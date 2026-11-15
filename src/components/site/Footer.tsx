import { Link } from "@tanstack/react-router";
import { Mail, Phone } from "lucide-react";
import { useCategories } from "@/hooks/useCategories";

export function Footer({ settings }: { settings: Record<string, string> }) {
  const email = settings["email"] ?? "Intellectualmindsetclothing@gmail.com";
  const phone = settings["phone"] ?? "+264 857726474";
  const phoneAlt = settings["phone_alt"];
  const { categories } = useCategories();

  return (
    <footer className="bg-ink text-ink-foreground">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="display-xl text-3xl">
            Intellectual<span className="text-lime">Mindset</span>
          </p>
          <p className="mt-3 max-w-xs text-sm text-ink-foreground/70">
            Streetwear made for thinkers. Designed in Namibia, worn worldwide.
          </p>
        </div>

        <div>
          <p className="label-tag text-lime">Shop</p>
          <ul className="mt-4 space-y-2 text-sm">
            {categories.map((c) => (
              <li key={c.slug}>
                <Link
                  to="/shop"
                  search={{ category: c.slug }}
                  className="text-ink-foreground/70 hover:text-ink-foreground"
                >
                  {c.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="label-tag text-lime">Company</p>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <Link to="/about" className="text-ink-foreground/70 hover:text-ink-foreground">
                About us
              </Link>
            </li>
            <li>
              <Link to="/catalogue" className="text-ink-foreground/70 hover:text-ink-foreground">
                Catalogue & guides
              </Link>
            </li>
            <li>
              <Link to="/contact" className="text-ink-foreground/70 hover:text-ink-foreground">
                Contact
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="label-tag text-lime">Get in touch</p>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex items-center gap-2">
              <Mail className="size-4 text-lime" />
              <a href={`mailto:${email}`} className="break-all text-ink-foreground/80">
                {email}
              </a>
            </li>
            <li className="flex items-center gap-2">
              <Phone className="size-4 text-lime" />
              <a href={`tel:${phone.replace(/\s/g, "")}`} className="text-ink-foreground/80">
                {phone}
              </a>
            </li>
            {phoneAlt ? (
              <li className="flex items-center gap-2">
                <Phone className="size-4 text-lime" />
                <a href={`tel:${phoneAlt.replace(/\s/g, "")}`} className="text-ink-foreground/80">
                  {phoneAlt}
                </a>
              </li>
            ) : null}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-ink-foreground/50 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Intellectual Mindset Clothing. All rights reserved.</p>
          <Link to="/auth" className="label-tag text-ink-foreground/40 hover:text-lime">
            Owner login
          </Link>
        </div>
      </div>
    </footer>
  );
}
