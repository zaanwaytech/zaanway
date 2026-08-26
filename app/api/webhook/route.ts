import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Keyword from "@/models/Keyword";
import Booking from "@/models/Booking";
import TurfSettings from "@/models/TurfSettings";
import User from "@/models/User";

const VERIFY_TOKEN = process.env.VERIFY_TOKEN!;
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN!;
const DEFAULT_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID!;
const API_VERSION = process.env.META_API_VERSION || "v23.0";

// Meta webhook verification
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("✅ Webhook Verified");
    return new Response(challenge, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  return NextResponse.json(
    { error: "Verification failed" },
    { status: 403 }
  );
}

// Receive WhatsApp messages
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    console.log("Incoming WhatsApp:", JSON.stringify(body, null, 2));

    const message = body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    if (!message) {
      return NextResponse.json({ success: true });
    }

    const from = message.from;
    const displayPhoneNumber = body?.entry?.[0]?.changes?.[0]?.value?.metadata?.display_phone_number;

    // Ignore messages sent by the business itself to avoid infinite loops or self-bookings
    const cleanFrom = from.replace(/\D/g, "");
    const cleanDisplayPhone = displayPhoneNumber ? displayPhoneNumber.replace(/\D/g, "") : null;
    if (cleanDisplayPhone && cleanFrom === cleanDisplayPhone) {
      console.log("Ignoring message sent from the business itself.");
      return NextResponse.json({ success: true });
    }

    // Extract dynamic targeted phone ID from metadata (falls back to configured env ID)
    const phoneId =
      body?.entry?.[0]?.changes?.[0]?.value?.metadata?.phone_number_id ||
      DEFAULT_PHONE_NUMBER_ID;

    // Connect database and load tenant credentials dynamically
    await connectDB();
    const user = await User.findOne({ phoneNumberId: phoneId });
    const accessToken = user?.accessToken || ACCESS_TOKEN;

    // Safely look up the contact matching the sender's phone number
    const contact = body?.entry?.[0]?.changes?.[0]?.value?.contacts?.find(
      (c: any) => c.wa_id === from
    );
    const profileName = contact?.profile?.name || "Customer";

    // 1. Handle interactive message callbacks
    if (message.type === "interactive") {
      const interactive = message.interactive;

      if (interactive?.type === "button_reply") {
        const btnId = interactive.button_reply?.id;
        if (btnId === "book_now") {
          await handleBookNow(from, phoneId, accessToken);
          return NextResponse.json({ success: true });
        }
      }

      if (interactive?.type === "list_reply") {
        const listId = interactive.list_reply?.id;
        if (listId && listId.startsWith("slot|")) {
          await handleSlotSelection(from, profileName, listId, phoneId, accessToken);
          return NextResponse.json({ success: true });
        }
      }

      return NextResponse.json({ success: true });
    }

    // 2. Handle standard text messages
    const text = message.text?.body?.toLowerCase()?.trim() || "";
    console.log("Message from:", from, "Text:", text, "Target Phone ID:", phoneId);

    await handleTextMessage(from, text, profileName, phoneId, accessToken);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook Error:", error);
    return NextResponse.json(
      { success: false },
      { status: 500 }
    );
  }
}

// Send standard text message
async function sendWhatsAppMessage(to: string, message: string, phoneId: string, accessToken: string) {
  const response = await fetch(
    `https://graph.facebook.com/${API_VERSION}/${phoneId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: message },
      }),
    }
  );
  return await response.json();
}

// Send interactive button message
async function sendWhatsAppButtonMessage(
  to: string,
  headerText: string,
  bodyText: string,
  buttons: { id: string; title: string }[],
  phoneId: string,
  accessToken: string
) {
  const response = await fetch(
    `https://graph.facebook.com/${API_VERSION}/${phoneId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "interactive",
        interactive: {
          type: "button",
          header: {
            type: "text",
            text: headerText.slice(0, 60), // Header text limit
          },
          body: {
            text: bodyText.slice(0, 1024), // Body text limit
          },
          action: {
            buttons: buttons.map((btn) => ({
              type: "reply",
              reply: {
                id: btn.id,
                title: btn.title.slice(0, 20), // Button title limit is 20 chars
              },
            })),
          },
        },
      }),
    }
  );
  return await response.json();
}

