import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { FileText } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { OrderSlipDialog } from "@/components/site/OrderSlip";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import type { OrderRecord } from "@/lib/orders";
import { mergeSlips, orderPaymentState, readLocalSlips } from "@/lib/order-slips";
import { formatPrice } from "@/lib/store";

export const Route = createFileRoute("/orders")({
  head: () => ({ meta: [
    { title: "My Order Slips | Intellectual Mindset Clothing" },
    { name: "description", content: "View and save your stamped Intellectual Mindset Clothing order slips." },
    { property: "og:title", content: "Order Slips | Intellectual Mindset Clothing" },
    { property: "og:description", content: "Your Intellectual Mindset order details and branded slips." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }, { name: "robots", content: "noindex" },
  ] }), component: Orders,
});

function Orders() {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [selected, setSelected] = useState<OrderRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  useEffect(() => {
    let active = true;
    async function load() {
      const local = readLocalSlips();
      if (active) setOrders(local);
      try {
        const { data } = await supabase.auth.getUser();
        if (data.user) {
          const result = await supabase.from("orders").select("*").eq("user_id", data.user.id).order("created_at", { ascending: false });
          if (result.error) throw result.error;
          if (active) setOrders(mergeSlips(local, result.data as OrderRecord[]));
        }
      } catch { if (active) setError(true); }
      finally { if (active) setLoading(false); }
    }
    void load();
    return () => { active = false; };
  }, []);
  return <SiteLayout><section className="mx-auto max-w-5xl px-4 py-10">
    <p className="text-xs uppercase text-muted-foreground">Intellectual Mindset Clothing</p><h1 className="mt-3 text-4xl">My order slips</h1>
    {loading ? <p className="mt-8 text-sm">Loading orders…</p> : null}
    {error ? <p role="alert" className="mt-6 text-sm text-destructive">Could not refresh your orders. Saved slips are still available.</p> : null}
    {!loading && !orders.length ? <div className="py-16 text-center"><FileText className="mx-auto size-10 text-muted-foreground" /><p className="mt-4 text-sm">No order slips yet.</p><Button asChild className="mt-5"><Link to="/shop">Shop clothing</Link></Button><p className="mt-4 text-xs text-muted-foreground"><Link to="/auth" className="underline">Sign in</Link> to see your account orders.</p></div> : null}
    <div className="mt-8 divide-y divide-border">{orders.map((o) => <div key={o.id} className="flex flex-wrap items-center justify-between gap-4 py-5"><div className="min-w-0"><p className="break-words font-semibold">{o.product_name}</p><p className="mt-1 text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString("en-GB")} · {orderPaymentState(o)}</p><p className="mt-2 text-sm">{formatPrice(Number(o.amount), o.currency)}</p></div><Button variant="outline" onClick={() => setSelected(o)}><FileText className="size-4" />View slip</Button></div>)}</div>
    <OrderSlipDialog order={selected} onClose={() => setSelected(null)} />
  </section></SiteLayout>;
}