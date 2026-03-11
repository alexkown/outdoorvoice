/**
 * Knowledge base RAG — vector similarity search via pgvector.
 *
 * When the conversation agent receives a caller's question, we embed it
 * using OpenAI text-embedding-3-small (1536 dims, matching the schema)
 * and find the top-K most semantically similar KB entries for the business.
 *
 * The retrieved Q&A pairs are injected into Claude's context as grounding
 * so it answers accurately and doesn't hallucinate.
 */

import OpenAI from "openai";
import { db } from "@outdoorvoice/db";

const openai = new OpenAI({ apiKey: process.env["OPENAI_API_KEY"] });

const EMBEDDING_MODEL = "text-embedding-3-small";
const TOP_K = 5;
const SIMILARITY_THRESHOLD = 0.75; // ignore results below this

export interface KBResult {
  question: string;
  answer: string;
  similarity: number;
}

/**
 * Embed a query string using OpenAI.
 */
async function embed(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text.trim(),
  });
  const embedding = response.data[0]?.embedding;
  if (!embedding) throw new Error("OpenAI returned empty embedding");
  return embedding;
}

/**
 * Find the most relevant KB entries for a business given a query.
 * Returns results sorted by descending similarity, filtered by threshold.
 */
export async function searchKnowledgeBase(
  businessId: string,
  query: string
): Promise<KBResult[]> {
  const queryEmbedding = await embed(query);
  const pgVector = `[${queryEmbedding.join(",")}]`;

  // pgvector cosine similarity: 1 - (embedding <=> query)
  const rows = await db.$queryRaw<
    { question: string; answer: string; similarity: number }[]
  >`
    SELECT
      question,
      answer,
      1 - (embedding <=> ${pgVector}::vector) AS similarity
    FROM "KnowledgeBaseEntry"
    WHERE "businessId" = ${businessId}
      AND embedding IS NOT NULL
    ORDER BY embedding <=> ${pgVector}::vector
    LIMIT ${TOP_K}
  `;

  return rows.filter((r) => r.similarity >= SIMILARITY_THRESHOLD);
}

/**
 * Generate and store an embedding for a knowledge base entry.
 * Called when a KB entry is created or updated.
 */
export async function embedKBEntry(entryId: string): Promise<void> {
  const entry = await db.knowledgeBaseEntry.findUniqueOrThrow({
    where: { id: entryId },
  });

  // Embed the combined question + answer for richer matching
  const text = `${entry.question}\n${entry.answer}`;
  const embedding = await embed(text);
  const pgVector = `[${embedding.join(",")}]`;

  await db.$executeRaw`
    UPDATE "KnowledgeBaseEntry"
    SET embedding = ${pgVector}::vector
    WHERE id = ${entryId}
  `;
}

/**
 * Format retrieved KB results into a compact string for Claude's context.
 */
export function formatKBContext(results: KBResult[]): string {
  if (results.length === 0) return "";
  return (
    "## Relevant Knowledge Base Entries\n" +
    results.map((r) => `Q: ${r.question}\nA: ${r.answer}`).join("\n\n")
  );
}
