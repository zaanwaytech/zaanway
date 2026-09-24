import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { getSession } from "@/lib/auth/session";
import WhatsAppAccount from "@/models/WhatsAppAccount";
import { getPhoneNumberDetails } from "@/lib/meta/service";
import { decryptToken } from "@/lib/security/encryption";

export async function GET() {
  try {
    await connectDB();
    const session = await getSession();

    if (!session || !session.userId) {
      return NextResponse.json(
        { success: false, connected: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const workspaceId = session.workspaceId;
    if (!workspaceId) {
      return NextResponse.json(
        { success: false, connected: false, message: "No active workspace selected" },
        { status: 400 }
      );
    }

    // Lookup WhatsApp Account strictly for the authenticated workspace
    const account = await WhatsAppAccount.findOne({ workspaceId });
    if (!account || account.status === "disconnected") {
      return NextResponse.json({
        success: true,
        connected: false,
        message: "No connected WhatsApp profile found for this workspace.",
      });
    }

    // Handle Mock mode
    if (
      process.env.WHATSAPP_MOCK_MODE === "true" ||
      account.accessTokenEncrypted.includes("mock_access_token")
    ) {
      return NextResponse.json({
        success: true,
        connected: true,
        phoneNumberId: account.phoneNumberId,
        displayPhoneNumber: account.displayPhoneNumber,
        verifiedName: account.verifiedName || "Mock Business Profile",
        businessName: account.businessName || "Zaanway Demo",
        wabaId: account.wabaId,
        status: account.status,
        qualityRating: account.qualityRating || "GREEN",
        messagingLimit: account.messagingLimit || "TIER_1K",
        webhookStatus: account.webhookStatus || "active",
      });
    }

    // Decrypt the token server-side for live Meta verification
    let token = "";
    try {
      token = decryptToken(account.accessTokenEncrypted);
    } catch {
      account.status = "error";
      account.lastError = "Token decryption failed on server.";
      await account.save();

      return NextResponse.json({
        success: true,
        connected: false,
        error: "WhatsApp security token could not be decrypted. Reconnection is required.",
      });
    }

    // Verify phone number details live against Meta
    const phoneDetails = await getPhoneNumberDetails(account.phoneNumberId, token);
    if (!phoneDetails.success || !phoneDetails.data) {
      account.status = "error";
      account.lastError = phoneDetails.error || "Meta verification failed";
      await account.save();

      return NextResponse.json({
        success: true,
        connected: false,
        error: phoneDetails.error || "Unable to reach WhatsApp Business Account. Please check connection.",
        phoneNumberId: account.phoneNumberId,
        displayPhoneNumber: account.displayPhoneNumber,
        wabaId: account.wabaId,
      });
    }

    // Update synced fields
    const updatedData = phoneDetails.data;
    if (updatedData.displayPhoneNumber && updatedData.displayPhoneNumber !== account.displayPhoneNumber) {
      account.displayPhoneNumber = updatedData.displayPhoneNumber;
    }
    if (updatedData.verifiedName) {
      account.verifiedName = updatedData.verifiedName;
    }
    if (updatedData.qualityRating) {
      account.qualityRating = updatedData.qualityRating;
    }
    if (updatedData.messagingLimit) {
      account.messagingLimit = updatedData.messagingLimit;
    }
    account.status = "connected";
    account.lastError = null;
    await account.save();

    return NextResponse.json({
      success: true,
      connected: true,
      phoneNumberId: account.phoneNumberId,
      displayPhoneNumber: account.displayPhoneNumber,
      verifiedName: account.verifiedName || "Business Profile",
      businessName: account.businessName || account.verifiedName || "My Business",
      wabaId: account.wabaId,
      qualityRating: account.qualityRating,
      messagingLimit: account.messagingLimit,
      status: account.status,
      webhookStatus: account.webhookStatus,
    });
  } catch (error: unknown) {
    console.error("[WHATSAPP_ERROR] operation=status route_error", error);
    return NextResponse.json(
      { success: false, connected: false, message: "Internal server error fetching connection status." },
      { status: 500 }
    );
  }
}
