import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { leadsQuery } from "../../lib/queries";
import { supabase } from "../../integrations/supabase/client";
import { PageHeader, StatusBadge } from "../../components/crm/Primitives";
import { relativeTime } from "../../lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/_auth/leads")({
  head: () => ({ meta: [{ title: "Leads | USTDTS CRM" }] }),
  component: Leads,
});

const statuses = ["new", "contacted", "qualified", "enrolled", "lost"];

function Leads() {
  const leads = useQuery(leadsQuery);
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    const channel = supabase
      .channel("leads-page")
      .on("postgres_changes", { event: "*", schema: "public", table: "leads" }, () => {
        qc.invalidateQueries({ queryKey: ["leads"] });
        toast.info("Leads updated");
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);

  async function setStatus(id: string, status: string) {
    const { error } = await supabase.from("leads").update({ status }).eq("id", id);
    if (error) toast.error(error.message);
    else qc.invalidateQueries({ queryKey: ["leads"] });
  }

  const rows = (leads.data ?? []).filter((l) => {
    const matchesQ = `${l.full_name} ${l.email} ${l.program ?? ""}`.toLowerCase().includes(q.toLowerCase());
    const matchesF = filter === "all" || l.status === filter;
    return matchesQ && matchesF;
  });

  return (
    <div>
      <PageHeader title="Leads" subtitle="Inbound applications from the website, updated in real time." />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-56">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search leads…"
            className="w-full rounded-lg border border-input bg-background py-2.5 pl-9 pr-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
          />
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none">
          <option value="all">All statuses</option>
          {statuses.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Contact</th>
                <th className="px-4 py-3 font-semibold">Program</th>
                <th className="px-4 py-3 font-semibold">Score</th>
                <th className="px-4 py-3 font-semibold">Received</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((l) => (
                <tr key={l.id} className="border-b border-border/60 last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium text-foreground">{l.full_name}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <div>{l.email}</div>
                    {l.phone && <div className="text-xs">{l.phone}</div>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{l.program ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-foreground">{l.score}</span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{relativeTime(l.created_at)}</td>
                  <td className="px-4 py-3">
                    <select
                      value={l.status}
                      onChange={(e) => setStatus(l.id, e.target.value)}
                      className="rounded-md border border-input bg-background px-2 py-1 text-xs capitalize outline-none"
                    >
                      {statuses.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">No leads match your filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
