/**
 * POST /api/business/complete
 * Mark onboarding as complete. Also upserts notification config and transfer numbers
 * from the final wizard payload.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db, Prisma } from "@outdoorvoice/db";
import { requireAuth } from "@/lib/business";

const schema = z.object({
  transferNumbers: z
    .array(z.object({ label: z.string(), number: z.string() }))
    .optional(),
  fallbackBehavior: z
    .enum(["TAKE_MESSAGE", "TRANSFER", "AI_DECIDES"])
    .optional(),
  smsNumbers: z.array(z.string()).optional(),
  emailAddresses: z.array(z.string()).optional(),
  integrationPlatform: z
    .enum(["FAREHARBOR", "REZDY", "CAMPSPOT", "GOOGLE_CALENDAR", "GENERIC"])
    .optional(),
  integrationApiKey: z.string().optional(),
  integrationCompanyId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const userId = await requireAuth();
    const body = schema.parse(await req.json());

    const business = await db.business.findUniqueOrThrow({
      where: { clerkOrgId: userId },
    });

    await db.$transaction(async (tx: Prisma.TransactionClient) => {
      // Update business fields
      await tx.business.update({
        where: { id: business.id },
        data: {
          onboardingComplete: true,
          fallbackBehavior: body.fallbackBehavior,
        },
      });

      // Replace transfer numbers
      if (body.transferNumbers !== undefined) {
        await tx.transferNumber.deleteMany({ where: { businessId: business.id } });
        if (body.transferNumbers.length > 0) {
          await tx.transferNumber.createMany({
            data: body.transferNumbers.map((t, i) => ({
              businessId: business.id,
              label: t.label,
              number: t.number,
              priority: i,
            })),
          });
        }
      }

      // Upsert notification config
      if (body.smsNumbers !== undefined || body.emailAddresses !== undefined) {
        await tx.notificationConfig.upsert({
          where: { businessId: business.id },
          create: {
            businessId: business.id,
            smsNumbers: body.smsNumbers ?? [],
            emailAddresses: body.emailAddresses ?? [],
          },
          update: {
            smsNumbers: body.smsNumbers ?? [],
            emailAddresses: body.emailAddresses ?? [],
          },
        });
      }

      // Upsert integration config
      if (body.integrationPlatform) {
        await tx.integrationConfig.upsert({
          where: { businessId: business.id },
          create: {
            businessId: business.id,
            platform: body.integrationPlatform,
            apiKey: body.integrationApiKey,
            companyId: body.integrationCompanyId,
          },
          update: {
            platform: body.integrationPlatform,
            apiKey: body.integrationApiKey,
            companyId: body.integrationCompanyId,
          },
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Bad request";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
