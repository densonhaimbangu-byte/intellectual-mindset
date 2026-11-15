import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Mail, MessageCircle, Phone } from "lucide-react";
import { SiteLayout, settingsQuery } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact & Orders | Intellectual Mindset Clothing" },
      {
        name: "description",
        content:
          "Order or ask about Intellectual Mindset Clothing by WhatsApp on +264 857726474 or email Intellectualmindsetclothing@gmail.com.",
      },
      { property: "og:title", content: "Contact Intellectual Mindset Clothing" },
      {
        property: "og:description",
        content: "Order by WhatsApp or email — we reply fast.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Contact,
});

function Contact() {
  const { data: settings } = useQuery(settingsQuery);
  const email = settings?.["email"] ?? "Intellectualmindsetclothing@gmail.com";
  const phone = settings?.["phone"] ?? "+264 857726474";
  const phoneAlt = settings?.["phone_alt"] ?? "";
  const wa = phone.replace(/[^\d]/g, "");

  return (
    <SiteLayout>
      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-10">
          <h1 className="text-4xl uppercase sm:text-5xl">Contact & orders</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Send us the item, size and quantity — we confirm price and delivery.
          </p>
        </div>
      </div>

      <div className="mx-auto grid max-w-5xl gap-4 px-4 py-14 sm:grid-cols-3">
        <a
          href={`https://wa.me/${wa}`}
          target="_blank"
          rel="noopener noreferrer"
          className="border border-border p-6 transition-colors hover:bg-card"
        >
          <MessageCircle className="size-6 text-lime" />
          <p className="label-tag mt-4">WhatsApp</p>
          <p className="mt-1 text-sm text-muted-foreground">{phone}</p>
        </a>
        <a href={`tel:${phone.replace(/\s/g, "")}`} className="border border-border p-6 transition-colors hover:bg-card">
          <Phone className="size-6 text-lime" />
          <p className="label-tag mt-4">Call us</p>
          <p className="mt-1 text-sm text-muted-foreground">{phone}</p>
          {phoneAlt ? <p className="text-sm text-muted-foreground">{phoneAlt}</p> : null}
        </a>
        <a href={`mailto:${email}`} className="border border-border p-6 transition-colors hover:bg-card">
          <Mail className="size-6 text-lime" />
          <p className="label-tag mt-4">Email</p>
          <p className="mt-1 break-all text-sm text-muted-foreground">{email}</p>
        </a>
      </div>
    </SiteLayout>
  );
}
