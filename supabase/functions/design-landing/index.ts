import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { sections, prompt, storeName, productName, currentTheme, themeOnly } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    if (!prompt || typeof prompt !== "string" || prompt.trim().length < 3) {
      return new Response(JSON.stringify({ error: "Le prompt doit contenir au moins 3 caractères." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sectionTypes = [
      "hero", "benefits", "social-proof", "product-highlights", "pricing", "countdown",
      "faq", "guarantee", "cta", "collection-grid", "lead-capture", "waitlist",
      "image", "video", "rich-text", "columns", "testimonials-grid", "stats",
      "comparison-table", "tabs", "trust-badges", "announcement-bar",
      "whatsapp-button", "sticky-cta", "before-after", "gallery",
    ];

    const systemPrompt = themeOnly
      ? `Tu es un designer expert en landing pages e-commerce pour le marché africain francophone.

CONTEXTE:
- Boutique: ${storeName || "N/A"}
- Produit principal: ${productName || "N/A"}
- Thème actuel: ${JSON.stringify(currentTheme || {})}

TA MISSION:
L'utilisateur va te donner une description du style visuel qu'il souhaite. Tu dois UNIQUEMENT générer un nouveau thème (couleurs et polices), SANS modifier les sections ni le contenu.

GÉNÈRE UN THÈME COMPLET:
- primaryColor: couleur HEX principale
- bgColor: couleur HEX de fond
- textColor: couleur HEX du texte
- radius: border-radius CSS (ex: "0.75rem", "0", "1.5rem")
- fontHeading: nom de police Google Fonts pour les titres
- fontBody: nom de police Google Fonts pour le corps

RÈGLES:
- Choisis des polices Google Fonts RÉELLES
- Les couleurs doivent être harmonieuses et adaptées au style demandé
- Assure un bon contraste texte/fond
- Renvoie UNIQUEMENT du JSON valide

FORMAT DE RÉPONSE (JSON uniquement):
{
  "theme": { "primaryColor": "...", "bgColor": "...", "textColor": "...", "radius": "...", "fontHeading": "...", "fontBody": "..." }
}`
      : `Tu es un designer expert en landing pages e-commerce, spécialisé dans la création de designs uniques et impactants pour le marché africain francophone.

CONTEXTE:
- Boutique: ${storeName || "N/A"}
- Produit principal: ${productName || "N/A"}
- Thème actuel: ${JSON.stringify(currentTheme || {})}

TA MISSION:
L'utilisateur va te donner une description libre du style/design qu'il souhaite. Tu dois:

1. **GÉNÉRER UN THÈME COMPLET** adapté au prompt:
   - primaryColor: couleur HEX principale
   - bgColor: couleur HEX de fond
   - textColor: couleur HEX du texte
   - radius: border-radius CSS (ex: "0.75rem", "0", "1.5rem")
   - fontHeading: nom de police Google Fonts pour les titres (choisir une police existante sur Google Fonts qui correspond au style)
   - fontBody: nom de police Google Fonts pour le corps (choisir une police existante sur Google Fonts)

2. **RESTRUCTURER ET RÉÉCRIRE LES SECTIONS** pour correspondre au style demandé:
   - Tu peux réorganiser, modifier, ajouter ou supprimer des sections
   - Le contenu textuel doit être adapté au ton/ambiance demandé
   - Les types de sections disponibles sont: ${sectionTypes.join(", ")}
   - Chaque section doit avoir: id (string court), type (un des types ci-dessus), visible (boolean), data (objet avec les propriétés du bloc)
   - NE CHANGE PAS les URLs d'images existantes
   - Assure-toi que la page reste optimisée pour la conversion (CTA clairs, structure persuasive)

3. **GÉNÉRER DES MÉTADONNÉES SEO** adaptées:
   - seoTitle: max 60 caractères
   - seoDescription: max 160 caractères

TYPES DE BLOCS ET LEURS DATA ATTENDUES:
- hero: { title, subtitle, ctaText, imageUrl }
- benefits: { title, items: [{ icon, title, desc }] }
- social-proof: { title, stats: [{ value, label }], testimonials: [{ name, text, rating }] }
- faq: { title, items: [{ q, a }] }
- guarantee: { title, text, icon }
- cta: { title, subtitle, ctaText }
- pricing: { title, items: [{ name, price, features: [], highlight }] }
- countdown: { title, endDate }
- lead-capture: { title, placeholder, buttonText, incentive }
- waitlist: { title, placeholder, buttonText, spotsText }
- stats: { items: [{ value, label }] }
- testimonials-grid: { title, items: [{ name, text, rating, avatar }] }
- trust-badges: { items: [{ icon, label }] }
- announcement-bar: { text, bgColor }
- whatsapp-button: { phone, message, label }
- sticky-cta: { text, ctaText, price }
- rich-text: { content }
- image: { url, alt, caption }
- video: { url, poster, autoplay }
- columns: { title, cols, items: [{ title, content }] }
- comparison-table: { title, headers: [], rows: [[]] }
- tabs: { items: [{ label, content }] }
- before-after: { title, beforeImage, afterImage, beforeLabel, afterLabel }
- gallery: { title, images: [] }
- product-highlights: { title, items: [] }
- collection-grid: { title, columns }

RÈGLES IMPORTANTES:
- Adapte TOUS les textes au style/ambiance demandé
- Choisis des polices Google Fonts RÉELLES et cohérentes avec le style
- Les couleurs doivent être harmonieuses et adaptées au style demandé
- La page doit rester responsive et optimisée pour la conversion
- Écris en français adapté au marché africain francophone
- Renvoie UNIQUEMENT du JSON valide, rien d'autre

FORMAT DE RÉPONSE (JSON uniquement):
{
  "theme": { "primaryColor": "...", "bgColor": "...", "textColor": "...", "radius": "...", "fontHeading": "...", "fontBody": "..." },
  "sections": [...],
  "seoTitle": "...",
  "seoDescription": "..."
}`;

    const userPrompt = themeOnly
      ? `PROMPT DU VENDEUR: "${prompt}"\n\nGénère uniquement un nouveau thème visuel (couleurs, polices, radius) correspondant au style demandé. Ne touche pas aux sections.`
      : `PROMPT DU VENDEUR: "${prompt}"

Sections actuelles de la landing page:
${JSON.stringify(sections, null, 2)}

Transforme complètement le design et le contenu de cette landing page selon le prompt du vendeur. Garde les images existantes mais change tout le reste (couleurs, polices, textes, structure, ambiance).`;

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

    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) jsonStr = jsonMatch[1].trim();

    let parsed;
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      const braceMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (braceMatch) {
        parsed = JSON.parse(braceMatch[0]);
      } else {
        throw new Error("Impossible de parser la réponse IA");
      }
    }

    // Ensure sections have ids and visible flag
    if (parsed.sections) {
      parsed.sections = parsed.sections.map((s: any) => ({
        ...s,
        id: s.id || Math.random().toString(36).slice(2, 10),
        visible: s.visible !== undefined ? s.visible : true,
      }));
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("design-landing error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erreur inconnue" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
