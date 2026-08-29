import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { getSession } from "@/lib/auth/session";
import { verifyWorkspaceAccess } from "@/lib/auth/permissions";
import Automation from "@/models/Automation";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const session = await getSession();

    if (!session || !session.userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    const existingAutomation = await Automation.findById(id);
    if (!existingAutomation) {
      return NextResponse.json({ success: false, message: "Automation not found" }, { status: 404 });
    }

    const member = await verifyWorkspaceAccess(existingAutomation.workspaceId, session.userId, ["Owner", "Admin"]);
    if (!member) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const updatedAutomation = await Automation.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true }
    );

    return NextResponse.json({ success: true, automation: updatedAutomation });
  } catch (error: any) {
    console.error("PUT Automation Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update automation" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const session = await getSession();

    if (!session || !session.userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const existingAutomation = await Automation.findById(id);
    if (!existingAutomation) {
      return NextResponse.json({ success: false, message: "Automation not found" }, { status: 404 });
    }

    const member = await verifyWorkspaceAccess(existingAutomation.workspaceId, session.userId, ["Owner", "Admin"]);
    if (!member) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    await Automation.findByIdAndDelete(id);

    return NextResponse.json({ success: true, message: "Automation deleted successfully" });
  } catch (error: any) {
    console.error("DELETE Automation Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to delete automation" },
      { status: 500 }
    );
  }
}
