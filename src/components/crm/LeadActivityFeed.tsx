import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Activity } from "lucide-react";
import { leadsQuery } from "../../lib/queries";
import { buildLeadActivity } from "../../lib/dashboard-metrics";
import { supabase } from "../../integrations/supabase/client";
import { relativeTime } from "../../lib/format";

export function LeadActivityFeed() {
  const leads = useQuery(leadsQuery);
  const qc = useQueryClient();
  const [, force] = useState(0);

  useEffect(() => {
    const channel = supabase
      .channel("activity-feed-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "leads" }, () => {
        qc.invalidateQueries({ queryKey: ["leads"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);

  // Re-render every 30s so relative timestamps stay fresh.
  useEffect(() => {
    const id = setInterval(() => force((n) => n + 1), 30000);
    return () => clearInterval(id);
  }, []);

  const entries = buildLeadActivity(leads.data ?? []);
  const live = entries.length > 0;

  return (
    <div className="dark cc-card flex h-full flex-col rounded-2xl p-5 text-foreground">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-success/15 text-success">
            <Activity className="h-4 w-4" />
          </span>
          <h3 className="font-display text-sm font-bold">Live Lead Activity</h3>
        </div>
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
          {live ? "Live" : "Idle"}
        </span>
      </div>

      <ul className="flex-1 space-y-1.5 overflow-hidden">
        {entries.map((e) => (
          <li
            key={e.id}
            className="flex items-start justify-between gap-3 rounded-lg bg-white/[0.02] px-3 py-2 text-xs"
          >
            <span className="leading-snug text-foreground/90">{e.text}</span>
            <span className="shrink-0 whitespace-nowrap text-[10px] font-medium text-muted-foreground">
              {relativeTime(new Date(e.ts).toISOString())}
            </span>
          </li>
        ))}
        {entries.length === 0 && (
          <li className="px-3 py-6 text-center text-xs text-muted-foreground">
            No lead activity yet — new inbound leads will appear here in real time.
          </li>
        )}
      </ul>
    </div>
  );
}
