import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_key_for_jwt_auth_saas";
const SESSION_COOKIE_NAME = "session";

export interface SessionPayload {
  userId: string;
  email: string;
  workspaceId?: string;
}

export const DEFAULT_BYPASS_SESSION: SessionPayload = {
  userId: "660000000000000000000001",
  email: "admin@zaanway.in",
  workspaceId: "660000000000000000000002",
};

/**
 * Signs a session payload into a JWT.
 */
export function signToken(payload: SessionPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

/**
 * Verifies a JWT and returns the payload, or null if invalid.
 */
export function verifyToken(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as SessionPayload;
  } catch (err) {
    console.log("[verifyToken] Error verifying JWT:", err);
    return null;
  }
}

/**
 * Sets the session cookie in the Next.js request/response cycle.
 */
export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days in seconds
  });
}

/**
 * Clears the session cookie.
 */
export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

/**
 * Retrieves current session. Supports authentication bypass when configured.
 */
export async function getSession(): Promise<SessionPayload | null> {
  const bypassAuth = process.env.BYPASS_AUTH === "true" || process.env.NEXT_PUBLIC_BYPASS_AUTH === "true";

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (token) {
      const payload = verifyToken(token);
      if (payload) return payload;
    }

    // If no valid cookie and bypass is active, return default session
    if (bypassAuth) {
      return DEFAULT_BYPASS_SESSION;
    }

    return null;
  } catch (error) {
    console.error("[getSession] Unexpected error getting session:", error);
    if (bypassAuth) {
      return DEFAULT_BYPASS_SESSION;
    }
    return null;
  }
}
