/**
 * POST /api/phone/provision
 * Purchase a Twilio phone number and configure it to call our voice-agent webhook.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import twilio from "twilio";
import { db } from "@outdoorvoice/db";
import { requireAuth } from "@/lib/business";

const schema = z.object({
  phoneNumber: z.string().regex(/^\+1\d{10}$/, "Must be E.164 format (+1XXXXXXXXXX)"),
});

export async function POST(req: NextRequest) {
  try {
    const userId = await requireAuth();
    const { phoneNumber } = schema.parse(await req.json());

    const accountSid = process.env["TWILIO_ACCOUNT_SID"];
    const authToken = process.env["TWILIO_AUTH_TOKEN"];
    if (!accountSid || !authToken) {
      return NextResponse.json({ error: "Twilio not configured" }, { status: 503 });
    }

    const voiceAgentHost = process.env["VOICE_AGENT_PUBLIC_HOST"];
    if (!voiceAgentHost) {
      return NextResponse.json({ error: "VOICE_AGENT_PUBLIC_HOST not configured" }, { status: 503 });
    }

    const client = twilio(accountSid, authToken);

    // Purchase the number and wire it to our voice-agent webhook
    const purchased = await client.incomingPhoneNumbers.create({
      phoneNumber,
      voiceUrl: `https://${voiceAgentHost}/twilio/incoming`,
      voiceMethod: "POST",
      statusCallback: `https://${voiceAgentHost}/twilio/status`,
      statusCallbackMethod: "POST",
    });

    // Save to the business record
    await db.business.update({
      where: { clerkOrgId: userId },
      data: {
        phoneNumber: purchased.phoneNumber,
        twilioPhoneNumberSid: purchased.sid,
      },
    });

    return NextResponse.json({
      phoneNumber: purchased.phoneNumber,
      sid: purchased.sid,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to provision number";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
