import { useQuery } from "@tanstack/react-query";
import { CATEGORIES, fetchCategories, type Category } from "@/lib/store";

const FALLBACK: Category[] = CATEGORIES.map((c, i) => ({
  id: c.slug,
  slug: c.slug,
  label: c.label,
  sort_order: i + 1,
  is_visible: true,
}));

/** Visible categories for storefront navigation (falls back to defaults). */
export function useCategories() {
  const query = useQuery({
    queryKey: ["categories", "visible"],
    queryFn: () => fetchCategories(true),
  });
  const categories = query.data && query.data.length ? query.data : FALLBACK;
  return { categories, isPending: query.isPending };
}

/** All categories, including hidden ones (owner dashboard). */
export function useAllCategories() {
  return useQuery({
    queryKey: ["categories", "all"],
    queryFn: () => fetchCategories(false),
  });
}

export function useCategoryLabel() {
  const { categories } = useCategories();
  return (slug: string) => categories.find((c) => c.slug === slug)?.label ?? slug;
}
