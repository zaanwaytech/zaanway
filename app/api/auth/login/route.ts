import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db/connect";
import User from "@/models/User";
import WorkspaceMember from "@/models/WorkspaceMember";
import { signToken, setSessionCookie } from "@/lib/auth/session";

export async function POST(request: Request) {
  try {
    await connectDB();
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Email and password are required" },
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
