import { useRef, useState } from "react";
import { Download, Stamp } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import type { OrderRecord } from "@/lib/orders";
import { orderPaymentState, orderReference } from "@/lib/order-slips";
import { formatPrice } from "@/lib/store";

export function OrderSlip({ order }: { order: OrderRecord }) {
  const ref = useRef<HTMLElement>(null);
  const [saving, setSaving] = useState(false);
  async function download() {
    if (!ref.current) return;
    setSaving(true);
    try {
      await document.fonts.ready;
      const { toPng } = await import("html-to-image");
      const url = await toPng(ref.current, { pixelRatio: 3 });
      const a = document.createElement("a");
      a.href = url;
      a.download = `${orderReference(order.id)}.png`;
      a.click();
    } catch { toast.error("Could not save the image. You can still take a screenshot."); }
    finally { setSaving(false); }
  }
  return <div className="mx-auto w-full max-w-lg">
    <article ref={ref} aria-label="Order slip" className="order-slip overflow-hidden rounded-md border border-border bg-background text-foreground">
      <header className="bg-ink px-6 py-6 text-ink-foreground">
        <p className="text-[10px] font-semibold uppercase">Namibia · Intellectual Mindset Clothing</p>
        <p className="mt-3 font-display text-4xl leading-none">INTELLECTUAL<br /><span className="text-lime">MINDSET</span></p>
        <div className="mt-5 flex items-center justify-between border-t border-ink-foreground/20 pt-4">
          <h2 className="text-xl">Order slip</h2><span className="rounded-sm bg-lime px-2 py-1 text-xs font-semibold text-lime-foreground">{order.status.replace(/_/g, " ")}</span>
        </div>
      </header>
      <div className="space-y-5 px-6 py-5">
        <div className="flex flex-wrap justify-between gap-2 text-xs">
          <div><p className="text-muted-foreground">Order reference</p><p className="mt-1 max-w-full break-all font-mono text-[10px] font-semibold">{orderReference(order.id)}</p></div>
          <div><p className="text-muted-foreground">Issued</p><p className="mt-1">{new Date(order.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</p></div>
        </div>
        <div className="border-t border-dashed border-border pt-4"><p className="text-[10px] uppercase text-muted-foreground">Prepared for</p><p className="mt-1 break-words text-lg font-bold">{order.customer_name}</p><p className="mt-1 break-words text-xs text-muted-foreground">{order.phone}</p>{order.email ? <p className="break-all text-xs text-muted-foreground">{order.email}</p> : null}</div>
        <div className="border-y border-dashed border-border py-4">
          <p className="break-words text-sm font-bold uppercase">{order.product_name}</p>
          <p className="mt-1 break-words text-xs text-muted-foreground">{[order.color, order.size].filter(Boolean).join(" · ")}</p>
          <div className="mt-3 flex justify-between gap-2 text-xs"><span>{order.quantity} × {formatPrice(Number(order.amount) / order.quantity, order.currency)}</span><span className="font-semibold">{formatPrice(Number(order.amount), order.currency)}</span></div>
        </div>
        <div className="flex items-end justify-between gap-3"><span className="text-xs uppercase text-muted-foreground">Order total</span><strong className="text-2xl">{formatPrice(Number(order.amount), order.currency)}</strong></div>
        <div className="flex items-center justify-between gap-4 border-t border-border pt-4">
          <div className="min-w-0 text-xs"><p className="font-semibold">{orderPaymentState(order)}</p><p className="mt-1 text-muted-foreground">{order.payment_method === "bank_card" ? "Bank card" : order.payment_method === "crypto" ? "Crypto" : "Order request"}</p><p className="mt-2 text-muted-foreground">Keep your reference for enquiries.</p></div>
          <div aria-label="Intellectual Mindset brand stamp" className="brand-stamp flex size-24 shrink-0 flex-col items-center justify-center rounded-full border-2 border-current text-center">
            <span className="max-w-[72px] text-[6px] font-bold uppercase">Intellectual Mindset</span><Stamp className="my-1 size-5" /><span className="text-[9px] font-bold uppercase">Brand issued</span><span className="mt-1 text-[6px] uppercase">Clothing · Namibia</span>
          </div>
        </div>
        {order.note ? <p className="break-words border-t border-border pt-3 text-xs text-muted-foreground">Note: {order.note}</p> : null}
        <p className="text-center text-[10px] text-muted-foreground">Thank you for choosing Intellectual Mindset.</p>
      </div>
      <div className="h-2 bg-lime" />
    </article>
    <Button onClick={() => void download()} disabled={saving} className="mt-4 w-full"><Download className="size-4" />{saving ? "Saving…" : "Save slip image"}</Button>
  </div>;
}

export function OrderSlipDialog({ order, onClose }: { order: OrderRecord | null; onClose: () => void }) {
  return <Dialog open={Boolean(order)} onOpenChange={(open) => { if (!open) onClose(); }}><DialogContent aria-describedby={undefined} className="z-[60] max-h-[95dvh] w-[calc(100%-1rem)] overflow-y-auto p-4"><DialogTitle className="sr-only">Your Intellectual Mindset order slip</DialogTitle>{order ? <OrderSlip order={order} /> : null}</DialogContent></Dialog>;
}