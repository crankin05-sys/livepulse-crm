import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Truck,
  ShieldCheck,
  Briefcase,
  GraduationCap,
  DollarSign,
  MapPin,
  CheckCircle2,
  ArrowRight,
  Star,
  Clock,
  Navigation,
  Radio,
} from "lucide-react";
import heroTruck from "../assets/hero-truck.jpg";
import { SiteLayout } from "../components/site/SiteLayout";
import { Button } from "../components/ui/button";
import { Reveal } from "../components/site/Reveal";
import { CountUp } from "../components/site/CountUp";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "U.S. Truck Driver Training School | Get Your CDL & Start Driving" },
      {
        name: "description",
        content:
          "Hands-on Class A & B CDL training in the Midwest with financing and guaranteed job-placement support. Start your trucking career in weeks.",
      },
      { property: "og:title", content: "U.S. Truck Driver Training School" },
      { property: "og:description", content: "Get your CDL and a high-paying career on the road." },
    ],
  }),
  component: Home,
});

const stats = [
  { value: "12,000+", label: "Drivers trained" },
  { value: "94%", label: "Job placement rate" },
  { value: "3-7 wks", label: "Program length" },
  { value: "40+", label: "Hiring carrier partners" },
];

const programs = [
  {
    icon: Truck,
    title: "Class A CDL",
    desc: "Drive tractor-trailers up to 80,000 lbs. The most in-demand license for over-the-road and regional careers.",
    weeks: "4-7 weeks",
  },
  {
    icon: Truck,
    title: "Class B CDL",
    desc: "Operate straight trucks, box trucks, and buses. Perfect for local routes and home-every-night schedules.",
    weeks: "3-4 weeks",
  },
  {
    icon: ShieldCheck,
    title: "Third-Party Skills Exam",
    desc: "Already trained? Take your official CDL road test on-site with our state-certified examiners.",
    weeks: "1 day",
  },
];

const features = [
  { icon: DollarSign, title: "Financing & Funding", desc: "GI Bill, WIOA grants, and flexible payment plans available." },
  { icon: Briefcase, title: "Guaranteed Placement Support", desc: "Pre-hire agreements with 40+ national and regional carriers." },
  { icon: GraduationCap, title: "Hands-On Training", desc: "Real trucks, real ranges, real road time — not just a classroom." },
  { icon: ShieldCheck, title: "State-Certified", desc: "Accredited curriculum that meets all FMCSA ELDT requirements." },
];

const steps = [
  { n: "01", title: "Apply Online", desc: "Submit a quick application and talk to an admissions advisor." },
  { n: "02", title: "Get Funded", desc: "We help you find grants, loans, or employer sponsorship." },
  { n: "03", title: "Train Hands-On", desc: "Master backing, shifting, and road skills with expert instructors." },
  { n: "04", title: "Get Hired", desc: "Interview with our carrier partners before you even graduate." },
];

function Home() {
  return (
    <SiteLayout>
      {/* Hero */}
      <section className="relative overflow-hidden bg-primary">
        <img
          src={heroTruck}
          alt="Semi-truck driving on an open highway at sunset"
          width={1600}
          height={1000}
          className="absolute inset-0 h-full w-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-hero-gradient opacity-80" />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-accent">
              <Star className="h-3.5 w-3.5" /> Rated #1 CDL school in the Midwest
            </span>
            <h1 className="mt-5 font-display text-4xl font-extrabold leading-tight text-primary-foreground text-balance sm:text-5xl lg:text-6xl">
              Your career on the road starts here.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-primary-foreground/80">
              Get your CDL in as little as 3 weeks with hands-on training, real financing options, and job-placement support that actually works.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/contact">
                <Button size="lg" variant="hero" className="gap-2">
                  Start Your Application <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/programs">
                <Button size="lg" variant="outline" className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
                  Explore Programs
                </Button>
              </Link>
            </div>
            <div className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-4">
              {stats.map((s) => (
                <div key={s.label}>
                  <div className="font-display text-2xl font-bold text-accent sm:text-3xl">{s.value}</div>
                  <div className="mt-1 text-xs text-primary-foreground/70">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Programs */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold text-foreground sm:text-4xl">Choose your path</h2>
          <p className="mt-3 text-muted-foreground">
            State-certified programs designed to get you licensed and earning fast.
          </p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {programs.map((p) => (
            <div key={p.title} className="group rounded-2xl border border-border bg-card p-7 shadow-card transition-all hover:-translate-y-1 hover:shadow-elevated">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-colors group-hover:bg-accent group-hover:text-accent-foreground">
                <p.icon className="h-6 w-6" />
              </span>
              <h3 className="mt-5 text-xl font-bold text-foreground">{p.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{p.desc}</p>
              <div className="mt-4 flex items-center gap-1.5 text-sm font-medium text-accent-foreground/80">
                <Clock className="h-4 w-4" /> {p.weeks}
              </div>
              <Link to="/programs" className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:gap-2 transition-all">
                Learn more <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="bg-secondary py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="font-display text-3xl font-bold text-foreground sm:text-4xl">Why drivers choose us</h2>
              <p className="mt-4 text-muted-foreground">
                We've trained over 12,000 drivers. Our students don't just pass the test — they launch careers.
              </p>
              <div className="mt-8 grid gap-5 sm:grid-cols-2">
                {features.map((f) => (
                  <div key={f.title} className="flex gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent-foreground">
                      <f.icon className="h-5 w-5 text-accent-foreground" />
                    </span>
                    <div>
                      <h3 className="font-semibold text-foreground">{f.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-3xl bg-primary p-8 text-primary-foreground shadow-elevated">
              <h3 className="font-display text-xl font-bold">What's included in tuition</h3>
              <ul className="mt-6 space-y-3.5">
                {[
                  "All hands-on range and road training hours",
                  "ELDT theory & FMCSA-compliant curriculum",
                  "CDL permit and endorsement prep",
                  "Job placement & carrier interview prep",
                  "Lifetime career-services support",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-primary-foreground/90">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-accent" /> {item}
                  </li>
                ))}
              </ul>
              <Link to="/contact" className="mt-7 block">
                <Button variant="hero" className="w-full">Talk to an advisor</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold text-foreground sm:text-4xl">From application to hired</h2>
          <p className="mt-3 text-muted-foreground">A clear path to your new career in four steps.</p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-4">
          {steps.map((s) => (
            <div key={s.n} className="relative rounded-2xl border border-border bg-card p-6 shadow-card">
              <div className="font-display text-3xl font-extrabold text-accent">{s.n}</div>
              <h3 className="mt-3 font-bold text-foreground">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-hero-gradient">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 px-4 py-16 text-center sm:px-6 lg:px-8">
          <MapPin className="h-10 w-10 text-accent" />
          <h2 className="font-display text-3xl font-bold text-primary-foreground sm:text-4xl text-balance">
            Ready to take the wheel?
          </h2>
          <p className="max-w-xl text-primary-foreground/80">
            Classes start every two weeks. Apply today and an advisor will reach out within one business day.
          </p>
          <Link to="/contact">
            <Button size="lg" variant="hero" className="gap-2">
              Apply Now <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </SiteLayout>
  );
}
