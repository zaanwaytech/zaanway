import crypto from "crypto";

const MOCK_MODE = process.env.WHATSAPP_MOCK_MODE === "true";

export function getGraphApiVersion(): string {
  return process.env.META_GRAPH_API_VERSION || "v21.0";
}

export interface MetaApiResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: number;
  errorSubcode?: number;
}

export interface SendMessageResult {
  success: boolean;
  messageId: string;
  error?: string;
}

export interface PhoneNumberDetails {
  id: string;
  displayPhoneNumber: string;
  verifiedName?: string;
  qualityRating?: string;
  codeVerificationStatus?: string;
  messagingLimit?: string;
}

export interface WabaDetails {
  id: string;
  name?: string;
  currency?: string;
  timezoneId?: string;
  messageTemplateNamespace?: string;
}

/**
 * Translates Meta Graph API error objects into safe, actionable customer messages.
 * Never leaks access tokens, secrets, or internal stack traces.
 */
export function translateMetaError(errorObj: {
  message?: string;
  code?: number;
  error_subcode?: number;
}): string {
  if (!errorObj) return "An unexpected error occurred with WhatsApp.";

  const code = errorObj.code;

  if (code === 190) {
    return "Your WhatsApp connection has expired or authorization was revoked. Please reconnect.";
  }
  if (code === 100) {
    return "Invalid parameter sent to WhatsApp API. Please verify phone number and template configuration.";
  }
  if (code === 131030) {
    return "Recipient phone number is not a valid WhatsApp user.";
  }
  if (code === 131031) {
    return "WhatsApp account is in sandbox/testing mode and recipient is not on allowed recipient list.";
  }
  if (code === 131047) {
    return "Message failed: Customer service window has closed (24 hours since customer's last message). Send a template message instead.";
  }
  if (code === 131051) {
    return "Phone number has not registered with WhatsApp Cloud API.";
  }
  if (code === 131052) {
    return "Media download or upload failed on WhatsApp servers.";
  }
  if (code === 131056) {
    return "Business WhatsApp account payment issue or account suspended.";
  }

  // Safe fallback without raw token/request traces
  return errorObj.message || "Meta WhatsApp API returned an error.";
}

/**
 * Exchange Meta OAuth / Embedded Signup authorization code for a business access token.
 */
export async function exchangeCodeForToken(code: string): Promise<MetaApiResult<{ accessToken: string }>> {
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  const version = getGraphApiVersion();

  if (!appId || !appSecret) {
    console.error("[WHATSAPP_ERROR] operation=exchangeCodeForToken error=missing_meta_credentials");
    return {
      success: false,
      error: "Meta App ID or App Secret is not configured on server.",
    };
  }

  if (MOCK_MODE || code === "mock_code") {
    console.log("[MOCK META] Exchanged code for mock access token");
    return {
      success: true,
      data: { accessToken: "mock_access_token_" + crypto.randomBytes(8).toString("hex") },
    };
  }

  try {
    const tokenUrl = `https://graph.facebook.com/${version}/oauth/access_token?client_id=${encodeURIComponent(
      appId
    )}&client_secret=${encodeURIComponent(appSecret)}&code=${encodeURIComponent(code)}`;

    const res = await fetch(tokenUrl, { method: "GET" });
    const data = await res.json();

    if (!res.ok || data.error) {
      console.error("[WHATSAPP_ERROR] operation=exchangeCodeForToken", {
        metaErrorCode: data.error?.code,
        message: data.error?.message,
      });
      return {
        success: false,
        error: translateMetaError(data.error),
        errorCode: data.error?.code,
        errorSubcode: data.error?.error_subcode,
      };
    }

    return {
      success: true,
      data: { accessToken: data.access_token },
    };
  } catch (err: unknown) {
    console.error("[WHATSAPP_ERROR] operation=exchangeCodeForToken network_failure", (err as Error).message);
    return {
      success: false,
      error: "Failed to connect to Meta servers to exchange authorization code.",
    };
  }
}

/**
 * Fetch WhatsApp Business Account (WABA) details.
 */
export async function getWabaDetails(
  wabaId: string,
  accessToken: string
): Promise<MetaApiResult<WabaDetails>> {
  if (MOCK_MODE || accessToken.startsWith("mock_")) {
    return {
      success: true,
      data: {
        id: wabaId,
        name: "Mock WABA Profile",
        currency: "INR",
        timezoneId: "1",
      },
    };
  }

  try {
    const version = getGraphApiVersion();
    const url = `https://graph.facebook.com/${version}/${wabaId}?fields=id,name,currency,timezone_id,message_template_namespace`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    const data = await res.json();

    if (!res.ok || data.error) {
      console.error("[WHATSAPP_ERROR] operation=getWabaDetails", {
        wabaId,
        code: data.error?.code,
      });
      return {
        success: false,
        error: translateMetaError(data.error),
        errorCode: data.error?.code,
      };
    }

    return {
      success: true,
      data: {
        id: data.id,
        name: data.name,
        currency: data.currency,
        timezoneId: data.timezone_id,
        messageTemplateNamespace: data.message_template_namespace,
      },
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: (err as Error).message || "Failed to fetch WABA details",
    };
  }
}

