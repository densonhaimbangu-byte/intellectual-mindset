import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ProductCard } from "@/components/site/ProductCard";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useCategories } from "@/hooks/useCategories";
import { fetchVisibleProducts } from "@/lib/store";

type ShopSearch = { category?: string | undefined };

export const Route = createFileRoute("/shop")({
  validateSearch: (search: Record<string, unknown>): ShopSearch => ({
    category: typeof search["category"] === "string" ? search["category"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Shop Hoodies, T-Shirts, Socks & Stickers | Intellectual Mindset" },
      {
        name: "description",
        content:
          "Browse the full Intellectual Mindset Clothing range: hoodies, t-shirts, socks and stickers with up-to-date prices in Namibian dollars.",
      },
      { property: "og:title", content: "Shop the Intellectual Mindset collection" },
      {
        property: "og:description",
        content: "Hoodies, t-shirts, socks and stickers with live prices.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Shop,
});

function Shop() {
  const { category } = Route.useSearch();
  const { categories } = useCategories();
  const { data: products, isPending } = useQuery({
    queryKey: ["products", "visible"],
    queryFn: fetchVisibleProducts,
  });

  const list = (products ?? []).filter((p) => !category || p.category === category);

  return (
    <SiteLayout>
      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-10">
          <h1 className="text-4xl uppercase sm:text-5xl">Shop</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Prices in Namibian dollars. Pay by bank card, crypto, or order by WhatsApp.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-wrap gap-2 border-b border-border pb-4">
          <Link
            to="/shop"
            search={{}}
            className={`label-tag px-4 py-2 ${!category ? "bg-ink text-ink-foreground" : "border border-border"}`}
          >
            All
          </Link>
          {categories.map((c) => (
            <Link
              key={c.slug}
              to="/shop"
              search={{ category: c.slug }}
              className={`label-tag px-4 py-2 ${
                category === c.slug ? "bg-lime text-lime-foreground" : "border border-border"
              }`}
            >
              {c.label}
            </Link>
          ))}
        </div>

        <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
          {list.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {!isPending && list.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">
            Nothing in this category yet — check back soon.
          </p>
        ) : null}
      </div>
    </SiteLayout>
  );
}
