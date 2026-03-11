/**
 * GET /api/calls/[id]
 * Returns the full call record including transcript, for the transcript viewer dialog.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@outdoorvoice/db";
import { requireAuth } from "@/lib/business";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireAuth();
    const { id } = await params;

    const call = await db.call.findUnique({
      where: { id },
      include: { business: { select: { clerkOrgId: true } } },
    });

    if (!call || call.business.clerkOrgId !== userId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ call });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
