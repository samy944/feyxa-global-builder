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

    const { action, productName, category, tags, currentDescription, storeName, language } = await req.json();

    let systemPrompt = "";
    let userPrompt = "";

    if (action === "description") {
      systemPrompt = `Tu es un expert en copywriting e-commerce. Tu écris des descriptions de produits qui convertissent. 
Réponds UNIQUEMENT en JSON valide avec cette structure:
{
  "description": "description complète du produit (200-400 mots, avec emojis, paragraphes courts, bullet points)",
  "short_description": "description courte (1-2 phrases accrocheuses)",
  "seo_title": "titre SEO optimisé (max 60 caractères)",
  "seo_description": "meta description SEO (max 155 caractères)",
  "suggested_tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}`;
      userPrompt = `Génère une description de produit pour:
- Nom: ${productName}
- Boutique: ${storeName || "N/A"}
- Catégorie: ${category || "Non spécifiée"}
- Tags existants: ${tags?.join(", ") || "Aucun"}
- Description actuelle: ${currentDescription || "Aucune"}
- Langue: ${language || "Français"}

Rends la description vendeuse, professionnelle et optimisée SEO. Utilise des emojis pertinents.`;
    } else if (action === "improve") {
      systemPrompt = `Tu es un expert en copywriting e-commerce. Tu améliores des descriptions existantes pour les rendre plus vendeuses.
Réponds UNIQUEMENT en JSON valide avec cette structure:
{
  "description": "description améliorée",
  "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"]
}`;
      userPrompt = `Améliore cette description de produit:
- Nom: ${productName}
- Description actuelle: ${currentDescription}
- Langue: ${language || "Français"}

Garde le sens mais rends-la plus accrocheuse, mieux structurée et optimisée pour la conversion.`;
    } else {
      throw new Error("Action non supportée");
    }

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
    
    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Invalid AI response format");
    
    const result = JSON.parse(jsonMatch[0]);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-product error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erreur inconnue" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
