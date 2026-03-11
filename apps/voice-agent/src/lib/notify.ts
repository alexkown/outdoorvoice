/**
 * Staff notification lib — SMS via Twilio, email via Resend.
 * Called after a booking is confirmed or a message is taken.
 */

import twilio from "twilio";
import { Resend } from "resend";

// ---------------------------------------------------------------------------
// Booking notification
// ---------------------------------------------------------------------------

export interface BookingNotificationPayload {
  businessName: string;
  customerName: string;
  customerPhone: string;
  activity: string;
  date: string;       // YYYY-MM-DD
  partySize: number;
  confirmationCode?: string;
  smsNumbers: string[];
  emailAddresses: string[];
}

export async function sendBookingNotification(
  payload: BookingNotificationPayload
): Promise<void> {
  const dateFormatted = new Date(payload.date + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric",
  });
  const code = payload.confirmationCode ? ` Conf# ${payload.confirmationCode}.` : "";
  const smsBody =
    `[${payload.businessName}] New booking!\n` +
    `${payload.customerName} | ${payload.activity} | ${dateFormatted} | ${payload.partySize} ppl.${code}\n` +
    `Call back: ${payload.customerPhone}`;

  await Promise.allSettled([
    sendSMS(payload.smsNumbers, smsBody),
    sendBookingEmail(payload, dateFormatted),
  ]);
}

// ---------------------------------------------------------------------------
// Message notification
// ---------------------------------------------------------------------------

export interface MessageNotificationPayload {
  businessName: string;
  callerName?: string;
  callerPhone: string;
  callbackTime?: string;
  summary: string;
  smsNumbers: string[];
  emailAddresses: string[];
}

export async function sendMessageNotification(
  payload: MessageNotificationPayload
): Promise<void> {
  const name = payload.callerName ?? "Unknown caller";
  const time = payload.callbackTime ? ` Best time: ${payload.callbackTime}.` : "";
  const smsBody =
    `[${payload.businessName}] New message from ${name} (${payload.callerPhone}).${time}\n` +
    `"${payload.summary}"`;

  await Promise.allSettled([
    sendSMS(payload.smsNumbers, smsBody),
    sendMessageEmail(payload),
  ]);
}

// ---------------------------------------------------------------------------
// Twilio SMS
// ---------------------------------------------------------------------------

async function sendSMS(toNumbers: string[], body: string): Promise<void> {
  if (toNumbers.length === 0) return;

  const accountSid = process.env["TWILIO_ACCOUNT_SID"];
  const authToken = process.env["TWILIO_AUTH_TOKEN"];
  const fromNumber = process.env["TWILIO_SMS_FROM_NUMBER"];
  if (!accountSid || !authToken || !fromNumber) return;

  const client = twilio(accountSid, authToken);
  await Promise.allSettled(
    toNumbers.map((to) => client.messages.create({ to, from: fromNumber, body }))
  );
}

// ---------------------------------------------------------------------------
// Resend email
// ---------------------------------------------------------------------------

async function getResend(): Promise<Resend | null> {
  const key = process.env["RESEND_API_KEY"];
  return key ? new Resend(key) : null;
}

async function sendBookingEmail(
  payload: BookingNotificationPayload,
  dateFormatted: string
): Promise<void> {
  if (payload.emailAddresses.length === 0) return;
  const resend = await getResend();
  if (!resend) return;

  const from = process.env["RESEND_FROM_EMAIL"] ?? "notifications@outdoorvoice.app";
  const code = payload.confirmationCode
    ? `<p><strong>Confirmation #:</strong> ${payload.confirmationCode}</p>`
    : "";

  await resend.emails.send({
    from,
    to: payload.emailAddresses,
    subject: `New booking — ${payload.activity} on ${dateFormatted}`,
    html: `
      <h2>New Booking via OutdoorVoice</h2>
      <table cellpadding="8" style="border-collapse:collapse">
        <tr><td><strong>Business:</strong></td><td>${payload.businessName}</td></tr>
        <tr><td><strong>Activity:</strong></td><td>${payload.activity}</td></tr>
        <tr><td><strong>Date:</strong></td><td>${dateFormatted}</td></tr>
        <tr><td><strong>Party size:</strong></td><td>${payload.partySize}</td></tr>
        <tr><td><strong>Customer:</strong></td><td>${payload.customerName}</td></tr>
        <tr><td><strong>Phone:</strong></td><td>${payload.customerPhone}</td></tr>
      </table>
      ${code}
      <p style="color:#666;font-size:12px">Booked via OutdoorVoice AI phone agent</p>
    `,
  });
}

async function sendMessageEmail(payload: MessageNotificationPayload): Promise<void> {
  if (payload.emailAddresses.length === 0) return;
  const resend = await getResend();
  if (!resend) return;

  const from = process.env["RESEND_FROM_EMAIL"] ?? "notifications@outdoorvoice.app";
  const name = payload.callerName ?? "Unknown caller";

  await resend.emails.send({
    from,
    to: payload.emailAddresses,
    subject: `New message from ${name}`,
    html: `
      <h2>New Message via OutdoorVoice</h2>
      <table cellpadding="8" style="border-collapse:collapse">
        <tr><td><strong>Business:</strong></td><td>${payload.businessName}</td></tr>
        <tr><td><strong>Caller:</strong></td><td>${name}</td></tr>
        <tr><td><strong>Phone:</strong></td><td>${payload.callerPhone}</td></tr>
        ${payload.callbackTime ? `<tr><td><strong>Best callback time:</strong></td><td>${payload.callbackTime}</td></tr>` : ""}
      </table>
      <p><strong>Message:</strong><br/>${payload.summary}</p>
      <p style="color:#666;font-size:12px">Captured by OutdoorVoice AI phone agent</p>
    `,
  });
}
