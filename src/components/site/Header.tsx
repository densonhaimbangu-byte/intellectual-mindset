import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { useCategories } from "@/hooks/useCategories";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/shop", label: "Shop" },
  { to: "/catalogue", label: "Catalogue" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
  { to: "/orders", label: "Order slips" },
] as const;

export function Header({ announcement }: { announcement?: string | undefined }) {
  const [open, setOpen] = useState(false);
  const { categories } = useCategories();

  return (
    <header className="sticky top-0 z-50">
      {announcement ? (
        <div className="bg-lime text-lime-foreground">
          <p className="label-tag mx-auto max-w-7xl px-4 py-2 text-center">{announcement}</p>
        </div>
      ) : null}

      <div className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4">
          <Link to="/" className="display-xl text-2xl leading-none tracking-tight sm:text-3xl">
            Intellectual<span className="text-lime">Mindset</span>
          </Link>

          <nav className="hidden items-center gap-7 md:flex">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="label-tag text-foreground/70 transition-colors hover:text-foreground"
                activeProps={{ className: "label-tag text-foreground" }}
                activeOptions={{ exact: item.to === "/" }}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <button
            type="button"
            aria-label="Toggle menu"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex size-10 items-center justify-center border border-border md:hidden"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>

        {open ? (
          <div className="border-t border-border md:hidden">
            <nav className="mx-auto flex max-w-7xl flex-col px-4 py-2">
              {NAV.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className="label-tag border-b border-border py-3"
                >
                  {item.label}
                </Link>
              ))}
              <div className="flex flex-wrap gap-3 py-3">
                {categories.map((c) => (
                  <Link
                    key={c.slug}
                    to="/shop"
                    search={{ category: c.slug }}
                    onClick={() => setOpen(false)}
                    className="label-tag bg-ink px-3 py-2 text-ink-foreground"
                  >
                    {c.label}
                  </Link>
                ))}
              </div>
            </nav>
          </div>
        ) : null}
      </div>
    </header>
  );
}
