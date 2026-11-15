import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BadgeCheck, FileText, Sparkles, Truck } from "lucide-react";
import heroImage from "@/assets/hero.jpg";
import catHoodies from "@/assets/cat-hoodies.jpg";
import catTshirts from "@/assets/cat-tshirts.jpg";
import catSocks from "@/assets/cat-socks.jpg";
import catStickers from "@/assets/cat-stickers.jpg";
import { PosterBoard } from "@/components/site/PosterBoard";
import { ProductCard } from "@/components/site/ProductCard";
import { SiteLayout, settingsQuery } from "@/components/site/SiteLayout";
import { fetchVisibleProducts } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Intellectual Mindset Clothing — Namibian Streetwear" },
      {
        name: "description",
        content:
          "Premium Namibian streetwear: hoodies, t-shirts, socks and stickers built for thinkers. Shop the Intellectual Mindset collection.",
      },
      { property: "og:title", content: "Intellectual Mindset Clothing — Namibian Streetwear" },
      {
        property: "og:description",
        content: "Premium Namibian streetwear: hoodies, t-shirts, socks and stickers built for thinkers. Shop the Intellectual Mindset collection.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

const CATEGORY_TILES = [
  { slug: "hoodies", label: "Hoodies", image: catHoodies },
  { slug: "tshirts", label: "T-Shirts", image: catTshirts },
  { slug: "socks", label: "Socks", image: catSocks },
  { slug: "stickers", label: "Stickers", image: catStickers },
] as const;

const PROMISES = [
  { icon: Truck, title: "Nationwide delivery", body: "Windhoek & countrywide courier" },
  { icon: BadgeCheck, title: "Premium quality", body: "Heavyweight, built to last" },
  { icon: Sparkles, title: "Limited drops", body: "Small runs, never restocked" },
  { icon: FileText, title: "Size guides", body: "Download our PDF guides" },
] as const;

function Home() {
  const { data: settings } = useQuery(settingsQuery);
  const { data: products } = useQuery({
    queryKey: ["products", "visible"],
    queryFn: fetchVisibleProducts,
  });

  const s = settings ?? {};
  const featured = (products ?? []).filter((p) => p.is_featured);
  const list = (featured.length ? featured : (products ?? [])).slice(0, 16);

  return (
    <SiteLayout>
      <PosterBoard />
      <section className="relative isolate bg-ink text-ink-foreground">
        <img
          src={heroImage}
          alt="Models wearing Intellectual Mindset streetwear"
          width={1600}
          height={912}
          className="absolute inset-0 size-full object-cover object-right opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/85 to-ink/10" />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:py-32">
          <p className="label-tag text-lime">{s["hero_kicker"] ?? "NEW COLLECTION"}</p>
          <h1 className="display-xl mt-4 max-w-2xl text-5xl sm:text-7xl">
            {s["hero_title_line1"] ?? "THINK DIFFERENT."}
            <br />
            <span className="text-lime">{s["hero_title_line2"] ?? "WEAR THE MINDSET."}</span>
          </h1>
          <p className="mt-5 max-w-md text-sm text-ink-foreground/75 sm:text-base">
            {s["hero_subtitle"] ?? "Premium streetwear for those who build their own path."}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/shop"
              className="label-tag bg-lime px-6 py-3 text-lime-foreground transition-transform hover:-translate-y-0.5"
            >
              Shop now
            </Link>
            <Link
              to="/catalogue"
              className="label-tag border border-ink-foreground/40 px-6 py-3 text-ink-foreground transition-colors hover:bg-ink-foreground hover:text-ink"
            >
              Read the catalogue
            </Link>
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-card">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:grid-cols-2 lg:grid-cols-4">
          {PROMISES.map((item) => (
            <div key={item.title} className="flex items-start gap-3">
              <item.icon className="mt-0.5 size-5 shrink-0" />
              <div>
                <p className="label-tag">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16">
        <h2 className="text-center text-3xl uppercase sm:text-4xl">Shop by category</h2>
        <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {CATEGORY_TILES.map((tile) => (
            <Link
              key={tile.slug}
              to="/shop"
              search={{ category: tile.slug }}
              className="group relative aspect-[3/4] overflow-hidden bg-ink"
            >
              <img
                src={tile.image}
                alt={tile.label}
                loading="lazy"
                width={800}
                height={1000}
                className="size-full object-cover opacity-70 transition-all duration-500 group-hover:scale-105 group-hover:opacity-90"
              />
              <div className="absolute inset-x-0 bottom-0 p-4 text-center">
                <p className="display-xl text-2xl text-ink-foreground">{tile.label}</p>
                <span className="label-tag mt-1 inline-block border-b-2 border-lime pb-0.5 text-ink-foreground">
                  Shop now
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-3xl uppercase sm:text-4xl">New arrivals</h2>
          <Link to="/shop" className="label-tag inline-flex items-center gap-1 hover:text-lime">
            View all <ArrowRight className="size-4" />
          </Link>
        </div>
        <div className="-mx-4 mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4">
          {list.map((product) => (
            <div key={product.id} className="w-44 shrink-0 snap-start sm:w-56">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
        {list.length === 0 ? (
          <p className="mt-8 text-sm text-muted-foreground">
            Products will appear here as soon as they are added.
          </p>
        ) : null}
      </section>

      {(products ?? []).length ? (
        <section className="mx-auto max-w-7xl px-4 pb-20">
          <h2 className="text-3xl uppercase sm:text-4xl">All products</h2>
          <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 lg:grid-cols-5">
            {(products ?? []).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="bg-ink text-ink-foreground">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-16 md:grid-cols-2">
          <div className="border border-white/10 p-8">
            <p className="label-tag text-lime">Join the movement</p>
            <h3 className="display-xl mt-3 text-4xl">Be part of something real.</h3>
            <Link
              to="/shop"
              className="label-tag mt-6 inline-block bg-lime px-5 py-3 text-lime-foreground"
            >
              Shop now
            </Link>
          </div>
          <div className="border border-white/10 p-8">
            <p className="label-tag text-lime">Limited drop</p>
            <h3 className="display-xl mt-3 text-4xl">Exclusive styles. Limited quantities.</h3>
            <Link
              to="/contact"
              className="label-tag mt-6 inline-block border border-ink-foreground/40 px-5 py-3"
            >
              Order via WhatsApp
            </Link>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
