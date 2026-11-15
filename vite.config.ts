import { defineConfig, loadEnv } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { nitro } from "nitro/vite";

// Deploy target is chosen by Nitro. On Vercel / Netlify / Cloudflare it is auto-detected
// at build time; to force one, set NITRO_PRESET (e.g. vercel, netlify, cloudflare_module, node-server).
export default defineConfig(({ mode }) => {
  // Expose SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY to the browser as VITE_* too.
  const env = loadEnv(mode, process.cwd(), "");
  return {
    define: {
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(env["VITE_SUPABASE_URL"] ?? env["SUPABASE_URL"] ?? ""),
      "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(
        env["VITE_SUPABASE_PUBLISHABLE_KEY"] ?? env["SUPABASE_PUBLISHABLE_KEY"] ?? "",
      ),
    },
    resolve: { dedupe: ["react", "react-dom", "@tanstack/react-router", "@tanstack/react-start"] },
    plugins: [
      tsConfigPaths(),
      tanstackStart({ server: { entry: "server" } }),
      viteReact(),
      tailwindcss(),
      ...(mode === "production" ? [nitro()] : []),
    ],
  };
});
