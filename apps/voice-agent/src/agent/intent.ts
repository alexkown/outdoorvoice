/**
 * Intent classification via Claude tool use.
 *
 * Each turn, Claude receives the conversation history + retrieved KB context
 * and responds with both:
 *   1. The spoken response (text to synthesize)
 *   2. A tool call indicating the action to take
 *
 * This keeps the response and intent classification in a single API round-trip,
 * minimising latency.
 */

import Anthropic from "@anthropic-ai/sdk";
import type { CallerIntent } from "@outdoorvoice/types";

const anthropic = new Anthropic({ apiKey: process.env["ANTHROPIC_API_KEY"] });

// ---------------------------------------------------------------------------
// Tool definitions — Claude picks one per turn
// ---------------------------------------------------------------------------

export const AGENT_TOOLS: Anthropic.Tool[] = [
  {
    name: "answer_question",
    description:
      "Caller asked a question that you can answer from the knowledge base or business info. Use this for FAQs, pricing, hours, policies, directions, what to bring, etc.",
    input_schema: {
      type: "object" as const,
      properties: {
        response: {
          type: "string",
          description: "What to say to the caller (keep it under 3 sentences, phone-friendly)",
        },
      },
      required: ["response"],
    },
  },
  {
    name: "start_reservation",
    description:
      "Caller wants to make a booking or reservation. Use this to begin the reservation collection flow.",
    input_schema: {
      type: "object" as const,
      properties: {
        response: {
          type: "string",
          description: "Opening response to start the reservation flow",
        },
      },
      required: ["response"],
    },
  },
  {
    name: "take_message",
    description:
      "Caller has a question or request you cannot handle, or has asked to leave a message for staff. Start the message collection flow.",
    input_schema: {
      type: "object" as const,
      properties: {
        response: {
          type: "string",
          description: "Transition phrase before asking for their name",
        },
      },
      required: ["response"],
    },
  },
  {
    name: "transfer_to_human",
    description:
      "Caller explicitly asked to speak with a person, or the situation is urgent/complex and requires a human. Only use if the business has configured transfer numbers.",
    input_schema: {
      type: "object" as const,
      properties: {
        response: {
          type: "string",
          description: "What to say while connecting them",
        },
        reason: {
          type: "string",
          description: "Internal reason for the transfer (for logging)",
        },
      },
      required: ["response", "reason"],
    },
  },
  {
    name: "end_call",
    description:
      "The conversation is complete and it's appropriate to end the call (caller said goodbye, issue resolved, etc.)",
    input_schema: {
      type: "object" as const,
      properties: {
        response: {
          type: "string",
          description: "Closing statement before hanging up",
        },
      },
      required: ["response"],
    },
  },
];

// ---------------------------------------------------------------------------
// Result type
// ---------------------------------------------------------------------------

export type IntentResult =
  | { intent: "faq"; response: string }
  | { intent: "reservation"; response: string }
  | { intent: "message"; response: string }
  | { intent: "transfer"; response: string; reason: string }
  | { intent: "end_call"; response: string }
  | { intent: "unknown"; response: string };

// ---------------------------------------------------------------------------
// Main classification function
// ---------------------------------------------------------------------------

export async function classifyAndRespond(
  systemPrompt: string,
  messages: Anthropic.MessageParam[],
  hasTransferNumbers: boolean
): Promise<IntentResult> {
  // Filter out transfer tool if no transfer numbers configured
  const tools = hasTransferNumbers
    ? AGENT_TOOLS
    : AGENT_TOOLS.filter((t) => t.name !== "transfer_to_human");

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: systemPrompt,
    tools,
    tool_choice: { type: "any" }, // force a tool call every turn
    messages,
  });

  // Extract tool use block
  const toolUse = response.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
  );

  if (!toolUse) {
    // Fallback: Claude didn't call a tool (shouldn't happen with tool_choice: any)
    const textBlock = response.content.find(
      (b): b is Anthropic.TextBlock => b.type === "text"
    );
    return {
      intent: "unknown",
      response:
        textBlock?.text ??
        "I'm sorry, I didn't quite catch that. Could you repeat your question?",
    };
  }

  const input = toolUse.input as Record<string, string>;

  switch (toolUse.name) {
    case "answer_question":
      return { intent: "faq", response: input["response"] ?? "" };
    case "start_reservation":
      return { intent: "reservation", response: input["response"] ?? "" };
    case "take_message":
      return { intent: "message", response: input["response"] ?? "" };
    case "transfer_to_human":
      return {
        intent: "transfer",
        response: input["response"] ?? "Let me connect you with someone.",
        reason: input["reason"] ?? "Caller requested human",
      };
    case "end_call":
      return { intent: "end_call", response: input["response"] ?? "Goodbye!" };
    default:
      return {
        intent: "unknown",
        response: "I'm sorry, I couldn't process that. Could you try again?",
      };
  }
}

/**
 * Map tool name → CallerIntent for DB logging.
 */
export function intentToCallOutcome(intent: CallerIntent): string {
  const map: Record<CallerIntent, string> = {
    faq: "FAQ",
    reservation: "RESERVATION",
    message: "MESSAGE",
    transfer: "TRANSFER",
    unknown: "ABANDONED",
  };
  return map[intent] ?? "ABANDONED";
}
