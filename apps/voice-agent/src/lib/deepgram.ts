/**
 * Deepgram streaming STT wrapper.
 *
 * Twilio sends audio as base64-encoded mulaw 8kHz mono chunks.
 * We decode them and stream raw binary to Deepgram's live transcription API.
 * Deepgram returns transcript events; we fire callbacks on interim and final results.
 */

import {
  createClient,
  LiveTranscriptionEvents,
  type LiveClient,
} from "@deepgram/sdk";

export interface DeepgramSTT {
  sendAudio(base64MulawChunk: string): void;
  close(): void;
}

export interface DeepgramCallbacks {
  onInterim(transcript: string): void;
  onFinal(transcript: string): void;
  onError(err: Error): void;
}

export function createDeepgramSTT(callbacks: DeepgramCallbacks): DeepgramSTT {
  const apiKey = process.env["DEEPGRAM_API_KEY"];
  if (!apiKey) throw new Error("DEEPGRAM_API_KEY is not set");

  const client = createClient(apiKey);

  const connection: LiveClient = client.listen.live({
    model: "nova-2",
    encoding: "mulaw",
    sample_rate: 8000,
    channels: 1,
    endpointing: 500,      // ms of silence to mark end of utterance
    interim_results: true, // fire callbacks for partial results (barge-in detection)
    utterance_end_ms: 1000,
    smart_format: true,
    no_delay: true,        // minimise Deepgram internal buffering
  });

  connection.on(LiveTranscriptionEvents.Open, () => {
    // Ready to receive audio
  });

  connection.on(LiveTranscriptionEvents.Transcript, (data) => {
    const alt = data.channel?.alternatives?.[0];
    const transcript: string = alt?.transcript ?? "";
    if (!transcript) return;

    if (data.is_final && data.speech_final) {
      callbacks.onFinal(transcript);
    } else {
      callbacks.onInterim(transcript);
    }
  });

  connection.on(LiveTranscriptionEvents.Error, (err: unknown) => {
    callbacks.onError(err instanceof Error ? err : new Error(String(err)));
  });

  return {
    sendAudio(base64MulawChunk: string) {
      const buffer = Buffer.from(base64MulawChunk, "base64");
      // Deepgram live client accepts Buffer directly
      connection.send(buffer);
    },

    close() {
      try {
        connection.requestClose();
      } catch {
        // ignore close errors
      }
    },
  };
}
