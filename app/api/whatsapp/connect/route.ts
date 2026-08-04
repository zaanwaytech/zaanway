import { NextRequest, NextResponse } from "next/server";

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


    /*
      NEXT STEPS:

      1. Exchange authorization code with Meta
      2. Get customer access token
      3. Subscribe your app to customer's WABA
      4. Save customer WhatsApp details in MongoDB


      MongoDB example:

      {
        businessId,
        wabaId,
        phoneNumberId,
        connected:true
      }

    */


    return NextResponse.json({
      success: true,

      message:
        "WhatsApp signup data received successfully",

      whatsapp:{
        businessId,
        wabaId,
        phoneNumberId,
      }
    });


  } catch(error){

    console.error(
      "WhatsApp Connect Error:",
      error
    );


    return NextResponse.json(
      {
        success:false,
        message:"Internal server error"
      },
      {
        status:500
      }
    );
  }
}