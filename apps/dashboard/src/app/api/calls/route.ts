/**
 * GET /api/calls
 * Returns paginated call log for the current business.
 *
 * Query params:
 *   outcome  — filter by outcome (FAQ | RESERVATION | MESSAGE | TRANSFER | ABANDONED)
 *   page     — 1-based page number (default 1)
 *   limit    — results per page (default 25, max 100)
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@outdoorvoice/db";
import { requireAuth } from "@/lib/business";

export async function GET(req: NextRequest) {
  try {
    const userId = await requireAuth();
    const business = await db.business.findUnique({ where: { clerkOrgId: userId }, select: { id: true } });
    if (!business) return NextResponse.json({ calls: [], total: 0 });

    const params = req.nextUrl.searchParams;
    const outcome = params.get("outcome");
    const page = Math.max(1, parseInt(params.get("page") ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(params.get("limit") ?? "25", 10)));
    const skip = (page - 1) * limit;

    const where = {
      businessId: business.id,
      ...(outcome ? { outcome: outcome as "FAQ" | "RESERVATION" | "MESSAGE" | "TRANSFER" | "ABANDONED" } : {}),
    };

    const [calls, total] = await Promise.all([
      db.call.findMany({
        where,
        orderBy: { startedAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          callerNumber: true,
          startedAt: true,
          endedAt: true,
          durationSecs: true,
          outcome: true,
          summary: true,
          recordingUrl: true,
          twilioCallSid: true,
        },
      }),
      db.call.count({ where }),
    ]);

    return NextResponse.json({ calls, total, page, limit });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
