import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { getSession } from "@/lib/auth/session";
import { verifyWorkspaceAccess } from "@/lib/auth/permissions";
import Automation from "@/models/Automation";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const session = await getSession();

    if (!session || !session.userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get("workspaceId") || session.workspaceId;

    if (!workspaceId) {
      return NextResponse.json({ success: false, message: "Workspace ID is required" }, { status: 400 });
    }

    const member = await verifyWorkspaceAccess(workspaceId, session.userId);
    if (!member) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const automations = await Automation.find({ workspaceId }).sort({ createdAt: -1 });

    return NextResponse.json({ success: true, automations });
  } catch (error: any) {
    console.error("GET Automations Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch automations" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const session = await getSession();

    if (!session || !session.userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { workspaceId, name, trigger, actions, isActive } = body;
    const targetWorkspaceId = workspaceId || session.workspaceId;

    const member = await verifyWorkspaceAccess(targetWorkspaceId, session.userId, ["Owner", "Admin"]);
    if (!member) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const automation = await Automation.create({
      workspaceId: targetWorkspaceId,
      name,
      trigger,
      actions,
      isActive: isActive !== undefined ? isActive : true,
    });

    return NextResponse.json({ success: true, automation }, { status: 201 });
  } catch (error: any) {
    console.error("POST Automation Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to create automation" },
      { status: 500 }
    );
  }
}
