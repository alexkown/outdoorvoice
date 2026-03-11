/**
 * Embedding helper for the dashboard (server-side API routes).
 * Mirrors the logic in voice-agent/src/agent/knowledge.ts but lives
 * here so dashboard API routes don't depend on the voice-agent package.
 */

import OpenAI from "openai";
import { db } from "@outdoorvoice/db";

const openai = new OpenAI({ apiKey: process.env["OPENAI_API_KEY"] });

export async function embedKBEntry(entryId: string): Promise<void> {
  const entry = await db.knowledgeBaseEntry.findUniqueOrThrow({ where: { id: entryId } });
  const text = `${entry.question}\n${entry.answer}`;

  const res = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text.trim(),
  });

  const embedding = res.data[0]?.embedding;
  if (!embedding) throw new Error("Empty embedding returned");

  const pgVector = `[${embedding.join(",")}]`;
  await db.$executeRaw`
    UPDATE "KnowledgeBaseEntry"
    SET embedding = ${pgVector}::vector
    WHERE id = ${entryId}
  `;
}
