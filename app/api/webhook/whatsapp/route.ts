import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { connectDB } from "@/lib/db/connect";
import WhatsAppAccount from "@/models/WhatsAppAccount";
import Conversation from "@/models/Conversation";
import Message from "@/models/Message";
import Contact from "@/models/Contact";
import { markMessageAsRead } from "@/lib/meta/service";
import { decryptToken } from "@/lib/security/encryption";
import { processAutomationsForMessage } from "@/lib/automation/engine";

const MOCK_MODE = process.env.WHATSAPP_MOCK_MODE === "true";

/**
 * GET Handler for Meta Webhook Hub Verification Challenge.
 * Confirms verify_token matches META_WEBHOOK_VERIFY_TOKEN.
 */
export async function GET(req: NextRequest) {
  try {
    const mode = req.nextUrl.searchParams.get("hub.mode") || new URL(req.url).searchParams.get("hub.mode");
    const token = req.nextUrl.searchParams.get("hub.verify_token") || new URL(req.url).searchParams.get("hub.verify_token");
    const challenge = req.nextUrl.searchParams.get("hub.challenge") || new URL(req.url).searchParams.get("hub.challenge");

    const expectedToken = (
      process.env.META_WEBHOOK_VERIFY_TOKEN ||
      process.env.WHATSAPP_VERIFY_TOKEN ||
      process.env.VERIFY_TOKEN ||
      ""
    ).trim();

    if (!expectedToken) {
      console.error("[WEBHOOK_VERIFICATION_ERROR] META_WEBHOOK_VERIFY_TOKEN is not configured in production environment variables.");
      return new Response("Server Configuration Error: META_WEBHOOK_VERIFY_TOKEN is missing in production environment variables", {
        status: 500,
        headers: { "Content-Type": "text/plain" },
      });
    }

    const receivedToken = (token || "").trim();

    if (mode === "subscribe" && receivedToken === expectedToken) {
      console.log("[WEBHOOK_VERIFIED] Meta webhook challenge verified successfully.");
      return new Response(challenge || "", {
        status: 200,
        headers: {
          "Content-Type": "text/plain",
          "Cache-Control": "no-store",
        },
      });
    }

    console.warn(`[WEBHOOK_VERIFICATION_FAILED] mode=${mode} received_token_length=${receivedToken.length} expected_token_length=${expectedToken.length}`);
    return new Response("Forbidden", {
      status: 403,
      headers: { "Content-Type": "text/plain" },
    });
  } catch (error: unknown) {
    console.error("[WEBHOOK_VERIFICATION_ERROR]", error);
    return new Response("Internal Server Error", {
      status: 500,
      headers: { "Content-Type": "text/plain" },
    });
  }
}

