import { NextRequest, NextResponse } from "next/server";

const VERIFY_TOKEN = process.env.VERIFY_TOKEN!;
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN!;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID!;
const API_VERSION = process.env.META_API_VERSION || "v23.0";


// Meta webhook verification
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");


  if (
    mode === "subscribe" &&
    token === VERIFY_TOKEN
  ) {

    console.log("✅ Webhook Verified");

    return new NextResponse(
      challenge,
      {
        status: 200,
      }
    );
  }


  return NextResponse.json(
    {
      error:"Verification failed"
    },
    {
      status:403
    }
  );
}



// Receive WhatsApp messages
export async function POST(req: NextRequest) {

  try {

    const body = await req.json();


    console.log(
      "Incoming WhatsApp:",
      JSON.stringify(body,null,2)
    );


    const message =
      body?.entry?.[0]
      ?.changes?.[0]
      ?.value
      ?.messages?.[0];


    if(!message){

      return NextResponse.json({
        success:true
      });

    }


    const from = message.from;


    const text =
      message.text?.body
      ?.toLowerCase()
      ?.trim();



    console.log(
      "Message from:",
      from
    );

    console.log(
      "Text:",
      text
    );



    let reply = "";



    if(
      text === "hi" ||
      text === "hello" ||
      text === "hey"
    ){

      reply =
      "Hello 👋 Welcome to Zaanway WhatsApp Automation 🚀";


    }else{


      reply =
      "Thanks for your message. Our team will contact you soon.";

    }



    await sendWhatsAppMessage(
      from,
      reply
    );



    return NextResponse.json({
      success:true
    });



  }catch(error){

    console.error(
      "Webhook Error:",
      error
    );


    return NextResponse.json(
      {
        success:false
      },
      {
        status:500
      }
    );

  }

}




async function sendWhatsAppMessage(
  to:string,
  message:string
){

  const response = await fetch(
    `https://graph.facebook.com/${API_VERSION}/${PHONE_NUMBER_ID}/messages`,
    {

      method:"POST",

      headers:{

        "Authorization":
        `Bearer ${ACCESS_TOKEN}`,

        "Content-Type":
        "application/json"

      },


      body:JSON.stringify({

        messaging_product:"whatsapp",

        to,

        type:"text",

        text:{
          body:message
        }

      })

    }
  );


  const data = await response.json();


  console.log(
    "Send Response:",
    data
  );


  return data;

}