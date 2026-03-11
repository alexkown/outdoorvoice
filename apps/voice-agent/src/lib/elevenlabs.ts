/**
 * ElevenLabs streaming TTS wrapper.
 *
 * We use the `ulaw_8000` output format so ElevenLabs returns raw mulaw
 * audio at 8kHz — the exact format Twilio's Media Streams expects.
 * No client-side audio conversion needed.
 *
 * We use `eleven_turbo_v2_5` (lowest latency model) to stay under
 * our 800ms response latency target.
 */

export const ELEVENLABS_VOICES = {
  rachel: {
    id: "21m00Tcm4TlvDq8ikWAM",
    name: "Rachel",
    description: "Calm and professional",
  },
  josh: {
    id: "TxGEqnHWrfWFTfGW9XjX",
    name: "Josh",
    description: "Friendly and conversational",
  },
  bella: {
    id: "EXAVITQu4vr4xnSDxMaL",
    name: "Bella",
    description: "Warm and natural",
  },
} as const;

export type ElevenLabsVoiceKey = keyof typeof ELEVENLABS_VOICES;

export const DEFAULT_VOICE_ID = ELEVENLABS_VOICES.rachel.id;

/**
 * Streams TTS audio from ElevenLabs.
 * Yields base64-encoded mulaw 8kHz chunks suitable for sending to Twilio.
 */
export async function* streamTTS(
  text: string,
  voiceId: string = DEFAULT_VOICE_ID
): AsyncGenerator<string> {
  const apiKey = process.env["ELEVENLABS_API_KEY"];
  if (!apiKey) throw new Error("ELEVENLABS_API_KEY is not set");

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/basic", // mulaw
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_turbo_v2_5",
        output_format: "ulaw_8000",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0,
          use_speaker_boost: true,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`ElevenLabs TTS failed (${response.status}): ${error}`);
  }

  if (!response.body) throw new Error("ElevenLabs returned no body");

  const reader = response.body.getReader();
  const CHUNK_SIZE = 640; // 80ms of mulaw at 8kHz (8000 samples/s × 0.08s)
  let leftover = Buffer.alloc(0);

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      // Flush any remaining bytes
      if (leftover.length > 0) {
        yield leftover.toString("base64");
      }
      break;
    }

    // Accumulate and emit in fixed-size chunks so Twilio plays smoothly
    let combined = Buffer.concat([leftover, Buffer.from(value)]);
    while (combined.length >= CHUNK_SIZE) {
      yield combined.subarray(0, CHUNK_SIZE).toString("base64");
      combined = combined.subarray(CHUNK_SIZE);
    }
    leftover = combined;
  }
}

/**
 * Convenience: collect all TTS audio into a single base64 string.
 * Use only for short utterances where latency isn't critical.
 */
export async function synthesizeTTS(
  text: string,
  voiceId: string = DEFAULT_VOICE_ID
): Promise<string> {
  const chunks: string[] = [];
  for await (const chunk of streamTTS(text, voiceId)) {
    chunks.push(chunk);
  }
  return chunks.join("");
}
