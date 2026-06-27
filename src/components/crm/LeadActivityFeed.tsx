import { useEffect, useRef, useState } from "react";
import { Activity } from "lucide-react";
import { makeActivity, relTime, seedActivity, type ActivityEntry } from "../../lib/lead-gen-demo";

const MAX = 14;

export function LeadActivityFeed() {
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [, force] = useState(0);
  const newestId = useRef<string | null>(null);

  // Seed + schedule new entries every 4-6s (client only, avoids SSR mismatch).
  useEffect(() => {
    setEntries(seedActivity(5));
    let timer: ReturnType<typeof setTimeout>;
    const loop = () => {
      const delay = 4000 + Math.random() * 2000;
      timer = setTimeout(() => {
        const e = makeActivity();
        newestId.current = e.id;
        setEntries((prev) => [e, ...prev].slice(0, MAX));
        loop();
      }, delay);
    };
    loop();
    return () => clearTimeout(timer);
  }, []);

  // Re-render every second so relative timestamps age.
  useEffect(() => {
    const id = setInterval(() => force((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="dark cc-card flex h-full flex-col rounded-2xl p-5 text-foreground">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-success/15 text-success">
            <Activity className="h-4 w-4" />
          </span>
          <h3 className="font-display text-sm font-bold">Lead Agent · Live Activity</h3>
        </div>
        <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-success">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
          </span>
          Live
        </span>
      </div>

      <ul className="flex-1 space-y-1.5 overflow-hidden">
        {entries.map((e) => (
          <li
            key={e.id}
            className={`flex items-start justify-between gap-3 rounded-lg px-3 py-2 text-xs transition-colors ${
              e.id === newestId.current ? "bg-success/10" : "bg-white/[0.02]"
            }`}
          >
            <span className="leading-snug text-foreground/90">{e.text}</span>
            <span className="shrink-0 whitespace-nowrap text-[10px] font-medium text-muted-foreground">
              {relTime(e.ts)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
