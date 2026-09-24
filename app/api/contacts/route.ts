import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { getSession } from "@/lib/auth/session";
import Contact from "@/models/Contact";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const session = await getSession();

    if (!session || !session.userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const workspaceId = session.workspaceId;
    if (!workspaceId) {
      return NextResponse.json({ success: false, message: "No active workspace" }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";

    const query: Record<string, unknown> = { workspaceId };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const contacts = await Contact.find(query).sort({ updatedAt: -1 }).limit(100).lean();

    return NextResponse.json({
      success: true,
      contacts,
    });
  } catch (error: unknown) {
    console.error("[CONTACTS_GET_ERROR]", error);
    return NextResponse.json({ success: false, message: "Failed to fetch contacts" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const session = await getSession();

    if (!session || !session.userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const workspaceId = session.workspaceId;
    if (!workspaceId) {
      return NextResponse.json({ success: false, message: "No active workspace" }, { status: 400 });
    }

    const body = await req.json();
    const { name, phone, email, tags, notes, customFields } = body;

    if (!phone) {
      return NextResponse.json({ success: false, message: "Phone number is required" }, { status: 400 });
    }

    const cleanPhone = phone.replace(/[^0-9]/g, "");

    const contact = await Contact.findOneAndUpdate(
      { workspaceId, phone: cleanPhone },
      {
        name: name || cleanPhone,
        email: email || undefined,
        tags: Array.isArray(tags) ? tags : [],
        notes: notes || "",
        customFields: customFields || {},
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json({
      success: true,
      contact,
    });
  } catch (error: unknown) {
    console.error("[CONTACTS_POST_ERROR]", error);
    return NextResponse.json({ success: false, message: "Failed to save contact" }, { status: 500 });
  }
}