/**
 * Fetch WhatsApp Phone Number details.
 */
export async function getPhoneNumberDetails(
  phoneNumberId: string,
  accessToken: string
): Promise<MetaApiResult<PhoneNumberDetails>> {
  if (MOCK_MODE || accessToken.startsWith("mock_")) {
    return {
      success: true,
      data: {
        id: phoneNumberId,
        displayPhoneNumber: "+91 98765 43210",
        verifiedName: "Zaanway Business",
        qualityRating: "GREEN",
        messagingLimit: "TIER_1K",
      },
    };
  }

  try {
    const version = getGraphApiVersion();
    const url = `https://graph.facebook.com/${version}/${phoneNumberId}?fields=id,display_phone_number,verified_name,quality_rating,code_verification_status,messaging_limit_tier`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    const data = await res.json();

    if (!res.ok || data.error) {
      console.error("[WHATSAPP_ERROR] operation=getPhoneNumberDetails", {
        phoneNumberId,
        code: data.error?.code,
      });
      return {
        success: false,
        error: translateMetaError(data.error),
        errorCode: data.error?.code,
      };
    }

    return {
      success: true,
      data: {
        id: data.id,
        displayPhoneNumber: data.display_phone_number || "Verified WhatsApp",
        verifiedName: data.verified_name || "Business Account",
        qualityRating: data.quality_rating || "UNKNOWN",
        codeVerificationStatus: data.code_verification_status,
        messagingLimit: data.messaging_limit_tier || "STANDARD",
      },
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: (err as Error).message || "Failed to fetch phone number details",
    };
  }
}

/**
 * Register phone number with Meta Cloud API.
 */
export async function registerPhoneNumber(
  phoneNumberId: string,
  accessToken: string,
  pin: string = "123456"
): Promise<MetaApiResult<{ success: boolean }>> {
  if (MOCK_MODE || accessToken.startsWith("mock_")) {
    return { success: true, data: { success: true } };
  }

  try {
    const version = getGraphApiVersion();
    const url = `https://graph.facebook.com/${version}/${phoneNumberId}/register`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        pin,
      }),
    });

    const data = await res.json();
    if (!res.ok || data.error) {
      console.error("[WHATSAPP_ERROR] operation=registerPhoneNumber", {
        phoneNumberId,
        code: data.error?.code,
      });
      return {
        success: false,
        error: translateMetaError(data.error),
        errorCode: data.error?.code,
      };
    }

    return { success: true, data: { success: true } };
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message };
  }
}

/**
 * Subscribes a WABA to the app's webhooks.
 */
export async function subscribeWabaToWebhook(
  wabaId: string,
  accessToken: string
): Promise<MetaApiResult<{ success: boolean }>> {
  if (MOCK_MODE || accessToken.startsWith("mock_")) {
    return { success: true, data: { success: true } };
  }

  try {
    const version = getGraphApiVersion();
    const url = `https://graph.facebook.com/${version}/${wabaId}/subscribed_apps`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await res.json();
    if (!res.ok || data.error) {
      console.error("[WHATSAPP_ERROR] operation=subscribeWabaToWebhook", {
        wabaId,
        code: data.error?.code,
      });
      return {
        success: false,
        error: translateMetaError(data.error),
        errorCode: data.error?.code,
      };
    }

    return { success: true, data: { success: true } };
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message };
  }
}

/**
 * Deregisters a phone number from WhatsApp Cloud API.
 */
export async function deregisterPhoneNumber(
  phoneNumberId: string,
  accessToken: string
): Promise<MetaApiResult<{ success: boolean }>> {
  if (MOCK_MODE || accessToken.startsWith("mock_")) {
    return { success: true, data: { success: true } };
  }

  try {
    const version = getGraphApiVersion();
    const url = `https://graph.facebook.com/${version}/${phoneNumberId}/deregister`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    await res.text();
    return { success: res.ok, data: { success: res.ok } };
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message };
  }
}

/**
 * Sends a generic WhatsApp message payload via Cloud API.
 */
