import { createFileRoute } from "@tanstack/react-router";

// TODO: adjust field names/statuses to match HandyPay's webhook payload.
export const Route = createFileRoute("/api/payments/handypay-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const raw = await request.text();
        const { verifyHandyPaySignature } = await import("@/lib/payments.server");
        if (!verifyHandyPaySignature(raw, request.headers.get("x-handypay-signature")))
          return new Response("Bad signature", { status: 400 });

        const event = JSON.parse(raw) as { reference?: string; status?: string };
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        if (event.reference) {
          if (event.status === "paid" || event.status === "success") {
            await supabaseAdmin.from("orders").update({ status: "paid" }).eq("id", event.reference);
          } else if (event.status === "failed" || event.status === "expired" || event.status === "cancelled") {
            await supabaseAdmin.from("orders").update({ status: "cancelled" }).eq("id", event.reference).eq("status", "awaiting_payment");
          }
        }
        return new Response("ok");
      },
    },
  },
});
