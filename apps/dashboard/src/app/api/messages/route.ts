/**
 * GET /api/messages
 * Returns messages for the current business, grouped by status.
 *
 * Query params:
 *   status — filter by NEW | IN_PROGRESS | RESOLVED (default: all)
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@outdoorvoice/db";
import { requireAuth } from "@/lib/business";

export async function GET(req: NextRequest) {
  try {
    const userId = await requireAuth();
    const business = await db.business.findUnique({ where: { clerkOrgId: userId }, select: { id: true } });
    if (!business) return NextResponse.json({ messages: [] });

    const status = req.nextUrl.searchParams.get("status");

    const messages = await db.message.findMany({
      where: {
        businessId: business.id,
        ...(status ? { status: status as "NEW" | "IN_PROGRESS" | "RESOLVED" } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        id: true,
        createdAt: true,
        callerName: true,
        callerPhone: true,
        callbackTime: true,
        summary: true,
        status: true,
      },
    });

    return NextResponse.json({ messages });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
