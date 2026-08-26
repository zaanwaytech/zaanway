import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

const DEFAULT_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const API_VERSION = process.env.META_API_VERSION || "v23.0";

export async function GET() {
  try {
    if (!ACCESS_TOKEN) {
      return NextResponse.json(
        {
          success: false,
          connected: false,
          message: "Missing WHATSAPP_ACCESS_TOKEN environment variable.",
        },
        { status: 500 }
      );
    }

    await connectDB();
    const user = await User.findOne();
    const phoneNumberId = user?.phoneNumberId || DEFAULT_PHONE_NUMBER_ID;
    const tokenToUse = user?.accessToken || ACCESS_TOKEN;

    if (!phoneNumberId) {
      return NextResponse.json(
        {
          success: false,
          connected: false,
          message: "No connected Phone Number ID found in settings or environment.",
        },
        { status: 400 }
      );
    }

    const response = await fetch(
      `https://graph.facebook.com/${API_VERSION}/${phoneNumberId}`,
      {
        headers: {
          Authorization: `Bearer ${tokenToUse}`,
        },
        cache: "no-store",
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          connected: false,
          error: data.error ?? data,
        },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      connected: true,
      phoneNumberId: data.id,
      displayPhoneNumber: data.display_phone_number,
      verifiedName: data.verified_name,
      qualityRating: data.quality_rating,
      messagingLimit: data.messaging_limit,
      platform: "Meta WhatsApp Cloud API",
    });
  } catch (error) {
    console.error("WhatsApp Status Error:", error);

    return NextResponse.json(
      {
        success: false,
        connected: false,
        message: "Unable to connect to Meta API.",
        error: error.message || error
      },
      { status: 500 }
    );
  }
}