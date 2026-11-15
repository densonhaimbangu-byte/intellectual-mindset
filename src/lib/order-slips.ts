import type { OrderRecord } from "@/lib/orders";

const STORAGE_KEY = "intellectual-mindset-order-slips";

export function orderReference(id: string) {
  return `IM-${id.replace(/-/g, "").toUpperCase()}`;
}

export function orderPaymentState(order: Pick<OrderRecord, "status">) {
  return ["paid", "done"].includes(order.status) ? "Payment confirmed" : order.status === "cancelled" ? "Cancelled" : "Payment not confirmed";
}

export function readLocalSlips(): OrderRecord[] {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(saved) ? saved.filter((o): o is OrderRecord => Boolean(o && typeof o === "object" && typeof o.id === "string" && typeof o.product_name === "string")) : [];
  } catch { return []; }
}

export function saveLocalSlip(order: OrderRecord) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([order, ...readLocalSlips().filter((o) => o.id !== order.id)].slice(0, 50)));
  } catch { /* The visible slip remains available when browser storage is full. */ }
}

export function mergeSlips(local: OrderRecord[], current: OrderRecord[]) {
  const orders = new Map(local.map((o) => [o.id, o]));
  for (const order of current) orders.set(order.id, order);
  return [...orders.values()].sort((a, b) => b.created_at.localeCompare(a.created_at));
}