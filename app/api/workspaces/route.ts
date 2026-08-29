import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { getSession, signToken, setSessionCookie } from "@/lib/auth/session";
import Workspace from "@/models/Workspace";
import WorkspaceMember from "@/models/WorkspaceMember";
import Automation from "@/models/Automation";

export async function GET() {
  try {
    await connectDB();
    const session = await getSession();

    if (!session || !session.userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const memberships = await WorkspaceMember.find({ userId: session.userId }).lean();
    const workspaceIds = memberships.map((m) => m.workspaceId);
    const workspaces = await Workspace.find({ _id: { $in: workspaceIds } }).lean();

    const result = workspaces.map((ws) => {
      const mem = memberships.find((m) => m.workspaceId.toString() === ws._id.toString());
      return {
        ...ws,
        role: mem?.role || "Agent",
      };
    });

    return NextResponse.json({ success: true, workspaces: result });
  } catch (error: unknown) {
    console.error("Fetch workspaces error:", error);
    return NextResponse.json(
      { success: false, message: (error as Error).message || "An error occurred fetching workspaces" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const session = await getSession();

    if (!session || !session.userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { name, industry, businessDescription, address, website, hours } = await request.json();

    if (!name) {
      return NextResponse.json(
        { success: false, message: "Workspace name is required" },
        { status: 400 }
      );
    }

    // Create workspace
    const workspace = await Workspace.create({
      name,
      ownerId: session.userId,
      plan: "Free",
      // Metadata fields for custom business settings
      metadata: {
        industry,
        businessDescription,
        address,
        website,
        hours,
      },
    });

    // Create membership role (Owner)
    await WorkspaceMember.create({
      workspaceId: workspace._id,
      userId: session.userId,
      role: "Owner",
    });

    // Create default automation
    await Automation.create({
      workspaceId: workspace._id,
      name: "Welcome Bot (Editable)",
      trigger: {
        type: "incoming_message",
        keyword: "hi",
      },
      actions: [
        {
          type: "send_text",
          payload: {
            text: `Hello 👋 Welcome to ${workspace.name}!\n\nHow can we help you?`,
          },
        },
        {
          type: "send_interactive_buttons",
          payload: {
            buttons: ["Products", "Services", "Talk to Agent"],
          },
        },
      ],
      isActive: true,
    });

    // Switch active workspace to this new one
    const newToken = signToken({
      userId: session.userId,
      email: session.email,
      workspaceId: workspace._id.toString(),
    });
    await setSessionCookie(newToken);

    return NextResponse.json({ success: true, workspace });
  } catch (error: unknown) {
    console.error("Create workspace error:", error);
    return NextResponse.json(
      { success: false, message: (error as Error).message || "An error occurred creating workspace" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    await connectDB();
    const session = await getSession();

    if (!session || !session.userId || !session.workspaceId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized or no active workspace" },
        { status: 401 }
      );
    }

    const { name, industry, businessDescription, address, website, hours } = await request.json();

    const workspace = await Workspace.findOneAndUpdate(
      { _id: session.workspaceId },
      {
        name: name || undefined,
        "metadata.industry": industry,
        "metadata.businessDescription": businessDescription,
        "metadata.address": address,
        "metadata.website": website,
        "metadata.hours": hours,
      },
      { new: true }
    );

    if (!workspace) {
      return NextResponse.json(
        { success: false, message: "Workspace not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, workspace });
  } catch (error: unknown) {
    console.error("Update workspace error:", error);
    return NextResponse.json(
      { success: false, message: (error as Error).message || "An error occurred updating workspace" },
      { status: 500 }
    );
  }
}
