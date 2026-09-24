import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db/connect";
import User from "@/models/User";
import Workspace from "@/models/Workspace";
import WorkspaceMember from "@/models/WorkspaceMember";
import Automation from "@/models/Automation";
import { signToken, setSessionCookie } from "@/lib/auth/session";

export async function POST(request: Request) {
  const bypassAuth = process.env.BYPASS_AUTH === "true" || process.env.NEXT_PUBLIC_BYPASS_AUTH === "true";

  try {
    const { name, email, password, businessName } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, message: "Missing required fields: name, email, password" },
        { status: 400 }
      );
    }

    try {
      await connectDB();
    } catch (dbError: unknown) {
      console.warn("[REGISTER] Database connection failed:", dbError);
      
      // If bypass mode is active, allow user to log in and access dashboard
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
            name,
            email: email.toLowerCase(),
          },
          workspace: {
            id: "660000000000000000000002",
            name: businessName || `${name}'s Workspace`,
          },
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

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: "A user with this email already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
    });

    // Create workspace
    const finalBusinessName = businessName || `${name}'s Workspace`;
    const workspace = await Workspace.create({
      name: finalBusinessName,
      ownerId: user._id,
      plan: "Free",
    });

    // Create membership role (Owner)
    await WorkspaceMember.create({
      workspaceId: workspace._id,
      userId: user._id,
      role: "Owner",
    });

    // Create default greeting automation
    await Automation.create({
      workspaceId: workspace._id,
      name: "Welcome Bot (Editable)",
      trigger: {
        type: "incoming_message",
        keyword: "hi", // will also handle hello, hey in bot engine matching
      },
      actions: [
        {
          type: "send_text",
          payload: {
            text: `Hello 👋 Welcome to ${workspace.name}!\n\nHow can we help you?`,
          },
        },
        {
          type: "send_interactive_buttons",
          payload: {
            buttons: ["Products", "Services", "Talk to Agent"],
          },
        },
      ],
      isActive: true,
    });

    // Sign session and set cookie
    const token = signToken({
      userId: user._id.toString(),
      email: user.email,
      workspaceId: workspace._id.toString(),
    });

    await setSessionCookie(token);

    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
      workspace: {
        id: workspace._id,
        name: workspace.name,
      },
    });
  } catch (error: unknown) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { success: false, message: (error as Error).message || "An error occurred during registration" },
      { status: 500 }
    );
  }
}
