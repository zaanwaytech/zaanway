import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { getSession, signToken, setSessionCookie, DEFAULT_BYPASS_SESSION } from "@/lib/auth/session";
import User from "@/models/User";
import WorkspaceMember from "@/models/WorkspaceMember";
import Workspace from "@/models/Workspace";

export async function GET() {
  const bypassAuth = process.env.BYPASS_AUTH === "true" || process.env.NEXT_PUBLIC_BYPASS_AUTH === "true";

  try {
    const session = await getSession();

    // 1. If not logged in and bypass is not enabled
    if (!session?.userId && !bypassAuth) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        {
          status: 401,
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          },
        }
      );
    }

    const currentSession = session || DEFAULT_BYPASS_SESSION;

    // 2. Try fetching from Database
    try {
      await connectDB();

      const user = await User.findById(currentSession.userId).select("-passwordHash");
      if (user) {
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
            id: ws._id.toString(),
            name: ws.name,
            plan: ws.plan,
            role: membership?.role || "Owner",
          };
        });

        // Check active workspace
        let activeWorkspaceId = currentSession.workspaceId;
        if (!activeWorkspaceId && workspacesWithRoles.length > 0) {
          activeWorkspaceId = workspacesWithRoles[0].id;
        }

        const activeWorkspace =
          workspacesWithRoles.find((ws) => ws.id === activeWorkspaceId) ||
          workspacesWithRoles[0] ||
          null;

        return NextResponse.json(
          {
            success: true,
            user: {
              id: user._id.toString(),
              name: user.name,
              email: user.email,
            },
            activeWorkspace,
            workspaces: workspacesWithRoles,
          },
          {
            headers: {
              "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
            },
          }
        );
      }
    } catch (dbErr) {
      console.warn("[AUTH_ME] Database query failed or database offline:", dbErr);
    }

    // 3. Fallback / Authentication Bypass Mode
    return NextResponse.json(
      {
        success: true,
        user: {
          id: currentSession.userId,
          name: "Admin User",
          email: currentSession.email,
        },
        activeWorkspace: {
          id: currentSession.workspaceId || DEFAULT_BYPASS_SESSION.workspaceId,
          name: "Zaanway Workspace",
          plan: "Business",
          role: "Owner",
        },
        workspaces: [
          {
            id: currentSession.workspaceId || DEFAULT_BYPASS_SESSION.workspaceId,
            name: "Zaanway Workspace",
            plan: "Business",
            role: "Owner",
          },
        ],
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
  } catch (error: unknown) {
    console.error("[AUTH_ME] Fatal handler error:", error);
    // Even on fatal handler error, return mock session if bypass is active
    if (bypassAuth) {
      return NextResponse.json({
        success: true,
        user: {
          id: DEFAULT_BYPASS_SESSION.userId,
          name: "Admin User",
          email: DEFAULT_BYPASS_SESSION.email,
        },
        activeWorkspace: {
          id: DEFAULT_BYPASS_SESSION.workspaceId,
          name: "Zaanway Workspace",
          plan: "Business",
          role: "Owner",
        },
        workspaces: [
          {
            id: DEFAULT_BYPASS_SESSION.workspaceId,
            name: "Zaanway Workspace",
            plan: "Business",
            role: "Owner",
          },
        ],
      });
    }

    return NextResponse.json(
      { success: false, message: (error as Error).message || "An error occurred fetching profile" },
      { status: 500 }
    );
  }
}

// Allow POST to update active workspace id in session
export async function POST(request: Request) {
  try {
    const session = await getSession();
    const currentSession = session || DEFAULT_BYPASS_SESSION;

    const { workspaceId } = await request.json();
    if (!workspaceId) {
      return NextResponse.json(
        { success: false, message: "workspaceId is required" },
        { status: 400 }
      );
    }

    // Update token
    const token = signToken({
      userId: currentSession.userId,
      email: currentSession.email,
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
