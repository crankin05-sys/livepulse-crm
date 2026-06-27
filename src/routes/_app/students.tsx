import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search } from "lucide-react";
import { studentsQuery } from "../../lib/queries";
import { PageHeader, StatusBadge } from "../../components/crm/Primitives";
import { dateShort, initials } from "../../lib/format";

export const Route = createFileRoute("/_app/students")({
  head: () => ({ meta: [{ title: "Students | USTDTS CRM" }] }),
  component: Students,
});

function Students() {
  const students = useQuery(studentsQuery);
  const [q, setQ] = useState("");

  const rows = (students.data ?? []).filter((s) =>
    `${s.full_name} ${s.program} ${s.cohort ?? ""} ${s.instructor_name ?? ""}`.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div>
      <PageHeader title="Students" subtitle="Enrolled trainees and their progress toward certification." />

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search students…"
          className="w-full rounded-lg border border-input bg-background py-2.5 pl-9 pr-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {rows.map((s) => (
          <div key={s.id} className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {initials(s.full_name)}
                </span>
                <div>
                  <div className="font-semibold text-foreground">{s.full_name}</div>
                  <div className="text-xs text-muted-foreground">{s.program}</div>
                </div>
              </div>
              <StatusBadge status={s.status} />
            </div>

            <div className="mt-4">
              <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                <span>Progress</span>
                <span className="font-semibold text-foreground">{s.progress_pct ?? 0}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-accent" style={{ width: `${s.progress_pct ?? 0}%` }} />
              </div>
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-y-2 text-xs">
              <dt className="text-muted-foreground">Hours</dt>
              <dd className="text-right font-medium text-foreground">{s.hours_completed}/{s.hours_required}</dd>
              <dt className="text-muted-foreground">Cohort</dt>
              <dd className="text-right font-medium text-foreground">{s.cohort ?? "—"}</dd>
              <dt className="text-muted-foreground">Instructor</dt>
              <dd className="text-right font-medium text-foreground">{s.instructor_name ?? "—"}</dd>
              <dt className="text-muted-foreground">Enrolled</dt>
              <dd className="text-right font-medium text-foreground">{dateShort(s.enrollment_date)}</dd>
            </dl>
          </div>
        ))}
        {rows.length === 0 && (
          <p className="col-span-full py-10 text-center text-muted-foreground">No students found.</p>
        )}
      </div>
    </div>
  );
}
