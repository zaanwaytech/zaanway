import { NextResponse } from "next/server";

const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const API_VERSION = process.env.META_API_VERSION || "v23.0";

export async function GET() {
  try {
    if (!PHONE_NUMBER_ID || !ACCESS_TOKEN) {
      return NextResponse.json(
        {
          success: false,
          connected: false,
          message: "Missing WhatsApp environment variables.",
        },
        { status: 500 }
      );
    }

    const response = await fetch(
      `https://graph.facebook.com/${API_VERSION}/${PHONE_NUMBER_ID}`,
      {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
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
      },
      { status: 500 }
    );
  }
}