import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { getSession, signToken, setSessionCookie } from "@/lib/auth/session";
import User from "@/models/User";
import WorkspaceMember from "@/models/WorkspaceMember";
import Workspace from "@/models/Workspace";

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

    const user = await User.findById(session.userId).select("-passwordHash");
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Get all workspaces user is member of
    const memberships = await WorkspaceMember.find({ userId: user._id }).lean();
    const workspaceIds = memberships.map((m) => m.workspaceId);
    const workspaces = await Workspace.find({ _id: { $in: workspaceIds } }).lean();

    // Attach role to workspaces array
    const workspacesWithRoles = workspaces.map((ws) => {
      const membership = memberships.find(
        (m) => m.workspaceId.toString() === ws._id.toString()
      );
      return {
        id: ws._id,
        name: ws.name,
        plan: ws.plan,
        role: membership?.role || "Agent",
      };
    });

    // Check active workspace
    let activeWorkspaceId = session.workspaceId;
    if (!activeWorkspaceId && workspacesWithRoles.length > 0) {
      activeWorkspaceId = workspacesWithRoles[0].id.toString();

      // Update session cookie with active workspace
      const newToken = signToken({
        userId: session.userId,
        email: session.email,
        workspaceId: activeWorkspaceId,
      });
      await setSessionCookie(newToken);
    }

    const activeWorkspace = workspacesWithRoles.find(
      (ws) => ws.id.toString() === activeWorkspaceId
    ) || workspacesWithRoles[0] || null;

    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
      activeWorkspace,
      workspaces: workspacesWithRoles,
    });
  } catch (error: unknown) {
    console.error("Auth me check error:", error);
    return NextResponse.json(
      { success: false, message: (error as Error).message || "An error occurred fetching profile" },
      { status: 500 }
    );
  }
}

// Allow POST to update active workspace id in session
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

    const { workspaceId } = await request.json();
    if (!workspaceId) {
      return NextResponse.json(
        { success: false, message: "workspaceId is required" },
        { status: 400 }
      );
    }

    // Verify membership
    const membership = await WorkspaceMember.findOne({
      userId: session.userId,
      workspaceId,
    });

    if (!membership) {
      return NextResponse.json(
        { success: false, message: "You are not a member of this workspace" },
        { status: 403 }
      );
    }

    // Update token
    const token = signToken({
      userId: session.userId,
      email: session.email,
      workspaceId,
    });
    await setSessionCookie(token);

    return NextResponse.json({
      success: true,
      message: "Active workspace updated successfully",
      workspaceId,
    });
  } catch (error: unknown) {
    console.error("Workspace switch error:", error);
    return NextResponse.json(
      { success: false, message: (error as Error).message || "An error occurred switching workspace" },
      { status: 500 }
    );
  }
}