// Send interactive list message
async function sendWhatsAppListMessage(
  to: string,
  headerText: string,
  bodyText: string,
  buttonText: string,
  sections: { title: string; rows: { id: string; title: string; description?: string }[] }[],
  phoneId: string,
  accessToken: string
) {
  const response = await fetch(
    `https://graph.facebook.com/${API_VERSION}/${phoneId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "interactive",
        interactive: {
          type: "list",
          header: {
            type: "text",
            text: headerText.slice(0, 60),
          },
          body: {
            text: bodyText.slice(0, 1024),
          },
          action: {
            button: buttonText.slice(0, 20),
            sections: sections.map((sec) => ({
              title: sec.title.slice(0, 24),
              rows: sec.rows.map((row) => ({
                id: row.id,
                title: row.title.slice(0, 24),
                description: row.description ? row.description.slice(0, 72) : undefined,
              })),
            })),
          },
        },
      }),
    }
  );
  return await response.json();
}

// Handle text messages (keyword matching or welcome)
async function handleTextMessage(from: string, text: string, profileName: string, phoneId: string, accessToken: string) {
  await connectDB();

  // A. Check for custom keywords first
  if (text) {
    const keywordRule = await Keyword.findOne({ keyword: text });
    if (keywordRule) {
      await sendWhatsAppMessage(from, keywordRule.reply, phoneId, accessToken);
      return;
    }
  }

  // B. Default welcome message + Book Now button
  const settings = await TurfSettings.findOne();
  const turfName = settings?.turfName || "ABC Turf";
  let welcomeMsg = settings?.welcomeMessage || "Welcome to ABC Turf! ⚽🏏\n\nClick the button below to book a slot.";

  // Dynamic placeholders replacement
  welcomeMsg = welcomeMsg.replace(/{name}/gi, profileName);

  await sendWhatsAppButtonMessage(
    from,
    turfName,
    welcomeMsg,
    [
      { id: "book_now", title: "Book Now 📅" }
    ],
    phoneId,
    accessToken
  );
}

// Handle "Book Now" click - list available slots
async function handleBookNow(from: string, phoneId: string, accessToken: string) {
  await connectDB();

  const settings = await TurfSettings.findOne();
  const openTime = settings?.openTime || "06:00";
  const closeTime = settings?.closeTime || "22:00";

  const { dateStr, rows } = await getAvailableSlots(openTime, closeTime);

  if (rows.length === 0) {
    await sendWhatsAppMessage(
      from,
      `Sorry! No slots are available for booking at the moment. Please check back later.`,
      phoneId,
      accessToken
    );
    return;
  }

  const formattedDateStr = new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  await sendWhatsAppListMessage(
    from,
    "Available Slots",
    `Select a 1-hour slot for ${formattedDateStr}:`,
    "View Slots",
    [
      {
        title: "Slots",
        rows,
      },
    ],
    phoneId,
    accessToken
  );
}

// Handle slot list selection
async function handleSlotSelection(from: string, profileName: string, listId: string, phoneId: string, accessToken: string) {
  const [, dateStr, timeSlot] = listId.split("|");

  if (!dateStr || !timeSlot) {
    await sendWhatsAppMessage(from, "Something went wrong with the slot selection. Please try again.", phoneId, accessToken);
    return;
  }

  await connectDB();

  // Double booking protection
  const existing = await Booking.findOne({ date: dateStr, timeSlot });
  if (existing) {
    await sendWhatsAppMessage(
      from,
      `Sorry, that slot (${timeSlot}) was just booked. Please try again by typing "hi".`,
      phoneId,
      accessToken
    );
    return;
  }

  // Create booking
  await Booking.create({
    customerPhone: from,
    customerName: profileName,
    date: dateStr,
    timeSlot,
  });

  const formattedDateStr = new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  await sendWhatsAppMessage(
    from,
    `✅ *Booking Confirmed!*\n\nThank you, ${profileName}.\n\n📅 *Date:* ${formattedDateStr}\n⏰ *Time:* ${timeSlot}\n📍 *Location:* ABC Turf\n\nWe look forward to seeing you! ⚽🏏`,
    phoneId,
    accessToken
  );
}

// Dynamic slot generator helper
async function getAvailableSlots(openTime: string, closeTime: string) {
  const [openHour] = openTime.split(":").map(Number);
  const [closeHour] = closeTime.split(":").map(Number);

  const now = new Date();
  const currentHour = now.getHours();

  let targetDate = new Date();
  let startHour = openHour;
  let isToday = true;

  if (currentHour >= closeHour - 1) {
    targetDate.setDate(targetDate.getDate() + 1);
    startHour = openHour;
    isToday = false;
  } else {
    // Current hour + 1 to give a buffer for booking
    startHour = Math.max(openHour, currentHour + 1);
  }

  let dateStr = formatDate(targetDate);
  let rows = await generateRowsForDate(dateStr, startHour, closeHour);

  // If today is fully booked, default to tomorrow's slots
  if (isToday && rows.length === 0) {
    targetDate.setDate(targetDate.getDate() + 1);
    dateStr = formatDate(targetDate);
    rows = await generateRowsForDate(dateStr, openHour, closeHour);
  }

  return { dateStr, rows };
}

function formatDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const dateVal = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${dateVal}`;
}

async function generateRowsForDate(dateStr: string, startHour: number, closeHour: number) {
  const bookings = await Booking.find({ date: dateStr });
  const bookedSlots = new Set(bookings.map((b: any) => b.timeSlot));
  const rows = [];

  for (let h = startHour; h < closeHour; h++) {
    const slotTitle = `${formatHour(h)} - ${formatHour(h + 1)}`;
    if (!bookedSlots.has(slotTitle)) {
      rows.push({
        id: `slot|${dateStr}|${slotTitle}`,
        title: slotTitle,
        description: "Tap to book this 1h slot",
      });
    }
    if (rows.length >= 10) {
      break;
    }
  }
  return rows;
}

function formatHour(h: number): string {
  const ampm = h >= 12 ? "PM" : "AM";
  const displayHour = h % 12 === 0 ? 12 : h % 12;
  return `${String(displayHour).padStart(2, "0")}:00 ${ampm}`;
}