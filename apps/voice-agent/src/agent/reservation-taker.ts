/**
 * Reservation-taker state machine.
 *
 * Walks the caller through booking an activity step-by-step:
 *   1. Ask which activity (if multiple offered)
 *   2. Ask for date
 *   3. Ask for party size
 *   4. Query reservation provider for availability → present options
 *   5. Caller picks a slot
 *   6. Collect name, phone, optional email
 *   7. Confirm details → create booking
 *   8. Read confirmation code
 *
 * Claude parses natural language for dates and matches spoken activity names.
 */

import Anthropic from "@anthropic-ai/sdk";
import { db } from "@outdoorvoice/db";
import type { ReservationProvider, TimeSlot } from "@outdoorvoice/types";

const anthropic = new Anthropic({ apiKey: process.env["ANTHROPIC_API_KEY"] });

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

export type ReservationStep =
  | "asking_activity"
  | "asking_date"
  | "asking_party_size"
  | "fetching_availability"  // internal — not spoken
  | "presenting_options"
  | "selecting_slot"
  | "asking_name"
  | "asking_phone"
  | "asking_email"
  | "confirming"
  | "booking"                // internal
  | "done"
  | "failed";

export interface ReservationState {
  step: ReservationStep;
  activityName?: string;
  date?: string;           // YYYY-MM-DD
  partySize?: number;
  availableSlots: TimeSlot[];
  selectedSlot?: TimeSlot;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  externalId?: string;
  confirmationCode?: string;
  errorMessage?: string;
}

export function createReservationState(): ReservationState {
  return { step: "asking_activity", availableSlots: [] };
}

// ---------------------------------------------------------------------------
// Date extraction via Claude
// ---------------------------------------------------------------------------

async function extractDate(utterance: string, timezone: string): Promise<string | null> {
  const today = new Date().toLocaleDateString("en-CA", { timeZone: timezone }); // YYYY-MM-DD
  const msg = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001", // fast model for simple extraction
    max_tokens: 64,
    messages: [
      {
        role: "user",
        content: `Today is ${today} (${timezone}). The caller said: "${utterance}".
Extract the booking date they mentioned and return ONLY a date in YYYY-MM-DD format.
If no date is clear, return the word "unclear".`,
      },
    ],
  });
  const text =
    msg.content[0]?.type === "text" ? msg.content[0].text.trim() : "unclear";
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null;
}

// ---------------------------------------------------------------------------
// Party size extraction
// ---------------------------------------------------------------------------

