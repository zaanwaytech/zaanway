import { connectDB } from "@/lib/db/connect";
import WorkspaceMember from "@/models/WorkspaceMember";

export type UserRole = "Owner" | "Admin" | "Agent";

/**
 * Checks if a user belongs to a workspace and has one of the allowed roles.
 * Returns the member record if successful, or null otherwise.
 */
export async function verifyWorkspaceAccess(
  workspaceId: string | undefined,
  userId: string | undefined,
  allowedRoles: UserRole[] = ["Owner", "Admin", "Agent"]
) {
  const bypassAuth = process.env.BYPASS_AUTH === "true" || process.env.NEXT_PUBLIC_BYPASS_AUTH === "true";

  if (!workspaceId || !userId) {
    if (bypassAuth) {
      return {
        workspaceId: "660000000000000000000002",
        userId: "660000000000000000000001",
        role: "Owner",
      };
    }
    return null;
  }

  try {
    await connectDB();

    const member = await WorkspaceMember.findOne({
      workspaceId,
      userId,
    });

    if (!member) {
      if (bypassAuth) {
        return {
          workspaceId,
          userId,
          role: "Owner",
        };
      }
      return null;
    }

    if (!allowedRoles.includes(member.role as UserRole)) {
      if (bypassAuth) {
        return {
          workspaceId,
          userId,
          role: "Owner",
        };
      }
      return null;
    }

    return member;
  } catch (err) {
    console.warn("[PERMISSIONS] DB error checking workspace access:", err);
    if (bypassAuth) {
      return {
        workspaceId,
        userId,
        role: "Owner",
      };
    }
    return null;
  }
}

/**
 * Verifies workspace access and throws an error if unauthorized.
 * Useful in Next.js Route Handlers.
 */
export async function requireWorkspaceAccess(
  workspaceId: string | undefined,
  userId: string | undefined,
  allowedRoles: UserRole[] = ["Owner", "Admin", "Agent"]
) {
  const member = await verifyWorkspaceAccess(workspaceId, userId, allowedRoles);
  if (!member) {
    throw new Error("Unauthorized workspace access");
  }
  return member;
}
