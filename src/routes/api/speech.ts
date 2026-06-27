import { createFileRoute } from "@tanstack/react-router";

type SpeechBody = { text?: unknown; voice?: unknown };

// Streams natural ChatGPT-style speech via Lovable AI (OpenAI-compatible TTS).
// Returns raw SSE (speech.audio.delta / speech.audio.done) so the browser can
// play PCM chunks as they arrive.
export const Route = createFileRoute("/api/speech")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { text, voice } = (await request.json()) as SpeechBody;
        if (typeof text !== "string" || !text.trim()) {
          return new Response("Text is required", { status: 400 });
        }

        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const input = text.slice(0, 1200);

        const upstream = await fetch("https://ai.gateway.lovable.dev/v1/audio/speech", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "openai/gpt-4o-mini-tts",
            input,
            voice: typeof voice === "string" && voice ? voice : "alloy",
            instructions:
              "You are Aura, a confident, warm executive AI assistant. Speak clearly and naturally with an upbeat, professional tone, like a sharp chief-of-staff briefing a CEO.",
            stream_format: "sse",
            response_format: "pcm",
          }),
        });

        if (!upstream.ok) {
          const detail = await upstream.text().catch(() => "");
          return new Response(`TTS failed: ${upstream.status} ${detail}`, {
            status: upstream.status,
          });
        }

        return new Response(upstream.body, {
          headers: { "Content-Type": "text/event-stream" },
        });
      },
    },
  },
});
