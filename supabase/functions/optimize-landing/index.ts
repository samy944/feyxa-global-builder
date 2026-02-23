import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { sections, objective, tone, storeName, productName, seoTitle, seoDescription } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const objectiveMap: Record<string, string> = {
      conversion: "Maximiser les ventes et les conversions. Utiliser l'urgence, la preuve sociale et des CTA forts.",
      branding: "Renforcer l'image de marque. Mettre en avant les valeurs, l'histoire et l'identité unique du vendeur.",
      leads: "Maximiser la capture de leads (emails, WhatsApp). Offrir des incitations irrésistibles.",
      seo: "Optimiser pour le référencement naturel. Utiliser des mots-clés pertinents, des titres H2 optimisés, et du contenu riche.",
      engagement: "Maximiser l'engagement des visiteurs. Utiliser du contenu interactif, des témoignages et des FAQ complètes.",
    };

    const toneMap: Record<string, string> = {
      professional: "Ton professionnel, sobre et crédible. Vocabulaire corporate.",
      dynamic: "Ton dynamique, énergique et motivant. Utiliser des émojis avec parcimonie.",
      premium: "Ton premium et luxueux. Vocabulaire raffiné, exclusivité.",
      friendly: "Ton amical et accessible. Comme si on parlait à un ami.",
      urgent: "Ton d'urgence. Créer la FOMO, stocks limités, offre qui expire.",
    };

    const systemPrompt = `Tu es un expert en copywriting e-commerce et optimisation de landing pages pour le marché africain francophone.

CONTEXTE:
- Boutique: ${storeName || "N/A"}
- Produit principal: ${productName || "N/A"}
- Objectif marketing: ${objectiveMap[objective] || objective}
- Ton demandé: ${toneMap[tone] || tone}

RÈGLES:
1. Tu reçois un tableau JSON de sections de landing page. Chaque section a un type, un id, et des data.
2. Tu dois OPTIMISER les textes de chaque section existante pour maximiser l'objectif.
3. Tu peux AJOUTER de nouvelles sections stratégiques si elles manquent (FAQ, témoignages, garantie, stats, etc.)
4. Tu dois conserver la STRUCTURE JSON exacte et tous les champs existants.
5. NE CHANGE PAS les types de sections existantes, les IDs, ni les URLs d'images.
6. Écris en français adapté au marché africain francophone.
7. Les textes doivent être persuasifs, clairs et adaptés au ton choisi.
8. Propose un seo_title (max 60 chars) et seo_description (max 160 chars) optimisés.

IMPORTANT: Renvoie UNIQUEMENT du JSON valide, rien d'autre.`;

    const userPrompt = `Voici les sections actuelles de la landing page:
${JSON.stringify(sections, null, 2)}

SEO actuel:
- Title: ${seoTitle || "(vide)"}
- Description: ${seoDescription || "(vide)"}

Optimise toutes les sections et propose de nouvelles sections stratégiques si nécessaire.
Renvoie le résultat sous cette forme JSON exacte:
{
  "sections": [...],
  "seoTitle": "...",
  "seoDescription": "..."
}`;

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
        return new Response(JSON.stringify({ error: "Trop de requêtes. Réessayez dans quelques instants." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Crédits IA insuffisants." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erreur du service IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResult = await response.json();
    const content = aiResult.choices?.[0]?.message?.content || "";

    // Extract JSON from the response (might be wrapped in markdown code blocks)
    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) jsonStr = jsonMatch[1].trim();

    // Try to parse
    let parsed;
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      // Try to find JSON object in the content
      const braceMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (braceMatch) {
        parsed = JSON.parse(braceMatch[0]);
      } else {
        throw new Error("Impossible de parser la réponse IA");
      }
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("optimize-landing error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erreur inconnue" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
