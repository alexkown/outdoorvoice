/**
 * PATCH  /api/knowledge/[id] — update a KB entry
 * DELETE /api/knowledge/[id] — delete a KB entry
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@outdoorvoice/db";
import { requireAuth } from "@/lib/business";
import { embedKBEntry } from "@/lib/embed";

async function getEntryForUser(id: string, userId: string) {
  const entry = await db.knowledgeBaseEntry.findUnique({
    where: { id },
    include: { business: true },
  });
  if (!entry || entry.business.clerkOrgId !== userId) return null;
  return entry;
}

const patchSchema = z.object({
  question: z.string().min(1).optional(),
  answer: z.string().min(1).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireAuth();
    const { id } = await params;
    const entry = await getEntryForUser(id, userId);
    if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = patchSchema.parse(await req.json());
    const updated = await db.knowledgeBaseEntry.update({ where: { id }, data: body });

    // Re-embed on update
    void embedKBEntry(id).catch((e) => console.error("Re-embed failed", id, e));

    return NextResponse.json({ entry: updated });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Bad request";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireAuth();
    const { id } = await params;
    const entry = await getEntryForUser(id, userId);
    if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await db.knowledgeBaseEntry.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
