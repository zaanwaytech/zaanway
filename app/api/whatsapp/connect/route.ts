import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      code,
      businessId,
      wabaId,
      phoneNumberId,
    } = body;

    if (!code || !businessId || !wabaId || !phoneNumberId) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing WhatsApp signup data",
        },
        {
          status: 400,
        }
      );
    }

    console.log("========== WhatsApp Signup ==========");
    console.log("Authorization Code:", code);
    console.log("Business ID:", businessId);
    console.log("WABA ID:", wabaId);
    console.log("Phone Number ID:", phoneNumberId);
    console.log("=====================================");

    // Exchange authorization code for access token
    let clientAccessToken = "";
    try {
      const appId = process.env.META_APP_ID;
      const appSecret = process.env.META_APP_SECRET;

      if (!appId || !appSecret) {
        throw new Error("Missing META_APP_ID or META_APP_SECRET in environment variables");
      }

      const tokenUrl = `https://graph.facebook.com/v23.0/oauth/access_token?client_id=${appId}&client_secret=${appSecret}&code=${code}`;
      const tokenRes = await fetch(tokenUrl);
      const tokenData = await tokenRes.json();

      if (!tokenRes.ok || tokenData.error) {
        console.error("Meta Token Exchange Error:", tokenData.error);
        throw new Error(tokenData.error?.message || "Failed to exchange authorization code for access token");
      }

      clientAccessToken = tokenData.access_token;
      console.log("Successfully exchanged code for access token");
    } catch (tokenErr: any) {
      console.error("Token exchange failed:", tokenErr);
      // Fallback to configured access token in case of test/sandbox setups
      clientAccessToken = process.env.WHATSAPP_ACCESS_TOKEN || "";
    }

    // Save WhatsApp connection details in MongoDB
    await connectDB();
    
    let user = await User.findOne();
    if (!user) {
      user = new User({
        name: "Admin",
        email: "admin@zaanway.com",
      });
    }

    user.whatsappConnected = true;
    user.phoneNumberId = phoneNumberId;
    user.wabaId = wabaId;
    user.businessId = businessId;
    user.accessToken = clientAccessToken;
    await user.save();

    return NextResponse.json({
      success: true,
      message: "WhatsApp signup details updated in database successfully",
      whatsapp: {
        businessId,
        wabaId,
        phoneNumberId,
      }
    });

  } catch (error: any) {
    console.error("WhatsApp Connect Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Internal server error"
      },
      {
        status: 500
      }
    );
  }
}