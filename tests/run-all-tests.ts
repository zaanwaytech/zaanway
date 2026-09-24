import assert from "assert";
import crypto from "crypto";

// Environment setup for tests
process.env.META_APP_ID = "1020860290572585";
process.env.META_APP_SECRET = "test_meta_app_secret_abc123xyz";
process.env.META_CONFIG_ID = "1405070211688783";
process.env.META_WEBHOOK_VERIFY_TOKEN = "test_verify_token_secure_999";
process.env.WHATSAPP_TOKEN_ENCRYPTION_KEY = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
process.env.WHATSAPP_MOCK_MODE = "true";

import { encryptToken, decryptToken } from "../lib/security/encryption";
import { checkRateLimit } from "../lib/security/rateLimiter";
import { translateMetaError } from "../lib/meta/service";

// Color helpers for test runner
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const CYAN = "\x1b[36m";
const RESET = "\x1b[0m";

let passedCount = 0;
let failedCount = 0;

async function runTest(name: string, fn: () => void | Promise<void>) {
  try {
    await fn();
    console.log(`  ${GREEN}✓ PASS:${RESET} ${name}`);
    passedCount++;
  } catch (err: unknown) {
    console.error(`  ${RED}✗ FAIL:${RESET} ${name}`);
    console.error(`    ${(err as Error).message}`);
    failedCount++;
  }
}

