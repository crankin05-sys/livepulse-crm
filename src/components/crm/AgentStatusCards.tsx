import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bot, Send, Target, GraduationCap } from "lucide-react";
import { leadsQuery, studentsQuery } from "../../lib/queries";
import { buildAgentStats, type LiveAgentStat } from "../../lib/dashboard-metrics";
import { supabase } from "../../integrations/supabase/client";

const ICONS: Record<string, typeof Bot> = {
  leadgen: Bot,
  outreach: Send,
  qualifier: Target,
  booking: GraduationCap,
};

function AgentCard({ agent }: { agent: LiveAgentStat }) {
  const Icon = ICONS[agent.key] ?? Bot;
  const live = agent.active;

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
            live ? "text-success" : "text-muted-foreground"
          }`}
        >
          <span className="relative flex h-2 w-2">
            {live && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
            )}
            <span
              className={`relative inline-flex h-2 w-2 rounded-full ${live ? "bg-success" : "bg-muted-foreground"}`}
            />
          </span>
          {live ? "Active" : "Idle"}
        </span>
      </div>
      <div className="mt-3 font-display text-sm font-bold text-foreground">{agent.name}</div>
      <p className="mt-0.5 text-xs text-muted-foreground">{agent.caption}</p>
      <div className="mt-3 flex items-baseline gap-1.5">
        <span className="font-display text-2xl font-bold text-foreground tabular-nums">{agent.count}</span>
        <span className="text-xs text-muted-foreground">{agent.unit}</span>
      </div>
    </div>
  );
}

export function AgentStatusCards() {
  const leads = useQuery(leadsQuery);
  const students = useQuery(studentsQuery);
  const qc = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("agent-cards-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "leads" }, () => {
        qc.invalidateQueries({ queryKey: ["leads"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "students" }, () => {
        qc.invalidateQueries({ queryKey: ["students"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);

  const agents = buildAgentStats(leads.data ?? [], students.data ?? []);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {agents.map((a) => (
        <AgentCard key={a.key} agent={a} />
      ))}
    </div>
  );
}
