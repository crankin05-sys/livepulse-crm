import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import {
  Mic,
  
  Send,
  Loader2,
  Volume2,
  VolumeX,
  Square,
  Sparkles,
} from "lucide-react";
import { Button } from "../ui/button";
import { streamSpeech, type SpeechController } from "../../lib/speak";

const SUGGESTIONS = [
  "Give me my briefing",
  "Who's missing paperwork?",
  "Which lead should I call right now?",
  "Pause the SMS reactivation campaign",
];

type ToolPart = {
  type: string;
  toolName?: string;
  state?: string;
  input?: unknown;
  output?: unknown;
};

function TOOL_LABEL(name?: string): string {
  const map: Record<string, string> = {
    get_executive_brief: "Reading live KPIs",
    list_missing_paperwork: "Auditing student paperwork",
    list_campaigns: "Pulling campaign performance",
    pause_campaign: "Pausing campaign",
    launch_campaign: "Launching campaign",
    list_hot_leads: "Ranking hottest leads",
  };
  return name ? (map[name] ?? name.replace(/_/g, " ")) : "Working";
}

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error?: string }) => void) | null;
};

function getRecognition(): SpeechRecognitionLike | null {
  const w = window as unknown as {
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    SpeechRecognition?: new () => SpeechRecognitionLike;
  };
  const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
  return Ctor ? new Ctor() : null;
}

function textOf(parts: { type: string; text?: string }[]): string {
  return parts
    .filter((p) => p.type === "text" && p.text)
    .map((p) => p.text as string)
    .join(" ")
    .trim();
}

