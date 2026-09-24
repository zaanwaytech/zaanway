import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { getSession } from "@/lib/auth/session";
import Conversation from "@/models/Conversation";
import Message from "@/models/Message";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: conversationId } = await params;

    // Strict multi-tenant verification: Conversation MUST belong to authenticated workspace
    const conversation = await Conversation.findOne({
      _id: conversationId,
      workspaceId,
    });

    if (!conversation) {
      return NextResponse.json(
        { success: false, message: "Conversation not found in your workspace" },
        { status: 404 }
      );
    }

    const messages = await Message.find({
      workspaceId,
      conversationId: conversation._id,
    })
      .sort({ timestamp: 1 })
      .limit(200)
      .lean();

    return NextResponse.json({
      success: true,
      conversation,
      messages,
    });
  } catch (error: unknown) {
    console.error("[CONVERSATION_MESSAGES_ERROR]", error);
    return NextResponse.json(
      { success: false, message: "Failed to load messages" },
      { status: 500 }
    );
  }
}
