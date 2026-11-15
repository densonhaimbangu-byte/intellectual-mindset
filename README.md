# Intellectual Mindset Clothing

Storefront + owner dashboard (products, prices, images, PDFs, orders) for the Intellectual Mindset brand.
Stack: TanStack Start (React 19) · Tailwind 4 · Supabase (database, auth, storage) · Nitro.

Contact: Intellectualmindsetclothing@gmail.com · +264 85 772 6474

## Run locally
```sh
cp .env.example .env     # fill in your own Supabase values
npm install
npm run dev
```

## Moving the backend to YOUR OWN Supabase (one-time)
1. Create a free project at supabase.com. Put its URL, publishable key and service-role key in `.env` and your host's environment variables.
2. Apply the schema: `npx supabase link --project-ref <ref>` then `npx supabase db push` (runs everything in `supabase/migrations`).
3. Storage buckets `product-images` and `documents` must exist (public read). Create them in the dashboard if the migrations didn't.
4. Auth > Providers > Google: create your own Google OAuth client (console.cloud.google.com) and paste its ID/secret. Auth > URL Configuration: set Site URL to your domain and add `https://yourdomain.com/auth` as a redirect URL.
5. Sign up with Intellectualmindsetclothing@gmail.com (migrations auto-grant that email the admin role).
6. Re-add your products/images/PDFs in the dashboard, or export/import the tables and storage files from the old project.

## Deploy to your domain
Vercel, Netlify or Cloudflare all work (Nitro auto-detects them). Connect the Git repo, add the env vars from `.env.example`,
then add your domain in the host's Domains settings and point DNS at it. Set `VITE_SITE_URL` to `https://yourdomain.com`.
