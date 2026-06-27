import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { Truck, Gauge, MapPin, Navigation } from "lucide-react";
import { vehiclesQuery, type Vehicle } from "../../lib/queries";
import { supabase } from "../../integrations/supabase/client";
import { PageHeader, StatCard } from "../../components/crm/Primitives";
import { relativeTime } from "../../lib/format";

export const Route = createFileRoute("/_app/fleet")({
  head: () => ({ meta: [{ title: "Live Fleet | USTDTS CRM" }] }),
  component: Fleet,
});

// Midwest bounding box (roughly around Chicago region)
const BOUNDS = { minLat: 40.5, maxLat: 43.0, minLng: -89.5, maxLng: -86.5 };

function project(lat: number, lng: number) {
  const x = ((lng - BOUNDS.minLng) / (BOUNDS.maxLng - BOUNDS.minLng)) * 100;
  const y = ((BOUNDS.maxLat - lat) / (BOUNDS.maxLat - BOUNDS.minLat)) * 100;
  return { x: Math.max(2, Math.min(98, x)), y: Math.max(3, Math.min(97, y)) };
}

const statusColor: Record<string, string> = {
  driving: "bg-success",
  idle: "bg-accent",
  maintenance: "bg-destructive",
  offline: "bg-muted-foreground",
};

