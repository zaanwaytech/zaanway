import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { getSession } from "@/lib/auth/session";
import { verifyWorkspaceAccess } from "@/lib/auth/permissions";
import WhatsAppAccount from "@/models/WhatsAppAccount";
import {
  exchangeCodeForToken,
  getPhoneNumberDetails,
  getWabaDetails,
  registerPhoneNumber,
  subscribeWabaToWebhook,
} from "@/lib/meta/service";
import { encryptToken } from "@/lib/security/encryption";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const session = await getSession();

    if (!session || !session.userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: Please log in." },
        { status: 401 }
      );
    }

    // Strictly derive workspaceId from authenticated session to enforce tenant isolation
    const workspaceId = session.workspaceId;
    if (!workspaceId) {
      return NextResponse.json(
        { success: false, message: "No active workspace selected in session." },
        { status: 400 }
      );
    }

    // Enforce role authorization: Only Owner or Admin can link WhatsApp
    const member = await verifyWorkspaceAccess(workspaceId, session.userId, ["Owner", "Admin"]);
    if (!member) {
      return NextResponse.json(
        { success: false, message: "Forbidden: Owner or Admin role required." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { code, wabaId, phoneNumberId, mock } = body;

    // Handle Mock Connection for local testing without real Meta credentials
    if (mock || process.env.WHATSAPP_MOCK_MODE === "true" || code === "mock_code") {
      const mockEncrypted = encryptToken("mock_access_token_12345");
      const account = await WhatsAppAccount.findOneAndUpdate(
        { workspaceId },
        {
          wabaId: wabaId || "mock_waba_id_102086029",
          phoneNumberId: phoneNumberId || "mock_phone_id_98765",
          displayPhoneNumber: "+91 98765 43210",
          verifiedName: "Mock Business Profile",
          businessName: "Zaanway Demo Workspace",
          accessTokenEncrypted: mockEncrypted,
          tokenType: "Bearer",
          verified: true,
          status: "connected",
          webhookStatus: "active",
          lastError: null,
        },
        { new: true, upsert: true }
      );

      console.log(`[WHATSAPP_CONNECT] workspaceId=${workspaceId} mode=mock status=success`);

      return NextResponse.json({
        success: true,
        message: "Mock WhatsApp linked successfully.",
        account: {
          id: account._id,
          displayPhoneNumber: account.displayPhoneNumber,
          verifiedName: account.verifiedName,
          wabaId: account.wabaId,
          phoneNumberId: account.phoneNumberId,
          status: account.status,
        },
      });
    }

    // Require real authorization code and identifiers
    if (!code || !wabaId || !phoneNumberId) {
      return NextResponse.json(
        { success: false, message: "Missing required Meta authorization parameters (code, wabaId, phoneNumberId)." },
        { status: 400 }
      );
    }

    // 1. Securely exchange code for Meta access token
    const tokenResult = await exchangeCodeForToken(code);
    if (!tokenResult.success || !tokenResult.data?.accessToken) {
      return NextResponse.json(
        { success: false, message: tokenResult.error || "Failed to exchange Meta authorization code." },
        { status: 400 }
      );
    }

    const rawAccessToken = tokenResult.data.accessToken;

    // 2. Fetch Phone Number details from Meta Cloud API
    const phoneDetailsResult = await getPhoneNumberDetails(phoneNumberId, rawAccessToken);
    const displayPhoneNumber = phoneDetailsResult.data?.displayPhoneNumber || "Verified WhatsApp Number";
    const verifiedName = phoneDetailsResult.data?.verifiedName || "";
    const qualityRating = phoneDetailsResult.data?.qualityRating || "UNKNOWN";
    const messagingLimit = phoneDetailsResult.data?.messagingLimit || "TIER_1K";

    // 3. Fetch WABA details
    const wabaDetailsResult = await getWabaDetails(wabaId, rawAccessToken);
    const businessName = wabaDetailsResult.data?.name || verifiedName || "My Business";

    // 4. Register Phone Number with Cloud API
    const registerResult = await registerPhoneNumber(phoneNumberId, rawAccessToken);
    if (!registerResult.success) {
      console.warn(`[WHATSAPP_CONNECT] Warning: Register phone returned error: ${registerResult.error}`);
    }

    // 5. Subscribe WABA to Webhooks
    const subscribeResult = await subscribeWabaToWebhook(wabaId, rawAccessToken);
    if (!subscribeResult.success) {
      console.warn(`[WHATSAPP_CONNECT] Warning: Subscribe WABA returned error: ${subscribeResult.error}`);
    }

    // 6. Encrypt access token at rest using AES-256-GCM
    const encryptedAccessToken = encryptToken(rawAccessToken);

    // 7. Save Connection exclusively under the authenticated workspace
    const account = await WhatsAppAccount.findOneAndUpdate(
      { workspaceId },
      {
        wabaId,
        phoneNumberId,
        displayPhoneNumber,
        verifiedName,
        businessName,
        accessTokenEncrypted: encryptedAccessToken,
        tokenType: "Bearer",
        verified: true,
        status: "connected",
        webhookStatus: subscribeResult.success ? "active" : "pending",
        lastError: null,
        qualityRating,
        messagingLimit,
      },
      { new: true, upsert: true }
    );

    console.log(
      `[WHATSAPP_CONNECT] workspaceId=${workspaceId} wabaId=${wabaId} phoneNumberId=${phoneNumberId} status=success`
    );

    // Return ONLY safe metadata to the frontend (NEVER return access token or secrets)
    return NextResponse.json({
      success: true,
      message: "WhatsApp Business Account linked successfully.",
      account: {
        id: account._id,
        displayPhoneNumber: account.displayPhoneNumber,
        verifiedName: account.verifiedName,
        businessName: account.businessName,
        wabaId: account.wabaId,
        phoneNumberId: account.phoneNumberId,
        status: account.status,
        webhookStatus: account.webhookStatus,
        qualityRating: account.qualityRating,
      },
    });
  } catch (error: unknown) {
    console.error("[WHATSAPP_ERROR] operation=connect route_error", error);
    return NextResponse.json(
      { success: false, message: "An internal server error occurred while connecting WhatsApp." },
      { status: 500 }
    );
  }
}