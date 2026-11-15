import { supabase } from "@/integrations/supabase/client";

export type MemberCardRecord = {
  id: string;
  user_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  card_number: string;
  cvv: string;
  card_title: string;
  is_owner_card: boolean;
  balance: number;
  points: number;
  created_at: string;
};

export type CardTransaction = {
  id: string;
  card_id: string;
  product_name: string;
  category: string | null;
  color: string | null;
  size: string | null;
  quantity: number;
  amount: number;
  currency: string;
  points_earned: number;
  created_at: string;
};

export type CardCredit = {
  id: string;
  card_id: string;
  amount: number;
  points: number;
  note: string | null;
  created_at: string;
};

/** 1 point is earned per N$100 spent with a member card, and is worth N$2. */
export const POINTS_PER_SPEND = 100;
export const POINT_VALUE_NAD = 2;

export const pointsValue = (points: number) => Number(points || 0) * POINT_VALUE_NAD;

export function formatCardNumber(value: string) {
  return value.replace(/(.{4})/g, "$1 ").trim();
}

export function maskCardNumber(value: string) {
  return `•••• •••• •••• ${value.slice(-4)}`;
}

/** Creates the signed-in customer's card when missing, then returns it. */
export async function fetchOrIssueMyCard(fullName?: string, phone?: string) {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return null;

  const { error: rpcError } = await supabase.rpc("issue_my_card", {
    _full_name: fullName ?? "",
    _phone: phone ?? "",
  });
  if (rpcError) throw rpcError;

  const { data, error } = await supabase
    .from("customer_cards")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data as MemberCardRecord | null;
}

export async function fetchMyTransactions() {
  const { data, error } = await supabase
    .from("card_transactions")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as CardTransaction[];
}

export async function fetchMyCredits() {
  const { data, error } = await supabase
    .from("card_credits")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as CardCredit[];
}

/* ------------------------------- owner views ------------------------------- */

export async function fetchAllCards() {
  const { data, error } = await supabase
    .from("customer_cards")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as MemberCardRecord[];
}

export async function fetchAllTransactions() {
  const { data, error } = await supabase
    .from("card_transactions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(300);
  if (error) throw error;
  return (data ?? []) as CardTransaction[];
}

export async function addCredit(cardId: string, amount: number, note: string) {
  const { data, error } = await supabase.rpc("admin_add_credit", {
    _card_id: cardId,
    _amount: amount,
    _note: note,
  });
  if (error) throw error;
  return Number(data);
}

export async function addPoints(cardId: string, points: number, note: string) {
  const { data, error } = await supabase.rpc("admin_add_points", {
    _card_id: cardId,
    _points: points,
    _note: note,
  });
  if (error) throw error;
  return Number(data);
}

export async function redeemPoints(cardId: string, points: number) {
  const { data, error } = await supabase.rpc("admin_redeem_points", {
    _card_id: cardId,
    _points: points,
  });
  if (error) throw error;
  return data as unknown as { points: number; balance: number };
}

export type SpendResult = {
  ok: boolean;
  error?: string;
  amount?: number;
  balance?: number;
  points_earned?: number;
  points?: number;
};

export async function payWithCard(input: {
  cardNumber: string;
  cvv: string;
  productId: string;
  quantity: number;
  color: string;
  size: string;
}) {
  const { data, error } = await supabase.rpc("spend_card", {
    _card_number: input.cardNumber,
    _cvv: input.cvv,
    _product_id: input.productId,
    _quantity: input.quantity,
    _color: input.color,
    _size: input.size,
  });
  if (error) throw error;
  return data as unknown as SpendResult;
}
