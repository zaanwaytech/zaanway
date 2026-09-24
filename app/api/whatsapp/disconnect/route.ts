import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { getSession } from "@/lib/auth/session";
import { verifyWorkspaceAccess } from "@/lib/auth/permissions";
import WhatsAppAccount from "@/models/WhatsAppAccount";
import Automation from "@/models/Automation";
import { deregisterPhoneNumber } from "@/lib/meta/service";
import { decryptToken } from "@/lib/security/encryption";

export async function POST() {
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

    // Role verification: Only Owner or Admin can disconnect WhatsApp
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
        { success: false, message: "No active WhatsApp connection found for this workspace." },
        { status: 404 }
      );
    }

    // Try deregistering from Meta if live credentials exist
    try {
      if (!account.accessTokenEncrypted.includes("mock_access_token")) {
        const token = decryptToken(account.accessTokenEncrypted);
        await deregisterPhoneNumber(account.phoneNumberId, token);
      }
    } catch (deregErr) {
      console.warn("[WHATSAPP_DISCONNECT] Meta deregistration warning:", deregErr);
    }

    // Update connection status to 'disconnected' and wipe encrypted credentials
    // IMPORTANT: Preserve historical messages, contacts, and conversations!
    account.status = "disconnected";
    account.accessTokenEncrypted = "REVOKED";
    account.lastError = "Account disconnected by user.";
    await account.save();

    // Pause all automations for this workspace to avoid sending errors
    await Automation.updateMany({ workspaceId }, { isActive: false });

    console.log(`[WHATSAPP_DISCONNECT] workspaceId=${workspaceId} status=disconnected`);

    return NextResponse.json({
      success: true,
      message: "WhatsApp account has been successfully disconnected. Historical data preserved.",
    });
  } catch (error: unknown) {
    console.error("[WHATSAPP_ERROR] operation=disconnect", error);
    return NextResponse.json(
      { success: false, message: "Failed to disconnect WhatsApp account." },
      { status: 500 }
    );
  }
}

// Support DELETE as well for compatibility
export async function DELETE() {
  return POST();
}
