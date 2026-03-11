/**
 * POST /api/knowledge/ingest-url
 * Crawl a URL, extract text, use Claude to generate Q&A pairs,
 * and return them for the user to review before saving.
 *
 * Body: { url: string }
 * Response: { pairs: { question: string; answer: string }[] }
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import * as cheerio from "cheerio";
import Anthropic from "@anthropic-ai/sdk";
import { requireAuth } from "@/lib/business";

const anthropic = new Anthropic({ apiKey: process.env["ANTHROPIC_API_KEY"] });

const schema = z.object({
  url: z.string().url(),
});

export async function POST(req: NextRequest) {
  try {
    await requireAuth();
    const { url } = schema.parse(await req.json());

    // Fetch the page
    const response = await fetch(url, {
      headers: { "User-Agent": "OutdoorVoice-Bot/1.0 (knowledge-ingestion)" },
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch URL: ${response.status}` },
        { status: 400 }
      );
    }

    const html = await response.text();

    // Extract readable text using cheerio
    const $ = cheerio.load(html);

    // Remove noise elements
    $("script, style, nav, footer, header, [role=navigation], .menu, .nav, .footer, .header, .sidebar, .cookie, .banner").remove();

    // Extract meaningful text from content areas
    const text = $("main, article, .content, .page-content, body")
      .first()
      .text()
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 12_000); // Cap to ~3k tokens for Claude

    if (text.length < 100) {
      return NextResponse.json({ error: "Not enough text content found on page" }, { status: 400 });
    }

    // Ask Claude to extract Q&A pairs
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: `You are helping an outdoor activity business build a FAQ knowledge base for their AI phone agent.

Extract question-and-answer pairs from this website content. Focus on:
- Pricing and rates
- Operating hours and location
- What activities or services are offered
- What to bring / requirements
- Cancellation / refund policies
- Booking process
- Safety information
- Contact info

Return ONLY a JSON array of objects with "question" and "answer" keys.
Each answer should be 1-3 sentences, suitable for reading aloud on a phone call.
Extract 5-15 pairs. Only include information clearly present in the text.

Website content:
${text}`,
        },
      ],
    });

    const content = message.content[0];
    if (!content || content.type !== "text") {
      return NextResponse.json({ error: "Extraction failed" }, { status: 500 });
    }

    // Parse the JSON response (Claude may wrap it in ```json blocks)
    const jsonMatch = content.text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Could not parse extracted pairs" }, { status: 500 });
    }

    const pairs = z
      .array(z.object({ question: z.string(), answer: z.string() }))
      .parse(JSON.parse(jsonMatch[0]));

    return NextResponse.json({ pairs, sourceUrl: url });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Ingestion failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
