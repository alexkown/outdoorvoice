/**
 * GET  /api/knowledge — list all KB entries for the current business
 * POST /api/knowledge — create a new KB entry (manual)
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@outdoorvoice/db";
import { requireAuth } from "@/lib/business";
import { embedKBEntry } from "@/lib/embed";

export async function GET() {
  try {
    const userId = await requireAuth();
    const business = await db.business.findUnique({ where: { clerkOrgId: userId } });
    if (!business) return NextResponse.json({ entries: [] });

    const entries = await db.knowledgeBaseEntry.findMany({
      where: { businessId: business.id },
      orderBy: { createdAt: "desc" },
      select: { id: true, question: true, answer: true, source: true, createdAt: true },
    });

    return NextResponse.json({ entries });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

const createSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const userId = await requireAuth();
    const business = await db.business.findUniqueOrThrow({ where: { clerkOrgId: userId } });
    const body = createSchema.parse(await req.json());

    const entry = await db.knowledgeBaseEntry.create({
      data: {
        businessId: business.id,
        question: body.question,
        answer: body.answer,
        source: "MANUAL",
      },
    });

    // Generate embedding asynchronously (don't block response)
    void embedKBEntry(entry.id).catch((e) =>
      console.error("Embedding failed for entry", entry.id, e)
    );

    return NextResponse.json({ entry }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Bad request";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
