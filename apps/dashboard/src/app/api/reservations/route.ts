/**
 * GET /api/reservations
 * Returns all reservations for the authenticated business,
 * most recent first, with optional status filter.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@outdoorvoice/db";
import { requireAuth } from "@/lib/business";

export async function GET(req: NextRequest) {
  try {
    const userId = await requireAuth();
    const business = await db.business.findUnique({ where: { clerkOrgId: userId } });
    if (!business) return NextResponse.json({ reservations: [] });

    const status = req.nextUrl.searchParams.get("status");

    const reservations = await db.reservation.findMany({
      where: {
        businessId: business.id,
        ...(status ? { status: status as "CONFIRMED" | "PENDING" | "CANCELLED" | "FAILED" } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ reservations });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
