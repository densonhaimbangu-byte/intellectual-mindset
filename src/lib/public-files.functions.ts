import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  bucket: z.enum(["product-images", "documents"]),
  path: z.string().min(1).max(500),
});

/** Signs a storage file only when it belongs to published store content. */
export const getPublicFileUrl = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { bucket, path } = data;
    let allowed = false;
    if (bucket === "documents") {
      const { data: row } = await supabaseAdmin
        .from("documents").select("id").eq("is_visible", true).eq("file_url", path).limit(1);
      allowed = Boolean(row?.length);
    } else {
      const { data: main } = await supabaseAdmin
        .from("products").select("id").eq("is_visible", true).eq("image_url", path).limit(1);
      allowed = Boolean(main?.length);
      if (!allowed) {
        const { data: gal } = await supabaseAdmin
          .from("products").select("id").eq("is_visible", true).contains("gallery", [path]).limit(1);
        allowed = Boolean(gal?.length);
      }
      if (!allowed) {
        const { data: poster } = await supabaseAdmin
          .from("posters").select("id").eq("is_active", true).eq("image_url", path).limit(1);
        allowed = Boolean(poster?.length);
      }
    }
    if (!allowed) return { url: null as string | null };
    const { data: signed } = await supabaseAdmin.storage.from(bucket).createSignedUrl(path, 3600);
    return { url: signed?.signedUrl ?? null };
  });