export function AuraExecutive({ context }: { context: string }) {
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const [voiceOn, setVoiceOn] = useState(true);
  const [speaking, setSpeaking] = useState(false);
  const [level, setLevel] = useState(0);
  const [micError, setMicError] = useState<string | null>(null);
  const recogRef = useRef<SpeechRecognitionLike | null>(null);
  const speechRef = useRef<SpeechController | null>(null);
  const voiceOnRef = useRef(voiceOn);
  const contextRef = useRef(context);
  voiceOnRef.current = voiceOn;
  contextRef.current = context;

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/executive-chat" }),
    onFinish: ({ message }) => {
      if (!voiceOnRef.current) return;
      const text = textOf(message.parts as { type: string; text?: string }[]);
      if (text) speak(text);
    },
  });
  const busy = status === "submitted" || status === "streaming";

  function stopSpeaking() {
    speechRef.current?.stop();
    speechRef.current = null;
    setSpeaking(false);
    setLevel(0);
  }

  async function speak(text: string) {
    stopSpeaking();
    speechRef.current = await streamSpeech(text, {
      voice: "alloy",
      onStart: () => setSpeaking(true),
      onLevel: (l) => setLevel(l),
      onEnd: () => {
        setSpeaking(false);
        setLevel(0);
      },
    });
  }

  function submit(text: string) {
    const value = text.trim();
    if (!value || busy) return;
    stopSpeaking();
    sendMessage({ text: value }, { body: { context: contextRef.current } });
    setInput("");
  }

  async function toggleMic() {
    if (listening) {
      recogRef.current?.stop();
      return;
    }
    const recog = getRecognition();
    if (!recog) {
      setMicError("Voice input needs Chrome, Edge, or Safari.");
      return;
    }
    // Explicitly request mic permission so the browser shows the prompt
    // and we can give a clear message if it's blocked.
    try {
      if (navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((t) => t.stop());
      }
    } catch {
      setMicError("Mic blocked. Allow microphone access in your browser, then try again.");
      return;
    }
    setMicError(null);
    recog.lang = "en-US";
    recog.continuous = false;
    recog.interimResults = false;
    recog.onresult = (e) => {
      const transcript = e.results[0]?.[0]?.transcript ?? "";
      if (transcript) submit(transcript);
    };
    recog.onend = () => setListening(false);
    recog.onerror = (e) => {
      setListening(false);
      if (e?.error === "not-allowed" || e?.error === "service-not-allowed") {
        setMicError("Mic blocked. Allow microphone access in your browser, then try again.");
      } else if (e?.error === "no-speech") {
        setMicError("Didn't catch that — tap the mic and speak again.");
      } else if (e?.error && e.error !== "aborted") {
        setMicError("Voice input hit an error. Try again.");
      }
    };
    recogRef.current = recog;
    setListening(true);
    stopSpeaking();
    try {
      recog.start();
    } catch {
      setListening(false);
    }
  }


  useEffect(() => {
    return () => {
      speechRef.current?.stop();
      recogRef.current?.stop();
    };
  }, []);

  const status_label = speaking
    ? "Speaking…"
    : listening
      ? "Listening…"
      : busy
        ? "Thinking…"
        : "Online";

  return (
    <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary via-primary to-[oklch(0.22_0.06_265)] p-px shadow-card">
      <div className="relative rounded-[calc(1.5rem-1px)] bg-gradient-to-br from-[oklch(0.16_0.03_262)] to-[oklch(0.21_0.05_265)] p-5 text-white">
        {/* glow grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(white 1px,transparent 1px),linear-gradient(90deg,white 1px,transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        <div className="relative flex items-center gap-4">
          <AuraOrb speaking={speaking} listening={listening} level={level} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="font-display text-lg font-bold">Aura · Executive AI</h2>
              <Sparkles className="h-4 w-4 text-[oklch(0.79_0.16_66)]" />
            </div>
            <p className="flex items-center gap-1.5 text-xs text-white/70">
              <span
                className={`h-1.5 w-1.5 rounded-full ${speaking || listening ? "bg-[oklch(0.79_0.16_66)]" : "bg-[oklch(0.66_0.14_152)]"} ${busy || speaking || listening ? "animate-pulse" : ""}`}
              />
              {status_label} · ChatGPT-grade voice
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                setVoiceOn((v) => !v);
                if (voiceOn) stopSpeaking();
              }}
              title={voiceOn ? "Mute voice" : "Enable voice"}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-white/80 transition-colors hover:bg-white/10"
            >
              {voiceOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </button>
            {speaking && (
              <button
                onClick={stopSpeaking}
                title="Stop speaking"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-white/80 transition-colors hover:bg-white/10"
              >
                <Square className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* conversation */}
        <div className="relative mt-4 max-h-64 space-y-3 overflow-y-auto pr-1">
          {messages.length === 0 ? (
            <div className="rounded-2xl rounded-tl-sm bg-white/5 px-4 py-3 text-sm text-white/85">
              Good to see you, Tyler. Ask me anything — I'll read the numbers and tell you
              the single move that matters most. Tap a prompt or hit the mic.
            </div>
          ) : (
            messages.map((m) => {
              const text = textOf(m.parts as { type: string; text?: string }[]);
              if (!text) return null;
              const mine = m.role === "user";
              return (
                <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm ${
                      mine
                        ? "rounded-br-sm bg-[oklch(0.79_0.16_66)] text-[oklch(0.27_0.05_70)]"
                        : "rounded-tl-sm bg-white/8 text-white/90"
                    }`}
                  >
                    {text}
                  </div>
                </div>
              );
            })
          )}
          {status === "submitted" && (
            <div className="flex items-center gap-2 text-xs text-white/60">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Aura is analyzing…
            </div>
          )}
        </div>

        {messages.length === 0 && (
          <div className="relative mt-3 flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => submit(s)}
                className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/80 transition-colors hover:border-[oklch(0.79_0.16_66)]/50 hover:bg-white/10"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit(input);
          }}
          className="relative mt-4 flex items-center gap-2"
        >
          <button
            type="button"
            onClick={toggleMic}
            title="Talk to Aura"
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors ${
              listening
                ? "border-[oklch(0.79_0.16_66)] bg-[oklch(0.79_0.16_66)] text-[oklch(0.27_0.05_70)]"
                : "border-white/15 bg-white/5 text-white/80 hover:bg-white/10"
            }`}
          >
            <Mic className={`h-4 w-4 ${listening ? "animate-pulse" : ""}`} />
            <span className="sr-only">{listening ? "Stop listening" : "Talk to Aura"}</span>
          </button>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Aura about revenue, leads, pipeline…"
            className="h-10 flex-1 rounded-xl border border-white/15 bg-white/5 px-3 text-sm text-white outline-none placeholder:text-white/40 focus:border-[oklch(0.79_0.16_66)]/60"
          />
          <Button
            type="submit"
            size="icon"
            disabled={busy || !input.trim()}
            className="h-10 w-10 rounded-xl bg-[oklch(0.79_0.16_66)] text-[oklch(0.27_0.05_70)] hover:bg-[oklch(0.79_0.16_66)]/90"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>

        <p className="relative mt-2 text-[11px] text-white/45">
          {micError ? (
            <span className="text-[oklch(0.79_0.16_66)]">{micError}</span>
          ) : (
            <>Tap the mic and talk — Aura listens, then replies out loud.</>
          )}
        </p>
      </div>

    </div>
  );
}

function AuraOrb({
  speaking,
  listening,
  level,
}: {
  speaking: boolean;
  listening: boolean;
  level: number;
}) {
  const scale = 1 + (speaking ? level * 0.35 : 0);
  const active = speaking || listening;
  return (
    <div className="relative flex h-14 w-14 shrink-0 items-center justify-center">
      <div
        className={`absolute inset-0 rounded-full bg-[oklch(0.79_0.16_66)] blur-md transition-opacity ${active ? "opacity-70" : "opacity-30"}`}
        style={{ transform: `scale(${1 + level * 0.5})` }}
      />
      <div
        className="relative h-12 w-12 rounded-full bg-gradient-to-br from-[oklch(0.85_0.16_70)] via-[oklch(0.72_0.16_55)] to-[oklch(0.6_0.13_240)] transition-transform duration-75"
        style={{ transform: `scale(${scale})` }}
      >
        <div className="absolute inset-1.5 rounded-full bg-[oklch(0.16_0.03_262)]/40 backdrop-blur-sm" />
        <div
          className={`absolute inset-0 rounded-full border-2 border-white/40 ${active ? "animate-ping" : ""}`}
        />
        {/* equalizer */}
        <div className="absolute inset-0 flex items-center justify-center gap-0.5">
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className="w-1 rounded-full bg-white/90"
              style={{
                height: speaking
                  ? `${6 + level * 16 * (0.5 + ((i % 2) ? 0.8 : 0.4))}px`
                  : "6px",
                transition: "height 80ms ease",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
