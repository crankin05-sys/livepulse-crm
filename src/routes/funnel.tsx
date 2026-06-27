import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Phone,
  CheckCircle2,
  Flame,
  ShieldCheck,
  Clock,
  DollarSign,
  Truck,
  Star,
  AlertTriangle,
  TrendingUp,
  Zap,
} from "lucide-react";
import { SiteLayout } from "../components/site/SiteLayout";
import { Button } from "../components/ui/button";
import { Reveal } from "../components/site/Reveal";
import { CountUp } from "../components/site/CountUp";

export const Route = createFileRoute("/funnel")({
  head: () => ({
    meta: [
      { title: "Get Your CDL in Weeks — Start Earning $60K+ | U.S. Truck Driver Training School" },
      {
        name: "description",
        content:
          "Michigan's fastest path to a high-paying trucking career. 94% job placement, financing available, pre-hire offers before you graduate. Claim your seat today.",
      },
      { property: "og:title", content: "Get Your CDL — Start Earning $60K+ in Weeks" },
      {
        property: "og:description",
        content: "94% placement. Financing available. Pre-hire offers before graduation. Limited seats this enrollment.",
      },
    ],
  }),
  component: Funnel,
});

const stakes = [
  "Stuck in a dead-end job with no raise in sight",
  "Watching prices climb while your paycheck stays flat",
  "Tired of being told you need a 4-year degree to earn real money",
  "Ready for a career that can't be outsourced or automated",
];

const deliverables = [
  { icon: Truck, title: "Class A CDL — done right", desc: "Behind-the-wheel hours with real equipment and instructors who actually drove the highway." },
  { icon: DollarSign, title: "Financing that works", desc: "Grants, payment plans, and Michigan Works funding so cost is never the reason you quit on yourself." },
  { icon: ShieldCheck, title: "94% job placement", desc: "Pre-hire agreements with 40+ carriers. Walk out with an offer, not just a license." },
  { icon: Clock, title: "Weeks, not years", desc: "Most students go from sign-up to road-ready faster than a single college semester." },
];

const steps = [
  { n: "1", title: "Claim your seat", desc: "Apply in 60 seconds. No obligation, no pressure." },
  { n: "2", title: "Lock your funding", desc: "We map out grants and financing so you start with a plan." },
  { n: "3", title: "Train & get certified", desc: "Hands-on training with pros until you're road-ready." },
  { n: "4", title: "Get hired & earn", desc: "Interview with carriers and start your $60K+ career." },
];

const testimonials = [
  { name: "Marcus W.", city: "Detroit, MI", quote: "I went from $14/hr to $68K my first year. This school changed my life — period." },
  { name: "Aisha C.", city: "Troy, MI", quote: "I had a job offer before I even graduated. The placement team is the real deal." },
  { name: "Darnell B.", city: "Sterling Heights, MI", quote: "Financing made it possible. Best decision I've ever made for my family." },
];

const faqs = [
  { q: "How fast can I get my CDL?", a: "Most students finish in a matter of weeks — far faster than any degree program. Your seat starts the clock." },
  { q: "What if I can't afford it?", a: "That's exactly what we solve first. Grants, Michigan Works funding, and flexible payment plans mean cost is rarely the barrier." },
  { q: "Will I actually get a job?", a: "94% of our graduates get placed. We hold pre-hire agreements with 40+ carriers actively recruiting in Michigan." },
  { q: "Do I need experience?", a: "No. We take you from zero to road-ready and job-ready. If you can show up and put in the work, we'll get you there." },
];

