import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Keyword from "@/models/Keyword";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    await connectDB();
    const query = userId ? { userId } : { userId: { $exists: false } };
    const keywords = await Keyword.find(query).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, keywords });
  } catch (error: any) {
    console.error("GET Keywords Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch keywords" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    const body = await req.json();
    const { keyword, reply } = body;

    if (!keyword || !reply) {
      return NextResponse.json(
        { success: false, message: "Keyword and reply are required" },
        { status: 400 }
      );
    }

    const cleanKeyword = keyword.trim().toLowerCase();

    await connectDB();
    const query = userId 
      ? { userId, keyword: cleanKeyword } 
      : { userId: { $exists: false }, keyword: cleanKeyword };

    let existing = await Keyword.findOne(query);
    if (existing) {
      existing.reply = reply;
      await existing.save();
      return NextResponse.json({ success: true, keyword: existing });
    } else {
      const newKeyword = await Keyword.create({
        userId: userId || undefined,
        keyword: cleanKeyword,
        reply,
      });
      return NextResponse.json({ success: true, keyword: newKeyword });
    }
  } catch (error: any) {
    console.error("POST Keyword Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to save keyword" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, message: "ID parameter is required" },
        { status: 400 }
      );
    }

    await connectDB();
    await Keyword.findByIdAndDelete(id);

    return NextResponse.json({ success: true, message: "Keyword deleted successfully" });
  } catch (error: any) {
    console.error("DELETE Keyword Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to delete keyword" },
      { status: 500 }
    );
  }
}
