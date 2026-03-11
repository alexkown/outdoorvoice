import Fastify from "fastify";
import websocket from "@fastify/websocket";
import formbody from "@fastify/formbody";
import { twilioRoutes } from "./routes/twilio.js";

const app = Fastify({
  logger: {
    level: process.env["LOG_LEVEL"] ?? "info",
  },
});

await app.register(websocket);
await app.register(formbody);

// Health check
app.get("/health", async () => ({ status: "ok", service: "voice-agent" }));

// Twilio webhook routes
await app.register(twilioRoutes, { prefix: "/twilio" });

const port = parseInt(process.env["PORT"] ?? "3001", 10);
const host = process.env["HOST"] ?? "0.0.0.0";

try {
  await app.listen({ port, host });
  app.log.info(`Voice agent listening on ${host}:${port}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
