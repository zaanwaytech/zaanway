import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { getSession } from "@/lib/auth/session";
import { verifyWorkspaceAccess } from "@/lib/auth/permissions";
import WhatsAppAccount from "@/models/WhatsAppAccount";

export async function DELETE() {
  try {
    await connectDB();
    const session = await getSession();

    if (!session || !session.userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const workspaceId = session.workspaceId;
    if (!workspaceId) {
      return NextResponse.json(
        { success: false, message: "No active workspace selected" },
        { status: 400 }
      );
    }

    // Verify workspace access and Owner/Admin role
    const member = await verifyWorkspaceAccess(workspaceId, session.userId, ["Owner", "Admin"]);
    if (!member) {
      return NextResponse.json(
        { success: false, message: "Forbidden: Owner or Admin role required" },
        { status: 403 }
      );
    }

    const account = await WhatsAppAccount.findOne({ workspaceId });
    if (!account) {
      return NextResponse.json(
        { success: false, message: "No connected WhatsApp profile found" },
        { status: 404 }
      );
    }

    // Attempt to deregister from Meta
    const isMock = process.env.WHATSAPP_MOCK_MODE === "true" || account.accessTokenEncrypted.startsWith("mock_");
    
    if (!isMock && account.phoneNumberId) {
      try {
        const apiVersion = process.env.META_API_VERSION || "v20.0";
        const systemToken = process.env.WHATSAPP_ACCESS_TOKEN;
        const tokenToUse = systemToken || account.accessTokenEncrypted;

        const deregisterUrl = `https://graph.facebook.com/${apiVersion}/${account.phoneNumberId}/deregister`;
        await fetch(deregisterUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${tokenToUse}`,
            "Content-Type": "application/json",
          },
        });
      } catch (err) {
        console.error("Failed to deregister from Meta API:", err);
      }
    }

    // Delete the account from our DB
    await WhatsAppAccount.deleteOne({ _id: account._id });

    return NextResponse.json({
      success: true,
      message: "WhatsApp account disconnected and removed successfully",
    });
  } catch (error: unknown) {
    console.error("WhatsApp Disconnect Error:", error);
    return NextResponse.json(
      { success: false, message: (error as Error).message || "Internal server error" },
      { status: 500 }
    );
  }
}
