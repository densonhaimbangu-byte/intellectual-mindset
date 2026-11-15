import { supabase } from "@/integrations/supabase/client";

export type Poster = {
  id: string;
  title: string;
  message: string | null;
  image_url: string | null;
  link_url: string | null;
  is_active: boolean;
  sort_order: number;
};

/** Posters currently posted (visible to everyone). */
export async function fetchActivePosters() {
  const { data, error } = await supabase
    .from("posters")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Poster[];
}

/** Every poster, posted or not (owner only). */
export async function fetchAllPosters() {
  const { data, error } = await supabase
    .from("posters")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Poster[];
}

export async function createPoster(input: {
  title: string;
  message?: string | null;
  image_url?: string | null;
  link_url?: string | null;
  is_active?: boolean;
}) {
  const { error } = await supabase.from("posters").insert({
    title: input.title,
    message: input.message ?? null,
    image_url: input.image_url ?? null,
    link_url: input.link_url ?? null,
    is_active: input.is_active ?? false,
  });
  if (error) throw error;
}

export async function updatePoster(id: string, patch: Partial<Poster>) {
  const { error } = await supabase.from("posters").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deletePoster(id: string) {
  const { error } = await supabase.from("posters").delete().eq("id", id);
  if (error) throw error;
}
