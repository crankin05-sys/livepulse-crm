import { createFileRoute, Link } from "@tanstack/react-router";
import { Briefcase, TrendingUp, Building2, Handshake, ArrowRight } from "lucide-react";
import { SiteLayout } from "../components/site/SiteLayout";
import { Button } from "../components/ui/button";

export const Route = createFileRoute("/careers")({
  head: () => ({
    meta: [
      { title: "Career Services & Job Placement | U.S. Truck Driver Training School" },
      { name: "description", content: "94% job-placement rate. We partner with 40+ national and regional carriers to get our graduates hired fast." },
      { property: "og:title", content: "Career Services & Job Placement" },
      { property: "og:description", content: "Get hired with our 40+ carrier partners and lifetime career support." },
    ],
  }),
  component: Careers,
});

const carriers = ["Schneider National", "Werner Enterprises", "J.B. Hunt", "US Xpress", "Old Dominion", "Roehl Transport", "Knight-Swift", "Prime Inc."];

const benefits = [
  { icon: Handshake, title: "Pre-hire agreements", desc: "Interview with carriers before graduation and walk out with a job offer in hand." },
  { icon: TrendingUp, title: "Career advancement", desc: "From entry-level OTR to owner-operator — we help you plan the whole journey." },
  { icon: Building2, title: "Local & national routes", desc: "Find the schedule that fits your life: regional, local, or over-the-road." },
  { icon: Briefcase, title: "Lifetime support", desc: "Need a new role years from now? Our career team is always here for alumni." },
];

function Careers() {
  return (
    <SiteLayout>
      <section className="bg-hero-gradient">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <h1 className="font-display text-4xl font-extrabold text-primary-foreground sm:text-5xl">Career Services</h1>
          <p className="mt-4 max-w-2xl text-lg text-primary-foreground/80">
            Training is only half the journey. Our dedicated career team makes sure you finish with a job — not just a license.
          </p>
          <div className="mt-8 flex flex-wrap gap-8">
            <div><div className="font-display text-4xl font-bold text-accent">94%</div><div className="text-sm text-primary-foreground/70">Placement rate</div></div>
            <div><div className="font-display text-4xl font-bold text-accent">40+</div><div className="text-sm text-primary-foreground/70">Carrier partners</div></div>
            <div><div className="font-display text-4xl font-bold text-accent">$62k</div><div className="text-sm text-primary-foreground/70">Avg. first-year pay</div></div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-6 sm:grid-cols-2">
          {benefits.map((b) => (
            <div key={b.title} className="flex gap-4 rounded-2xl border border-border bg-card p-7 shadow-card">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent-foreground">
                <b.icon className="h-6 w-6 text-accent-foreground" />
              </span>
              <div>
                <h3 className="text-lg font-bold text-foreground">{b.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{b.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-secondary py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center font-display text-2xl font-bold text-foreground sm:text-3xl">Our hiring partners</h2>
          <p className="mt-3 text-center text-muted-foreground">A few of the carriers actively recruiting our graduates.</p>
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {carriers.map((c) => (
              <div key={c} className="flex items-center justify-center rounded-xl border border-border bg-card p-6 text-center text-sm font-semibold text-foreground shadow-card">
                {c}
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Link to="/contact"><Button size="lg" variant="accent" className="gap-2">Start your career <ArrowRight className="h-4 w-4" /></Button></Link>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
