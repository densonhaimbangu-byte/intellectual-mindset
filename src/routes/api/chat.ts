import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { createFileRoute } from "@tanstack/react-router";
import { streamText } from "ai";

type ChatMessage = { role: "user" | "assistant"; content: string };

const BRAND_RULES = `You are "Intellectual Mindset", the friendly assistant for the Intellectual Mindset Clothing brand.

You ONLY help with things about this brand:
- clothing products in the catalogue (hoodies, tees, socks, stickers and anything listed below)
- prices, colours, sizes and sizing advice
- how to order, delivery, payment and branded order slips
- contacting the brand and custom / bulk inquiries
- general brand and store information

If the question is not about this brand or its products, politely decline in one short sentence and offer to help with products, orders or sizing instead. Never answer general knowledge, coding, maths, news, medical, legal or personal questions.

Discount/member cards and points are no longer offered. Customers receive branded order slips after ordering; a slip is not proof of payment unless payment is confirmed.

Keep answers short (1-3 sentences), warm and confident. Never invent products, prices or policies that are not in the information below. If you do not know, tell the customer to contact the brand.`;

async function buildContext() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const [{ data: products }, { data: settings }] = await Promise.all([
    supabaseAdmin
      .from("products")
      .select("name, category, price, currency, colors, sizes, description")
      .eq("is_visible", true)
      .limit(60),
    supabaseAdmin.from("site_settings").select("key, value"),
  ]);

  const catalogue = (products ?? [])
    .map(
      (p) =>
        `- ${p.name} (${p.category}) — ${p.currency} ${p.price}; colours: ${(p.colors ?? []).join(", ") || "ask"}; sizes: ${(p.sizes ?? []).join(", ") || "one size"}. ${p.description ?? ""}`,
    )
    .join("\n");

  const info = (settings ?? []).map((s) => `${s.key}: ${s.value}`).join("\n");

  return `CATALOGUE:\n${catalogue || "No products published yet."}\n\nBRAND INFO:\n${info || "No extra brand info."}`;
}

async function getOwnerKey(): Promise<string | null> {
  const envKey = process.env["OPENAI_API_KEY"]?.trim();
  if (envKey) return envKey;
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("admin_secrets")
      .select("value")
      .eq("key", "ai_api_key")
      .maybeSingle();
    return data?.value?.trim() || null;
  } catch {
    return null;
  }
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as { messages?: ChatMessage[] };
        const messages = Array.isArray(body.messages) ? body.messages.slice(-12) : [];
        if (messages.length === 0) {
          return new Response("No messages", { status: 400 });
        }

        const system = `${BRAND_RULES}\n\n${await buildContext()}`;
        const ownerKey = await getOwnerKey();

        if (ownerKey) {
          const provider = createOpenAICompatible({
            name: "owner-openai",
            baseURL: "https://api.openai.com/v1",
            headers: { Authorization: `Bearer ${ownerKey}` },
          });
          const result = streamText({
            model: provider("gpt-4o-mini"),
            system,
            messages,
          });
          return result.toTextStreamResponse();
        }

        return new Response("The assistant is not configured yet.", { status: 503 });
      },
    },
  },
});
