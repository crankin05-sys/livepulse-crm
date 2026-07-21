import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import {
  CalendarClock,
  ArrowLeft,
  Radio,
  Phone,
  MapPin,
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  Loader2,
  Plus,
  Calendar as CalendarIcon,
} from "lucide-react";
import { appointmentsQuery, leadsQuery, type Appointment } from "../../lib/queries";
import { supabase } from "../../integrations/supabase/client";
import {
  bookAppointment,
  updateAppointmentStatus,
  APPT_STATUS_LABEL,
  APPT_TYPE_LABEL,
  type ApptStatus,
  type ApptType,
} from "../../lib/appointments.functions";
import { relativeTime } from "../../lib/format";
import { Button } from "../../components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/agents/appointment")({
  head: () => ({ meta: [{ title: "Appointment AI Agent | USTDTS CRM" }] }),
  component: AppointmentAgentPage,
});

const STATUS_TONE: Record<ApptStatus, string> = {
  scheduled: "bg-info/15 text-info",
  confirmed: "bg-success/15 text-success",
  completed: "bg-primary/15 text-primary",
  no_show: "bg-warning/15 text-warning",
  cancelled: "bg-muted text-muted-foreground",
};

const TYPE_ICON: Record<ApptType, typeof Phone> = {
  phone_call: Phone,
  campus_tour: MapPin,
  skills_exam: ClipboardCheck,
};

