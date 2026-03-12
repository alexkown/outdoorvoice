/**
 * GET  /api/business  — return the current user's business
 * POST /api/business  — create a new business (first-time onboarding)
 * PATCH /api/business — update business fields (called by wizard steps)
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db, Prisma } from "@outdoorvoice/db";
import { requireAuth, getCurrentBusiness } from "@/lib/business";

export async function GET() {
  try {
    const business = await getCurrentBusiness();
    return NextResponse.json({ business });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

const createSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["KAYAK_CANOE", "HIKING_TOURS", "CAMPING_RV", "OTHER"]),
  timezone: z.string().default("America/New_York"),
});

export async function POST(req: NextRequest) {
  let userId: string;
  try {
    userId = await requireAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = createSchema.parse(await req.json());

    // Idempotent — if business already exists, return it
    const existing = await db.business.findUnique({ where: { clerkOrgId: userId } });
    if (existing) return NextResponse.json({ business: existing });

    const business = await db.business.create({
      data: {
        clerkOrgId: userId,
        name: body.name,
        type: body.type,
        timezone: body.timezone,
        billingAccount: { create: {} }, // create empty billing account
      },
    });

    return NextResponse.json({ business }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Bad request";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  type: z.enum(["KAYAK_CANOE", "HIKING_TOURS", "CAMPING_RV", "OTHER"]).optional(),
  timezone: z.string().optional(),
  operatingHours: z.record(z.unknown()).optional(),
  agentGreeting: z.string().optional(),
  agentVoiceId: z.string().optional(),
  fallbackBehavior: z.enum(["TAKE_MESSAGE", "TRANSFER", "AI_DECIDES"]).optional(),
  recordingEnabled: z.boolean().optional(),
  phoneNumber: z.string().optional(),
  twilioPhoneNumberSid: z.string().optional(),
});

export async function PATCH(req: NextRequest) {
  let userId: string;
  try {
    userId = await requireAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = patchSchema.parse(await req.json());

    const business = await db.business.update({
      where: { clerkOrgId: userId },
      data: body as Prisma.BusinessUpdateInput,
    });

    return NextResponse.json({ business });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Bad request";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
