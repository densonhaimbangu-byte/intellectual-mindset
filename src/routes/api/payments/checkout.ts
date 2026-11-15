import { createFileRoute } from "@tanstack/react-router";

type Body = {
  method?: string;
  productId?: string;
  quantity?: number;
  color?: string;
  size?: string;
  customerName?: string;
  phone?: string;
  email?: string;
  note?: string;
};

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json" } });

export const Route = createFileRoute("/api/payments/checkout")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const b = (await request.json().catch(() => ({}))) as Body;
        if (b.method !== "bank_card" && b.method !== "crypto") return json({ error: "Invalid payment method" }, 400);
        if (!b.productId || !b.customerName?.trim() || !b.phone?.trim())
          return json({ error: "Name and phone are required" }, 400);

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const bearer = request.headers.get("authorization");
        const token = bearer?.startsWith("Bearer ") ? bearer.slice(7) : null;
        const user = token ? await supabaseAdmin.auth.getUser(token) : null;
        if (token && !user?.data.user) return json({ error: "Please sign in again" }, 401);
        const pay = await import("@/lib/payments.server");

        // Price always comes from the database, never from the browser.
        const { data: product } = await supabaseAdmin
          .from("products")
          .select("id, name, category, price, currency")
          .eq("id", b.productId)
          .eq("is_visible", true)
          .maybeSingle();
        if (!product) return json({ error: "Product not available" }, 404);

        const quantity = Math.min(100, Math.max(1, Math.floor(Number(b.quantity) || 1)));
        const unit = Number(product.price);
        const total = unit * quantity;
        const origin = new URL(request.url).origin;

        const { data: order, error } = await supabaseAdmin
          .from("orders")
          .insert({
            user_id: user?.data.user?.id ?? null,
            product_id: product.id,
            product_name: product.name,
            category: product.category,
            color: b.color?.trim() || null,
            size: b.size?.trim() || null,
            quantity,
            amount: total,
            currency: product.currency,
            customer_name: b.customerName.trim().slice(0, 120),
            phone: b.phone.trim().slice(0, 40),
            email: b.email?.trim().slice(0, 200) || null,
            note: b.note?.trim().slice(0, 500) || null,
            payment_method: b.method,
            status: "awaiting_payment",
          })
          .select("*")
          .single();
        if (error || !order) return json({ error: "Could not create your order" }, 500);

        try {
          const result =
            b.method === "bank_card"
              ? await pay.createHandyPaySession({
                  orderId: order.id,
                  name: product.name,
                  currency: product.currency,
                  unitAmount: unit,
                  quantity,
                  email: b.email?.trim() || null,
                  origin,
                  productId: product.id,
                })
              : await pay.createCryptoInvoice({
                  orderId: order.id,
                  name: `${product.name} x${quantity}`,
                  amount: total,
                  currency: product.currency,
                  origin,
                  productId: product.id,
                });
          return json({ url: result.url, order });
        } catch (e) {
          await supabaseAdmin.from("orders").update({ status: "cancelled" }).eq("id", order.id);
          return json({ error: e instanceof Error ? e.message : "Payment could not start" }, 502);
        }
      },
    },
  },
});
