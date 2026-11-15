import { supabase } from "@/integrations/supabase/client";

export type OrderRecord = {
  id: string;
  user_id: string | null;
  product_id: string | null;
  product_name: string;
  category: string | null;
  color: string | null;
  size: string | null;
  quantity: number;
  amount: number;
  currency: string;
  customer_name: string;
  phone: string;
  email: string | null;
  note: string | null;
  payment_method: string;
  status: string;
  created_at: string;
};

export type NewOrderInput = {
  productId: string;
  productName: string;
  category: string | null;
  color: string;
  size: string;
  quantity: number;
  amount: number;
  currency: string;
  customerName: string;
  phone: string;
  email: string;
  note: string;
};

/** Issue a slip only after the order has been accepted. */
export async function placeOrder(input: NewOrderInput) {
  const { data: userData } = await supabase.auth.getUser();
  const order: OrderRecord = {
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    user_id: userData.user?.id ?? null,
    product_id: input.productId,
    product_name: input.productName,
    category: input.category,
    color: input.color || null,
    size: input.size || null,
    quantity: input.quantity,
    amount: input.amount,
    currency: input.currency,
    customer_name: input.customerName,
    phone: input.phone,
    email: input.email || null,
    note: input.note || null,
    payment_method: "request",
    status: "new",
  };
  const { error } = await supabase.from("orders").insert(order);
  if (error) throw error;
  return order;
}

export async function fetchAllOrders() {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(300);
  if (error) throw error;
  return (data ?? []) as OrderRecord[];
}

export async function setOrderStatus(id: string, status: string) {
  const { error } = await supabase.from("orders").update({ status }).eq("id", id);
  if (error) throw error;
}

/** Human-readable WhatsApp order message with product, options, quantity and price. */
export function buildOrderMessage(input: NewOrderInput) {
  const money = (v: number) => `N$${Number(v).toFixed(2)}`;
  const unit = input.quantity > 0 ? input.amount / input.quantity : input.amount;
  const lines: (string | null)[] = [
    "*NEW ORDER — Intellectual Mindset Clothing*",
    "",
    `*Item:* ${input.productName}`,
    input.category ? `*Category:* ${input.category}` : null,
    input.color ? `*Colour:* ${input.color}` : null,
    input.size ? `*Size:* ${input.size}` : null,
    `*Quantity:* ${input.quantity}`,
    `*Unit price:* ${money(unit)}`,
    `*Total:* ${money(input.amount)}`,
    "",
    `*Name:* ${input.customerName}`,
    `*Phone:* ${input.phone}`,
    input.email ? `*Email:* ${input.email}` : null,
    input.note ? `*Note:* ${input.note}` : null,
    "",
    "Please confirm availability and payment details.",
  ];
  return lines.filter((l): l is string => l !== null).join("\n");
}

export function whatsappOrderUrl(ownerPhone: string, input: NewOrderInput) {
  const number = ownerPhone.replace(/[^0-9]/g, "");
  return `https://wa.me/${number}?text=${encodeURIComponent(buildOrderMessage(input))}`;
}
