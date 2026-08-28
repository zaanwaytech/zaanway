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
  if (!workspaceId || !userId) {
    return null;
  }

  await connectDB();

  const member = await WorkspaceMember.findOne({
    workspaceId,
    userId,
  });

  if (!member) {
    return null;
  }

  if (!allowedRoles.includes(member.role as UserRole)) {
    return null;
  }

  return member;
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
