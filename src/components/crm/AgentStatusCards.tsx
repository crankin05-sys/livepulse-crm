import { useEffect, useState } from "react";
import { Bot, Send, Target, CalendarClock } from "lucide-react";
import { AGENTS, type AgentStat } from "../../lib/lead-gen-demo";

const ICONS: Record<string, typeof Bot> = {
  leadgen: Bot,
  outreach: Send,
  qualifier: Target,
  booking: CalendarClock,
};

function AgentCard({ agent }: { agent: AgentStat }) {
  const Icon = ICONS[agent.key] ?? Bot;
  const live = agent.status === "Active";
  const [count, setCount] = useState(agent.base);

  useEffect(() => {
    if (!live || agent.tickMax === 0) return;
    const id = setInterval(
      () => setCount((c) => c + Math.floor(Math.random() * (agent.tickMax + 1))),
      3500 + Math.random() * 2500,
    );
    return () => clearInterval(id);
  }, [live, agent.tickMax]);

  return (
    <div className={`dark rounded-2xl p-5 text-foreground ${live ? "cc-card-glow" : "cc-card"}`}>
      <div className="flex items-center justify-between">
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${
            live ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"
          }`}
        >
          <Icon className="h-5 w-5" />
        </span>
        <span
          className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide ${
            live ? "text-success" : "text-warning"
          }`}
        >
          <span className="relative flex h-2 w-2">
            {live && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
            )}
            <span
              className={`relative inline-flex h-2 w-2 rounded-full ${live ? "bg-success" : "bg-warning"}`}
            />
          </span>
          {agent.status}
        </span>
      </div>
      <div className="mt-3 font-display text-sm font-bold text-foreground">{agent.name}</div>
      <p className="mt-0.5 text-xs text-muted-foreground">{agent.caption}</p>
      {agent.base > 0 ? (
        <div className="mt-3 flex items-baseline gap-1.5">
          <span className="font-display text-2xl font-bold text-foreground tabular-nums">{count}</span>
          <span className="text-xs text-muted-foreground">{agent.unit}</span>
        </div>
      ) : (
        <div className="mt-3 text-xs font-medium text-muted-foreground">Awaiting handoff</div>
      )}
    </div>
  );
}

export function AgentStatusCards() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {AGENTS.map((a) => (
        <AgentCard key={a.key} agent={a} />
      ))}
    </div>
  );
}