function extractPartySize(utterance: string): number | null {
  // Handle word numbers
  const wordMap: Record<string, number> = {
    one: 1, two: 2, three: 3, four: 4, five: 5,
    six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  };
  const lower = utterance.toLowerCase();
  for (const [word, num] of Object.entries(wordMap)) {
    if (lower.includes(word)) return num;
  }
  const match = utterance.match(/\b(\d{1,2})\b/);
  if (match?.[1]) {
    const n = parseInt(match[1], 10);
    if (n >= 1 && n <= 50) return n;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Format a slot for speaking aloud
// ---------------------------------------------------------------------------

function formatSlotForSpeech(slot: TimeSlot, index: number): string {
  const time = new Date(slot.startTime).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  const price = slot.price !== undefined ? ` at $${slot.price} per person` : "";
  return `Option ${index + 1}: ${slot.activityName} at ${time}${price}, ${slot.availableSpots} spots available.`;
}

// ---------------------------------------------------------------------------
// Advance the state machine
// ---------------------------------------------------------------------------

export interface ReservationAdvanceResult {
  updatedState: ReservationState;
  prompt: string;             // what the agent should say next
  isComplete: boolean;
  booking?: {
    externalId: string;
    confirmationCode?: string;
  };
}

export async function advanceReservation(
  state: ReservationState,
  callerUtterance: string,
  provider: ReservationProvider,
  timezone: string
): Promise<ReservationAdvanceResult> {
  let s = { ...state };

  switch (s.step) {
    // -------------------------------------------------------------------------
    case "asking_activity": {
      s.activityName = callerUtterance.trim();
      s.step = "asking_date";
      return {
        updatedState: s,
        prompt: `Got it — ${s.activityName}. What date were you thinking? You can say something like "next Saturday" or "March 15th".`,
        isComplete: false,
      };
    }

    // -------------------------------------------------------------------------
    case "asking_date": {
      const date = await extractDate(callerUtterance, timezone);
      if (!date) {
        return {
          updatedState: s,
          prompt: "I didn't quite catch the date. Could you say it again? For example, 'this Saturday' or 'April 10th'.",
          isComplete: false,
        };
      }
      s.date = date;
      s.step = "asking_party_size";
      return {
        updatedState: s,
        prompt: "And how many people will be joining?",
        isComplete: false,
      };
    }

    // -------------------------------------------------------------------------
    case "asking_party_size": {
      const size = extractPartySize(callerUtterance);
      if (!size) {
        return {
          updatedState: s,
          prompt: "Sorry, how many people total? Just the number is fine.",
          isComplete: false,
        };
      }
      s.partySize = size;
      s.step = "fetching_availability";

      // Fetch availability
      let slots: TimeSlot[] = [];
      try {
        slots = await provider.getAvailability({
          date: s.date!,
          activityName: s.activityName,
          partySize: s.partySize,
        });
      } catch (err) {
        console.error("Availability fetch failed:", err);
      }

      if (slots.length === 0) {
        s.step = "failed";
        s.errorMessage = "no_availability";
        const dateFormatted = new Date(s.date! + "T12:00:00").toLocaleDateString("en-US", {
          weekday: "long", month: "long", day: "numeric",
        });
        return {
          updatedState: s,
          prompt: `I'm sorry, I couldn't find any availability for ${s.activityName} on ${dateFormatted} for ${s.partySize} people. Would you like to try a different date, or shall I take a message so our team can help?`,
          isComplete: false,
        };
      }

      s.availableSlots = slots.slice(0, 4); // max 4 options for the phone
      s.step = "selecting_slot";

      const optionsList = s.availableSlots.map(formatSlotForSpeech).join(" ");
      const plural = s.availableSlots.length === 1 ? "one option" : `${s.availableSlots.length} options`;
      return {
        updatedState: s,
        prompt: `Great — I found ${plural}. ${optionsList} Which one works for you? Just say the number.`,
        isComplete: false,
      };
    }

    // -------------------------------------------------------------------------
    case "selecting_slot": {
      // Handle no-availability fallback
      if (s.step === "failed") {
        s.step = "done";
        return { updatedState: s, prompt: "", isComplete: true };
      }

      const match = callerUtterance.match(/\b([1-4]|one|two|three|four)\b/i);
      const optionMap: Record<string, number> = { one: 1, two: 2, three: 3, four: 4 };
      const pick = match?.[1]
        ? (optionMap[match[1].toLowerCase()] ?? parseInt(match[1], 10))
        : null;

      if (!pick || pick < 1 || pick > s.availableSlots.length) {
        const valid = s.availableSlots.map((_, i) => i + 1).join(", ");
        return {
          updatedState: s,
          prompt: `Sorry, please choose option ${valid}.`,
          isComplete: false,
        };
      }

      s.selectedSlot = s.availableSlots[pick - 1];
      s.step = "asking_name";
      return {
        updatedState: s,
        prompt: "Perfect! Let me get your details. What's the name for the reservation?",
        isComplete: false,
      };
    }

    // -------------------------------------------------------------------------
    case "asking_name": {
      s.customerName = callerUtterance.trim();
      s.step = "asking_phone";
      return {
        updatedState: s,
        prompt: "And your phone number?",
        isComplete: false,
      };
    }

    // -------------------------------------------------------------------------
    case "asking_phone": {
      s.customerPhone = callerUtterance.trim();
      s.step = "asking_email";
      return {
        updatedState: s,
        prompt: "Do you have an email address for the confirmation? You can skip this if you'd like.",
        isComplete: false,
      };
    }

    // -------------------------------------------------------------------------
    case "asking_email": {
      const lower = callerUtterance.toLowerCase();
      const skip = ["no", "skip", "no thanks", "nope", "that's fine", "no email"].some((w) =>
        lower.includes(w)
      );
      if (!skip && callerUtterance.includes("@")) {
        s.customerEmail = callerUtterance.trim();
      }
      s.step = "confirming";

      const slot = s.selectedSlot!;
      const time = new Date(slot.startTime).toLocaleTimeString("en-US", {
        hour: "numeric", minute: "2-digit", hour12: true,
      });
      const date = new Date(s.date! + "T12:00:00").toLocaleDateString("en-US", {
        weekday: "long", month: "long", day: "numeric",
      });
      const price = slot.price !== undefined
        ? ` The total would be $${slot.price * s.partySize!} for ${s.partySize} people.`
        : "";

      return {
        updatedState: s,
        prompt: `Just to confirm: ${slot.activityName} on ${date} at ${time} for ${s.partySize} people under ${s.customerName}.${price} Shall I go ahead and book this?`,
        isComplete: false,
      };
    }

    // -------------------------------------------------------------------------
    case "confirming": {
      const confirmed = ["yes", "yeah", "yep", "sure", "please", "correct", "go ahead", "book it"].some(
        (w) => callerUtterance.toLowerCase().includes(w)
      );
      if (!confirmed) {
        s.step = "failed";
        return {
          updatedState: s,
          prompt: "No problem, I won't book that. Is there anything else I can help with, or would you like to try a different time?",
          isComplete: false,
        };
      }

      // Create the booking
      s.step = "booking";
      const result = await provider.createBooking({
        activityId: s.selectedSlot!.activityId,
        startTime: s.selectedSlot!.startTime,
        partySize: s.partySize!,
        customerName: s.customerName!,
        customerPhone: s.customerPhone!,
        customerEmail: s.customerEmail,
      });

      if (!result.success) {
        s.step = "failed";
        s.errorMessage = result.error;
        return {
          updatedState: s,
          prompt: `I'm sorry, I wasn't able to complete the booking — ${result.error ?? "an error occurred"}. Let me take a message so our team can book this manually for you.`,
          isComplete: false,
        };
      }

      s.externalId = result.externalId;
      s.confirmationCode = result.confirmationCode;
      s.step = "done";

      const code = s.confirmationCode ? ` Your confirmation number is ${s.confirmationCode.split("").join(" ")}.` : "";
      return {
        updatedState: s,
        prompt: `You're all set!${code} We'll see you then. Is there anything else I can help with?`,
        isComplete: true,
        booking: { externalId: s.externalId!, confirmationCode: s.confirmationCode },
      };
    }

    // -------------------------------------------------------------------------
    default:
      return {
        updatedState: s,
        prompt: "",
        isComplete: true,
      };
  }
}

// ---------------------------------------------------------------------------
// Persist a completed reservation to the database
// ---------------------------------------------------------------------------

export async function saveReservation(
  businessId: string,
  callId: string | null,
  state: ReservationState,
  platform: string
): Promise<void> {
  if (!state.selectedSlot || !state.customerName || !state.customerPhone) return;

  await db.reservation.create({
    data: {
      businessId,
      callId: callId ?? undefined,
      externalId: state.externalId ?? null,
      platform: platform as "FAREHARBOR",
      activity: state.selectedSlot.activityName,
      date: new Date(state.date! + "T00:00:00"),
      partySize: state.partySize!,
      customerName: state.customerName,
      customerPhone: state.customerPhone,
      customerEmail: state.customerEmail ?? null,
      status: state.externalId ? "CONFIRMED" : "FAILED",
    },
  });
}
