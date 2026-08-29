import crypto from "crypto";

const MOCK_MODE = process.env.WHATSAPP_MOCK_MODE === "true";
const API_VERSION = process.env.META_API_VERSION || "v20.0";

export interface SendMessageResult {
  success: boolean;
  messageId: string;
  error?: string;
}

/**
 * Sends a message payload to the Meta WhatsApp Cloud API.
 * In mock mode, logs the payload and returns a simulated message ID.
 */
export async function sendWhatsAppMessage(
  phoneNumberId: string,
  accessToken: string,
  payload: unknown
): Promise<SendMessageResult> {
  if (MOCK_MODE || accessToken === "mock_encrypted_access_token_abcde") {
    const mockId = `wamid.HBgL${crypto.randomBytes(8).toString("hex").toUpperCase()}`;
    console.log(`[MOCK WHATSAPP SEND] Phone Number ID: ${phoneNumberId}`);
    console.log(`[MOCK WHATSAPP SEND] Payload:`, JSON.stringify(payload, null, 2));
    console.log(`[MOCK WHATSAPP SEND] Generated Mock Message ID: ${mockId}`);
    
    // Simulate slight network delay
    await new Promise((resolve) => setTimeout(resolve, 300));
    
    return {
      success: true,
      messageId: mockId,
    };
  }

  try {
    const url = `https://graph.facebook.com/${API_VERSION}/${phoneNumberId}/messages`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      console.error("Meta API send error response:", data.error);
      return {
        success: false,
        messageId: "",
        error: data.error?.message || "Failed to send message via Meta API",
      };
    }

    const messageId = data.messages?.[0]?.id || "";
    return {
      success: true,
      messageId,
    };
  } catch (error: unknown) {
    console.error("WhatsApp API Network/Server error:", error);
    return {
      success: false,
      messageId: "",
      error: (error as Error).message || "Internal network error",
    };
  }
}

/**
 * Sends a standard text message.
 */
export async function sendWhatsAppText(
  phoneNumberId: string,
  accessToken: string,
  to: string,
  text: string
): Promise<SendMessageResult> {
  const payload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    type: "text",
    text: {
      body: text,
    },
  };

  return sendWhatsAppMessage(phoneNumberId, accessToken, payload);
}

/**
 * Sends an interactive message containing up to 3 quick reply buttons.
 */
export async function sendWhatsAppButtons(
  phoneNumberId: string,
  accessToken: string,
  to: string,
  bodyText: string,
  buttons: string[]
): Promise<SendMessageResult> {
  // Meta Cloud API supports maximum 3 reply buttons in interactive messages
  const formattedButtons = buttons.slice(0, 3).map((buttonText, index) => ({
    type: "reply",
    reply: {
      id: `btn_${index}_${buttonText.toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
      title: buttonText.substring(0, 20), // Meta limits button title length to 20 chars
    },
  }));

  const payload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    type: "interactive",
    interactive: {
      type: "button",
      body: {
        text: bodyText,
      },
      action: {
        buttons: formattedButtons,
      },
    },
  };

  return sendWhatsAppMessage(phoneNumberId, accessToken, payload);
}
