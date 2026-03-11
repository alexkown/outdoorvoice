/**
 * PATCH /api/messages/[id]
 * Update message status: NEW → IN_PROGRESS → RESOLVED
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@outdoorvoice/db";
import { requireAuth } from "@/lib/business";

const schema = z.object({
  status: z.enum(["NEW", "IN_PROGRESS", "RESOLVED"]),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireAuth();
    const { id } = await params;

    const message = await db.message.findUnique({
      where: { id },
      include: { business: { select: { clerkOrgId: true } } },
    });

    if (!message || message.business.clerkOrgId !== userId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { status } = schema.parse(await req.json());
    const updated = await db.message.update({ where: { id }, data: { status } });
    return NextResponse.json({ message: updated });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Bad request";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
