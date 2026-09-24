import http from "http";
import crypto from "crypto";

// Configuration from environment variables - NO hardcoded secrets
const APP_SECRET = process.env.META_APP_SECRET || "";
const PHONE_NUMBER_ID = process.env.TEST_PHONE_NUMBER_ID || "1299895066532873";
const CUSTOMER_PHONE = "919876543210";
const MESSAGE_TEXT = "hi";

const payload = {
  object: "whatsapp_business_account",
  entry: [
    {
      id: "mock_waba_id",
      changes: [
        {
          value: {
            messaging_product: "whatsapp",
            metadata: {
              display_phone_number: "919876543210",
              phone_number_id: PHONE_NUMBER_ID,
            },
            contacts: [
              {
                profile: { name: "Test User" },
                wa_id: CUSTOMER_PHONE,
              },
            ],
            messages: [
              {
                from: CUSTOMER_PHONE,
                id: "wamid.mock_" + Date.now(),
                timestamp: Math.floor(Date.now() / 1000).toString(),
                text: { body: MESSAGE_TEXT },
                type: "text",
              },
            ],
          },
          field: "messages",
        },
      ],
    },
  ],
};

const rawBody = JSON.stringify(payload);

const signature = APP_SECRET
  ? crypto.createHmac("sha256", APP_SECRET).update(rawBody).digest("hex")
  : "unsigned";

console.log("Sending mock webhook to http://localhost:3000/api/webhook/whatsapp...");

const req = http.request(
  "http://localhost:3000/api/webhook/whatsapp",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-hub-signature-256": `sha256=${signature}`,
    },
  },
  (res) => {
    let data = "";
    res.on("data", (chunk) => {
      data += chunk;
    });
    res.on("end", () => {
      console.log(`Status: ${res.statusCode}`);
      console.log(`Response: ${data}`);
    });
  }
);

req.on("error", (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.write(rawBody);
req.end();
