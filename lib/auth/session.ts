import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_key_for_jwt_auth_saas";
const SESSION_COOKIE_NAME = "session";

export interface SessionPayload {
  userId: string;
  email: string;
  workspaceId?: string;
}

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

export async function getSession(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) {
      console.log("[getSession] No session cookie found in request.");
      return null;
    }

    const payload = verifyToken(token);
    if (!payload) {
      console.log("[getSession] Token verification failed.");
      return null;
    }

    return payload;
  } catch (error) {
    console.error("[getSession] Unexpected error getting session:", error);
    return null;
  }
}
