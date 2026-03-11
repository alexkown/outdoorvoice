/**
 * Twilio REST API helpers — warm transfer, hangup.
 */

import twilio from "twilio";

function getClient() {
  const accountSid = process.env["TWILIO_ACCOUNT_SID"];
  const authToken = process.env["TWILIO_AUTH_TOKEN"];
  if (!accountSid || !authToken) {
    throw new Error("TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN not set");
  }
  return twilio(accountSid, authToken);
}

/**
 * Warm transfer: redirect the live call to a new TwiML that dials the
 * target number. If the target doesn't answer we fall back to a voicemail
 * prompt handled by our /twilio/no-answer endpoint.
 */
export async function transferCall(
  callSid: string,
  targetNumber: string,
  callerNumber: string,
  businessNumber: string
): Promise<void> {
  const client = getClient();
  const host = process.env["VOICE_AGENT_PUBLIC_HOST"];

  // Redirect the in-progress call to TwiML that dials the staff number
  await client.calls(callSid).update({
    twiml: `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Please hold while I connect you.</Say>
  <Dial callerId="${businessNumber}" action="https://${host}/twilio/transfer-status" method="POST">
    <Number>${targetNumber}</Number>
  </Dial>
</Response>`,
  });
}

/**
 * Hang up a call programmatically.
 */
export async function hangupCall(callSid: string): Promise<void> {
  const client = getClient();
  await client.calls(callSid).update({ status: "completed" });
}
