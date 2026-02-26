import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { storeName, storeDescription, storeCategory, products, language } = await req.json();

    const productList = (products || []).slice(0, 10).map((p: any) => `- ${p.name} (${p.price})`).join("\n");

    const systemPrompt = `Tu es un directeur artistique e-commerce expert. Tu crées des vitrines de boutiques en ligne professionnelles.
Réponds UNIQUEMENT en JSON valide avec cette structure:
{
  "theme": {
    "id": "un des thèmes disponibles: minimal, warm-earth, ocean-breeze, midnight-luxe, sunset-glow, forest-calm, rose-gold, arctic-frost, neon-nights, terracotta, lavender-dreams, deep-ocean, champagne, electric-blue, sage-garden, mocha, coral-reef, slate-modern, golden-hour, vintage-cream",
    "colorOverrides": {
      "primary": "H S% L% (HSL values)",
      "background": "H S% L%",
      "foreground": "H S% L%",
      "accent": "H S% L%"
    }
  },
  "template": "un des templates: minimal, starter, fashion-magazine, tech-bento, beauty-soft, marketplace-pro, electronics-showcase, jewelry-luxe, organic-natural, kids-playful, sports-dynamic, home-decor, food-gourmet, books-editorial, automotive, handmade-artisan, pet-store, fitness-pro, luxury-watches, streetwear-urban",
  "sections": {
    "hero": {
      "headline": "Titre accrocheur de la boutique",
      "subheadline": "Sous-titre vendeur",
      "cta_text": "Texte du bouton CTA"
    },
    "trust": {
      "badges": ["Badge 1", "Badge 2", "Badge 3", "Badge 4"]
    },
    "newsletter": {
      "headline": "Titre newsletter",
      "description": "Description newsletter"
    },
    "footer": {
      "tagline": "Slogan de la boutique"
    }
  },
  "seo": {
    "title": "Titre SEO (max 60 chars)",
    "description": "Meta description (max 155 chars)"
  }
}`;

    const userPrompt = `Crée une vitrine e-commerce complète pour:
- Boutique: ${storeName}
- Description: ${storeDescription || "Non spécifiée"}
- Catégorie: ${storeCategory || "Généraliste"}
- Produits:
${productList || "Aucun produit encore"}
- Langue: ${language || "Français"}

Choisis le thème et template les plus adaptés au type de boutique. Les couleurs doivent être cohérentes et professionnelles.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Trop de requêtes, réessayez dans quelques secondes." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Crédits IA insuffisants." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Invalid AI response format");
    
    const result = JSON.parse(jsonMatch[0]);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-storefront error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erreur inconnue" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
