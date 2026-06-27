import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Building2, MapPin, Briefcase } from "lucide-react";
import { carriersQuery, placementsQuery } from "../../lib/queries";
import { PageHeader, StatCard } from "../../components/crm/Primitives";
import { currency } from "../../lib/format";

export const Route = createFileRoute("/_auth/carriers")({
  head: () => ({ meta: [{ title: "Carriers | USTDTS CRM" }] }),
  component: Carriers,
});

function Carriers() {
  const carriers = useQuery(carriersQuery);
  const placements = useQuery(placementsQuery);

  const rows = carriers.data ?? [];
  const totalOpenings = rows.reduce((s, c) => s + (c.openings ?? 0), 0);
  const hiring = rows.filter((c) => c.hiring).length;

  return (
    <div>
      <PageHeader title="Carrier Partners" subtitle="Hiring partners and graduate placement opportunities." />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard icon={Building2} label="Carrier partners" value={rows.length} />
        <StatCard icon={Briefcase} label="Open seats" value={totalOpenings} tone="accent" />
        <StatCard icon={MapPin} label="Active placements" value={(placements.data ?? []).length} tone="success" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {rows.map((c) => (
          <div key={c.id} className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <Building2 className="h-5 w-5" />
                </span>
                <div>
                  <div className="font-semibold text-foreground">{c.name}</div>
                  <div className="text-xs text-muted-foreground">{c.locations ?? "Nationwide"}</div>
                </div>
              </div>
              {c.hiring ? (
                <span className="inline-flex items-center rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-semibold text-success">Hiring</span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">Paused</span>
              )}
            </div>
            <div className="mt-4 flex items-center justify-between rounded-xl bg-muted/40 px-4 py-3">
              <div>
                <div className="font-display text-xl font-bold text-foreground">{c.openings}</div>
                <div className="text-xs text-muted-foreground">open seats</div>
              </div>
              <div className="text-right">
                <div className="font-display text-xl font-bold text-foreground">{currency(c.avg_salary)}</div>
                <div className="text-xs text-muted-foreground">avg. salary</div>
              </div>
            </div>
          </div>
        ))}
        {rows.length === 0 && <p className="col-span-full py-10 text-center text-muted-foreground">No carriers yet.</p>}
      </div>
    </div>
  );
}
