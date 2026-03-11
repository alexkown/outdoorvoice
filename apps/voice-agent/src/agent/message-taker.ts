/**
 * Message-taking state machine.
 *
 * Walks the caller through leaving a message step-by-step:
 *   1. Ask for name
 *   2. Ask for callback number
 *   3. Ask for best callback time
 *   4. Ask for the reason / message
 *   5. Confirm and write to DB
 *
 * Returns the next prompt to speak, or `null` when collection is complete.
 */

import { db } from "@outdoorvoice/db";

type MessageStep = "name" | "phone" | "callback_time" | "reason" | "done";

export interface MessageState {
  step: MessageStep;
  callerName?: string;
  callerPhone?: string;
  callbackTime?: string;
  reason?: string;
}

export function createMessageState(): MessageState {
  return { step: "name" };
}

/**
 * Given the current state and the caller's latest utterance,
 * advances the state machine and returns the next prompt to say.
 *
 * Returns `null` when the message is complete (triggers DB write externally).
 */
export function advanceMessageCollection(
  state: MessageState,
  callerUtterance: string
): { updatedState: MessageState; prompt: string | null } {
  const utterance = callerUtterance.trim();

  switch (state.step) {
    case "name": {
      const updatedState: MessageState = {
        ...state,
        step: "phone",
        callerName: utterance,
      };
      return {
        updatedState,
        prompt: `Thanks, ${utterance}. What's the best phone number to reach you at?`,
      };
    }

    case "phone": {
      // Strip common formatting from spoken numbers ("five five five one two three four")
      const updatedState: MessageState = {
        ...state,
        step: "callback_time",
        callerPhone: utterance,
      };
      return {
        updatedState,
        prompt:
          "Got it. What's the best time for someone to call you back — morning, afternoon, or a specific time?",
      };
    }

    case "callback_time": {
      const updatedState: MessageState = {
        ...state,
        step: "reason",
        callbackTime: utterance,
      };
      return {
        updatedState,
        prompt:
          "Perfect. And briefly, what's the reason for your call or what can we help you with?",
      };
    }

    case "reason": {
      const updatedState: MessageState = {
        ...state,
        step: "done",
        reason: utterance,
      };
      const name = updatedState.callerName ?? "you";
      const time = updatedState.callbackTime ?? "as soon as possible";
      return {
        updatedState,
        prompt:
          `Got it — I've noted your message, ${name}. Someone will call you back ${time}. ` +
          `Is there anything else I can help you with before we go?`,
      };
    }

    case "done":
      // State machine is complete; caller might say "no thanks / goodbye"
      return {
        updatedState: state,
        prompt: null,
      };
  }
}

/**
 * Persist the completed message to the database.
 */
export async function saveMessage(
  businessId: string,
  callId: string | null,
  state: MessageState,
  fullTranscript: string
): Promise<void> {
  if (state.step !== "done") return;

  const summary = buildSummary(state);

  await db.message.create({
    data: {
      businessId,
      callId: callId ?? undefined,
      callerName: state.callerName ?? null,
      callerPhone: state.callerPhone ?? "unknown",
      callbackTime: state.callbackTime ?? null,
      summary,
      transcript: fullTranscript,
      status: "NEW",
    },
  });
}

function buildSummary(state: MessageState): string {
  const parts: string[] = [];
  if (state.callerName) parts.push(`Name: ${state.callerName}`);
  if (state.callerPhone) parts.push(`Phone: ${state.callerPhone}`);
  if (state.callbackTime) parts.push(`Best time: ${state.callbackTime}`);
  if (state.reason) parts.push(`Message: ${state.reason}`);
  return parts.join(" | ");
}
