import { createFileRoute, Link } from "@tanstack/react-router";
import { Truck, ShieldCheck, CheckCircle2, Clock, DollarSign, ArrowRight } from "lucide-react";
import { SiteLayout } from "../components/site/SiteLayout";
import { Button } from "../components/ui/button";

export const Route = createFileRoute("/programs")({
  head: () => ({
    meta: [
      { title: "CDL Programs & Tuition | U.S. Truck Driver Training School" },
      { name: "description", content: "Class A CDL, Class B CDL, and third-party skills exams. Hands-on, FMCSA-compliant CDL training with financing options." },
      { property: "og:title", content: "CDL Programs & Tuition" },
      { property: "og:description", content: "Explore our Class A, Class B, and skills-exam CDL programs." },
    ],
  }),
  component: Programs,
});

const programs = [
  {
    icon: Truck,
    title: "Class A CDL",
    weeks: "4-7 weeks",
    price: "from $6,500",
    desc: "Our flagship program. Train on tractor-trailers and qualify for the highest-paying over-the-road and regional driving jobs.",
    points: ["160 hours of training", "Pre-trip, backing & road skills", "Doubles/triples & tanker endorsements available", "Job placement included"],
  },
  {
    icon: Truck,
    title: "Class B CDL",
    weeks: "3-4 weeks",
    price: "from $4,800",
    desc: "Operate straight trucks, dump trucks, and buses. Ideal for local routes with home-every-night schedules.",
    points: ["120 hours of training", "Air brakes & passenger endorsements", "Local & municipal job pipeline", "Flexible scheduling"],
  },
  {
    icon: ShieldCheck,
    title: "Third-Party Skills Exam",
    weeks: "1 day",
    price: "from $250",
    desc: "Already completed training elsewhere? Take your official CDL road test on-site with our state-certified examiners.",
    points: ["State-certified examiners", "Same-day results", "All vehicle classes", "On-site testing range"],
  },
];

function Programs() {
  return (
    <SiteLayout>
      <section className="bg-hero-gradient">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <h1 className="font-display text-4xl font-extrabold text-primary-foreground sm:text-5xl">Programs & Tuition</h1>
          <p className="mt-4 max-w-2xl text-lg text-primary-foreground/80">
            Choose the program that fits your goals. Every path is FMCSA-compliant and built around real-world driving.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {programs.map((p) => (
            <div key={p.title} className="flex flex-col rounded-2xl border border-border bg-card p-7 shadow-card">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <p.icon className="h-6 w-6" />
              </span>
              <h2 className="mt-5 text-2xl font-bold text-foreground">{p.title}</h2>
              <div className="mt-2 flex flex-wrap gap-3 text-sm font-medium">
                <span className="inline-flex items-center gap-1.5 text-muted-foreground"><Clock className="h-4 w-4" /> {p.weeks}</span>
                <span className="inline-flex items-center gap-1.5 text-accent-foreground"><DollarSign className="h-4 w-4" /> {p.price}</span>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">{p.desc}</p>
              <ul className="mt-5 flex-1 space-y-2.5">
                {p.points.map((pt) => (
                  <li key={pt} className="flex items-start gap-2 text-sm text-foreground">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" /> {pt}
                  </li>
                ))}
              </ul>
              <Link to="/contact" className="mt-6">
                <Button className="w-full gap-2">Apply for {p.title} <ArrowRight className="h-4 w-4" /></Button>
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-16 rounded-3xl bg-secondary p-8 sm:p-12">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl">Funding & financing</h2>
              <p className="mt-3 text-muted-foreground">
                Don't let cost stand between you and a six-figure trucking career. We work with multiple funding sources to make training affordable.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {["GI Bill & VA benefits", "WIOA workforce grants", "Employer sponsorship", "0% interest payment plans"].map((f) => (
                <div key={f} className="flex items-center gap-2 rounded-xl bg-card p-4 text-sm font-medium text-foreground shadow-card">
                  <CheckCircle2 className="h-5 w-5 text-accent-foreground" /> {f}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
