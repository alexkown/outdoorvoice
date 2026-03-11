/**
 * Server-side helpers for fetching the current user's business.
 * All API routes and Server Components call these instead of querying Prisma directly.
 */

import { auth } from "@clerk/nextjs/server";
import { db } from "@outdoorvoice/db";

/** Get the authenticated userId or throw a 401-style error. */
export async function requireAuth(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  return userId;
}

/** Get the business owned by the current Clerk user. Returns null if not found. */
export async function getCurrentBusiness() {
  const userId = await requireAuth();
  return db.business.findUnique({
    where: { clerkOrgId: userId },
    include: {
      transferNumbers: { orderBy: { priority: "asc" } },
      integrationConfig: true,
      notificationConfig: true,
      billingAccount: true,
    },
  });
}

/** Get the business or throw a 404-style error. */
export async function requireBusiness() {
  const business = await getCurrentBusiness();
  if (!business) throw new Error("Business not found — complete onboarding first");
  return business;
}
