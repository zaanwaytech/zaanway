import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { getSession } from "@/lib/auth/session";
import { verifyWorkspaceAccess } from "@/lib/auth/permissions";
import Automation from "@/models/Automation";

export async function GET() {
  const bypassAuth = process.env.BYPASS_AUTH === "true" || process.env.NEXT_PUBLIC_BYPASS_AUTH === "true";

  try {
    const session = await getSession();

    if (!session || !session.userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    // Derive strictly from session
    const workspaceId = session.workspaceId;
    if (!workspaceId) {
      return NextResponse.json({ success: false, message: "Workspace not selected" }, { status: 400 });
    }

    try {
      await connectDB();
    } catch (dbErr) {
      console.warn("[AUTOMATIONS] DB connection offline:", dbErr);
      return NextResponse.json({ success: true, automations: [] });
    }

    const member = await verifyWorkspaceAccess(workspaceId, session.userId);
    if (!member) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const automations = await Automation.find({ workspaceId }).sort({ createdAt: -1 });

    return NextResponse.json({ success: true, automations });
  } catch (error: unknown) {
    console.error("GET Automations Error:", error);
    if (bypassAuth) {
      return NextResponse.json({ success: true, automations: [] });
    }
    return NextResponse.json(
      { success: false, message: (error as Error).message || "Failed to fetch automations" },
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

    // Derive strictly from session (never trust req.body.workspaceId)
    const workspaceId = session.workspaceId;
    if (!workspaceId) {
      return NextResponse.json({ success: false, message: "Workspace not selected" }, { status: 400 });
    }

    const member = await verifyWorkspaceAccess(workspaceId, session.userId, ["Owner", "Admin"]);
    if (!member) {
      return NextResponse.json({ success: false, message: "Forbidden: Owner or Admin required" }, { status: 403 });
    }

    const body = await req.json();
    const { name, trigger, actions, isActive } = body;

    if (!name || !trigger?.type) {
      return NextResponse.json({ success: false, message: "Rule name and trigger are required" }, { status: 400 });
    }

    const automation = await Automation.create({
      workspaceId,
      name,
      trigger,
      actions: Array.isArray(actions) ? actions : [],
      isActive: isActive !== undefined ? isActive : true,
    });

    return NextResponse.json({ success: true, automation }, { status: 201 });
  } catch (error: unknown) {
    console.error("POST Automation Error:", error);
    return NextResponse.json(
      { success: false, message: (error as Error).message || "Failed to create automation" },
      { status: 500 }
    );
  }
}
