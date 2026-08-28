import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { getSession } from "@/lib/auth/session";
import { verifyWorkspaceAccess } from "@/lib/auth/permissions";
import WhatsAppAccount from "@/models/WhatsAppAccount";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const session = await getSession();

    if (!session || !session.userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      workspaceId,
      code,
      businessId,
      wabaId,
      phoneNumberId,
      displayPhoneNumber,
      mock,
    } = body;

    const targetWorkspaceId = workspaceId || session.workspaceId;

    // Verify workspace access and Owner/Admin role
    const member = await verifyWorkspaceAccess(targetWorkspaceId, session.userId, ["Owner", "Admin"]);
    if (!member) {
      return NextResponse.json(
        { success: false, message: "Forbidden: Owner or Admin role required" },
        { status: 403 }
      );
    }

    // Handle mock connection (Onboarding or Local development)
    if (mock || process.env.WHATSAPP_MOCK_MODE === "true") {
      const displayNum = displayPhoneNumber || "+1 555 019 2831";
      const account = await WhatsAppAccount.findOneAndUpdate(
        { workspaceId: targetWorkspaceId },
        {
          wabaId: wabaId || "mock_waba_id_12345",
          phoneNumberId: phoneNumberId || "mock_phone_id_67890",
          displayPhoneNumber: displayNum,
          accessTokenEncrypted: "mock_encrypted_access_token_abcde",
          verified: true,
          status: "connected",
        },
        { new: true, upsert: true }
      );

      return NextResponse.json({
        success: true,
        message: "Mock WhatsApp linked successfully",
        account: {
          id: account._id,
          displayPhoneNumber: account.displayPhoneNumber,
          wabaId: account.wabaId,
        },
      });
    }

    // If real Meta sign up code is provided
    if (!code || !businessId || !wabaId || !phoneNumberId) {
      return NextResponse.json(
        { success: false, message: "Missing Meta authorization parameters" },
        { status: 400 }
      );
    }

    const appId = process.env.META_APP_ID;
    const appSecret = process.env.META_APP_SECRET;
    const apiVersion = process.env.META_GRAPH_API_VERSION || "v20.0";

    if (!appId || !appSecret) {
      return NextResponse.json(
        { success: false, message: "Meta configuration missing on server" },
        { status: 500 }
      );
    }

    // Exchange auth code for access token
    const tokenUrl = `https://graph.facebook.com/${apiVersion}/oauth/access_token?client_id=${appId}&client_secret=${appSecret}&code=${code}`;
    const tokenRes = await fetch(tokenUrl);
    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || tokenData.error) {
      console.error("Meta Token Exchange Error:", tokenData.error);
      return NextResponse.json(
        { success: false, message: tokenData.error?.message || "Failed to exchange Meta code" },
        { status: 400 }
      );
    }

    const clientAccessToken = tokenData.access_token;

    // Register phone number
    try {
      const registerUrl = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/register`;
      await fetch(registerUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${clientAccessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          pin: "123456",
        }),
      });
    } catch (regErr) {
      console.error("Error registering phone number:", regErr);
    }

    // Subscribe WABA
    try {
      const subscribeUrl = `https://graph.facebook.com/${apiVersion}/${wabaId}/subscribed_apps`;
      await fetch(subscribeUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${clientAccessToken}`,
        },
      });
    } catch (subErr) {
      console.error("Error subscribing app to WABA:", subErr);
    }

    // Save in Database under active workspace
    const account = await WhatsAppAccount.findOneAndUpdate(
      { workspaceId: targetWorkspaceId },
      {
        wabaId,
        phoneNumberId,
        displayPhoneNumber: displayPhoneNumber || "Verified Number",
        accessTokenEncrypted: clientAccessToken, // In prod you can encrypt this token
        verified: true,
        status: "connected",
      },
      { new: true, upsert: true }
    );

    return NextResponse.json({
      success: true,
      message: "WhatsApp Business Account linked successfully",
      account: {
        id: account._id,
        displayPhoneNumber: account.displayPhoneNumber,
        wabaId: account.wabaId,
        phoneNumberId: account.phoneNumberId,
      },
    });
  } catch (error: unknown) {
    console.error("WhatsApp Connection Error:", error);
    return NextResponse.json(
      { success: false, message: (error as Error).message || "Internal server error" },
      { status: 500 }
    );
  }
}