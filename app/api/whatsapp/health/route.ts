import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { getSession } from "@/lib/auth/session";
import WhatsAppAccount from "@/models/WhatsAppAccount";
import { getPhoneNumberDetails, getWabaDetails } from "@/lib/meta/service";
import { decryptToken } from "@/lib/security/encryption";

export async function GET() {
  try {
    await connectDB();
    const session = await getSession();

    if (!session || !session.userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const workspaceId = session.workspaceId;
    if (!workspaceId) {
      return NextResponse.json({ success: false, message: "No active workspace" }, { status: 400 });
    }

    const account = await WhatsAppAccount.findOne({ workspaceId });
    if (!account || account.status === "disconnected") {
      return NextResponse.json({
        success: true,
        connected: false,
        message: "No connected WhatsApp profile found.",
        checks: {
          metaAuth: false,
          waba: false,
          phoneNumber: false,
          webhook: false,
          messagingApi: false,
        },
      });
    }

    // Mock mode handling
    if (
      process.env.WHATSAPP_MOCK_MODE === "true" ||
      account.accessTokenEncrypted.includes("mock_access_token")
    ) {
      return NextResponse.json({
        success: true,
        connected: true,
        checks: {
          metaAuth: true,
          waba: true,
          phoneNumber: true,
          webhook: true,
          messagingApi: true,
        },
        details: {
          displayPhoneNumber: account.displayPhoneNumber,
          verifiedName: account.verifiedName || "Mock Business Profile",
          qualityRating: "GREEN",
          messagingLimit: "TIER_1K",
          wabaId: account.wabaId,
          phoneNumberId: account.phoneNumberId,
        },
      });
    }

    // Live checks against Meta
    let token = "";
    try {
      token = decryptToken(account.accessTokenEncrypted);
    } catch {
      return NextResponse.json({
        success: true,
        connected: false,
        checks: {
          metaAuth: false,
          waba: false,
          phoneNumber: false,
          webhook: false,
          messagingApi: false,
        },
        error: "Failed to decrypt local access token. Reconnection required.",
      });
    }

    // 1. Check Phone Number & Messaging Status
    const phoneRes = await getPhoneNumberDetails(account.phoneNumberId, token);
    const isPhoneValid = phoneRes.success && !!phoneRes.data;

    // 2. Check WABA access
    const wabaRes = await getWabaDetails(account.wabaId, token);
    const isWabaValid = wabaRes.success && !!wabaRes.data;

    const checks = {
      metaAuth: isPhoneValid || isWabaValid,
      waba: isWabaValid,
      phoneNumber: isPhoneValid,
      webhook: account.webhookStatus === "active",
      messagingApi: isPhoneValid,
    };

    const allPassed = checks.metaAuth && checks.waba && checks.phoneNumber;

    // Update account status in DB
    account.status = allPassed ? "connected" : "error";
    if (!allPassed) {
      account.lastError = phoneRes.error || wabaRes.error || "One or more Meta components failed health check.";
    } else {
      account.lastError = null;
    }
    await account.save();

    return NextResponse.json({
      success: true,
      connected: allPassed,
      checks,
      error: account.lastError,
      details: {
        displayPhoneNumber: account.displayPhoneNumber,
        verifiedName: account.verifiedName,
        qualityRating: account.qualityRating,
        messagingLimit: account.messagingLimit,
        wabaId: account.wabaId,
        phoneNumberId: account.phoneNumberId,
      },
    });
  } catch (err: unknown) {
    console.error("[WHATSAPP_HEALTH_ERROR]", err);
    return NextResponse.json(
      { success: false, message: "Error performing connection health check." },
      { status: 500 }
    );
  }
}
