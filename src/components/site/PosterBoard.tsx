import { useQuery } from "@tanstack/react-query";
import { Megaphone } from "lucide-react";
import { useStoreImage } from "@/hooks/useStoreImage";
import { fetchActivePosters, type Poster } from "@/lib/posters";

function PosterCard({ poster }: { poster: Poster }) {
  const image = useStoreImage("product-images", poster.image_url);

  const body = (
    <div className="group relative overflow-hidden border border-border bg-ink text-ink-foreground">
      {image ? (
        <img
          src={image}
          alt={poster.title}
          loading="lazy"
          className="aspect-[4/5] w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="flex aspect-[4/5] w-full items-center justify-center bg-ink">
          <Megaphone className="size-10 text-lime" />
        </div>
      )}
      <div className="space-y-1 p-4">
        <p className="label-tag text-lime">Promotion</p>
        <h3 className="text-2xl uppercase">{poster.title}</h3>
        {poster.message ? (
          <p className="text-sm text-ink-foreground/70">{poster.message}</p>
        ) : null}
      </div>
    </div>
  );

  return poster.link_url ? (
    <a href={poster.link_url} target="_blank" rel="noreferrer">
      {body}
    </a>
  ) : (
    body
  );
}

/** Promotion posters — renders nothing until a poster is posted. */
export function PosterBoard() {
  const { data } = useQuery({ queryKey: ["posters", "active"], queryFn: fetchActivePosters });
  const posters = data ?? [];
  if (!posters.length) return null;

  return (
    <section className="border-b border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 py-14">
        <div className="mb-6 flex items-end justify-between gap-4">
          <h2 className="display-xl text-3xl sm:text-4xl">Promotions</h2>
          <p className="label-tag text-muted-foreground">Live now</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posters.map((p) => (
            <PosterCard key={p.id} poster={p} />
          ))}
        </div>
      </div>
    </section>
  );
}
