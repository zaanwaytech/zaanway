import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { getSession } from "@/lib/auth/session";
import { verifyWorkspaceAccess } from "@/lib/auth/permissions";
import Automation from "@/models/Automation";

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
    const { workspaceId, welcomeMessage, buttons } = body;

    const targetWorkspaceId = workspaceId || session.workspaceId;

    // Verify workspace access
    const member = await verifyWorkspaceAccess(targetWorkspaceId, session.userId, ["Owner", "Admin"]);
    if (!member) {
      return NextResponse.json(
        { success: false, message: "Forbidden: Owner or Admin role required" },
        { status: 403 }
      );
    }

    // Find and update the default Welcome automation flow
    let welcomeBot = await Automation.findOne({
      workspaceId: targetWorkspaceId,
      trigger: { type: "incoming_message", keyword: "hi" },
    });

    const actions = [
      {
        type: "send_text",
        payload: {
          text: welcomeMessage || "Hello 👋 Welcome to our business!",
        },
      },
      {
        type: "send_interactive_buttons",
        payload: {
          buttons: buttons && buttons.length > 0 ? buttons : ["Products", "Services", "Talk to Agent"],
        },
      },
    ];

    if (welcomeBot) {
      welcomeBot.actions = actions;
      await welcomeBot.save();
    } else {
      welcomeBot = await Automation.create({
        workspaceId: targetWorkspaceId,
        name: "Welcome Bot (Editable)",
        trigger: {
          type: "incoming_message",
          keyword: "hi",
        },
        actions,
        isActive: true,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Chatbot settings updated successfully",
      automation: welcomeBot,
    });
  } catch (error: unknown) {
    console.error("POST Settings Error:", error);
    return NextResponse.json(
      { success: false, message: (error as Error).message || "Failed to update chatbot settings" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const session = await getSession();

    if (!session || !session.userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get("workspaceId") || session.workspaceId;

    const welcomeBot = await Automation.findOne({
      workspaceId,
      trigger: { type: "incoming_message", keyword: "hi" },
    });

    const welcomeMessage = welcomeBot?.actions?.[0]?.payload?.text || "Hello 👋 Welcome to our business!";
    const buttons = welcomeBot?.actions?.[1]?.payload?.buttons || ["Products", "Services", "Talk to Agent"];

    return NextResponse.json({
      success: true,
      settings: {
        welcomeMessage,
        buttons,
      },
    });
  } catch (error: unknown) {
    console.error("GET Settings Error:", error);
    return NextResponse.json(
      { success: false, message: (error as Error).message || "Failed to fetch chatbot settings" },
      { status: 500 }
    );
  }
}
