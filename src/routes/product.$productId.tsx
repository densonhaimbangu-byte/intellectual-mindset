import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { Bitcoin, CreditCard, Heart, RotateCcw, ShieldCheck, Shirt, ShoppingBag, Star, Truck, X, ZoomIn } from "lucide-react";
import { useFavorite } from "@/hooks/useFavorites";
import { ProductCard } from "@/components/site/ProductCard";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStoreImage } from "@/hooks/useStoreImage";
import { supabase } from "@/integrations/supabase/client";
import { OrderSlipDialog } from "@/components/site/OrderSlip";
import { saveLocalSlip } from "@/lib/order-slips";
import type { OrderRecord } from "@/lib/orders";
import { startOnlinePayment } from "@/lib/payments";
import { placeOrder, whatsappOrderUrl } from "@/lib/orders";
import { categoryLabel, fetchSettings, fetchVisibleProducts, formatPrice, type Product } from "@/lib/store";

export const Route = createFileRoute("/product/$productId")({
  head: () => ({
    meta: [
      { title: "Product | Intellectual Mindset Clothing" },
      {
        name: "description",
        content:
          "Choose your colour and size, place an order and receive a branded order slip.",
      },
      { property: "og:title", content: "Intellectual Mindset Clothing product" },
      {
        property: "og:description",
        content: "Shop Intellectual Mindset clothing and get your own order slip.",
      },
      { property: "og:type", content: "product" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProductPage,
  errorComponent: () => (
    <SiteLayout>
      <p className="mx-auto max-w-3xl px-4 py-16 text-sm text-muted-foreground">
        This product could not be loaded.
      </p>
    </SiteLayout>
  ),
  notFoundComponent: () => (
    <SiteLayout>
      <p className="mx-auto max-w-3xl px-4 py-16 text-sm text-muted-foreground">
        Product not found.
      </p>
    </SiteLayout>
  ),
});

async function fetchProduct(id: string) {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .eq("is_visible", true)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as Product | null;
}

function Thumb({
  path,
  active,
  onSelect,
}: {
  path: string;
  active: boolean;
  onSelect: () => void;
}) {
  const url = useStoreImage("product-images", path);
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-label="View this image"
      aria-pressed={active}
      className={`relative aspect-square overflow-hidden rounded-md bg-secondary ${
        active ? "ring-2 ring-lime" : "border border-border"
      }`}
    >
      {url ? <img src={url} alt="" className="size-full object-cover" /> : null}
    </button>
  );
}

function ProductPage() {
  const { productId } = useParams({ from: "/product/$productId" });
  const { data: product, isPending } = useQuery({
    queryKey: ["product", productId],
    queryFn: () => fetchProduct(productId),
  });
  const { data: settings } = useQuery({ queryKey: ["settings"], queryFn: fetchSettings });
  const { data: allProducts } = useQuery({
    queryKey: ["products", "visible"],
    queryFn: fetchVisibleProducts,
  });
  const [tab, setTab] = useState<"details" | "size" | "shipping">("details");
  const { liked, toggle: toggleLiked } = useFavorite(productId);
  const [zoom, setZoom] = useState(false);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const gallery = [product?.image_url, ...(product?.gallery ?? [])].filter(
    (v): v is string => Boolean(v),
  );
  const image = useStoreImage("product-images", activeImage ?? product?.image_url ?? null);

  const [color, setColor] = useState("");
  const [size, setSize] = useState("");
  const [quantityInput, setQuantityInput] = useState("1");
  const quantity = Math.max(1, Math.floor(Number(quantityInput) || 1));

  const [slip, setSlip] = useState<OrderRecord | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [ordering, setOrdering] = useState(false);
  const [onlineBusy, setOnlineBusy] = useState<"bank_card" | "crypto" | null>(null);


  useEffect(() => {
    if (!product) return;
    if (!color && product.colors.length) setColor(product.colors[0] ?? "");
    if (!size && product.sizes.length) setSize(product.sizes[0] ?? "");
  }, [product, color, size]);

  async function submitOrder(e: React.FormEvent) {
    e.preventDefault();
    if (!product) return;
    setOrdering(true);
    const payload = {
      productId: product.id,
      productName: product.name,
      category: product.category,
      color,
      size,
      quantity,
      amount: Number(product.price) * quantity,
      currency: product.currency,
      customerName,
      phone,
      email,
      note,
    };
    try {
      const order = await placeOrder(payload);
      saveLocalSlip(order);
      setSlip(order);
      const ownerPhone = settings?.["phone"] ?? "+264 857726474";
      window.open(whatsappOrderUrl(ownerPhone, payload), "_blank", "noopener,noreferrer");
      toast.success("Order saved — your slip is ready");
      setNote("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send your order");
    } finally {
      setOrdering(false);
    }
  }

  async function payOnline(method: "bank_card" | "crypto") {
    if (!product) return;
    if (!customerName.trim() || !phone.trim()) {
      toast.error("Enter your name and phone first");
      return;
    }
    setOnlineBusy(method);
    try {
      const url = await startOnlinePayment({
        method,
        productId: product.id,
        quantity,
        color,
        size,
        customerName,
        phone,
        email,
        note,
      });
      window.location.href = url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not start payment");
      setOnlineBusy(null);
    }
  }

  if (isPending) {
    return (
      <SiteLayout>
        <p className="mx-auto max-w-5xl px-4 py-16 text-sm text-muted-foreground">Loading…</p>
      </SiteLayout>
    );
  }

  if (!product) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-5xl px-4 py-16">
          <h1 className="text-3xl uppercase">Product not available</h1>
          <Link to="/shop" className="label-tag mt-4 inline-block text-lime-foreground underline">
            Back to shop
          </Link>
        </div>
      </SiteLayout>
    );
  }

  const total = Number(product.price) * quantity;

  return (
    <SiteLayout>
      <OrderSlipDialog order={slip} onClose={() => setSlip(null)} />
      {zoom && image ? (
        <div
          role="dialog"
          aria-label="Full size photo"
          onClick={() => setZoom(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/95 p-4"
        >
          <button
            type="button"
            aria-label="Close"
            className="absolute right-4 top-4 grid size-10 place-items-center rounded-full bg-background text-foreground"
          >
            <X className="size-5" />
          </button>
          <img src={image} alt={product.name} className="max-h-full max-w-full object-contain" />
        </div>
      ) : null}
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-8 lg:grid-cols-[1.3fr_1fr]">
        <div className="flex gap-3">
          {gallery.length > 1 ? (
            <div className="flex w-20 shrink-0 flex-col gap-2">
              {gallery.map((path) => (
                <Thumb
                  key={path}
                  path={path}
                  active={(activeImage ?? product.image_url) === path}
                  onSelect={() => setActiveImage(path)}
                />
              ))}
            </div>
          ) : null}
          <div className="relative aspect-[4/5] min-w-0 flex-1 overflow-hidden rounded-md bg-secondary">
            {image ? (
              <button
                type="button"
                onClick={() => setZoom(true)}
                className="group size-full cursor-zoom-in"
                aria-label="Open full size photo"
              >
                <img src={image} alt={product.name} className="size-full object-contain" />
                <span className="absolute bottom-3 right-3 grid size-10 place-items-center rounded-full bg-background shadow">
                  <ZoomIn className="size-5" />
                </span>
              </button>
            ) : (
              <div className="flex size-full items-center justify-center">
                <Shirt className="size-12 text-muted-foreground/40" />
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <span className="label-tag rounded bg-secondary px-2 py-1 text-muted-foreground">
              {product.is_featured ? "New arrival" : categoryLabel(product.category)}
            </span>
            <h1 className="mt-3 font-sans text-3xl font-bold leading-tight sm:text-4xl">{product.name}</h1>
            <div className="mt-2 flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="size-4 fill-foreground" />
              ))}
            </div>
            <div className="mt-3 flex items-center gap-3">
              <p className="text-2xl font-bold">
                {formatPrice(product.price, product.currency)}
              </p>
              {product.compare_price && product.compare_price > product.price ? (
                <>
                  <p className="text-sm text-muted-foreground line-through">
                    {formatPrice(product.compare_price, product.currency)}
                  </p>
                  <span className="label-tag rounded bg-ink px-2 py-1 text-ink-foreground">
                    {Math.round((1 - product.price / product.compare_price) * 100)}% off
                  </span>
                </>
              ) : null}
            </div>
            {product.description ? (
              <p className="mt-4 text-sm text-muted-foreground">{product.description}</p>
            ) : null}
          </div>

          <div className="space-y-2">
              <p className="text-sm">
                <span className="font-semibold">Colour:</span> {color}
              </p>
              <div className="flex flex-wrap gap-3">
                {product.colors.map((c) => (
                  <button
                    key={c}
                    type="button"
                    title={c}
                    aria-label={c}
                    onClick={() => setColor(c)}
                    aria-pressed={color === c}
                    className={`size-10 rounded-full border border-border ring-offset-2 ring-offset-background ${
                      color === c ? "ring-2 ring-foreground" : ""
                    }`}
                    style={{ backgroundColor: c.toLowerCase().replace(/\s+/g, "") }}
                  />
                ))}
              </div>
              <div className="space-y-1 pt-1">
                <Label htmlFor="ownColour" className="text-xs text-muted-foreground">
                  Or type your own colour
                </Label>
                <Input
                  id="ownColour"
                  placeholder="e.g. burgundy, cream, sky blue"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                />
              </div>
            </div>

          {product.sizes.length ? (
            <div className="space-y-2">
              <p className="text-sm">
                <span className="font-semibold">Size:</span> {size}
              </p>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSize(s)}
                    aria-pressed={size === s}
                    className={`min-w-14 rounded-md px-4 py-2.5 text-sm font-medium ${
                      size === s ? "bg-ink text-ink-foreground" : "border border-border"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="qty" className="label-tag">
              Quantity
            </Label>
            <Input
              id="qty"
              type="number"
              min={1}
              inputMode="numeric"
              value={quantityInput}
              onChange={(e) => setQuantityInput(e.target.value)}
              onBlur={() => setQuantityInput(String(quantity))}
              className="w-24"
            />
          </div>

          <div className="flex gap-3">
            <a
              href="#order"
              className="flex flex-1 items-center justify-center gap-2 rounded-md bg-ink px-6 py-4 font-semibold text-ink-foreground"
            >
              <ShoppingBag className="size-5" /> Order now
            </a>
            <button
              type="button"
              aria-label="Save to favourites"
              aria-pressed={liked}
              onClick={toggleLiked}
              className="grid w-14 place-items-center rounded-md border border-border transition-transform active:scale-90"
            >
              <Heart className={`size-5 ${liked ? "fill-destructive text-destructive" : ""}`} />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs">
            {[
              { icon: Truck, t: "Nationwide delivery", b: "Windhoek & countrywide" },
              { icon: RotateCcw, t: "Easy exchanges", b: "Wrong size? We help" },
              { icon: ShieldCheck, t: "Secure payment", b: "Bank card or crypto" },
            ].map((x) => (
              <div key={x.t} className="flex items-start gap-1.5">
                <x.icon className="size-4 shrink-0" />
                <div>
                  <p className="font-semibold">{x.t}</p>
                  <p className="text-muted-foreground">{x.b}</p>
                </div>
              </div>
            ))}
          </div>

          <form id="order" onSubmit={submitOrder} className="scroll-mt-24 space-y-4 border border-border bg-card p-5">
            <div>
              <h2 className="text-2xl uppercase">Place your order</h2>
              <p className="text-xs text-muted-foreground">
                Anyone can order. Leave your details and we contact you to arrange payment and
                delivery. Total{" "}
                <span className="font-semibold text-foreground">
                  {formatPrice(total, product.currency)}
                </span>
                .
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="orderName" className="label-tag">
                  Your name
                </Label>
                <Input
                  id="orderName"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="orderPhone" className="label-tag">
                  Phone / WhatsApp
                </Label>
                <Input
                  id="orderPhone"
                  required
                  inputMode="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="orderEmail" className="label-tag">
                  Email (optional)
                </Label>
                <Input
                  id="orderEmail"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="orderNote" className="label-tag">
                  Note (optional)
                </Label>
                <Input id="orderNote" value={note} onChange={(e) => setNote(e.target.value)} />
              </div>
            </div>
            <Button
              type="submit"
              disabled={ordering}
              className="bg-lime text-lime-foreground hover:bg-lime/90"
            >
              <ShoppingBag className="size-4" />
              {ordering ? "Sending…" : `Place order · ${formatPrice(total, product.currency)}`}
            </Button>
            <div className="space-y-2 border-t border-border pt-4">
              <p className="label-tag">Or pay online now</p>
              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  disabled={onlineBusy !== null}
                  onClick={() => void payOnline("bank_card")}
                  className="bg-ink text-ink-foreground hover:bg-ink/90"
                >
                  <CreditCard className="size-4" />
                  {onlineBusy === "bank_card" ? "Redirecting…" : "Pay by bank card"}
                </Button>
                <Button type="button" variant="outline" disabled={onlineBusy !== null} onClick={() => void payOnline("crypto")}>
                  <Bitcoin className="size-4" />
                  {onlineBusy === "crypto" ? "Redirecting…" : "Pay with crypto"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                You are sent to a secure hosted page to pay. Card details never touch our site.
              </p>
            </div>
          </form>


        </div>
      </div>
      <div className="mx-auto max-w-6xl px-4 pb-10">
        <div className="flex gap-6 border-b border-border">
          {(
            [
              ["details", "Details"],
              ["size", "Size & Fit"],
              ["shipping", "Shipping & Exchanges"],
            ] as const
          ).map(([k, l]) => (
            <button
              key={k}
              type="button"
              onClick={() => setTab(k)}
              className={`-mb-px border-b-2 py-3 text-sm ${
                tab === k ? "border-foreground font-semibold" : "border-transparent text-muted-foreground"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
        <div className="max-w-2xl py-5 text-sm text-muted-foreground">
          {tab === "details" ? (
            <p>{product.description || "Premium Intellectual Mindset streetwear, built to last."}</p>
          ) : tab === "size" ? (
            <p>
              Available sizes: {product.sizes.length ? product.sizes.join(", ") : "one size"}. Download
              our size guides on the catalogue page, or ask our chat assistant for help.
            </p>
          ) : (
            <p>
              We deliver in Windhoek and countrywide by courier. If the size is wrong, contact us and
              we will help you exchange it.
            </p>
          )}
        </div>

        {(() => {
          const others = (allProducts ?? []).filter((p) => p.id !== product.id);
          const same = others.filter((p) => p.category === product.category);
          const picks = [...same, ...others.filter((p) => p.category !== product.category)].slice(0, 4);
          return picks.length ? (
            <section className="mt-8">
              <div className="flex items-end justify-between">
                <h2 className="font-sans text-2xl font-bold">You may also like</h2>
                <Link to="/shop" className="text-sm hover:underline">View all →</Link>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4">
                {picks.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </section>
          ) : null;
        })()}
      </div>
    </SiteLayout>
  );
}
