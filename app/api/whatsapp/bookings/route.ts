import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Booking from "@/models/Booking";

export async function GET() {
  try {
    await connectDB();
    const bookings = await Booking.find().sort({ date: -1, timeSlot: 1 });
    return NextResponse.json({ success: true, bookings });
  } catch (error: any) {
    console.error("GET Bookings Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch bookings" },
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
    await Booking.findByIdAndDelete(id);

    return NextResponse.json({ success: true, message: "Booking cancelled successfully" });
  } catch (error: any) {
    console.error("DELETE Booking Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to cancel booking" },
      { status: 500 }
    );
  }
}
