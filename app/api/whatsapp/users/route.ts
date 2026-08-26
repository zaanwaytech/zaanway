import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export async function GET() {
  try {
    await connectDB();
    // Return all users who have registered a phone number ID
    const users = await User.find({ phoneNumberId: { $exists: true } }).select(
      "_id name email phoneNumberId whatsappConnected"
    );
    return NextResponse.json({ success: true, users });
  } catch (error: any) {
    console.error("GET Users Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch users" },
      { status: 500 }
    );
  }
}
