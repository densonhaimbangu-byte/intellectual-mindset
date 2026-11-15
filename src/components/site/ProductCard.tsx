import { Link } from "@tanstack/react-router";
import { Heart, Shirt } from "lucide-react";
import { useStoreImage } from "@/hooks/useStoreImage";
import { useFavorite } from "@/hooks/useFavorites";
import { formatPrice, type Product } from "@/lib/store";

export function ProductCard({ product }: { product: Product }) {
  const image = useStoreImage("product-images", product.image_url);
  const { liked, toggle } = useFavorite(product.id);
  const onSale = Boolean(product.compare_price && product.compare_price > product.price);

  return (
    <article className="group">
      <Link to="/product/$productId" params={{ productId: product.id }} className="block">
        <div className="relative aspect-square overflow-hidden bg-secondary">
          {image ? (
            <img
              src={image}
              alt={product.name}
              loading="lazy"
              className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex size-full items-center justify-center">
              <Shirt className="size-10 text-muted-foreground/40" />
            </div>
          )}
          <button
            type="button"
            aria-label="Save to favourites"
            aria-pressed={liked}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggle();
            }}
            className="absolute right-2 top-2 grid size-8 place-items-center rounded-full bg-background/90 transition-transform active:scale-90"
          >
            <Heart className={`size-4 ${liked ? "fill-destructive text-destructive" : ""}`} />
          </button>
          {onSale ? (
            <span className="label-tag absolute left-0 top-0 bg-lime px-2 py-1 text-lime-foreground">
              Sale
            </span>
          ) : null}
        </div>

        <div className="pt-3">
          <h3 className="truncate font-sans text-xs font-bold uppercase tracking-wide">
            {product.name}
          </h3>
          <div className="mt-1 flex items-center gap-2">
            <p className="text-sm font-semibold">{formatPrice(product.price, product.currency)}</p>
            {onSale ? (
              <p className="text-xs text-muted-foreground line-through">
                {formatPrice(product.compare_price!, product.currency)}
              </p>
            ) : null}
          </div>
          {product.colors.length ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {product.colors.slice(0, 5).map((c) => (
                <span
                  key={c}
                  title={c}
                  className="size-3 rounded-full border border-border"
                  style={{ backgroundColor: c.toLowerCase().replace(/\s+/g, "") }}
                />
              ))}
            </div>
          ) : null}
        </div>
      </Link>
    </article>
  );
}
