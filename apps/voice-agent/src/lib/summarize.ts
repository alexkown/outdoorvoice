/**
 * Post-call summary generation using Claude.
 * Called in onStop() after the transcript is assembled.
 * Produces a 2-3 sentence plain-English summary suitable for displaying
 * in the dashboard call log.
 */

import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env["ANTHROPIC_API_KEY"] });

export async function generateCallSummary(
  businessName: string,
  transcript: string,
  outcome: string
): Promise<string> {
  if (!transcript.trim()) return "No transcript available.";

  // Truncate very long transcripts to avoid token waste
  const truncated = transcript.length > 8_000
    ? transcript.slice(0, 8_000) + "\n[transcript truncated]"
    : transcript;

  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001", // fast + cheap for summaries
    max_tokens: 200,
    messages: [
      {
        role: "user",
        content: `Summarize this phone call for the business owner's dashboard in 2-3 sentences.
Be factual and concise. Include the caller's main request and the outcome.
Do NOT include personal info like phone numbers or email addresses.

Business: ${businessName}
Outcome: ${outcome}

Transcript:
${truncated}`,
      },
    ],
  });

  const text = message.content[0]?.type === "text" ? message.content[0].text.trim() : "";
  return text || "Call completed.";
}
