import { supabase } from "@/integrations/supabase/client";

export const CATEGORIES = [
  { slug: "hoodies", label: "Hoodies" },
  { slug: "tshirts", label: "T-Shirts" },
  { slug: "socks", label: "Socks" },
  { slug: "stickers", label: "Stickers" },
] as const;

export type CategorySlug = (typeof CATEGORIES)[number]["slug"];

export type Category = {
  id: string;
  slug: string;
  label: string;
  sort_order: number;
  is_visible: boolean;
};

export const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const PAGE = 1000;

/** Fetch every row in pages so the store can hold unlimited products/categories. */
async function fetchAllPages<T>(
  build: (from: number, to: number) => PromiseLike<{ data: unknown; error: { message: string } | null }>,
) {
  const rows: T[] = [];
  for (let page = 0; ; page += 1) {
    const { data, error } = await build(page * PAGE, page * PAGE + PAGE - 1);
    if (error) throw new Error(error.message);
    const batch = (data ?? []) as T[];
    rows.push(...batch);
    if (batch.length < PAGE) break;
  }
  return rows;
}

export async function fetchCategories(onlyVisible = true) {
  return fetchAllPages<Category>((from, to) => {
    let query = supabase
      .from("categories")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("label", { ascending: true })
      .range(from, to);
    if (onlyVisible) query = query.eq("is_visible", true);
    return query;
  });
}

export type Product = {
  id: string;
  name: string;
  category: string;
  description: string | null;
  price: number;
  compare_price: number | null;
  currency: string;
  image_url: string | null;
  gallery: string[];
  sizes: string[];
  colors: string[];
  is_featured: boolean;
  is_visible: boolean;
  sort_order: number;
};

export type StoreDocument = {
  id: string;
  title: string;
  description: string | null;
  file_url: string;
  is_visible: boolean;
  sort_order: number;
};

export const categoryLabel = (slug: string) =>
  CATEGORIES.find((c) => c.slug === slug)?.label ?? slug;

export function formatPrice(price: number, currency = "NAD") {
  const symbol = currency === "NAD" ? "N$" : `${currency} `;
  return `${symbol}${Number(price).toFixed(2)}`;
}

/** Resolve a stored value to a viewable URL (external URL or signed storage path). */
export async function resolveFileUrl(bucket: string, value: string | null) {
  if (!value) return null;
  if (/^https?:\/\//.test(value)) return value;
  // Owner (admin) can sign any store file directly.
  const { data } = await supabase.storage.from(bucket).createSignedUrl(value, 60 * 60);
  if (data?.signedUrl) return data.signedUrl;
  if (bucket !== "product-images" && bucket !== "documents") return null;
  const { getPublicFileUrl } = await import("@/lib/public-files.functions");
  const res = await getPublicFileUrl({ data: { bucket, path: value } });
  return res.url;
}

export async function fetchVisibleProducts() {
  return fetchAllPages<Product>((from, to) =>
    supabase
      .from("products")
      .select("*")
      .eq("is_visible", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false })
      .range(from, to),
  );
}

export async function fetchAllProducts() {
  return fetchAllPages<Product>((from, to) =>
    supabase
      .from("products")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false })
      .range(from, to),
  );
}

export async function fetchDocuments(onlyVisible = true) {
  let query = supabase.from("documents").select("*").order("sort_order", { ascending: true });
  if (onlyVisible) query = query.eq("is_visible", true);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as StoreDocument[];
}

export async function fetchSettings() {
  const { data, error } = await supabase.from("site_settings").select("key, value");
  if (error) throw error;
  const map: Record<string, string> = {};
  for (const row of data ?? []) map[row.key] = row.value ?? "";
  return map;
}

export const SETTING_FIELDS = [
  { key: "announcement", label: "Announcement bar" },
  { key: "hero_kicker", label: "Hero kicker" },
  { key: "hero_title_line1", label: "Hero headline line 1" },
  { key: "hero_title_line2", label: "Hero headline line 2 (lime)" },
  { key: "hero_subtitle", label: "Hero subtitle" },
  { key: "about", label: "About the brand" },
  { key: "email", label: "Contact email" },
  { key: "phone", label: "Phone" },
  { key: "phone_alt", label: "Phone (alternative)" },
] as const;
