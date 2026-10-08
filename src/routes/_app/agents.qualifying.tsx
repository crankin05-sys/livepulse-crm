import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { ArrowLeft, ShieldCheck, Loader2, OctagonX, AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { leadsQuery, type Lead } from "../../lib/queries";
import { qualifyLead } from "../../lib/qualifying-ai.functions";
import { QUESTIONS, TUITION, scoreQualification, type QualAnswers, type QualResult } from "../../lib/qualification";
import { Button } from "../../components/ui/button";

export const Route = createFileRoute("/_app/agents/qualifying")({
  head: () => ({ meta: [{ title: "Qualifying AI Agent | USTDTS CRM" }] }),
  component: QualifyingPage,
});

type QLead = Lead & { qualification_status?: string | null; qualification_score?: number | null; qualification_notes?: string | null };

const DEFAULTS: QualAnswers = {
  age: 25, michigan_resident: true, valid_license: true, license_years: 3, dui_last_2y: false,
  can_pass_dot: true, english_ok: true, funding: "unsure", monthly_budget: 300, savings: 500,
  start_timeline: "30d", schedule_ok: true, motivation: "career",
};

const STATUS_STYLE: Record<string, string> = {
  qualified: "bg-success/15 text-success border-success/30",
  conditional: "bg-warning/15 text-warning border-warning/30",
  disqualified: "bg-destructive/15 text-destructive border-destructive/30",
};

function QualifyingPage() {
  const leadsQ = useQuery(leadsQuery);
  const qc = useQueryClient();
  const run = useServerFn(qualifyLead);
  const leads = (leadsQ.data ?? []) as QLead[];
  const [selected, setSelected] = useState<string | null>(null);
  const [answers, setAnswers] = useState<QualAnswers>(DEFAULTS);
  const [saving, setSaving] = useState(false);
  const preview: QualResult = useMemo(() => scoreQualification(answers), [answers]);

  const queue = leads.filter((l) => !l.qualification_status && !["enrolled", "rejected", "lost"].includes(l.status));
  const counts = {
    qualified: leads.filter((l) => l.qualification_status === "qualified").length,
    conditional: leads.filter((l) => l.qualification_status === "conditional").length,
    disqualified: leads.filter((l) => l.qualification_status === "disqualified").length,
  };
  const lead = leads.find((l) => l.id === selected);

  const set = <K extends keyof QualAnswers>(k: K, v: QualAnswers[K]) => setAnswers((a) => ({ ...a, [k]: v }));

  async function submit() {
    if (!lead) return;
    setSaving(true);
    try {
      const r = await run({ data: { id: lead.id, answers } });
      toast.success(`${lead.full_name}: ${r.status.toUpperCase()} (${r.score}/100)`);
      qc.invalidateQueries({ queryKey: ["leads"] });
      setSelected(null);
      setAnswers(DEFAULTS);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  const yesNo = (k: keyof QualAnswers) => (
    <div className="flex gap-2">
      {[true, false].map((v) => (
        <button key={String(v)} type="button" onClick={() => set(k, v as never)}
          className={`rounded-md border px-3 py-1 text-xs font-semibold ${answers[k] === v ? "border-accent bg-accent text-accent-foreground" : "border-border text-muted-foreground"}`}>
          {v ? "Yes" : "No"}
        </button>
      ))}
    </div>
  );
  const select = (k: keyof QualAnswers, opts: [string, string][]) => (
    <select value={String(answers[k])} onChange={(e) => set(k, e.target.value as never)}
      className="rounded-md border border-border bg-background px-2 py-1 text-sm">
      {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  );
  const num = (k: keyof QualAnswers) => (
    <input type="number" min={0} value={Number(answers[k])} onChange={(e) => set(k, Number(e.target.value) as never)}
      className="w-28 rounded-md border border-border bg-background px-2 py-1 text-sm" />
  );

  const control: Record<keyof QualAnswers, React.ReactNode> = {
    age: num("age"), michigan_resident: yesNo("michigan_resident"), valid_license: yesNo("valid_license"),
    license_years: num("license_years"), dui_last_2y: yesNo("dui_last_2y"), can_pass_dot: yesNo("can_pass_dot"),
    english_ok: yesNo("english_ok"),
    funding: select("funding", [["gi_bill", "GI Bill / VA"], ["wioa", "WIOA grant"], ["employer", "Employer sponsor"], ["financing", "Payment plan / loan"], ["cash", "Cash"], ["unsure", "Not sure"]]),
    monthly_budget: num("monthly_budget"), savings: num("savings"),
    start_timeline: select("start_timeline", [["now", "Right away"], ["30d", "Within 30 days"], ["90d", "Within 90 days"], ["later", "Later / unsure"]]),
    schedule_ok: yesNo("schedule_ok"),
    motivation: select("motivation", [["career", "Long-term career"], ["money", "Better pay"], ["exploring", "Just exploring"]]),
  };

  return (
    <div className="space-y-6">
      <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Dashboard
      </Link>
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-accent-foreground"><ShieldCheck className="h-5 w-5" /></span>
        <div>
          <h1 className="font-display text-2xl font-bold">Qualifying AI</h1>
          <p className="text-sm text-muted-foreground">Screens every new lead for eligibility and affordability (${TUITION.toLocaleString()} tuition) before an advisor spends time.</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        {[["Waiting to qualify", queue.length, ""], ["Qualified", counts.qualified, "text-success"], ["Conditional", counts.conditional, "text-warning"], ["Stopped", counts.disqualified, "text-destructive"]].map(([l, v, c]) => (
          <div key={l as string} className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs uppercase text-muted-foreground">{l}</p>
            <p className={`text-2xl font-bold ${c}`}>{v}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="mb-3 font-semibold">Qualification queue</h2>
          <div className="max-h-[560px] space-y-1 overflow-y-auto">
            {queue.length === 0 && <p className="text-sm text-muted-foreground">Everyone has been screened.</p>}
            {queue.map((l) => (
              <button key={l.id} onClick={() => { setSelected(l.id); setAnswers(DEFAULTS); }}
                className={`w-full rounded-lg px-3 py-2 text-left text-sm ${selected === l.id ? "bg-accent/15" : "hover:bg-secondary"}`}>
                <p className="font-medium">{l.full_name}</p>
                <p className="text-xs text-muted-foreground">{l.program ?? "Undecided"} · {l.source}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          {!lead ? (
            <p className="text-sm text-muted-foreground">Pick a lead from the queue to run the qualifying interview.</p>
          ) : (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold">Interview: {lead.full_name}</h2>
                <span className={`rounded-full border px-3 py-1 text-xs font-bold uppercase ${STATUS_STYLE[preview.status]}`}>
                  {preview.status} · {preview.score}/100
                </span>
              </div>
              <div className="divide-y divide-border">
                {QUESTIONS.map((q, i) => (
                  <div key={q.key} className="flex flex-wrap items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{i + 1}. {q.q}</p>
                      <p className="text-xs text-muted-foreground">{q.why}</p>
                    </div>
                    {control[q.key]}
                  </div>
                ))}
              </div>
              {preview.stops.length > 0 && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm">
                  <p className="mb-1 flex items-center gap-1 font-semibold text-destructive"><OctagonX className="h-4 w-4" /> Stop — hard knockout</p>
                  {preview.stops.map((s) => <p key={s}>• {s}</p>)}
                </div>
              )}
              {preview.flags.length > 0 && (
                <div className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm">
                  <p className="mb-1 flex items-center gap-1 font-semibold text-warning"><AlertTriangle className="h-4 w-4" /> Flags to resolve</p>
                  {preview.flags.map((s) => <p key={s}>• {s}</p>)}
                </div>
              )}
              <div className="rounded-lg border border-border bg-secondary/50 p-3 text-sm">
                <p className="flex items-center gap-1 font-semibold"><CheckCircle2 className="h-4 w-4 text-success" /> Affordability: {preview.affordability.replace("_", " ")}</p>
                <p className="mt-1 text-muted-foreground">Next step: {preview.next_step}</p>
              </div>
              <Button onClick={submit} disabled={saving} className="w-full">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save qualification to CRM"}
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <h2 className="mb-3 font-semibold">Recently screened</h2>
        <div className="space-y-2">
          {leads.filter((l) => l.qualification_status).slice(0, 15).map((l) => (
            <div key={l.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2 text-sm">
              <span className="font-medium">{l.full_name}</span>
              <span className="flex-1 truncate px-2 text-xs text-muted-foreground">{l.qualification_notes}</span>
              <span className={`rounded-full border px-2 py-0.5 text-xs font-bold uppercase ${STATUS_STYLE[l.qualification_status ?? ""] ?? ""}`}>
                {l.qualification_status} · {l.qualification_score}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