function fmtWhen(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    timeZone: "America/Detroit",
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function fmtDay(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    timeZone: "America/Detroit",
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

function AppointmentAgentPage() {
  const apptQ = useQuery(appointmentsQuery);
  const leadsQ = useQuery(leadsQuery);
  const qc = useQueryClient();
  const bookFn = useServerFn(bookAppointment);
  const updateFn = useServerFn(updateAppointmentStatus);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    email: "",
    program: "Class A CDL",
    appt_type: "phone_call" as ApptType,
    date: "",
    time: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const channel = supabase
      .channel("appointments-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "appointments" },
        () => qc.invalidateQueries({ queryKey: ["appointments"] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);

  const appointments = apptQ.data ?? [];
  const leads = leadsQ.data ?? [];

  const now = Date.now();
  const upcoming = useMemo(
    () =>
      appointments
        .filter((a) => new Date(a.scheduled_at).getTime() >= now && a.status !== "cancelled")
        .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at)),
    [appointments, now],
  );
  const past = useMemo(
    () =>
      appointments
        .filter((a) => new Date(a.scheduled_at).getTime() < now)
        .sort((a, b) => b.scheduled_at.localeCompare(a.scheduled_at))
        .slice(0, 12),
    [appointments, now],
  );

  const today = new Date();
  const todayKey = today.toDateString();
  const todayCount = upcoming.filter(
    (a) => new Date(a.scheduled_at).toDateString() === todayKey,
  ).length;

  const stats = useMemo(() => {
    const scheduled = appointments.filter((a) => a.status === "scheduled").length;
    const confirmed = appointments.filter((a) => a.status === "confirmed").length;
    const completed = appointments.filter((a) => a.status === "completed").length;
    const noShow = appointments.filter((a) => a.status === "no_show").length;
    const aiBooked = appointments.filter((a) => a.source === "ai_agent").length;
    const showRate =
      completed + noShow > 0 ? Math.round((completed / (completed + noShow)) * 100) : 0;
    return { scheduled, confirmed, completed, noShow, aiBooked, showRate };
  }, [appointments]);

  const groupedUpcoming = useMemo(() => {
    const groups: Record<string, Appointment[]> = {};
    for (const a of upcoming) {
      const key = fmtDay(a.scheduled_at);
      (groups[key] ??= []).push(a);
    }
    return Object.entries(groups);
  }, [upcoming]);

  const hotLeadsWithoutAppt = useMemo(() => {
    const bookedLeadIds = new Set(appointments.map((a) => a.lead_id).filter(Boolean) as string[]);
    return leads
      .filter((l) => (l.score ?? 0) >= 75 && !bookedLeadIds.has(l.id))
      .slice(0, 6);
  }, [leads, appointments]);

  async function setStatus(id: string, status: ApptStatus) {
    setBusyId(id);
    try {
      await updateFn({ data: { id, status } });
      toast.success(`Marked ${APPT_STATUS_LABEL[status]}`);
      await qc.invalidateQueries({ queryKey: ["appointments"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusyId(null);
    }
  }

  async function submitBook(e: React.FormEvent) {
    e.preventDefault();
    if (!form.full_name || !form.phone || !form.date || !form.time) {
      toast.error("Name, phone, date, and time are required.");
      return;
    }
    const iso = new Date(`${form.date}T${form.time}:00`).toISOString();
    setSaving(true);
    try {
      await bookFn({
        data: {
          full_name: form.full_name,
          phone: form.phone,
          email: form.email || null,
          program: form.program || null,
          appt_type: form.appt_type,
          scheduled_at: iso,
          duration_minutes: form.appt_type === "campus_tour" ? 45 : 20,
          notes: form.notes || null,
          source: "staff_manual",
        },
      });
      toast.success("Appointment booked.");
      setShowForm(false);
      setForm({
        full_name: "",
        phone: "",
        email: "",
        program: "Class A CDL",
        appt_type: "phone_call",
        date: "",
        time: "",
        notes: "",
      });
      await qc.invalidateQueries({ queryKey: ["appointments"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Booking failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="dark cc-shell -m-4 min-h-screen rounded-none p-4 text-foreground lg:-m-8 lg:p-8">
      <div className="space-y-6 pb-10">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Control Center
        </Link>

        <div className="cc-card-glow rounded-3xl p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-info/15 text-info">
                <CalendarClock className="h-7 w-7" />
              </span>
              <div>
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-success">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
                  </span>
                  Active · Writing to public.appointments in real time
                </div>
                <h1 className="mt-1 font-display text-2xl font-bold">Appointment AI</h1>
                <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                  When a prospect asks Stephanie (site chat) or Aura (CRM) for a callback or campus
                  tour, this agent parses their preferred time, creates a lead record, and inserts
                  a real appointment row on the school calendar. Staff can confirm, complete, or
                  mark no-show below.
                </p>
              </div>
            </div>
            <Button onClick={() => setShowForm((s) => !s)} className="gap-2">
              <Plus className="h-4 w-4" /> {showForm ? "Cancel" : "Book manually"}
            </Button>
          </div>
        </div>

        {/* Stats */}
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <StatCard label="Today" value={todayCount} tone="text-info" />
          <StatCard label="Scheduled" value={stats.scheduled} />
          <StatCard label="Confirmed" value={stats.confirmed} tone="text-success" />
          <StatCard label="Completed" value={stats.completed} tone="text-primary" />
          <StatCard label="No-shows" value={stats.noShow} tone="text-warning" />
          <StatCard label="Show rate" value={`${stats.showRate}%`} tone="text-success" />
        </section>

        {/* Manual booking form */}
        {showForm && (
          <form onSubmit={submitBook} className="cc-card rounded-2xl p-5">
            <h2 className="mb-3 font-display text-sm font-bold">New appointment</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Full name">
                <input
                  required
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  className="cc-input"
                />
              </Field>
              <Field label="Phone">
                <input
                  required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="cc-input"
                />
              </Field>
              <Field label="Email (optional)">
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="cc-input"
                />
              </Field>
              <Field label="Program">
                <select
                  value={form.program}
                  onChange={(e) => setForm({ ...form, program: e.target.value })}
                  className="cc-input"
                >
                  <option>Class A CDL</option>
                  <option>Class B CDL</option>
                  <option>Third-Party Skills Exam</option>
                  <option>Undecided</option>
                </select>
              </Field>
              <Field label="Type">
                <select
                  value={form.appt_type}
                  onChange={(e) =>
                    setForm({ ...form, appt_type: e.target.value as ApptType })
                  }
                  className="cc-input"
                >
                  <option value="phone_call">Phone call</option>
                  <option value="campus_tour">Campus tour</option>
                  <option value="skills_exam">Skills exam</option>
                </select>
              </Field>
              <Field label="Date">
                <input
                  type="date"
                  required
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="cc-input"
                />
              </Field>
              <Field label="Time (ET)">
                <input
                  type="time"
                  required
                  value={form.time}
                  onChange={(e) => setForm({ ...form, time: e.target.value })}
                  className="cc-input"
                />
              </Field>
              <Field label="Notes" className="sm:col-span-2">
                <input
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="cc-input"
                />
              </Field>
            </div>
            <div className="mt-4">
              <Button type="submit" disabled={saving} className="gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarIcon className="h-4 w-4" />}
                Book appointment
              </Button>
            </div>
          </form>
        )}

        {/* Upcoming schedule */}
        <section className="grid gap-4 lg:grid-cols-3">
          <div className="cc-card rounded-2xl p-5 lg:col-span-2">
            <div className="mb-3 flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-info" />
              <h2 className="font-display text-sm font-bold">Upcoming schedule</h2>
              <span className="ml-auto flex items-center gap-1.5 text-[10px] font-bold uppercase text-success">
                <Radio className="h-3 w-3 animate-pulse" /> Live from DB
              </span>
            </div>
            {groupedUpcoming.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No upcoming appointments. Book one manually or let the AI agent create them from
                the site chat.
              </p>
            ) : (
              <div className="space-y-4">
                {groupedUpcoming.map(([day, items]) => (
                  <div key={day}>
                    <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      {day}
                    </div>
                    <ul className="space-y-2">
                      {items.map((a) => (
                        <AppointmentRow
                          key={a.id}
                          appt={a}
                          busy={busyId === a.id}
                          onStatus={(s) => setStatus(a.id, s)}
                        />
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Hot leads waiting to book */}
          <div className="cc-card rounded-2xl p-5">
            <div className="mb-3 flex items-center gap-2">
              <Phone className="h-4 w-4 text-warning" />
              <h2 className="font-display text-sm font-bold">Hot leads to book</h2>
            </div>
            {hotLeadsWithoutAppt.length === 0 ? (
              <p className="text-xs text-muted-foreground">Every hot lead has an appointment.</p>
            ) : (
              <ul className="space-y-2">
                {hotLeadsWithoutAppt.map((l) => (
                  <li
                    key={l.id}
                    className="rounded-lg border border-border/50 bg-background/40 p-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-xs font-medium text-foreground">
                          {l.full_name}
                        </div>
                        <div className="truncate text-[10px] text-muted-foreground">
                          {l.phone ?? "—"} · score {l.score ?? 0}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-7 gap-1 px-2 text-[10px]"
                        onClick={() => {
                          setForm({
                            ...form,
                            full_name: l.full_name,
                            phone: l.phone ?? "",
                            email: l.email ?? "",
                            program: l.program ?? "Class A CDL",
                          });
                          setShowForm(true);
                        }}
                      >
                        <Plus className="h-3 w-3" /> Book
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* Past */}
        <div className="cc-card rounded-2xl p-5">
          <h2 className="mb-3 font-display text-sm font-bold">Recent history</h2>
          {past.length === 0 ? (
            <p className="text-xs text-muted-foreground">No past appointments yet.</p>
          ) : (
            <ul className="space-y-2">
              {past.map((a) => {
                const Icon = TYPE_ICON[a.appt_type as ApptType] ?? Phone;
                return (
                  <li
                    key={a.id}
                    className="flex items-center gap-3 rounded-lg border border-border/50 bg-background/40 p-2.5"
                  >
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${STATUS_TONE[a.status as ApptStatus] ?? "bg-muted"}`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-medium">{a.full_name}</div>
                      <div className="truncate text-[10px] text-muted-foreground">
                        {APPT_TYPE_LABEL[a.appt_type as ApptType] ?? a.appt_type} ·{" "}
                        {fmtWhen(a.scheduled_at)}
                      </div>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${STATUS_TONE[a.status as ApptStatus] ?? "bg-muted text-muted-foreground"}`}
                    >
                      {APPT_STATUS_LABEL[a.status as ApptStatus] ?? a.status}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {relativeTime(a.created_at)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* How it works */}
        <div className="cc-card rounded-2xl p-5">
          <h2 className="mb-3 font-display text-sm font-bold">How this agent works</h2>
          <ol className="space-y-2 text-xs text-muted-foreground">
            <li>
              <span className="font-bold text-foreground">1. Signal.</span> A prospect asks
              Stephanie on the public site (or Aura in the CRM) for a call or a tour.
            </li>
            <li>
              <span className="font-bold text-foreground">2. Parse.</span> The AI extracts name,
              phone, program, and a preferred time — converting phrases like "tomorrow at 3" into
              an ISO timestamp in America/Detroit.
            </li>
            <li>
              <span className="font-bold text-foreground">3. Write.</span> A row is inserted into
              <code className="mx-1 rounded bg-muted px-1 text-[10px]">public.leads</code>
              and a matching row into
              <code className="mx-1 rounded bg-muted px-1 text-[10px]">public.appointments</code>
              via the Supabase Data API.
            </li>
            <li>
              <span className="font-bold text-foreground">4. Notify.</span> Realtime pushes the
              new row into this page and the dashboard queue instantly.
            </li>
            <li>
              <span className="font-bold text-foreground">5. Close the loop.</span> Staff confirm,
              complete, or mark no-show — those actions write back through a protected server
              function.
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone?: string;
}) {
  return (
    <div className="cc-card rounded-2xl p-4">
      <div className="text-[11px] font-bold uppercase text-muted-foreground">{label}</div>
      <div className={`mt-1 font-display text-2xl font-bold tabular-nums ${tone ?? "text-foreground"}`}>
        {value}
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className ?? ""}`}>
      <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      {children}
    </label>
  );
}

function AppointmentRow({
  appt,
  busy,
  onStatus,
}: {
  appt: Appointment;
  busy: boolean;
  onStatus: (s: ApptStatus) => void;
}) {
  const Icon = TYPE_ICON[appt.appt_type as ApptType] ?? Phone;
  const status = appt.status as ApptStatus;
  return (
    <li className="flex flex-wrap items-center gap-3 rounded-lg border border-border/50 bg-background/40 p-3">
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${STATUS_TONE[status] ?? "bg-muted"}`}
      >
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-foreground">{appt.full_name}</span>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${STATUS_TONE[status] ?? "bg-muted text-muted-foreground"}`}
          >
            {APPT_STATUS_LABEL[status] ?? appt.status}
          </span>
          {appt.source === "ai_agent" && (
            <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-bold uppercase text-accent-foreground">
              AI booked
            </span>
          )}
        </div>
        <div className="mt-0.5 text-[11px] text-muted-foreground">
          {APPT_TYPE_LABEL[appt.appt_type as ApptType] ?? appt.appt_type} ·{" "}
          {fmtWhen(appt.scheduled_at)} · {appt.duration_minutes}m · {appt.phone}
          {appt.program ? ` · ${appt.program}` : ""}
        </div>
        {appt.notes && (
          <div className="mt-1 text-[11px] italic text-muted-foreground">"{appt.notes}"</div>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {status !== "confirmed" && status !== "completed" && (
          <Button
            size="sm"
            variant="secondary"
            className="h-7 gap-1 px-2 text-[10px]"
            disabled={busy}
            onClick={() => onStatus("confirmed")}
          >
            <CheckCircle2 className="h-3 w-3" /> Confirm
          </Button>
        )}
        {status !== "completed" && (
          <Button
            size="sm"
            className="h-7 gap-1 px-2 text-[10px]"
            disabled={busy}
            onClick={() => onStatus("completed")}
          >
            <CheckCircle2 className="h-3 w-3" /> Complete
          </Button>
        )}
        {status !== "no_show" && status !== "completed" && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 gap-1 px-2 text-[10px]"
            disabled={busy}
            onClick={() => onStatus("no_show")}
          >
            <XCircle className="h-3 w-3" /> No-show
          </Button>
        )}
      </div>
    </li>
  );
}
