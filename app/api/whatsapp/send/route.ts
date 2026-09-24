import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { getSession } from "@/lib/auth/session";
import WhatsAppAccount from "@/models/WhatsAppAccount";
import Contact from "@/models/Contact";
import Conversation from "@/models/Conversation";
import Message from "@/models/Message";
import {
  sendTextMessage,
  sendInteractiveButtons,
  sendTemplateMessage,
  sendWhatsAppMessage,
} from "@/lib/meta/service";
import { decryptToken } from "@/lib/security/encryption";
import { checkRateLimit } from "@/lib/security/rateLimiter";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const session = await getSession();

    if (!session || !session.userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const workspaceId = session.workspaceId;
    if (!workspaceId) {
      return NextResponse.json({ success: false, message: "No active workspace selected" }, { status: 400 });
    }

    // Rate Limiting: 60 messages per minute per workspace
    const rateCheck = checkRateLimit(`send_msg:${workspaceId}`, 60, 60000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { success: false, message: "Outbound rate limit exceeded. Please wait before sending more messages." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { contactId, phone, conversationId, type = "text", text, buttons, templateName, languageCode, components } = body;

    if (!text && !buttons && !templateName) {
      return NextResponse.json({ success: false, message: "Message content cannot be empty." }, { status: 400 });
    }

    // Find recipient contact strictly belonging to this workspace
    let recipientContact = null;
    if (contactId) {
      recipientContact = await Contact.findOne({ _id: contactId, workspaceId });
    } else if (conversationId) {
      const conv = await Conversation.findOne({ _id: conversationId, workspaceId });
      if (conv) {
        recipientContact = await Contact.findOne({ phone: conv.customerPhone, workspaceId });
        if (!recipientContact) {
          recipientContact = await Contact.create({
            workspaceId,
            name: conv.customerName || conv.customerPhone,
            phone: conv.customerPhone,
            source: "WhatsApp Inbox",
          });
        }
      }
    } else if (phone) {
      const cleanPhone = phone.replace(/[^0-9]/g, "");
      recipientContact = await Contact.findOne({ phone: cleanPhone, workspaceId });
      if (!recipientContact) {
        recipientContact = await Contact.create({
          workspaceId,
          name: cleanPhone,
          phone: cleanPhone,
          source: "Direct Outbound",
        });
      }
    }

    if (!recipientContact) {
      return NextResponse.json({ success: false, message: "Recipient contact not found in this workspace." }, { status: 404 });
    }

    // Verify WhatsApp connection for this workspace
    const account = await WhatsAppAccount.findOne({ workspaceId });
    if (!account || account.status !== "connected") {
      return NextResponse.json(
        {
          success: false,
          message: "WhatsApp account is not connected. Please connect or reconnect your WhatsApp number.",
        },
        { status: 400 }
      );
    }

    // Retrieve and decrypt token server-side
    let token = "";
    try {
      token = decryptToken(account.accessTokenEncrypted);
    } catch {
      return NextResponse.json(
        { success: false, message: "Failed to decrypt WhatsApp access token. Please reconnect WhatsApp." },
        { status: 500 }
      );
    }

    // Ensure Conversation exists
    let conversation = await Conversation.findOne({
      workspaceId,
      customerPhone: recipientContact.phone,
    });

    if (!conversation) {
      conversation = await Conversation.create({
        workspaceId,
        whatsappAccountId: account._id,
        customerPhone: recipientContact.phone,
        customerName: recipientContact.name,
        status: "open",
        lastMessageAt: new Date(),
      });
    }

    // Send through Meta Cloud API
    let sendResult;
    let savedText = text || "";

    if (type === "text") {
      sendResult = await sendTextMessage(account.phoneNumberId, token, recipientContact.phone, text);
    } else if (type === "buttons" && buttons) {
      sendResult = await sendInteractiveButtons(account.phoneNumberId, token, recipientContact.phone, text || "Select:", buttons);
      savedText = `${text} [Buttons: ${buttons.join(", ")}]`;
    } else if (type === "template" && templateName) {
      sendResult = await sendTemplateMessage(account.phoneNumberId, token, recipientContact.phone, templateName, languageCode || "en", components);
      savedText = `[Template: ${templateName}]`;
    } else {
      sendResult = await sendWhatsAppMessage(account.phoneNumberId, token, body.payload);
    }

    if (!sendResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: sendResult.error || "Failed to deliver WhatsApp message.",
        },
        { status: 400 }
      );
    }

    // Save outbound message to database
    const messageDoc = await Message.create({
      workspaceId,
      conversationId: conversation._id,
      direction: "outgoing",
      type: type === "buttons" ? "interactive" : type,
      text: savedText,
      whatsappMessageId: sendResult.messageId,
      status: "sent",
      timestamp: new Date(),
    });

    // Update conversation last message timestamp
    conversation.lastMessageAt = new Date();
    await conversation.save();

    console.log(
      `[WHATSAPP_SEND] workspaceId=${workspaceId} contactId=${recipientContact._id} messageId=${sendResult.messageId} status=success`
    );

    return NextResponse.json({
      success: true,
      messageId: sendResult.messageId,
      message: messageDoc,
    });
  } catch (error: unknown) {
    console.error("[WHATSAPP_ERROR] operation=send_message route_error", error);
    return NextResponse.json(
      { success: false, message: "Internal server error dispatching WhatsApp message." },
      { status: 500 }
    );
  }
}
