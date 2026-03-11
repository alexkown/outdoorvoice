/**
 * Twilio webhook routes.
 *
 * POST /twilio/incoming       — Twilio calls this when a call arrives.
 *                               Returns TwiML that opens a Media Streams WebSocket.
 *
 * POST /twilio/status         — Twilio calls this on call status changes.
 *
 * GET  /twilio/stream/:b/:c   — Twilio connects here via WebSocket and streams
 *                               bidirectional mulaw 8kHz audio.
 *
 * POST /twilio/transfer-status — Twilio calls after a <Dial> completes.
 *                                If the transfer target didn't answer, take a message.
 */

import type { FastifyPluginAsync } from "fastify";
import twilio from "twilio";
import { db } from "@outdoorvoice/db";
import { buildConversationAgent } from "../agent/conversation.js";

const { VoiceResponse } = twilio.twiml;

// Validate Twilio webhook signatures in production
function validateTwilioSignature(
  request: Parameters<Parameters<FastifyPluginAsync>[0]["post"]>[0],
  _authToken: string
): boolean {
  // In development skip validation; in production enable with twilio.validateRequest()
  if (process.env["NODE_ENV"] !== "production") return true;
  // TODO: implement full signature validation for production
  return true;
}

export const twilioRoutes: FastifyPluginAsync = async (app) => {
  // ---------------------------------------------------------------------------
  // POST /twilio/incoming
  // ---------------------------------------------------------------------------
  app.post("/incoming", async (request, reply) => {
    const body = request.body as Record<string, string>;
    const twilioCallSid = body["CallSid"] ?? "";
    const callerNumber = body["From"] ?? "unknown";
    const calledNumber = body["To"] ?? "";

    validateTwilioSignature(request, process.env["TWILIO_AUTH_TOKEN"] ?? "");

    app.log.info({ twilioCallSid, callerNumber, calledNumber }, "Incoming call");

    // Find the business that owns this number
    const business = await db.business.findFirst({
      where: { phoneNumber: calledNumber },
    });

    if (!business || !business.onboardingComplete) {
      const twiml = new VoiceResponse();
      twiml.say(
        { voice: "alice" },
        "Sorry, this number is not yet configured. Please try again later. Goodbye."
      );
      twiml.hangup();
      return reply.type("text/xml").send(twiml.toString());
    }

    // Create the call record immediately so the agent can find it by callSid
    await db.call.create({
      data: {
        businessId: business.id,
        callerNumber,
        twilioCallSid,
        startedAt: new Date(),
      },
    });

    // Build TwiML — open a Media Streams WebSocket back to this service
    const twiml = new VoiceResponse();
    const wsHost = process.env["VOICE_AGENT_PUBLIC_HOST"] ?? request.hostname;
    const wsUrl = `wss://${wsHost}/twilio/stream/${business.id}/${twilioCallSid}`;

    const greeting =
      business.agentGreeting ??
      `Thank you for calling ${business.name}. I'm an AI assistant here to help. How can I assist you today?`;

    const connect = twiml.connect();
    // Pass metadata as stream parameters — available in the `start` event
    (connect as unknown as {
      stream(opts: {
        url: string;
        "parameter"?: { name: string; value: string }[];
      }): void;
    }).stream({
      url: wsUrl,
      parameter: [
        { name: "businessId", value: business.id },
        { name: "callerNumber", value: callerNumber },
        { name: "greeting", value: greeting },
      ],
    });

    reply.type("text/xml").send(twiml.toString());
  });

  // ---------------------------------------------------------------------------
  // POST /twilio/status
  // ---------------------------------------------------------------------------
  app.post("/status", async (request) => {
    const body = request.body as Record<string, string>;
    const twilioCallSid = body["CallSid"];
    const callStatus = body["CallStatus"];
    const callDuration = body["CallDuration"]; // seconds as string

    app.log.info({ twilioCallSid, callStatus, callDuration }, "Call status update");

    if (callStatus === "completed" && twilioCallSid) {
      await db.call.updateMany({
        where: { twilioCallSid },
        data: {
          endedAt: new Date(),
          durationSecs: callDuration ? parseInt(callDuration, 10) : null,
        },
      });
    }
  });

  // ---------------------------------------------------------------------------
  // POST /twilio/transfer-status
  // Called by Twilio after a <Dial> action completes (transfer result).
  // ---------------------------------------------------------------------------
  app.post("/transfer-status", async (request, reply) => {
    const body = request.body as Record<string, string>;
    const dialStatus = body["DialCallStatus"]; // "completed" | "no-answer" | "busy" | "failed"
    const callSid = body["CallSid"] ?? "";

    app.log.info({ dialStatus, callSid }, "Transfer status");

    const twiml = new VoiceResponse();

    if (dialStatus !== "completed") {
      // Transfer failed — fall back to message
      twiml.say(
        { voice: "alice" },
        "I wasn't able to reach a team member right now. Please leave a message after the tone and we'll call you back shortly."
      );
      twiml.record({
        action: `/twilio/voicemail/${callSid}`,
        maxLength: 120,
        finishOnKey: "#",
        playBeep: true,
      });
    } else {
      twiml.hangup();
    }

    reply.type("text/xml").send(twiml.toString());
  });

  // ---------------------------------------------------------------------------
  // POST /twilio/voicemail/:callSid
  // Called after a voicemail recording completes (fallback path only).
  // ---------------------------------------------------------------------------
  app.post("/voicemail/:callSid", async (request) => {
    const { callSid } = request.params as { callSid: string };
    const body = request.body as Record<string, string>;
    const recordingUrl = body["RecordingUrl"];

    if (callSid && recordingUrl) {
      await db.call.updateMany({
        where: { twilioCallSid: callSid },
        data: { recordingUrl },
      });
    }
  });

  // ---------------------------------------------------------------------------
  // GET /twilio/stream/:businessId/:callSid
  // Twilio Media Streams WebSocket endpoint.
  // ---------------------------------------------------------------------------
  app.get(
    "/stream/:businessId/:callSid",
    { websocket: true },
    async (socket, request) => {
      const { businessId, callSid } = request.params as {
        businessId: string;
        callSid: string;
      };

      app.log.info({ businessId, callSid }, "Media stream WS connected");

      // Helper to send JSON messages to Twilio
      function sendToTwilio(msg: object) {
        if (socket.readyState === socket.OPEN) {
          socket.send(JSON.stringify(msg));
        }
      }

      // Build the agent — loads business config and connects Deepgram
      const agent = await buildConversationAgent(businessId, callSid, sendToTwilio);

      socket.on("message", (rawMsg) => {
        let msg: {
          event: string;
          streamSid?: string;
          start?: { streamSid: string; customParameters?: Record<string, string> };
          media?: { payload: string };
        };

        try {
          msg = JSON.parse(rawMsg.toString());
        } catch {
          app.log.warn("Failed to parse Twilio WS message");
          return;
        }

        switch (msg.event) {
          case "connected":
            // Twilio confirms the WebSocket connection — nothing to do yet
            break;

          case "start": {
            // Stream is ready; includes streamSid and custom parameters
            const params: Record<string, string> = {
              ...(msg.start?.customParameters ?? {}),
              streamSid: msg.start?.streamSid ?? "",
            };
            void agent.onStart(params);
            break;
          }

          case "media":
            // Audio chunk from the caller — forward to Deepgram
            if (msg.media?.payload) {
              agent.onAudio(msg.media.payload);
            }
            break;

          case "stop":
            void agent.onStop();
            socket.close();
            break;
        }
      });

      socket.on("close", () => {
        app.log.info({ businessId, callSid }, "Media stream WS closed");
        void agent.onStop();
      });

      socket.on("error", (err) => {
        app.log.error({ businessId, callSid, err }, "Media stream WS error");
        void agent.onStop();
      });
    }
  );
};
