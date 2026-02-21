import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    const { store_id, template, country, currency, niche_description } = await req.json();

    if (!store_id || !template) throw new Error("Missing store_id or template");

    let systemPrompt = "";
    let userPrompt = "";

    if (template === "us_trending") {
      systemPrompt = `You are an e-commerce product catalog expert. Generate exactly 10 trending products inspired by current American e-commerce trends (Amazon, TikTok Shop, etc.) that would sell well in ${country || "West Africa"}.

Return a JSON array of 10 product objects. Each object must have:
- name: Product name in French (string)
- description: Compelling product description in French, 2-3 sentences (string)
- price: Adapted price in ${currency || "XOF"} for the local market (number)
- slug: URL-friendly slug (string, lowercase, hyphens)
- tags: Array of 2-3 relevant tags in French (string[])
- category: One of: Mode, Électronique, Beauté, Maison, Gadgets, Sport, Santé, Accessoires (string)

Products should be diverse across categories. Prices must be realistic for ${country || "Bénin"} market.
IMPORTANT: Return ONLY the JSON array, no markdown, no explanation.`;

      userPrompt = `Generate 10 trending US-inspired products for a store in ${country || "Bénin"}, currency: ${currency || "XOF"}. Focus on high-demand products popular on American platforms like Amazon, TikTok Shop, Temu that can be sold in West Africa.`;
    } else if (template === "niche") {
      systemPrompt = `You are an e-commerce niche expert. Generate exactly 8 products for a specialized niche store.

Return a JSON array of 8 product objects. Each object must have:
- name: Product name in French (string)
- description: Compelling product description in French, 2-3 sentences (string)
- price: Adapted price in ${currency || "XOF"} for the local market (number)
- slug: URL-friendly slug (string, lowercase, hyphens)
- tags: Array of 2-3 relevant tags in French (string[])
- category: The niche category name (string)

Prices must be realistic for ${country || "Bénin"} market.
IMPORTANT: Return ONLY the JSON array, no markdown, no explanation.`;

      userPrompt = `Generate 8 products for a niche store focused on: "${niche_description || "mode féminine"}". Country: ${country || "Bénin"}, currency: ${currency || "XOF"}.`;
    } else if (template === "one_product") {
      systemPrompt = `You are an e-commerce expert specializing in one-product stores (landing page stores). Generate 1 high-converting product with a very detailed description.

Return a JSON array with exactly 1 product object:
- name: Product name in French (string)
- description: Very detailed product description in French with benefits, features, specifications. Use line breaks. 5-8 sentences (string)
- price: Premium price in ${currency || "XOF"} for the local market (number)
- slug: URL-friendly slug (string, lowercase, hyphens)
- tags: Array of 3-4 relevant tags in French (string[])
- category: Product category (string)
- benefits: Array of 4-5 key benefits in French (string[])
- faq: Array of 3 objects with "question" and "answer" fields in French

Prices must be realistic for ${country || "Bénin"} market.
IMPORTANT: Return ONLY the JSON array, no markdown, no explanation.`;

      userPrompt = `Generate 1 premium product for a one-product store. ${niche_description ? `Product niche: "${niche_description}".` : "Choose a trending high-margin product."} Country: ${country || "Bénin"}, currency: ${currency || "XOF"}.`;
    } else {
      throw new Error("Invalid template type");
    }

    // Call Lovable AI
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Trop de requêtes, réessayez dans quelques instants." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Crédits IA insuffisants." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);
      throw new Error("AI generation failed");
    }

    const aiData = await aiResponse.json();
    const rawContent = aiData.choices?.[0]?.message?.content || "[]";

    // Parse the JSON array - handle potential markdown wrapping
    let products: any[];
    try {
      const cleaned = rawContent.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      products = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse AI response:", rawContent);
      throw new Error("Failed to parse generated products");
    }

    if (!Array.isArray(products) || products.length === 0) {
      throw new Error("No products generated");
    }

    // Use service role to insert products for the store
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Verify store ownership
    const { data: store } = await adminClient
      .from("stores")
      .select("id, owner_id")
      .eq("id", store_id)
      .single();

    if (!store || store.owner_id !== user.id) {
      throw new Error("Store not found or unauthorized");
    }

    // Insert products
    const productRows = products.map((p: any) => ({
      store_id,
      name: p.name,
      slug: p.slug || p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
      description: p.description,
      price: Number(p.price) || 0,
      stock_quantity: 50,
      is_published: true,
      tags: p.tags || [],
      images: [],
    }));

    const { data: insertedProducts, error: insertError } = await adminClient
      .from("products")
      .insert(productRows)
      .select("id, name");

    if (insertError) {
      console.error("Insert error:", insertError);
      throw new Error("Failed to insert products: " + insertError.message);
    }

    // Store template metadata in store settings
    const { data: currentStore } = await adminClient
      .from("stores")
      .select("settings")
      .eq("id", store_id)
      .single();

    const currentSettings = (currentStore?.settings as Record<string, any>) || {};
    await adminClient
      .from("stores")
      .update({
        settings: {
          ...currentSettings,
          smart_start_template: template,
          smart_start_niche: niche_description || null,
          smart_start_completed: true,
        },
      })
      .eq("id", store_id);

    return new Response(
      JSON.stringify({
        success: true,
        products: insertedProducts,
        template,
        count: insertedProducts?.length || 0,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("smart-start error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
