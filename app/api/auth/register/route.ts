import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db/connect";
import User from "@/models/User";
import Workspace from "@/models/Workspace";
import WorkspaceMember from "@/models/WorkspaceMember";
import Automation from "@/models/Automation";
import { signToken, setSessionCookie } from "@/lib/auth/session";

export async function POST(request: Request) {
  try {
    await connectDB();
    const { name, email, password, businessName } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, message: "Missing required fields: name, email, password" },
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