export async function sendWhatsAppMessage(
  phoneNumberId: string,
  accessToken: string,
  payload: unknown
): Promise<SendMessageResult> {
  if (MOCK_MODE || accessToken.startsWith("mock_")) {
    const mockId = `wamid.HBgL${crypto.randomBytes(8).toString("hex").toUpperCase()}`;
    console.log(`[WHATSAPP_MOCK_SEND] phoneNumberId=${phoneNumberId} mockMessageId=${mockId}`);
    return {
      success: true,
      messageId: mockId,
    };
  }

  try {
    const version = getGraphApiVersion();
    const url = `https://graph.facebook.com/${version}/${phoneNumberId}/messages`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok || data.error) {
      console.error("[WHATSAPP_ERROR] operation=sendWhatsAppMessage", {
        phoneNumberId,
        code: data.error?.code,
        message: data.error?.message,
      });
      return {
        success: false,
        messageId: "",
        error: translateMetaError(data.error),
      };
    }

    const messageId = data.messages?.[0]?.id || "";
    console.log(`[WHATSAPP_SEND] phoneNumberId=${phoneNumberId} status=success messageId=${messageId}`);

    return {
      success: true,
      messageId,
    };
  } catch (err: unknown) {
    console.error("[WHATSAPP_ERROR] operation=sendWhatsAppMessage network_error", (err as Error).message);
    return {
      success: false,
      messageId: "",
      error: "Network failure while dispatching WhatsApp message.",
    };
  }
}

/**
 * Send regular plain text message.
 */
export async function sendTextMessage(
  phoneNumberId: string,
  accessToken: string,
  to: string,
  text: string
): Promise<SendMessageResult> {
  const cleanTo = to.replace(/[^0-9]/g, "");
  const payload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: cleanTo,
    type: "text",
    text: { body: text },
  };

  return sendWhatsAppMessage(phoneNumberId, accessToken, payload);
}

/**
 * Send template message.
 */
export async function sendTemplateMessage(
  phoneNumberId: string,
  accessToken: string,
  to: string,
  templateName: string,
  languageCode: string = "en",
  components?: unknown[]
): Promise<SendMessageResult> {
  const cleanTo = to.replace(/[^0-9]/g, "");
  const payload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: cleanTo,
    type: "template",
    template: {
      name: templateName,
      language: { code: languageCode },
      components: components || [],
    },
  };

  return sendWhatsAppMessage(phoneNumberId, accessToken, payload);
}

/**
 * Send interactive quick reply buttons (up to 3 buttons supported by Meta).
 */
export async function sendInteractiveButtons(
  phoneNumberId: string,
  accessToken: string,
  to: string,
  bodyText: string,
  buttons: Array<{ id: string; title: string } | string>
): Promise<SendMessageResult> {
  const cleanTo = to.replace(/[^0-9]/g, "");
  const formattedButtons = buttons.slice(0, 3).map((btn, index) => {
    if (typeof btn === "string") {
      return {
        type: "reply",
        reply: {
          id: `btn_${index}_${btn.toLowerCase().replace(/[^a-z0-9]/g, "_").slice(0, 50)}`,
          title: btn.substring(0, 20),
        },
      };
    }
    return {
      type: "reply",
      reply: {
        id: btn.id.substring(0, 256),
        title: btn.title.substring(0, 20),
      },
    };
  });

  const payload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: cleanTo,
    type: "interactive",
    interactive: {
      type: "button",
      body: { text: bodyText },
      action: { buttons: formattedButtons },
    },
  };

  return sendWhatsAppMessage(phoneNumberId, accessToken, payload);
}

/**
 * Send interactive list message (sections with rows).
 */
export async function sendInteractiveList(
  phoneNumberId: string,
  accessToken: string,
  to: string,
  bodyText: string,
  buttonText: string,
  sections: Array<{
    title: string;
    rows: Array<{ id: string; title: string; description?: string }>;
  }>
): Promise<SendMessageResult> {
  const cleanTo = to.replace(/[^0-9]/g, "");
  const payload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: cleanTo,
    type: "interactive",
    interactive: {
      type: "list",
      body: { text: bodyText },
      action: {
        button: buttonText.substring(0, 20),
        sections: sections.map((sec) => ({
          title: sec.title.substring(0, 24),
          rows: sec.rows.slice(0, 10).map((row) => ({
            id: row.id.substring(0, 200),
            title: row.title.substring(0, 24),
            description: row.description ? row.description.substring(0, 72) : undefined,
          })),
        })),
      },
    },
  };

  return sendWhatsAppMessage(phoneNumberId, accessToken, payload);
}

/**
 * Mark an incoming message as read.
 */
export async function markMessageAsRead(
  phoneNumberId: string,
  accessToken: string,
  messageId: string
): Promise<boolean> {
  if (MOCK_MODE || accessToken.startsWith("mock_")) return true;

  try {
    const version = getGraphApiVersion();
    const url = `https://graph.facebook.com/${version}/${phoneNumberId}/messages`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        status: "read",
        message_id: messageId,
      }),
    });

    return res.ok;
  } catch {
    return false;
  }
}
