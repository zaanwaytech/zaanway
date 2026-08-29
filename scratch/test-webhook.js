const http = require('http');
const crypto = require('crypto');

// Configuration
const APP_SECRET = process.env.META_APP_SECRET || "fcab3bf6e2f6e7f2410d32300352487d"; // From your .env.local
const PHONE_NUMBER_ID = "1299895066532873"; // Your Meta Phone Number ID
const CUSTOMER_PHONE = "1234567890"; // Fake customer sending the message
const MESSAGE_TEXT = "hi"; // The keyword to test

// Create mock Meta webhook payload
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
              display_phone_number: "9633663256",
              phone_number_id: PHONE_NUMBER_ID
            },
            contacts: [
              {
                profile: { name: "Test User" },
                wa_id: CUSTOMER_PHONE
              }
            ],
            messages: [
              {
                from: CUSTOMER_PHONE,
                id: "wamid.mock_message_id_" + Date.now(),
                timestamp: Math.floor(Date.now() / 1000).toString(),
                text: { body: MESSAGE_TEXT },
                type: "text"
              }
            ]
          },
          field: "messages"
        }
      ]
    }
  ]
};

const rawBody = JSON.stringify(payload);

// Generate signature
const signature = crypto
  .createHmac("sha256", APP_SECRET)
  .update(rawBody)
  .digest("hex");

console.log("Sending mock webhook to http://localhost:3000/api/webhook/whatsapp...");

const req = http.request("http://localhost:3000/api/webhook/whatsapp", {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-hub-signature-256': `sha256=${signature}`
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Response: ${data}`);
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
  console.log("Make sure your Next.js server is running on localhost:3000!");
});

req.write(rawBody);
req.end();
