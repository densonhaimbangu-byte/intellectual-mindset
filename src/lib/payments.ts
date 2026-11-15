import { supabase } from "@/integrations/supabase/client";
import { saveLocalSlip } from "@/lib/order-slips";
import type { OrderRecord } from "@/lib/orders";

export type OnlinePayInput = {
  method: "bank_card" | "crypto";
  productId: string;
  quantity: number;
  color: string;
  size: string;
  customerName: string;
  phone: string;
  email: string;
  note: string;
};

/** Creates a pending order on the server and returns the hosted payment page URL. */
export async function startOnlinePayment(input: OnlinePayInput): Promise<string> {
  const { data: session } = await supabase.auth.getSession();
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (session.session) headers["Authorization"] = `Bearer ${session.session.access_token}`;
  const res = await fetch("/api/payments/checkout", {
    method: "POST",
    headers,
    body: JSON.stringify(input),
  });
  const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string; order?: OrderRecord };
  if (!res.ok || !data.url) throw new Error(data.error ?? "Could not start payment");
  if (data.order) saveLocalSlip(data.order);
  return data.url;
}
