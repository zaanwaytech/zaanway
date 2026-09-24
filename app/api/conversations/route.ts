import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { getSession } from "@/lib/auth/session";
import Conversation from "@/models/Conversation";
import Message from "@/models/Message";

export async function GET(req: NextRequest) {
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

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status");

    const query: Record<string, unknown> = { workspaceId };
    if (status) {
      query.status = status;
    }
    if (search) {
      query.$or = [
        { customerPhone: { $regex: search, $options: "i" } },
        { customerName: { $regex: search, $options: "i" } },
      ];
    }

    const conversations = await Conversation.find(query)
      .sort({ lastMessageAt: -1 })
      .limit(100)
      .lean();

    // Fetch the latest message for each conversation
    const conversationsWithLatest = await Promise.all(
      conversations.map(async (conv) => {
        const lastMsg = await Message.findOne({
          workspaceId,
          conversationId: conv._id,
        })
          .sort({ timestamp: -1 })
          .lean();

        return {
          ...conv,
          latestMessage: lastMsg?.text || (lastMsg?.type ? `[${lastMsg.type}]` : "No messages yet"),
          latestMessageTimestamp: lastMsg?.timestamp || conv.lastMessageAt,
          latestMessageDirection: lastMsg?.direction,
          latestMessageStatus: lastMsg?.status,
        };
      })
    );

    return NextResponse.json({
      success: true,
      conversations: conversationsWithLatest,
    });
  } catch (error: unknown) {
    console.error("[CONVERSATIONS_GET_ERROR]", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch conversations" },
      { status: 500 }
    );
  }
}
