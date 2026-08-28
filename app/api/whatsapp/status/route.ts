import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { getSession } from "@/lib/auth/session";
import WhatsAppAccount from "@/models/WhatsAppAccount";

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

    const account = await WhatsAppAccount.findOne({ workspaceId });
    if (!account) {
      return NextResponse.json({
        success: true,
        connected: false,
        message: "No connected WhatsApp profile found for this workspace",
      });
    }

    // Handle Mock account mode
    if (
      process.env.WHATSAPP_MOCK_MODE === "true" ||
      account.accessTokenEncrypted.startsWith("mock_")
    ) {
      return NextResponse.json({
        success: true,
        connected: true,
        phoneNumberId: account.phoneNumberId,
        displayPhoneNumber: account.displayPhoneNumber,
        verifiedName: "Mock Business Profile",
        wabaId: account.wabaId,
        platform: "Meta WhatsApp Cloud API (MOCK)",
      });
    }

    // Call Meta API
    const apiVersion = process.env.META_GRAPH_API_VERSION || "v20.0";
    const res = await fetch(
      `https://graph.facebook.com/${apiVersion}/${account.phoneNumberId}`,
      {
        headers: {
          Authorization: `Bearer ${account.accessTokenEncrypted}`,
        },
        cache: "no-store",
      }
    );

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({
        success: true,
        connected: false,
        error: data.error || data,
      });
    }

    return NextResponse.json({
      success: true,
      connected: true,
      phoneNumberId: data.id,
      displayPhoneNumber: data.display_phone_number,
      verifiedName: data.verified_name,
      wabaId: account.wabaId,
      qualityRating: data.quality_rating,
      messagingLimit: data.messaging_limit,
      platform: "Meta WhatsApp Cloud API",
    });
  } catch (error: unknown) {
    console.error("WhatsApp Status check error:", error);
    return NextResponse.json(
      { success: false, connected: false, message: (error as Error).message || "Internal server error" },
      { status: 500 }
    );
  }
}
