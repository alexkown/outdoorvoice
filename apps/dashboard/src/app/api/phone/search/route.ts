/**
 * GET /api/phone/search?areaCode=555
 * Search available Twilio local numbers by area code.
 */

import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { requireAuth } from "@/lib/business";

export async function GET(req: NextRequest) {
  try {
    await requireAuth();

    const areaCode = req.nextUrl.searchParams.get("areaCode") ?? "";
    if (!/^\d{3}$/.test(areaCode)) {
      return NextResponse.json({ error: "Invalid area code" }, { status: 400 });
    }

    const accountSid = process.env["TWILIO_ACCOUNT_SID"];
    const authToken = process.env["TWILIO_AUTH_TOKEN"];
    if (!accountSid || !authToken) {
      return NextResponse.json({ error: "Twilio not configured" }, { status: 503 });
    }

    const client = twilio(accountSid, authToken);
    const available = await client
      .availablePhoneNumbers("US")
      .local.list({ areaCode: parseInt(areaCode, 10), limit: 10 });

    return NextResponse.json({
      numbers: available.map((n) => ({
        phoneNumber: n.phoneNumber,
        friendlyName: n.friendlyName,
        locality: n.locality,
        region: n.region,
      })),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to search numbers";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
