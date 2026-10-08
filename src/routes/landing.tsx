import { createFileRoute } from "@tanstack/react-router";
import adVideo from "@/assets/videos/ustdts-ad.mp4.asset.json";

export const Route = createFileRoute("/landing")({
  head: () => ({
    meta: [
      { title: "Landing Page — U.S. Truck Driver Training School" },
      {
        name: "description",
        content:
          "Explore CDL training in Sterling Heights, Michigan. Take a quick readiness assessment and connect with admissions.",
      },
      { property: "og:title", content: "Landing Page — U.S. Truck Driver Training School" },
      {
        property: "og:description",
        content:
          "Explore CDL training in Sterling Heights, Michigan. Take a quick readiness assessment and connect with admissions.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <section className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="mb-6 text-center text-3xl font-bold tracking-tight">
          Watch: Your CDL Career Starts Here
        </h1>
        <video
          src={adVideo.url}
          controls
          autoPlay
          muted
          loop
          playsInline
          className="w-full rounded-2xl shadow-2xl"
        />
      </section>
      <iframe
        src="/landing-page.html"
        title="Landing Page"
        className="block h-[2400px] w-full border-0"
      />
    </div>
  );
}
