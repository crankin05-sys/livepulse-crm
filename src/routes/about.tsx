import { createFileRoute } from "@tanstack/react-router";
import { Target, Heart, Award, Users } from "lucide-react";
import { SiteLayout } from "../components/site/SiteLayout";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Us | U.S. Truck Driver Training School" },
      { name: "description", content: "For over 20 years, U.S. Truck Driver Training School has launched careers with hands-on, student-first CDL training." },
      { property: "og:title", content: "About U.S. Truck Driver Training School" },
      { property: "og:description", content: "20+ years of student-first CDL training." },
    ],
  }),
  component: About,
});

const values = [
  { icon: Target, title: "Student-first", desc: "Every decision we make starts with what's best for our students' careers." },
  { icon: Award, title: "Excellence", desc: "State-certified instructors and a curriculum that exceeds federal standards." },
  { icon: Heart, title: "Integrity", desc: "Honest pricing, honest advice, and real outcomes — no empty promises." },
  { icon: Users, title: "Community", desc: "Our alumni network spans the country and supports each other on the road." },
];

function About() {
  return (
    <SiteLayout>
      <section className="bg-hero-gradient">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <h1 className="font-display text-4xl font-extrabold text-primary-foreground sm:text-5xl">About Our School</h1>
          <p className="mt-4 max-w-2xl text-lg text-primary-foreground/80">
            For over two decades we've been one of the Midwest's most trusted names in commercial driver training.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="prose prose-lg max-w-none text-muted-foreground">
          <p>
            U.S. Truck Driver Training School was founded on a simple belief: that a great career should be within
            reach for anyone willing to work for it. Since opening our doors, we've trained more than 12,000 drivers
            who now move freight across the country.
          </p>
          <p className="mt-4">
            Our hands-on approach pairs every student with experienced, state-certified instructors and real equipment.
            We don't believe in learning to drive from a textbook — we believe in getting you behind the wheel as fast
            as safely possible, then connecting you with carriers who are hiring right now.
          </p>
        </div>
      </section>

      <section className="bg-secondary py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center font-display text-2xl font-bold text-foreground sm:text-3xl">What we stand for</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v) => (
              <div key={v.title} className="rounded-2xl border border-border bg-card p-7 text-center shadow-card">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <v.icon className="h-6 w-6" />
                </span>
                <h3 className="mt-4 font-bold text-foreground">{v.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
