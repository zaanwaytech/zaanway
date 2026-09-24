import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db/connect";
import User from "@/models/User";
import WorkspaceMember from "@/models/WorkspaceMember";
import { signToken, setSessionCookie } from "@/lib/auth/session";

export async function POST(request: Request) {
  const bypassAuth = process.env.BYPASS_AUTH === "true" || process.env.NEXT_PUBLIC_BYPASS_AUTH === "true";

  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Email and password are required" },
        { status: 400 }
      );
    }

    try {
      await connectDB();
    } catch (dbError: unknown) {
      console.warn("[LOGIN] Database connection failed:", dbError);

      if (bypassAuth) {
        const token = signToken({
          userId: "660000000000000000000001",
          email: email.toLowerCase(),
          workspaceId: "660000000000000000000002",
        });
        await setSessionCookie(token);

        return NextResponse.json({
          success: true,
          user: {
            id: "660000000000000000000001",
            name: "Admin User",
            email: email.toLowerCase(),
          },
          workspaceId: "660000000000000000000002",
        });
      }

      const errMsg = (dbError as Error).message || "";
      const isBadAuth = errMsg.includes("bad auth") || errMsg.includes("authentication failed");
      return NextResponse.json(
        {
          success: false,
          message: isBadAuth
            ? "MongoDB Atlas authentication failed. Please verify your database username and password in MongoDB Atlas (Security > Database Access)."
            : "Database connection failed. Please check your MongoDB Atlas cluster connection.",
        },
        { status: 400 }
      );
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, message: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Find user's workspaces
    const memberships = await WorkspaceMember.find({ userId: user._id });
    let defaultWorkspaceId: string | undefined = undefined;

    if (memberships.length > 0) {
      defaultWorkspaceId = memberships[0].workspaceId.toString();
    }

    // Sign session and set cookie
    const token = signToken({
      userId: user._id.toString(),
      email: user.email,
      workspaceId: defaultWorkspaceId,
    });

    await setSessionCookie(token);

    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
      workspaceId: defaultWorkspaceId,
    });
  } catch (error: unknown) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, message: (error as Error).message || "An error occurred during login" },
      { status: 500 }
    );
  }
}