function Fleet() {
  const vehicles = useQuery(vehiclesQuery);
  const qc = useQueryClient();
  const [selected, setSelected] = useState<string | null>(null);
  // local simulated positions for smooth motion overlay
  const [sim, setSim] = useState<Record<string, { lat: number; lng: number; heading: number }>>({});
  const headings = useRef<Record<string, number>>({});

  useEffect(() => {
    const channel = supabase
      .channel("fleet")
      .on("postgres_changes", { event: "*", schema: "public", table: "vehicles" }, () => {
        qc.invalidateQueries({ queryKey: ["vehicles"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);

  // gentle client-side drift for driving trucks (visual demo only)
  useEffect(() => {
    const data = vehicles.data;
    if (!data) return;
    const id = setInterval(() => {
      setSim((prev) => {
        const next = { ...prev };
        for (const v of data) {
          if (v.status !== "driving") continue;
          const cur = next[v.id] ?? { lat: v.lat, lng: v.lng, heading: headings.current[v.id] ?? Math.random() * 360 };
          if (headings.current[v.id] === undefined) headings.current[v.id] = cur.heading;
          headings.current[v.id] += (Math.random() - 0.5) * 25;
          const rad = (headings.current[v.id] * Math.PI) / 180;
          const step = 0.012;
          let lat = cur.lat + Math.cos(rad) * step;
          let lng = cur.lng + Math.sin(rad) * step;
          lat = Math.max(BOUNDS.minLat, Math.min(BOUNDS.maxLat, lat));
          lng = Math.max(BOUNDS.minLng, Math.min(BOUNDS.maxLng, lng));
          next[v.id] = { lat, lng, heading: headings.current[v.id] };
        }
        return next;
      });
    }, 2000);
    return () => clearInterval(id);
  }, [vehicles.data]);

  const data = vehicles.data ?? [];
  const driving = data.filter((v) => v.status === "driving").length;
  const idle = data.filter((v) => v.status === "idle").length;
  const avgSpeed = useMemo(() => {
    const d = data.filter((v) => v.status === "driving");
    return d.length ? Math.round(d.reduce((s, v) => s + v.speed, 0) / d.length) : 0;
  }, [data]);

  function pos(v: Vehicle) {
    const s = sim[v.id];
    return project(s?.lat ?? v.lat, s?.lng ?? v.lng);
  }

  return (
    <div>
      <PageHeader title="Live Fleet Tracking" subtitle="Real-time GPS positions of training and road vehicles." />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Truck} label="Total units" value={data.length} />
        <StatCard icon={Navigation} label="Driving now" value={driving} tone="success" />
        <StatCard icon={MapPin} label="Idle" value={idle} tone="accent" />
        <StatCard icon={Gauge} label="Avg. speed (mph)" value={avgSpeed} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Map */}
        <div className="lg:col-span-2">
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border bg-sidebar shadow-card">
            {/* grid */}
            <svg className="absolute inset-0 h-full w-full opacity-30" preserveAspectRatio="none">
              {Array.from({ length: 11 }).map((_, i) => (
                <line key={`v${i}`} x1={`${i * 10}%`} y1="0" x2={`${i * 10}%`} y2="100%" stroke="oklch(0.5 0.05 260)" strokeWidth="0.5" />
              ))}
              {Array.from({ length: 9 }).map((_, i) => (
                <line key={`h${i}`} x1="0" y1={`${i * 12.5}%`} x2="100%" y2={`${i * 12.5}%`} stroke="oklch(0.5 0.05 260)" strokeWidth="0.5" />
              ))}
            </svg>
            {/* faux highways */}
            <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
              <path d="M 10 80 Q 40 50 90 20" fill="none" stroke="oklch(0.79 0.16 66 / 0.35)" strokeWidth="2" />
              <path d="M 5 30 Q 50 45 95 75" fill="none" stroke="oklch(0.79 0.16 66 / 0.25)" strokeWidth="2" />
            </svg>

            <div className="absolute left-3 top-3 rounded-md bg-background/80 px-2.5 py-1 text-xs font-medium text-foreground backdrop-blur">
              Chicago / Midwest region
            </div>

            {data.map((v) => {
              const p = pos(v);
              const active = selected === v.id;
              return (
                <button
                  key={v.id}
                  onClick={() => setSelected(active ? null : v.id)}
                  className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-1000 ease-linear"
                  style={{ left: `${p.x}%`, top: `${p.y}%` }}
                  title={`${v.unit_number} · ${v.driver_name ?? ""}`}
                >
                  <span className="relative flex items-center justify-center">
                    {v.status === "driving" && (
                      <span className={`absolute inline-flex h-7 w-7 animate-ping rounded-full ${statusColor[v.status]} opacity-40`} />
                    )}
                    <span className={`relative flex h-7 w-7 items-center justify-center rounded-full ring-2 ring-background ${statusColor[v.status] ?? "bg-muted-foreground"} ${active ? "scale-125" : ""} transition-transform`}>
                      <Truck className="h-3.5 w-3.5 text-white" />
                    </span>
                  </span>
                  {active && (
                    <span className="absolute left-1/2 top-9 z-10 w-40 -translate-x-1/2 rounded-lg border border-border bg-card p-2.5 text-left text-xs shadow-elevated">
                      <span className="block font-semibold text-foreground">{v.unit_number}</span>
                      <span className="block text-muted-foreground">{v.driver_name ?? "Unassigned"}</span>
                      <span className="block text-muted-foreground">{v.speed} mph · {v.status}</span>
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
            {Object.entries(statusColor).map(([k, c]) => (
              <span key={k} className="flex items-center gap-1.5 capitalize"><span className={`h-2.5 w-2.5 rounded-full ${c}`} /> {k}</span>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
          <h2 className="mb-3 font-display text-lg font-bold text-foreground">Units</h2>
          <div className="space-y-2 max-h-[28rem] overflow-y-auto pr-1">
            {data.map((v) => (
              <button
                key={v.id}
                onClick={() => setSelected(selected === v.id ? null : v.id)}
                className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors ${
                  selected === v.id ? "border-accent bg-accent/10" : "border-border/60 hover:bg-muted/40"
                }`}
              >
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${statusColor[v.status] ?? "bg-muted-foreground"}`}>
                  <Truck className="h-4 w-4 text-white" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="truncate text-sm font-semibold text-foreground">{v.unit_number}</span>
                    <span className="text-xs font-medium capitalize text-muted-foreground">{v.status}</span>
                  </div>
                  <div className="truncate text-xs text-muted-foreground">
                    {v.driver_name ?? "Unassigned"} · {v.speed} mph
                  </div>
                  <div className="truncate text-[11px] text-muted-foreground/70">
                    {v.location_name ?? "—"} · {relativeTime(v.updated_at)}
                  </div>
                </div>
              </button>
            ))}
            {data.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No vehicles tracked.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
