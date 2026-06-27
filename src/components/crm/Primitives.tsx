import type { LucideIcon } from "lucide-react";

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  tone = "primary",
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  hint?: string;
  tone?: "primary" | "accent" | "success";
}) {
  const toneCls =
    tone === "accent"
      ? "bg-accent/15 text-accent-foreground"
      : tone === "success"
      ? "bg-success/15 text-success"
      : "bg-primary/10 text-primary";
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-center justify-between">
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${toneCls}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <div className="mt-4 font-display text-3xl font-bold text-foreground">{value}</div>
      <div className="mt-1 text-sm text-muted-foreground">{label}</div>
      {hint && <div className="mt-2 text-xs font-medium text-success">{hint}</div>}
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    new: "bg-info/15 text-info",
    contacted: "bg-accent/15 text-accent-foreground",
    qualified: "bg-success/15 text-success",
    enrolled: "bg-success/15 text-success",
    active: "bg-success/15 text-success",
    lost: "bg-destructive/10 text-destructive",
    graduated: "bg-primary/10 text-primary",
    placed: "bg-success/15 text-success",
    paused: "bg-muted text-muted-foreground",
    pending: "bg-accent/15 text-accent-foreground",
    paid: "bg-success/15 text-success",
    overdue: "bg-destructive/10 text-destructive",
  };
  const cls = map[status?.toLowerCase()] ?? "bg-muted text-muted-foreground";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${cls}`}>
      {status}
    </span>
  );
}
