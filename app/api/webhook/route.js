import { NextResponse } from "next/server";

const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

export async function GET(request) {
  const { searchParams } = new URL(request.url);

  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 });
  }

  return new Response("Verification failed", { status: 403 });
}

export async function POST(request) {
  const body = await request.json();

  console.log("Webhook Event:", JSON.stringify(body, null, 2));

  return NextResponse.json({ success: true });
}