/**
 * POST Handler for Meta Webhook Events (Messages, Status Updates, Delivery Receipts).
 * Uses X-Hub-Signature-256 HMAC timing-safe validation and idempotent event processing.
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signatureHeader = req.headers.get("x-hub-signature-256");

    // 1. Signature Verification with Timing-Safe Comparison
    const appSecret = process.env.META_APP_SECRET;

    if (!MOCK_MODE && appSecret) {
      if (!signatureHeader || !signatureHeader.startsWith("sha256=")) {
        console.warn("[WEBHOOK_SECURITY] Missing or invalid x-hub-signature-256 header.");
        return NextResponse.json({ error: "Missing signature header" }, { status: 401 });
      }

      const signature = signatureHeader.replace("sha256=", "");
      const computedSignature = crypto
        .createHmac("sha256", appSecret)
        .update(rawBody)
        .digest("hex");

      const sigBuffer = Buffer.from(signature, "hex");
      const compBuffer = Buffer.from(computedSignature, "hex");

      if (sigBuffer.length !== compBuffer.length || !crypto.timingSafeEqual(sigBuffer, compBuffer)) {
        console.warn("[WEBHOOK_SECURITY] Invalid webhook signature detected. Rejecting request.");
        return NextResponse.json({ error: "Signature verification failed" }, { status: 401 });
      }
    }

    const body = JSON.parse(rawBody);

    if (body.object !== "whatsapp_business_account") {
      return NextResponse.json({ error: "Unsupported object type" }, { status: 400 });
    }

    await connectDB();

    const entry = body.entry?.[0];
    const change = entry?.changes?.[0];
    const val = change?.value;

    if (!val) {
      return NextResponse.json({ success: true, message: "No change value found" });
    }

    const metadata = val.metadata;
    const phoneNumberId = metadata?.phone_number_id;

    if (!phoneNumberId) {
      return NextResponse.json({ success: true, message: "No phone number id found" });
    }

    // Lookup WhatsApp Account to identify workspace tenant
    const account = await WhatsAppAccount.findOne({ phoneNumberId });
    if (!account) {
      console.warn(`[WEBHOOK] WhatsAppAccount not mapped for Phone Number ID: ${phoneNumberId}`);
      // Return 200 so Meta does not retry indefinitely for unmapped test numbers
      return NextResponse.json({ success: true, message: "Phone number not mapped to a tenant" });
    }

    const workspaceId = account.workspaceId;

    // 2. Handle Message Status Updates (sent, delivered, read, failed)
    if (val.statuses && val.statuses.length > 0) {
      for (const statusObj of val.statuses) {
        const messageId = statusObj.id;
        const statusType = statusObj.status; // sent, delivered, read, failed

        await Message.findOneAndUpdate(
          { workspaceId, whatsappMessageId: messageId },
          { status: statusType }
        );
        console.log(`[WEBHOOK_STATUS] workspaceId=${workspaceId} messageId=${messageId} status=${statusType}`);
      }
      return NextResponse.json({ success: true, message: "Status updates processed" });
    }

    // 3. Handle Incoming Messages
    if (val.messages && val.messages.length > 0) {
      const message = val.messages[0];
      const messageId = message.id;

      // IDEMPOTENCY CHECK: Reject duplicate deliveries of the same message ID
      const existingMessage = await Message.findOne({ whatsappMessageId: messageId });
      if (existingMessage) {
        console.log(`[WEBHOOK_IDEMPOTENCY] Duplicate message ID skipped: ${messageId}`);
        return NextResponse.json({ success: true, message: "Message already processed" });
      }

      const customerPhone = message.from;
      const contactObj = val.contacts?.[0];
      const customerName = contactObj?.profile?.name || customerPhone;

      // Ensure Contact exists in Directory for this tenant
      let contact = await Contact.findOne({ workspaceId, phone: customerPhone });
      if (!contact) {
        contact = await Contact.create({
          workspaceId,
          name: customerName,
          phone: customerPhone,
          source: "WhatsApp Webhook",
          customFields: {},
        });
      } else if (customerName && contact.name === customerPhone) {
        contact.name = customerName;
        await contact.save();
      }

      // Ensure Conversation exists
      let isNewConversation = false;
      let conversation = await Conversation.findOne({ workspaceId, customerPhone });
      if (!conversation) {
        isNewConversation = true;
        conversation = await Conversation.create({
          workspaceId,
          whatsappAccountId: account._id,
          customerPhone,
          customerName,
          status: "open",
          lastMessageAt: new Date(),
        });
      } else {
        conversation.lastMessageAt = new Date();
        if (customerName && conversation.customerName !== customerName) {
          conversation.customerName = customerName;
        }
        await conversation.save();
      }

      // Determine message content/type
      let text = "";
      let buttonId = "";
      let listRowId = "";
      const msgType = message.type;

      if (msgType === "text") {
        text = message.text?.body || "";
      } else if (msgType === "interactive") {
        const replyType = message.interactive?.type;
        if (replyType === "button_reply") {
          text = message.interactive?.button_reply?.title || "";
          buttonId = message.interactive?.button_reply?.id || "";
        } else if (replyType === "list_reply") {
          text = message.interactive?.list_reply?.title || "";
          listRowId = message.interactive?.list_reply?.id || "";
        }
      } else if (msgType === "button") {
        text = message.button?.text || "";
        buttonId = message.button?.payload || "";
      } else {
        text = `[Media: ${msgType}]`;
      }

      // Save Incoming Message to Database
      await Message.create({
        workspaceId,
        conversationId: conversation._id,
        direction: "incoming",
        type: msgType,
        text,
        whatsappMessageId: messageId,
        status: "delivered",
        timestamp: new Date(parseInt(message.timestamp, 10) * 1000 || Date.now()),
      });

      console.log(`[WEBHOOK_INCOMING] workspaceId=${workspaceId} customer=${customerPhone} type=${msgType} text="${text}"`);

      // Mark message as read
      try {
        if (!account.accessTokenEncrypted.includes("mock_access_token")) {
          const token = decryptToken(account.accessTokenEncrypted);
          markMessageAsRead(phoneNumberId, token, messageId).catch(() => {});
        }
      } catch {
        // Continue even if mark as read fails
      }

      // 4. Run Automations Asynchronously
      // Fire-and-forget so we return HTTP 200 to Meta quickly
      processAutomationsForMessage({
        workspaceId: workspaceId.toString(),
        phoneNumberId,
        customerPhone,
        customerName,
        messageType: msgType,
        text,
        buttonId,
        listRowId,
        isNewConversation,
      }).catch((autoErr) => {
        console.error("[WEBHOOK_AUTOMATION_ERROR]", autoErr);
      });
    }

    return NextResponse.json({ success: true, message: "Webhook processed successfully" });
  } catch (error: unknown) {
    console.error("[WEBHOOK_ERROR] Internal processing error:", error);
    return NextResponse.json(
      { error: "Webhook internal processing error" },
      { status: 500 }
    );
  }
}
