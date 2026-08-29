import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { connectDB } from "@/lib/db/connect";
import WhatsAppAccount from "@/models/WhatsAppAccount";
import Conversation from "@/models/Conversation";
import Message from "@/models/Message";
import Contact from "@/models/Contact";
import Automation from "@/models/Automation";
import { sendWhatsAppText, sendWhatsAppButtons } from "@/lib/whatsapp/api";

const MOCK_MODE = process.env.WHATSAPP_MOCK_MODE === "true";

/**
 * GET handler for Meta webhook verification challenge.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("hub.mode");
    const token = searchParams.get("hub.verify_token");
    const challenge = searchParams.get("hub.challenge");

    const localVerifyToken = process.env.WHATSAPP_VERIFY_TOKEN || process.env.VERIFY_TOKEN || "zaanway_verify_token_12345";

    if (mode === "subscribe" && token === localVerifyToken) {
      console.log("[WEBHOOK] Webhook verified successfully.");
      return new NextResponse(challenge, {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      });
    }

    console.warn("[WEBHOOK] Verification failed. Tokens mismatch.");
    return new NextResponse("Forbidden", { status: 403 });
  } catch (error: unknown) {
    console.error("[WEBHOOK] Verification error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

/**
 * POST handler for Meta webhook events (incoming messages, status changes).
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signatureHeader = req.headers.get("x-hub-signature-256");

    console.log("[WEBHOOK INCOMING] Received webhook POST request.");
    console.log("[WEBHOOK INCOMING] Signature Header:", signatureHeader);
    console.log("[WEBHOOK INCOMING] Raw Body:", rawBody.substring(0, 500) + (rawBody.length > 500 ? "..." : ""));

    // 1. Signature Verification
    if (!MOCK_MODE) {
      const appSecret = process.env.META_APP_SECRET;
      if (!appSecret) {
        console.error("[WEBHOOK] META_APP_SECRET is not configured.");
        return NextResponse.json({ error: "Meta App Secret not configured" }, { status: 500 });
      }

      if (!signatureHeader) {
        console.warn("[WEBHOOK] Missing x-hub-signature-256 header. Make sure Meta is sending the signature.");
        return NextResponse.json({ error: "Missing signature header" }, { status: 401 });
      }

      const signature = signatureHeader.replace("sha256=", "");
      const computedSignature = crypto
        .createHmac("sha256", appSecret)
        .update(rawBody)
        .digest("hex");

      if (signature !== computedSignature) {
        console.warn("[WEBHOOK] Signature mismatch.");
        return NextResponse.json({ error: "Signature verification failed" }, { status: 401 });
      }
    }

    const body = JSON.parse(rawBody);

    // Verify it is a WhatsApp object event
    if (body.object !== "whatsapp_business_account") {
      return NextResponse.json({ error: "Invalid webhook object" }, { status: 400 });
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

    // Lookup WhatsApp Account to identify workspace
    const account = await WhatsAppAccount.findOne({ phoneNumberId });
    if (!account) {
      console.warn(`[WEBHOOK] WhatsAppAccount not found for Phone Number ID: ${phoneNumberId}`);
      return NextResponse.json({ error: "WhatsApp Account not mapped to a tenant" }, { status: 404 });
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
        console.log(`[WEBHOOK] Updated status for message ${messageId} to ${statusType}`);
      }
      return NextResponse.json({ success: true, message: "Status updates processed" });
    }

    // 3. Handle Incoming Messages
    if (val.messages && val.messages.length > 0) {
      const message = val.messages[0];
      const messageId = message.id;

      // Idempotency check: Ignore duplicate delivery of the same message ID
      const existingMessage = await Message.findOne({ whatsappMessageId: messageId });
      if (existingMessage) {
        console.log(`[WEBHOOK] Duplicate message ID detected: ${messageId}. Skipping.`);
        return NextResponse.json({ success: true, message: "Message already processed" });
      }

      const customerPhone = message.from;
      const contactObj = val.contacts?.[0];
      const customerName = contactObj?.profile?.name || customerPhone;

      // Ensure Contact exists in Directory
      let contact = await Contact.findOne({ workspaceId, phone: customerPhone });
      if (!contact) {
        contact = await Contact.create({
          workspaceId,
          name: customerName,
          phone: customerPhone,
          source: "WhatsApp Webhook",
        });
      }

      // Ensure Conversation exists
      let conversation = await Conversation.findOne({ workspaceId, customerPhone });
      if (!conversation) {
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
      const msgType = message.type;
      
      if (msgType === "text") {
        text = message.text?.body || "";
      } else if (msgType === "interactive") {
        const replyType = message.interactive?.type;
        if (replyType === "button_reply") {
          text = message.interactive?.button_reply?.title || "";
        } else if (replyType === "list_reply") {
          text = message.interactive?.list_reply?.title || "";
        }
      } else {
        text = `[Media: ${msgType}]`;
      }

      // Save Incoming Message
      const incomingMessage = await Message.create({
        workspaceId,
        conversationId: conversation._id,
        direction: "incoming",
        type: msgType,
        text,
        whatsappMessageId: messageId,
        status: "delivered",
        timestamp: new Date(parseInt(message.timestamp) * 1000),
      });

      console.log(`[WEBHOOK] Message saved successfully. ID: ${incomingMessage._id}`);

      // 4. Trigger Automation Rule Checks
      const cleanedText = text.trim().toLowerCase();
      let matchedAutomation = await Automation.findOne({
        workspaceId,
        isActive: true,
        "trigger.type": "keyword",
        "trigger.keyword": cleanedText,
      });

      // Fallback: If no keyword matched, see if there is a generic greeting bot
      if (!matchedAutomation) {
        // Trigger welcome greeting on first message or "hi/hello" keywords
        const isCommonGreeting = ["hi", "hello", "start", "opt in"].includes(cleanedText);
        if (isCommonGreeting || (await Message.countDocuments({ workspaceId, conversationId: conversation._id })) <= 1) {
          matchedAutomation = await Automation.findOne({
            workspaceId,
            isActive: true,
            "trigger.type": "incoming_message",
          });
        }
      }

      // Process Automation actions
      if (matchedAutomation && matchedAutomation.actions && matchedAutomation.actions.length > 0) {
        console.log(`[WEBHOOK] Triggering automation rule: ${matchedAutomation.name}`);

        // Track welcomeBot text to use as prompt in case of reply buttons
        let textPrompt = "Please select an option:";
        const textAction = matchedAutomation.actions.find(
          (a: { type: string; payload?: { text?: string } }) => a.type === "send_text"
        );
        if (textAction && textAction.payload?.text) {
          textPrompt = textAction.payload.text;
        }

        for (const action of matchedAutomation.actions) {
          if (action.type === "send_text") {
            const replyText = action.payload?.text;
            if (replyText) {
              const systemToken = process.env.WHATSAPP_ACCESS_TOKEN;
              const tokenToUse = systemToken || account.accessTokenEncrypted;

              const sendResult = await sendWhatsAppText(
                account.phoneNumberId,
                tokenToUse,
                customerPhone,
                replyText
              );

              if (sendResult.success) {
                await Message.create({
                  workspaceId,
                  conversationId: conversation._id,
                  direction: "outgoing",
                  type: "text",
                  text: replyText,
                  whatsappMessageId: sendResult.messageId,
                  status: "sent",
                  timestamp: new Date(),
                });
              }
            }
          } else if (action.type === "send_interactive_buttons") {
            const replyButtons = action.payload?.buttons;
            if (replyButtons && replyButtons.length > 0) {
              const systemToken = process.env.WHATSAPP_ACCESS_TOKEN;
              const tokenToUse = systemToken || account.accessTokenEncrypted;

              const sendResult = await sendWhatsAppButtons(
                account.phoneNumberId,
                tokenToUse,
                customerPhone,
                textPrompt,
                replyButtons
              );

              if (sendResult.success) {
                await Message.create({
                  workspaceId,
                  conversationId: conversation._id,
                  direction: "outgoing",
                  type: "interactive",
                  text: `${textPrompt} [Buttons: ${replyButtons.join(", ")}]`,
                  whatsappMessageId: sendResult.messageId,
                  status: "sent",
                  timestamp: new Date(),
                });
              }
            }
          }
        }
      }
    }

    return NextResponse.json({ success: true, message: "Webhook payload processed" });
  } catch (error: unknown) {
    console.error("[WEBHOOK] Processing error:", error);
    return NextResponse.json(
      { error: "Webhook internal processing error", details: (error as Error).message },
      { status: 500 }
    );
  }
}
