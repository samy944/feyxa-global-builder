import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const { products, storeName, platform, language = "Français", storeUrl } = await req.json();

    if (!products || !Array.isArray(products) || products.length === 0) {
      return new Response(JSON.stringify({ error: "Aucun produit fourni" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const platformInstructions: Record<string, string> = {
      instagram: `Crée un post Instagram engageant avec:
- Une description captivante (max 2200 chars) avec des emojis stratégiques
- 20-30 hashtags pertinents et tendance
- Un appel à l'action clair (lien en bio, DM pour commander, etc.)
- Un ton authentique et aspirationnel`,
      facebook: `Crée un post Facebook engageant avec:
- Un texte accrocheur (3-5 lignes max avant le "voir plus")  
- Des emojis utilisés avec parcimonie
- Un appel à l'action direct avec le lien
- Un ton conversationnel et chaleureux`,
      tiktok: `Crée un script/description TikTok avec:
- Un hook percutant dans les 3 premières secondes
- Une description courte et percutante (max 150 chars)
- 5-8 hashtags tendance TikTok
- Des idées de transitions/effets visuels
- Un ton fun, jeune et dynamique`,
      whatsapp: `Crée un message WhatsApp promotionnel avec:
- Un message court et direct
- Des emojis bien placés
- Le prix et les détails essentiels
- Un catalogue format texte des produits
- Un ton personnel et amical`,
    };

    const productList = products
      .slice(0, 5)
      .map((p: any) => `- ${p.name}: ${p.price} ${p.currency || "FCFA"}${p.compare_at_price ? ` (ancien prix: ${p.compare_at_price})` : ""}${p.description ? ` — ${p.description.slice(0, 100)}` : ""}`)
      .join("\n");

    const prompt = `Tu es un expert en marketing digital et social media pour l'Afrique francophone.

Boutique: "${storeName}"
URL: ${storeUrl || "(à ajouter)"}

Produits à promouvoir:
${productList}

${platformInstructions[platform] || platformInstructions.instagram}

Langue: ${language}

Retourne le contenu prêt à publier. Sois créatif et adapté au marché africain.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: "Tu es un expert social media manager spécialisé dans le e-commerce en Afrique francophone." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Trop de requêtes, réessayez." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      throw new Error("AI error");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    return new Response(JSON.stringify({ content, platform }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("social-commerce error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