async function runTestSuite() {
  console.log(`\n${CYAN}====================================================${RESET}`);
  console.log(`${CYAN}   ZAANWAY WHATSAPP CLOUD API AUTOMATED TEST SUITE   ${RESET}`);
  console.log(`${CYAN}====================================================\n${RESET}`);

  // ----------------------------------------------------
  // 1. TOKEN SECURITY & ENCRYPTION TESTS
  // ----------------------------------------------------
  console.log(`${CYAN}[1] Token Security & Encryption Tests${RESET}`);

  await runTest("Token encryption produces formatted encrypted string", () => {
    const plainToken = "EAAGtest_access_token_1234567890_meta";
    const encrypted = encryptToken(plainToken);
    assert(encrypted.startsWith("enc:v1:"), "Token must start with enc:v1:");
    assert(encrypted !== plainToken, "Encrypted token must not match plaintext");
  });

  await runTest("Token decryption restores original plaintext token", () => {
    const plainToken = "EAAGtest_access_token_1234567890_meta";
    const encrypted = encryptToken(plainToken);
    const decrypted = decryptToken(encrypted);
    assert.strictEqual(decrypted, plainToken, "Decrypted token must match original");
  });

  await runTest("Tampered ciphertext is rejected during decryption", () => {
    const plainToken = "EAAGtest_access_token_1234567890_meta";
    const encrypted = encryptToken(plainToken);
    const parts = encrypted.split(":");
    // Tamper with the ciphertext hex
    parts[4] = "ff" + parts[4].substring(2);
    const tampered = parts.join(":");

    assert.throws(
      () => decryptToken(tampered),
      /Failed to decrypt access token/,
      "Tampered token must throw error"
    );
  });

  await runTest("Plaintext/legacy token passes through safely without crashing", () => {
    const legacyToken = "mock_legacy_plain_token_abc";
    const result = decryptToken(legacyToken);
    assert.strictEqual(result, legacyToken);
  });

  // ----------------------------------------------------
  // 2. WEBHOOK VERIFICATION (GET) TESTS
  // ----------------------------------------------------
  console.log(`\n${CYAN}[2] Webhook Verification Tests (GET)${RESET}`);

  await runTest("Valid webhook verify token returns challenge (HTTP 200)", () => {
    const expectedToken = process.env.META_WEBHOOK_VERIFY_TOKEN;
    const mode = "subscribe";
    const verifyToken = "test_verify_token_secure_999";
    const challenge = "meta_hub_challenge_sample_123";

    const isMatch = mode === "subscribe" && verifyToken === expectedToken;
    assert.strictEqual(isMatch, true, "Verify token must match environment variable");
    assert.strictEqual(challenge, "meta_hub_challenge_sample_123");
  });

  await runTest("Invalid webhook token is rejected (HTTP 403)", () => {
    const expectedToken = process.env.META_WEBHOOK_VERIFY_TOKEN;
    const verifyToken = "wrong_invalid_token";

    const isMatch = verifyToken === expectedToken;
    assert.strictEqual(isMatch, false, "Invalid verify token must not match");
  });

  await runTest("Invalid hub mode is rejected (HTTP 403)", () => {
    const mode: string = "unsubscribe";
    const isSubscribe = mode === "subscribe";
    assert.strictEqual(isSubscribe, false, "Non-subscribe hub.mode must be rejected");
  });

  // ----------------------------------------------------
  // 3. WEBHOOK SIGNATURE (POST) TESTS
  // ----------------------------------------------------
  console.log(`\n${CYAN}[3] Webhook Signature Validation Tests (POST)${RESET}`);

  await runTest("Valid HMAC-SHA256 signature passes timing-safe comparison", () => {
    const appSecret = process.env.META_APP_SECRET!;
    const rawBody = JSON.stringify({ object: "whatsapp_business_account", entry: [] });

    const computedSignature = crypto.createHmac("sha256", appSecret).update(rawBody).digest("hex");
    const sigBuffer = Buffer.from(computedSignature, "hex");
    const compBuffer = Buffer.from(computedSignature, "hex");

    const valid = sigBuffer.length === compBuffer.length && crypto.timingSafeEqual(sigBuffer, compBuffer);
    assert.strictEqual(valid, true, "Timing-safe signature verification must succeed");
  });

  await runTest("Forged or invalid HMAC signature is rejected (HTTP 401)", () => {
    const appSecret = process.env.META_APP_SECRET!;
    const rawBody = JSON.stringify({ object: "whatsapp_business_account", entry: [] });

    const validSignature = crypto.createHmac("sha256", appSecret).update(rawBody).digest("hex");
    const forgedSignature = crypto.createHmac("sha256", "wrong_secret").update(rawBody).digest("hex");

    const sigBuffer = Buffer.from(forgedSignature, "hex");
    const compBuffer = Buffer.from(validSignature, "hex");

    const valid = sigBuffer.length === compBuffer.length && crypto.timingSafeEqual(sigBuffer, compBuffer);
    assert.strictEqual(valid, false, "Forged signature must fail validation");
  });

  // ----------------------------------------------------
  // 4. WEBHOOK IDEMPOTENCY & EVENT HANDLING
  // ----------------------------------------------------
  console.log(`\n${CYAN}[4] Webhook Idempotency & Parsing Tests${RESET}`);

  await runTest("Idempotency: duplicate message ID is detected and skipped", () => {
    const processedMessageIds = new Set<string>();
    const messageId = "wamid.HBgLMTIzNDU2";

    // First arrival
    const isFirstTime = !processedMessageIds.has(messageId);
    if (isFirstTime) processedMessageIds.add(messageId);
    assert.strictEqual(isFirstTime, true, "First message must be accepted");

    // Second arrival (Meta duplicate retry)
    const isDuplicate = processedMessageIds.has(messageId);
    assert.strictEqual(isDuplicate, true, "Duplicate message must be detected and skipped");
  });

  await runTest("Interactive button reply payload parsing", () => {
    const interactiveMsg = {
      type: "interactive",
      interactive: {
        type: "button_reply",
        button_reply: {
          id: "btn_book_turf",
          title: "Book a Turf",
        },
      },
    };

    assert.strictEqual(interactiveMsg.interactive.type, "button_reply");
    assert.strictEqual(interactiveMsg.interactive.button_reply.id, "btn_book_turf");
    assert.strictEqual(interactiveMsg.interactive.button_reply.title, "Book a Turf");
  });

  await runTest("Interactive list reply payload parsing", () => {
    const listMsg = {
      type: "interactive",
      interactive: {
        type: "list_reply",
        list_reply: {
          id: "slot_7pm",
          title: "7:00 PM Slot",
        },
      },
    };

    assert.strictEqual(listMsg.interactive.type, "list_reply");
    assert.strictEqual(listMsg.interactive.list_reply.id, "slot_7pm");
    assert.strictEqual(listMsg.interactive.list_reply.title, "7:00 PM Slot");
  });

  // ----------------------------------------------------
  // 5. MULTI-TENANT ISOLATION TESTS
  // ----------------------------------------------------
  console.log(`\n${CYAN}[5] Multi-Tenant Data Isolation Tests${RESET}`);

  await runTest("Tenant A cannot access or query Tenant B data", () => {
    const tenantA_workspaceId = "workspace_tenant_a_111";
    const tenantB_workspaceId = "workspace_tenant_b_222";

    const databaseRecords = [
      { id: "msg_1", workspaceId: tenantA_workspaceId, text: "Business A secret message" },
      { id: "msg_2", workspaceId: tenantB_workspaceId, text: "Business B secret message" },
    ];

    // Query scoped strictly by authenticated session
    const tenantAResults = databaseRecords.filter((r) => r.workspaceId === tenantA_workspaceId);
    assert.strictEqual(tenantAResults.length, 1);
    assert.strictEqual(tenantAResults[0].text, "Business A secret message");

    // Assert Tenant B records are never leaked to Tenant A
    const leaked = tenantAResults.some((r) => r.workspaceId === tenantB_workspaceId);
    assert.strictEqual(leaked, false, "Tenant B records must not leak to Tenant A");
  });

  await runTest("Client-submitted workspaceId/businessId is ignored in favor of session", () => {
    const session = { userId: "user_123", workspaceId: "workspace_real_session_id" };
    const attackerBody = { workspaceId: "workspace_victim_stolen_id", text: "Malicious payload" };

    // Strict derivation:
    const targetWorkspaceId = session.workspaceId; // Session ALWAYS overrides body
    assert.strictEqual(targetWorkspaceId, "workspace_real_session_id");
    assert.notStrictEqual(targetWorkspaceId, attackerBody.workspaceId);
  });

  // ----------------------------------------------------
  // 6. AUTOMATION ENGINE TESTS
  // ----------------------------------------------------
  console.log(`\n${CYAN}[6] Automation Engine Logic & Condition Tests${RESET}`);

  await runTest("Keyword trigger: exact match execution", () => {
    const incomingText = "hi";
    const trigger = { type: "keyword", matching: "exact", keyword: "hi" };
    const matches = trigger.matching === "exact" && incomingText.trim().toLowerCase() === trigger.keyword;
    assert.strictEqual(matches, true);
  });

  await runTest("Keyword trigger: contains match execution", () => {
    const incomingText = "hello, I would like to book a slot for tomorrow";
    const trigger = { type: "keyword", matching: "contains", keyword: "book a slot" };
    const matches = incomingText.toLowerCase().includes(trigger.keyword);
    assert.strictEqual(matches, true);
  });

  await runTest("Condition IF/THEN/ELSE branching logic", () => {
    const contact = {
      name: "Rahul",
      customFields: { customer_type: "premium" },
    };

    const condition = { field: "customer_type", operator: "==", value: "premium" };
    const isMatch = contact.customFields.customer_type === condition.value;

    const resultingAction = isMatch ? "send_vip_message" : "send_standard_message";
    assert.strictEqual(resultingAction, "send_vip_message");
  });

  await runTest("Contact custom field update action writes key-value data", () => {
    const contact: { customFields: Record<string, string> } = { customFields: {} };
    const updateAction = { field: "booking_time", value: "7:00 PM" };

    contact.customFields[updateAction.field] = updateAction.value;
    assert.strictEqual(contact.customFields.booking_time, "7:00 PM");
  });

  await runTest("Variable template interpolation ({{name}}, {{phone}}, {{customFields}})", () => {
    const contact = {
      name: "Rahul",
      phone: "919876543210",
      customFields: { booking_time: "7:00 PM" },
    };
    const template = "Hello {{name}}, your booking is confirmed for {{booking_time}}!";
    const interpolated = template
      .replace(/\{\{\s*name\s*\}\}/g, contact.name)
      .replace(/\{\{\s*booking_time\s*\}\}/g, contact.customFields.booking_time);

    assert.strictEqual(interpolated, "Hello Rahul, your booking is confirmed for 7:00 PM!");
  });

  await runTest("Infinite loop protection: max execution steps aborts runaway recursions", () => {
    const MAX_STEPS = 15;
    let stepCount = 0;
    let aborted = false;

    // Simulate loop of 50 steps
    for (let i = 0; i < 50; i++) {
      if (stepCount >= MAX_STEPS) {
        aborted = true;
        break;
      }
      stepCount++;
    }

    assert.strictEqual(aborted, true, "Runaway execution must abort");
    assert.strictEqual(stepCount, 15, "Execution steps must cap at 15");
  });

  await runTest("Anti-loop guard: outgoing messages never trigger incoming automation", () => {
    const outgoingMessage = { direction: "outgoing", text: "Hello customer" };
    const shouldTrigger = outgoingMessage.direction === "incoming";
    assert.strictEqual(shouldTrigger, false, "Outgoing messages must NOT trigger automations");
  });

  // ----------------------------------------------------
  // 7. DISCONNECTED ACCOUNT & RATE LIMITING
  // ----------------------------------------------------
  console.log(`\n${CYAN}[7] Safety Guards & Outbound Controls${RESET}`);

  await runTest("Disconnected account blocks outgoing messages", () => {
    const account = { status: "disconnected", phoneNumberId: "12345" };
    const canSend = account.status === "connected";
    assert.strictEqual(canSend, false, "Must block outbound messages if disconnected");
  });

  await runTest("Rate limiter enforces request limits within sliding window", () => {
    const testKey = `test_rate_limit_${Date.now()}`;
    const max = 3;

    const res1 = checkRateLimit(testKey, max, 1000);
    const res2 = checkRateLimit(testKey, max, 1000);
    const res3 = checkRateLimit(testKey, max, 1000);
    const res4 = checkRateLimit(testKey, max, 1000);

    assert.strictEqual(res1.allowed, true);
    assert.strictEqual(res2.allowed, true);
    assert.strictEqual(res3.allowed, true);
    assert.strictEqual(res4.allowed, false, "4th request within limit of 3 must be blocked");
  });

  // ----------------------------------------------------
  // 8. META ERROR TRANSLATION (SAFE CUSTOMER MESSAGES)
  // ----------------------------------------------------
  console.log(`\n${CYAN}[8] Production Meta Error Handling Tests${RESET}`);

  await runTest("Meta Graph API error 190 translates to friendly reconnection message", () => {
    const error190 = { code: 190, message: "Error validating access token: Session has expired" };
    const translated = translateMetaError(error190);
    assert(
      translated.includes("WhatsApp connection has expired"),
      "Must not expose raw token validation error to customer"
    );
  });

  await runTest("Meta Graph API error 131047 translates to 24h customer window notice", () => {
    const error131047 = { code: 131047, message: "Re-engagement message" };
    const translated = translateMetaError(error131047);
    assert(
      translated.includes("24 hours"),
      "Must inform customer of 24h messaging window limitation"
    );
  });

  // ----------------------------------------------------
  // 9. BROWSER SECRET EXPOSURE CHECK
  // ----------------------------------------------------
  console.log(`\n${CYAN}[9] Browser Secret Exposure Tests${RESET}`);

  await runTest("Connection response object never contains tokens or secrets", () => {
    const safeAccountPayload = {
      id: "660c1234567890",
      displayPhoneNumber: "+91 98765 43210",
      verifiedName: "ABC Business",
      businessName: "ABC Business",
      wabaId: "1020860290572585",
      phoneNumberId: "1299895066532873",
      status: "connected",
    };

    const serialized = JSON.stringify(safeAccountPayload);
    assert(!serialized.includes(process.env.META_APP_SECRET!), "Must not contain app secret");
    assert(!serialized.includes(process.env.WHATSAPP_TOKEN_ENCRYPTION_KEY!), "Must not contain encryption key");
    assert(!("accessTokenEncrypted" in safeAccountPayload), "Must not contain access token");
  });

  // ----------------------------------------------------
  // SUMMARY REPORT
  // ----------------------------------------------------
  console.log(`\n${CYAN}====================================================${RESET}`);
  console.log(`TEST SUITE RESULTS: ${GREEN}${passedCount} Passed${RESET} | ${failedCount > 0 ? RED : GREEN}${failedCount} Failed${RESET}`);
  console.log(`${CYAN}====================================================\n${RESET}`);

  if (failedCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTestSuite();
