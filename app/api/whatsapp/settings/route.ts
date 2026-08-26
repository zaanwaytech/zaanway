import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import TurfSettings from "@/models/TurfSettings";

export async function GET() {
  try {
    await connectDB();
    let settings = await TurfSettings.findOne();
    if (!settings) {
      settings = await TurfSettings.create({
        turfName: "ABC Turf",
        openTime: "06:00",
        closeTime: "22:00",
        welcomeMessage: "Welcome to ABC Turf! ⚽🏏",
      });
    }
    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    console.error("GET Settings Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { turfName, openTime, closeTime, welcomeMessage } = body;

    await connectDB();
    let settings = await TurfSettings.findOne();
    if (settings) {
      settings.turfName = turfName ?? settings.turfName;
      settings.openTime = openTime ?? settings.openTime;
      settings.closeTime = closeTime ?? settings.closeTime;
      settings.welcomeMessage = welcomeMessage ?? settings.welcomeMessage;
      await settings.save();
    } else {
      settings = await TurfSettings.create({
        turfName: turfName || "ABC Turf",
        openTime: openTime || "06:00",
        closeTime: closeTime || "22:00",
        welcomeMessage: welcomeMessage || "Welcome to ABC Turf! ⚽🏏",
      });
    }

    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    console.error("POST Settings Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update settings" },
      { status: 500 }
    );
  }
}
