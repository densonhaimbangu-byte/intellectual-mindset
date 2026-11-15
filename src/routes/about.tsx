import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import heroImage from "@/assets/hero.jpg";
import { SiteLayout, settingsQuery } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About the Brand | Intellectual Mindset Clothing" },
      {
        name: "description",
        content:
          "Intellectual Mindset Clothing is a Namibian streetwear label for thinkers, builders and doers. Learn the story behind the brand.",
      },
      { property: "og:title", content: "About Intellectual Mindset Clothing" },
      {
        property: "og:description",
        content: "A Namibian streetwear label made for thinkers, builders and doers.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: About,
});

function About() {
  const { data: settings } = useQuery(settingsQuery);

  return (
    <SiteLayout>
      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-10">
          <h1 className="text-4xl uppercase sm:text-5xl">About us</h1>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-2">
        <div>
          <p className="label-tag text-lime">The label</p>
          <h2 className="mt-3 text-3xl uppercase">Worn with intent.</h2>
          <p className="mt-5 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
            {settings?.["about"] ??
              "Intellectual Mindset Clothing is a Namibian streetwear label made for thinkers, builders and doers."}
          </p>
        </div>
        <img
          src={heroImage}
          alt="Intellectual Mindset Clothing campaign"
          loading="lazy"
          width={1600}
          height={912}
          className="aspect-[4/3] w-full object-cover"
        />
      </div>
    </SiteLayout>
  );
}
