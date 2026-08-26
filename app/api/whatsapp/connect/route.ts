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