import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { getSession } from "@/lib/auth/session";
import WhatsAppAccount from "@/models/WhatsAppAccount";
import Conversation from "@/models/Conversation";
import Message from "@/models/Message";
import Contact from "@/models/Contact";
import AutomationRun from "@/models/AutomationRun";

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

    // 1. WhatsApp Connection Status strictly for this tenant
    const account = await WhatsAppAccount.findOne({ workspaceId }).lean();

    // 2. Count messages strictly for this tenant
    const [messagesReceived, messagesSent, totalConversations, totalContacts, automationRuns] =
      await Promise.all([
        Message.countDocuments({ workspaceId, direction: "incoming" }),
        Message.countDocuments({ workspaceId, direction: "outgoing" }),
        Conversation.countDocuments({ workspaceId }),
        Contact.countDocuments({ workspaceId }),
        AutomationRun.countDocuments({ workspaceId }),
      ]);

    const automationFailures = await AutomationRun.countDocuments({
      workspaceId,
      status: "failed",
    });

    const activeConversations = await Conversation.countDocuments({
      workspaceId,
      status: "open",
    });

    // Messages today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const messagesToday = await Message.countDocuments({
      workspaceId,
      timestamp: { $gte: startOfToday },
    });

    return NextResponse.json({
      success: true,
      metrics: {
        messagesReceived,
        messagesSent,
        messagesToday,
        totalConversations,
        activeConversations,
        totalContacts,
        automationExecutions: automationRuns,
        automationFailures,
        connectedPhoneNumber: account?.displayPhoneNumber || null,
        verifiedName: account?.verifiedName || null,
        connectionStatus: account?.status || "disconnected",
        wabaId: account?.wabaId || null,
        qualityRating: account?.qualityRating || null,
      },
    });
  } catch (error: unknown) {
    console.error("[ANALYTICS_GET_ERROR]", error);
    return NextResponse.json(
      { success: false, message: "Failed to calculate analytics" },
      { status: 500 }
    );
  }
}
