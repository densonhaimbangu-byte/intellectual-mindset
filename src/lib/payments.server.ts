import { createHmac, timingSafeEqual } from "node:crypto";

export type PayMethod = "bank_card" | "crypto";

const env = (k: string) => process.env[k]?.trim() || "";

export function safeEqual(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/**
 * HandyPay hosted checkout.
 * TODO: fill in using HandyPay's API docs (endpoint, auth header, request fields,
 * response field holding the payment URL). Env vars: HANDYPAY_API_KEY, HANDYPAY_API_URL.
 */
export async function createHandyPaySession(o: {
  orderId: string;
  name: string;
  currency: string;
  unitAmount: number;
  quantity: number;
  email?: string | null;
  origin: string;
  productId: string;
}) {
  const key = env("HANDYPAY_API_KEY");
  const apiUrl = env("HANDYPAY_API_URL");
  if (!key || !apiUrl) throw new Error("Card payments are not configured yet (HANDYPAY_API_KEY / HANDYPAY_API_URL missing)");
  const res = await fetch(apiUrl, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      reference: o.orderId,
      description: o.name,
      amount: Math.round(o.unitAmount * o.quantity * 100) / 100,
      currency: o.currency,
      customer_email: o.email ?? undefined,
      success_url: `${o.origin}/product/${o.productId}?paid=1`,
      cancel_url: `${o.origin}/product/${o.productId}?cancelled=1`,
      callback_url: `${o.origin}/api/payments/handypay-webhook`,
    }),
  });
  const json = (await res.json().catch(() => ({}))) as { id?: string; url?: string; message?: string };
  if (!res.ok || !json.url) throw new Error(json.message ?? "Could not start card payment");
  return { url: json.url, reference: json.id ?? "" };
}

/** TODO: replace with HandyPay's real webhook signature check. */
export function verifyHandyPaySignature(raw: string, header: string | null) {
  const secret = env("HANDYPAY_WEBHOOK_SECRET");
  if (!secret || !header) return false;
  const expected = createHmac("sha256", secret).update(raw).digest("hex");
  return safeEqual(expected, header);
}

/** NOWPayments hosted invoice (BTC, ETH, USDT, etc. — customer picks the coin). */
export async function createCryptoInvoice(o: {
  orderId: string;
  name: string;
  amount: number;
  currency: string;
  origin: string;
  productId: string;
}) {
  const key = env("NOWPAYMENTS_API_KEY");
  if (!key) throw new Error("Crypto payments are not configured yet (NOWPAYMENTS_API_KEY missing)");
  let priceCurrency = (env("CRYPTO_PRICE_CURRENCY") || "usd").toLowerCase();
  let price = o.amount;
  if (o.currency.toUpperCase() === "NAD") {
    const rate = Number(env("NAD_PER_USD"));
    if (!rate) throw new Error("Set NAD_PER_USD (e.g. 18.5) so crypto prices can be converted");
    price = Math.round((o.amount / rate) * 100) / 100;
    priceCurrency = "usd";
  } else {
    priceCurrency = o.currency.toLowerCase();
  }
  const res = await fetch("https://api.nowpayments.io/v1/invoice", {
    method: "POST",
    headers: { "x-api-key": key, "Content-Type": "application/json" },
    body: JSON.stringify({
      price_amount: price,
      price_currency: priceCurrency,
      order_id: o.orderId,
      order_description: o.name,
      ipn_callback_url: `${o.origin}/api/payments/crypto-webhook`,
      success_url: `${o.origin}/product/${o.productId}?paid=1`,
      cancel_url: `${o.origin}/product/${o.productId}?cancelled=1`,
    }),
  });
  const json = (await res.json()) as { id?: string | number; invoice_url?: string; message?: string };
  if (!res.ok || !json.invoice_url) throw new Error(json.message ?? "Could not start crypto payment");
  return { url: json.invoice_url, reference: String(json.id ?? "") };
}

const sortKeys = (v: unknown): unknown =>
  Array.isArray(v)
    ? v.map(sortKeys)
    : v && typeof v === "object"
      ? Object.fromEntries(
          Object.keys(v as object)
            .sort()
            .map((k) => [k, sortKeys((v as Record<string, unknown>)[k])]),
        )
      : v;

export function verifyNowPaymentsSignature(body: unknown, sig: string | null) {
  const secret = env("NOWPAYMENTS_IPN_SECRET");
  if (!secret || !sig) return false;
  const expected = createHmac("sha512", secret).update(JSON.stringify(sortKeys(body))).digest("hex");
  return safeEqual(expected, sig);
}
