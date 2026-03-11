/**
 * GET /api/overview
 * Returns today's stats for the dashboard overview page.
 * All counts are scoped to the current business and the current calendar day
 * in the business's configured timezone.
 */

import { NextResponse } from "next/server";
import { db } from "@outdoorvoice/db";
import { requireAuth } from "@/lib/business";

export async function GET() {
  try {
    const userId = await requireAuth();
    const business = await db.business.findUnique({
      where: { clerkOrgId: userId },
      select: { id: true, timezone: true },
    });
    if (!business) return NextResponse.json(emptyStats());

    // Start of today in the business's timezone
    const todayStr = new Date().toLocaleDateString("en-CA", {
      timeZone: business.timezone,
    }); // "YYYY-MM-DD"
    const todayStart = new Date(`${todayStr}T00:00:00`);
    const todayEnd = new Date(`${todayStr}T23:59:59`);

    const [
      totalCallsToday,
      callsByOutcome,
      bookingsToday,
      messagesNew,
      activeCall,
    ] = await Promise.all([
      db.call.count({
        where: { businessId: business.id, startedAt: { gte: todayStart, lte: todayEnd } },
      }),
      db.call.groupBy({
        by: ["outcome"],
        where: { businessId: business.id, startedAt: { gte: todayStart, lte: todayEnd } },
        _count: { outcome: true },
      }),
      db.reservation.count({
        where: {
          businessId: business.id,
          createdAt: { gte: todayStart, lte: todayEnd },
          status: "CONFIRMED",
        },
      }),
      db.message.count({
        where: { businessId: business.id, status: "NEW" },
      }),
      db.call.findFirst({
        where: { businessId: business.id, endedAt: null, startedAt: { gte: new Date(Date.now() - 3_600_000) } },
        orderBy: { startedAt: "desc" },
        select: { id: true, callerNumber: true, startedAt: true, outcome: true },
      }),
    ]);

    // Resolution rate = calls NOT transferred/abandoned / total (skip zero denominator)
    const abandoned = callsByOutcome.find((r) => r.outcome === "ABANDONED")?._count.outcome ?? 0;
    const transferred = callsByOutcome.find((r) => r.outcome === "TRANSFER")?._count.outcome ?? 0;
    const resolutionRate =
      totalCallsToday > 0
        ? Math.round(((totalCallsToday - abandoned - transferred) / totalCallsToday) * 100)
        : null;

    return NextResponse.json({
      callsToday: totalCallsToday,
      bookingsToday,
      messagesWaiting: messagesNew,
      resolutionRate,
      activeCall,
      outcomeBreakdown: callsByOutcome.map((r) => ({
        outcome: r.outcome,
        count: r._count.outcome,
      })),
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

function emptyStats() {
  return {
    callsToday: 0,
    bookingsToday: 0,
    messagesWaiting: 0,
    resolutionRate: null,
    activeCall: null,
    outcomeBreakdown: [],
  };
}