function Funnel() {
  return (
    <SiteLayout>
      {/* HERO — the big promise */}
      <section className="relative overflow-hidden bg-hero-gradient">
        <div className="mx-auto max-w-5xl px-4 py-20 text-center sm:px-6 sm:py-28 lg:px-8">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/15 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-accent">
              <Flame className="h-3.5 w-3.5" /> Now enrolling — Michigan residents
            </span>
          </Reveal>
          <Reveal delay={80}>
            <h1 className="mt-6 font-display text-4xl font-extrabold leading-[1.05] text-primary-foreground sm:text-6xl">
              Get Your CDL in Weeks.
              <br />
              <span className="text-accent">Start Earning $60K+.</span>
            </h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-primary-foreground/85 sm:text-xl">
              No degree. No experience. No limits. Michigan's fastest path to a high-paying career that
              <span className="font-semibold text-primary-foreground"> can't be outsourced.</span> Financing available — and 94% of our grads get hired.
            </p>
          </Reveal>
          <Reveal delay={240}>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to="/contact">
                <Button size="lg" variant="accent" className="h-14 gap-2 px-8 text-base font-bold">
                  Claim Your Seat Now <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <a href="tel:+15868381268">
                <Button size="lg" variant="outline" className="h-14 gap-2 border-primary-foreground/30 bg-transparent px-8 text-base text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
                  <Phone className="h-5 w-5" /> 586-838-1268
                </Button>
              </a>
            </div>
          </Reveal>
          <Reveal delay={320}>
            <p className="mt-5 text-sm text-primary-foreground/60">
              ⚡ Seats are limited each enrollment cycle. Apply in 60 seconds — no obligation.
            </p>
          </Reveal>

          <div className="mt-14 grid grid-cols-3 gap-4 border-t border-primary-foreground/15 pt-10">
            <div>
              <div className="font-display text-3xl font-bold text-accent sm:text-4xl"><CountUp value="94%" /></div>
              <div className="mt-1 text-xs uppercase tracking-wider text-primary-foreground/60">Placement rate</div>
            </div>
            <div>
              <div className="font-display text-3xl font-bold text-accent sm:text-4xl"><CountUp value="$62k" /></div>
              <div className="mt-1 text-xs uppercase tracking-wider text-primary-foreground/60">Avg. 1st-year pay</div>
            </div>
            <div>
              <div className="font-display text-3xl font-bold text-accent sm:text-4xl"><CountUp value="30+" /></div>
              <div className="mt-1 text-xs uppercase tracking-wider text-primary-foreground/60">Years training</div>
            </div>
          </div>
        </div>
      </section>

      {/* THE STAKES — agitate the problem */}
      <section className="bg-background py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <h2 className="text-center font-display text-2xl font-bold text-foreground sm:text-3xl">
              Every day you wait is money you'll never get back.
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-muted-foreground">
              The trucking industry is short hundreds of thousands of drivers. The opportunity is right now. Be honest — does any of this sound familiar?
            </p>
          </Reveal>
          <div className="mx-auto mt-8 grid max-w-2xl gap-3">
            {stakes.map((s, i) => (
              <Reveal key={s} delay={i * 70}>
                <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 shadow-card">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
                  <span className="text-sm font-medium text-foreground">{s}</span>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={300}>
            <p className="mt-8 text-center text-lg font-semibold text-foreground">
              You don't have a money problem. You have an <span className="text-accent">opportunity problem.</span> We fix that in weeks.
            </p>
          </Reveal>
        </div>
      </section>

      {/* WHAT YOU GET — the offer stack */}
      <section className="bg-secondary py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <h2 className="text-center font-display text-2xl font-bold text-foreground sm:text-3xl">
              Here's everything you walk away with
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-muted-foreground">
              This isn't just a class. It's a complete career launch system — built so you can't fail if you show up.
            </p>
          </Reveal>
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {deliverables.map((d, i) => (
              <Reveal key={d.title} delay={i * 80}>
                <div className="flex h-full gap-4 rounded-2xl border border-border bg-card p-7 shadow-card">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/15">
                    <d.icon className="h-6 w-6 text-accent-foreground" />
                  </span>
                  <div>
                    <h3 className="flex items-center gap-2 text-lg font-bold text-foreground">
                      <CheckCircle2 className="h-4 w-4 text-success" /> {d.title}
                    </h3>
                    <p className="mt-1.5 text-sm text-muted-foreground">{d.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={360}>
            <div className="mt-10 text-center">
              <Link to="/contact">
                <Button size="lg" variant="accent" className="h-13 gap-2 px-8 text-base font-bold">
                  Yes — I Want This Career <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* HOW IT WORKS — remove friction */}
      <section className="bg-background py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <h2 className="text-center font-display text-2xl font-bold text-foreground sm:text-3xl">
              Your road to a paycheck — 4 simple steps
            </h2>
          </Reveal>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <Reveal key={s.n} delay={i * 80}>
                <div className="relative h-full rounded-2xl border border-border bg-card p-7 shadow-card">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary font-display text-lg font-bold text-primary-foreground">
                    {s.n}
                  </span>
                  <h3 className="mt-4 text-lg font-bold text-foreground">{s.title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">{s.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* PROOF — testimonials */}
      <section className="bg-secondary py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <h2 className="text-center font-display text-2xl font-bold text-foreground sm:text-3xl">
              Real Michigan drivers. Real paychecks.
            </h2>
          </Reveal>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {testimonials.map((t, i) => (
              <Reveal key={t.name} delay={i * 90}>
                <figure className="flex h-full flex-col rounded-2xl border border-border bg-card p-7 shadow-card">
                  <div className="flex gap-0.5 text-accent">
                    {Array.from({ length: 5 }).map((_, k) => (
                      <Star key={k} className="h-4 w-4 fill-current text-accent" />
                    ))}
                  </div>
                  <blockquote className="mt-4 flex-1 text-sm text-foreground">"{t.quote}"</blockquote>
                  <figcaption className="mt-4 border-t border-border pt-4 text-sm">
                    <span className="font-bold text-foreground">{t.name}</span>
                    <span className="block text-muted-foreground">{t.city}</span>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* RISK REVERSAL */}
      <section className="bg-background py-16">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <Reveal>
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-success/15">
              <ShieldCheck className="h-7 w-7 text-success" />
            </span>
            <h2 className="mt-5 font-display text-2xl font-bold text-foreground sm:text-3xl">
              The only risk is doing nothing
            </h2>
            <p className="mt-4 text-muted-foreground">
              We've trained drivers for over 30 years in Sterling Heights. Our career team works for you until you're placed — 94% of grads get hired. The application is free, takes 60 seconds, and there's zero obligation. The worst case? You find out exactly how to fund and launch a $60K+ career.
            </p>
          </Reveal>
        </div>
      </section>

      {/* FAQ — knock down objections */}
      <section className="bg-secondary py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <h2 className="text-center font-display text-2xl font-bold text-foreground sm:text-3xl">
              Got questions? Good. Here are answers.
            </h2>
          </Reveal>
          <div className="mt-8 space-y-4">
            {faqs.map((f, i) => (
              <Reveal key={f.q} delay={i * 70}>
                <div className="rounded-xl border border-border bg-card p-6 shadow-card">
                  <h3 className="flex items-start gap-2 font-bold text-foreground">
                    <Zap className="mt-0.5 h-4 w-4 shrink-0 text-accent" /> {f.q}
                  </h3>
                  <p className="mt-2 pl-6 text-sm text-muted-foreground">{f.a}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA — close hard */}
      <section className="relative overflow-hidden bg-hero-gradient py-20">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <Reveal>
            <TrendingUp className="mx-auto h-10 w-10 text-accent" />
            <h2 className="mt-5 font-display text-3xl font-extrabold text-primary-foreground sm:text-4xl">
              Decide your future right now.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-primary-foreground/85">
              Successful people make fast decisions. Claim your seat, lock your funding, and let's get you earning. Seats this cycle are limited.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to="/contact">
                <Button size="lg" variant="accent" className="h-14 gap-2 px-10 text-base font-bold">
                  Claim Your Seat Now <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <a href="tel:+15868381268">
                <Button size="lg" variant="outline" className="h-14 gap-2 border-primary-foreground/30 bg-transparent px-8 text-base text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
                  <Phone className="h-5 w-5" /> Call 586-838-1268
                </Button>
              </a>
            </div>
            <p className="mt-5 text-sm text-primary-foreground/60">
              6500 15 Mile Rd., Sterling Heights, MI 48312 · Mon–Fri 8am–6pm
            </p>
          </Reveal>
        </div>
      </section>
    </SiteLayout>
  );
}
