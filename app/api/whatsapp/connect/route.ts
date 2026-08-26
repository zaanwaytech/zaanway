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

    if (!clientAccessToken) {
      return NextResponse.json(
        {
          success: false,
          message: "Failed to exchange code or find a fallback WhatsApp Access Token",
        },
        {
          status: 400,
        }
      );
    }

    // 1. Register the phone number with Meta Cloud API
    console.log(`Registering phone number ${phoneNumberId} with Meta Cloud API...`);
    try {
      const registerUrl = `https://graph.facebook.com/v23.0/${phoneNumberId}/register`;
      const registerRes = await fetch(registerUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${clientAccessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          pin: "123456", // default 6-digit pin
        }),
      });

      const registerData = await registerRes.json();
      if (!registerRes.ok) {
        console.error("Meta Phone Registration Error details:", registerData);
      } else {
        console.log("Meta Phone Registration Successful:", registerData);
      }
    } catch (regErr) {
      console.error("Error calling Meta Phone Registration API:", regErr);
    }

    // 2. Subscribe the App to the WABA
    console.log(`Subscribing App to WABA ${wabaId}...`);
    try {
      const subscribeUrl = `https://graph.facebook.com/v23.0/${wabaId}/subscribed_apps`;
      const subscribeRes = await fetch(subscribeUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${clientAccessToken}`,
        },
      });

      const subscribeData = await subscribeRes.json();
      if (!subscribeRes.ok) {
        console.error("Meta Subscribed Apps Error details:", subscribeData);
      } else {
        console.log("Meta WABA Subscription Successful:", subscribeData);
      }
    } catch (subErr) {
      console.error("Error calling Meta Subscribed Apps API:", subErr);
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