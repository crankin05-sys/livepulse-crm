import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Phone, Mail, MapPin, Clock, CheckCircle2 } from "lucide-react";
import { SiteLayout } from "../components/site/SiteLayout";
import { Button } from "../components/ui/button";
import { supabase } from "../integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Apply Now & Contact | U.S. Truck Driver Training School" },
      { name: "description", content: "Apply for CDL training or get in touch with admissions. An advisor will reach out within one business day." },
      { property: "og:title", content: "Apply Now & Contact Admissions" },
      { property: "og:description", content: "Start your CDL application today." },
    ],
  }),
  component: Contact,
});

const programs = ["Class A CDL", "Class B CDL", "Third-Party Skills Exam", "Not sure yet"];

function Contact() {
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", program: programs[0], message: "" });

  function update(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.full_name.trim() || !form.email.trim()) {
      toast.error("Please enter your name and email.");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("leads").insert({
      full_name: form.full_name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || null,
      program: form.program,
      message: form.message.trim() || null,
      source: "website",
      status: "new",
    });
    setSubmitting(false);
    if (error) {
      toast.error("Something went wrong. Please try again or call us.");
      return;
    }
    setDone(true);
    toast.success("Application received! We'll be in touch shortly.");
  }

  return (
    <SiteLayout>
      <section className="bg-hero-gradient">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <h1 className="font-display text-4xl font-extrabold text-primary-foreground sm:text-5xl">Apply Now</h1>
          <p className="mt-4 max-w-2xl text-lg text-primary-foreground/80">
            Take the first step toward your new career. Fill out the form and an admissions advisor will reach out within one business day.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-5">
          <div className="lg:col-span-3">
            {done ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card p-12 text-center shadow-card">
                <CheckCircle2 className="h-14 w-14 text-success" />
                <h2 className="mt-5 font-display text-2xl font-bold text-foreground">You're all set!</h2>
                <p className="mt-2 max-w-md text-muted-foreground">
                  Thanks, {form.full_name.split(" ")[0]}. Your application is in our system and an advisor will contact you within one business day.
                </p>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="rounded-2xl border border-border bg-card p-7 shadow-card sm:p-8">
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Full name *">
                    <input className={inputCls} value={form.full_name} onChange={(e) => update("full_name", e.target.value)} placeholder="Jordan Smith" required />
                  </Field>
                  <Field label="Email *">
                    <input type="email" className={inputCls} value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="you@email.com" required />
                  </Field>
                  <Field label="Phone">
                    <input type="tel" className={inputCls} value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="(555) 123-4567" />
                  </Field>
                  <Field label="Program of interest">
                    <select className={inputCls} value={form.program} onChange={(e) => update("program", e.target.value)}>
                      {programs.map((p) => <option key={p}>{p}</option>)}
                    </select>
                  </Field>
                </div>
                <div className="mt-5">
                  <Field label="Message (optional)">
                    <textarea className={`${inputCls} min-h-28 resize-y`} value={form.message} onChange={(e) => update("message", e.target.value)} placeholder="Tell us about your goals, schedule, or questions." />
                  </Field>
                </div>
                <Button type="submit" size="lg" variant="accent" className="mt-6 w-full" disabled={submitting}>
                  {submitting ? "Submitting…" : "Submit Application"}
                </Button>
                <p className="mt-3 text-center text-xs text-muted-foreground">
                  By submitting, you agree to be contacted by our admissions team.
                </p>
              </form>
            )}
          </div>

          <div className="lg:col-span-2">
            <div className="rounded-2xl bg-primary p-7 text-primary-foreground shadow-elevated">
              <h2 className="font-display text-xl font-bold">Contact admissions</h2>
              <ul className="mt-6 space-y-5 text-sm">
                <li className="flex items-start gap-3"><Phone className="mt-0.5 h-5 w-5 text-accent" /><div><div className="font-semibold">Call us</div><div className="text-primary-foreground/70">(800) 555-1234</div></div></li>
                <li className="flex items-start gap-3"><Mail className="mt-0.5 h-5 w-5 text-accent" /><div><div className="font-semibold">Email</div><div className="text-primary-foreground/70">admissions@ustdts.edu</div></div></li>
                <li className="flex items-start gap-3"><MapPin className="mt-0.5 h-5 w-5 text-accent" /><div><div className="font-semibold">Visit</div><div className="text-primary-foreground/70">1234 Freight Way, Chicago, IL 60601</div></div></li>
                <li className="flex items-start gap-3"><Clock className="mt-0.5 h-5 w-5 text-accent" /><div><div className="font-semibold">Hours</div><div className="text-primary-foreground/70">Mon–Fri 8am–6pm · Sat 9am–2pm</div></div></li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}

const inputCls =
  "w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm text-foreground shadow-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-foreground">{label}</span>
      {children}
    </label>
  );
}
