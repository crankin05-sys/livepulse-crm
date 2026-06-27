import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Users, GraduationCap, MapPin, Building2, TrendingUp, DollarSign } from "lucide-react";
import { leadsQuery, studentsQuery, vehiclesQuery, carriersQuery, placementsQuery } from "../../lib/queries";
import { supabase } from "../../integrations/supabase/client";
import { PageHeader, StatCard, StatusBadge } from "../../components/crm/Primitives";
import { relativeTime } from "../../lib/format";

export const Route = createFileRoute("/_auth/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard | USTDTS CRM" }] }),
  component: Dashboard,
});

function Dashboard() {
  const leads = useQuery(leadsQuery);
  const students = useQuery(studentsQuery);
  const vehicles = useQuery(vehiclesQuery);
  const carriers = useQuery(carriersQuery);
  const placements = useQuery(placementsQuery);

  // realtime: refetch leads on insert
  useEffect(() => {
    const channel = supabase
      .channel("dash-leads")
      .on("postgres_changes", { event: "*", schema: "public", table: "leads" }, () => {
        leads.refetch();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [leads]);

  const leadData = leads.data ?? [];
  const studentData = students.data ?? [];
  const newLeads = leadData.filter((l) => l.status === "new").length;
  const activeStudents = studentData.filter((s) => ["active", "enrolled"].includes(s.status)).length;
  const driving = (vehicles.data ?? []).filter((v) => v.status === "driving").length;
  const openings = (carriers.data ?? []).reduce((sum, c) => sum + (c.openings ?? 0), 0);
  const placedCount = (placements.data ?? []).length;
  const avgProgress = studentData.length
    ? Math.round(studentData.reduce((s, x) => s + (x.progress_pct ?? 0), 0) / studentData.length)
    : 0;

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Real-time overview of admissions, training, and placement." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard icon={Users} label="New leads" value={newLeads} hint={`${leadData.length} total in pipeline`} tone="accent" />
        <StatCard icon={GraduationCap} label="Active students" value={activeStudents} hint={`${avgProgress}% avg. progress`} />
        <StatCard icon={MapPin} label="Trucks driving now" value={driving} hint={`${(vehicles.data ?? []).length} units tracked`} tone="success" />
        <StatCard icon={Building2} label="Open carrier seats" value={openings} tone="accent" />
        <StatCard icon={TrendingUp} label="Total placements" value={placedCount} tone="success" />
        <StatCard icon={DollarSign} label="Carrier partners" value={(carriers.data ?? []).length} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-foreground">Latest leads</h2>
            <span className="flex items-center gap-1.5 text-xs font-medium text-success">
              <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" /><span className="relative inline-flex h-2 w-2 rounded-full bg-success" /></span>
              Live
            </span>
          </div>
          <div className="space-y-2">
            {leadData.slice(0, 6).map((l) => (
              <div key={l.id} className="flex items-center justify-between gap-3 rounded-lg border border-border/60 px-3 py-2.5">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-foreground">{l.full_name}</div>
                  <div className="truncate text-xs text-muted-foreground">{l.program ?? "—"} · {relativeTime(l.created_at)}</div>
                </div>
                <StatusBadge status={l.status} />
              </div>
            ))}
            {leadData.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No leads yet.</p>}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <h2 className="mb-4 font-display text-lg font-bold text-foreground">Training progress</h2>
          <div className="space-y-3">
            {studentData.slice(0, 6).map((s) => (
              <div key={s.id}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="truncate font-medium text-foreground">{s.full_name}</span>
                  <span className="text-muted-foreground">{s.progress_pct ?? 0}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-accent" style={{ width: `${s.progress_pct ?? 0}%` }} />
                </div>
              </div>
            ))}
            {studentData.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No students yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
