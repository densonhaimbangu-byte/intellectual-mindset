import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/payments/crypto-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json().catch(() => null)) as {
          order_id?: string;
          payment_status?: string;
        } | null;
        const { verifyNowPaymentsSignature } = await import("@/lib/payments.server");
        if (!body || !verifyNowPaymentsSignature(body, request.headers.get("x-nowpayments-sig")))
          return new Response("Bad signature", { status: 400 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        if (body.order_id) {
          if (body.payment_status === "finished") {
            await supabaseAdmin.from("orders").update({ status: "paid" }).eq("id", body.order_id);
          } else if (body.payment_status === "failed" || body.payment_status === "expired") {
            await supabaseAdmin.from("orders").update({ status: "cancelled" }).eq("id", body.order_id).eq("status", "awaiting_payment");
          }
        }
        return new Response("ok");
      },
    },
  },
});
