// Streams ChatGPT-style PCM speech from /api/speech and plays it through the
// Web Audio API as chunks arrive. Returns a controller you can stop, plus
// hooks to drive a speaking animation.

export type SpeechController = {
  stop: () => void;
  done: Promise<void>;
};

export async function streamSpeech(
  text: string,
  opts: {
    voice?: string;
    onStart?: () => void;
    onEnd?: () => void;
    onLevel?: (level: number) => void;
    signal?: AbortSignal;
  } = {},
): Promise<SpeechController> {
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new AudioCtx({ sampleRate: 24000 });
  if (ctx.state === "suspended") await ctx.resume().catch(() => {});

  let playhead = 0;
  let pending = new Uint8Array(0);
  let stopped = false;
  let started = false;
  const sources = new Set<AudioBufferSourceNode>();
  let resolveDone: () => void = () => {};
  const done = new Promise<void>((r) => (resolveDone = r));

  const finish = () => {
    if (stopped) return;
    stopped = true;
    sources.forEach((s) => {
      try {
        s.stop();
      } catch {
        /* noop */
      }
    });
    sources.clear();
    ctx.close().catch(() => {});
    opts.onLevel?.(0);
    opts.onEnd?.();
    resolveDone();
  };

  const playChunk = (incoming: Uint8Array) => {
    if (stopped) return;
    const bytes = new Uint8Array(pending.length + incoming.length);
    bytes.set(pending);
    bytes.set(incoming, pending.length);
    const usable = bytes.length - (bytes.length % 2);
    pending = bytes.slice(usable);
    if (usable === 0) return;

    const samples = new Int16Array(bytes.buffer, 0, usable / 2);
    const floats = new Float32Array(samples.length);
    let peak = 0;
    for (let i = 0; i < samples.length; i++) {
      const v = samples[i] / 32768;
      floats[i] = v;
      const a = Math.abs(v);
      if (a > peak) peak = a;
    }
    opts.onLevel?.(Math.min(1, peak * 1.6));

    const buffer = ctx.createBuffer(1, floats.length, 24000);
    buffer.copyToChannel(floats, 0);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    if (playhead === 0) playhead = ctx.currentTime + 0.06;
    else playhead = Math.max(playhead, ctx.currentTime);
    source.start(playhead);
    playhead += buffer.duration;
    sources.add(source);
    source.onended = () => sources.delete(source);

    if (!started) {
      started = true;
      opts.onStart?.();
    }
  };

  (async () => {
    try {
      const res = await fetch("/api/speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voice: opts.voice }),
        signal: opts.signal,
      });
      if (!res.ok || !res.body) throw new Error(`TTS ${res.status}`);

      const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
      let buf = "";
      while (true) {
        const { value, done: rdone } = await reader.read();
        if (rdone || stopped) break;
        buf += value;
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const payload = trimmed.slice(5).trim();
          if (!payload || payload === "[DONE]") continue;
          let evt: { type?: string; audio?: string };
          try {
            evt = JSON.parse(payload);
          } catch {
            continue;
          }
          if (evt.type === "speech.audio.delta" && evt.audio) {
            const bin = atob(evt.audio);
            const out = new Uint8Array(bin.length);
            for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
            playChunk(out);
          }
        }
      }
      // let the final scheduled audio play out
      const remaining = Math.max(0, (playhead - ctx.currentTime) * 1000);
      setTimeout(finish, remaining + 120);
    } catch {
      finish();
    }
  })();

  return {
    stop: finish,
    done,
  };
}
