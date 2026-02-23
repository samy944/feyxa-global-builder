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
      "header", "hero", "benefits", "social-proof", "product-highlights", "pricing", "countdown",
      "faq", "guarantee", "cta", "collection-grid", "lead-capture", "waitlist",
      "image", "video", "rich-text", "columns", "testimonials-grid", "stats",
      "comparison-table", "tabs", "trust-badges", "announcement-bar",
      "whatsapp-button", "sticky-cta", "before-after", "gallery", "footer",
    ];

    const systemPrompt = themeOnly
      ? `Tu es un directeur artistique de classe mondiale, formé chez Apple, Stripe et Airbnb. Tu crées des identités visuelles qui rivalisent avec les meilleures marques tech au monde.

CONTEXTE:
- Boutique: ${storeName || "N/A"}
- Produit principal: ${productName || "N/A"}
- Thème actuel: ${JSON.stringify(currentTheme || {})}

TA MISSION:
Génère un thème visuel EXCEPTIONNEL basé sur le prompt du vendeur. Pense comme un directeur artistique de marque de luxe.

PRINCIPES DE DESIGN ELITE:
1. **Théorie des couleurs** : Utilise des palettes harmonieuses (analogues, complémentaires split, triadiques). Jamais de couleurs aléatoires.
2. **Contraste** : Ratio WCAG AA minimum (4.5:1 pour le texte). Un fond sombre exige des textes clairs et vice versa.
3. **Typographie** : Combine une police display distinctive (titres) + une sans-serif élégante (corps). Exemples de combos premium:
   - "Playfair Display" + "Inter" (luxe classique)
   - "Space Grotesk" + "DM Sans" (tech moderne)
   - "Clash Display" + "Satoshi" (avant-garde)
   - "Fraunces" + "Outfit" (artisanal premium)
   - "Syne" + "Work Sans" (bold créatif)
4. **Radius** : Cohérent avec le style — "0" pour brutaliste, "0.5rem" pour moderne, "1.5rem" pour playful, "9999px" pour pill-shaped

GÉNÈRE UN THÈME AVEC:
- primaryColor: couleur HEX principale (riche, pas fade)
- bgColor: couleur HEX de fond
- textColor: couleur HEX du texte (DOIT contraster avec bgColor)
- radius: border-radius CSS
- fontHeading: police Google Fonts pour titres (EXISTANTE sur Google Fonts)
- fontBody: police Google Fonts pour le corps (EXISTANTE sur Google Fonts)

FORMAT DE RÉPONSE (JSON uniquement):
{
  "theme": { "primaryColor": "...", "bgColor": "...", "textColor": "...", "radius": "...", "fontHeading": "...", "fontBody": "..." }
}`
      : `Tu es un directeur artistique et stratège de conversion de classe mondiale. Tu as travaillé pour Apple, Stripe, Airbnb et les plus grandes marques D2C. Tu crées des landing pages qui génèrent des millions en revenus.

CONTEXTE:
- Boutique: ${storeName || "N/A"}  
- Produit principal: ${productName || "N/A"}
- Thème actuel: ${JSON.stringify(currentTheme || {})}

TA MISSION:
Transformer cette landing page en une expérience de conversion exceptionnelle. Chaque pixel doit servir un objectif. Chaque mot doit vendre.

═══════════════════════════════════════
PRINCIPES DE DESIGN ELITE
═══════════════════════════════════════

1. **HIÉRARCHIE VISUELLE** : Le regard doit être guidé naturellement — Hero captivant → Preuve sociale → Bénéfices → CTA irrésistible
2. **COPYWRITING DE CONVERSION** :
   - Titres: Bénéfice principal + émotion. Pas de descriptions plates.
   - Sous-titres: Éliminer l'objection principale du lecteur.
   - CTA: Verbe d'action + résultat ("Obtenir mon kit" pas "Acheter")
3. **THÉORIE DES COULEURS** : Palette harmonieuse, accents stratégiques sur les CTA
4. **TYPOGRAPHIE PREMIUM** : Police display impactante + sans-serif lisible
   Combos recommandés: "Playfair Display"+"Inter", "Space Grotesk"+"DM Sans", "Syne"+"Work Sans", "Fraunces"+"Outfit"
5. **ESPACEMENT** : Généreux, aéré. Les landing pages premium respirent.
6. **PREUVE SOCIALE** : Chiffres spécifiques ("+2,847 clients", pas "des milliers"), témoignages avec nom/ville

═══════════════════════════════════════
STRUCTURE D'UNE PAGE À FORT TAUX DE CONVERSION
═══════════════════════════════════════

Ordre recommandé (adapte selon le contexte):
1. header — Navigation avec logo et liens
2. hero — Accroche émotionnelle + CTA principal + image
3. social-proof / trust-badges — Crédibilité immédiate
4. benefits — 3-6 bénéfices avec icônes
5. product-highlights / image — Mise en valeur visuelle
6. testimonials-grid — Témoignages détaillés avec noms
7. stats — Chiffres impressionnants
8. faq — Éliminer les dernières objections
9. cta — CTA final avec urgence
10. footer — Liens, réseaux sociaux, légal

═══════════════════════════════════════
EXEMPLES DE DESIGN EXCEPTIONNELS (FEW-SHOT)
═══════════════════════════════════════

EXEMPLE 1 — Marque beauté premium:
{
  "theme": { "primaryColor": "#c9a87c", "bgColor": "#faf8f5", "textColor": "#1a1a1a", "radius": "0.5rem", "fontHeading": "Playfair Display", "fontBody": "Inter" },
  "sections": [
    { "id": "hdr", "type": "header", "visible": true, "data": { "storeName": "Luxe Beauté", "links": [{"label":"Produits","href":"#products"},{"label":"Témoignages","href":"#reviews"},{"label":"FAQ","href":"#faq"}] } },
    { "id": "h1", "type": "hero", "visible": true, "data": { "title": "Révélez l'éclat naturel de votre peau", "subtitle": "Notre sérum bio, formulé avec 12 actifs naturels, transforme votre routine beauté en 14 jours. Résultats visibles ou remboursé.", "ctaText": "Découvrir le sérum →", "imageUrl": "" } },
    { "id": "sp1", "type": "trust-badges", "visible": true, "data": { "items": [{"icon":"🌿","label":"100% Bio"},{"icon":"🇨🇲","label":"Made in Africa"},{"icon":"⭐","label":"4.9/5 — 1,247 avis"},{"icon":"🚚","label":"Livraison 48h"}] } },
    { "id": "b1", "type": "benefits", "visible": true, "data": { "title": "Pourquoi 3,000+ femmes l'adorent", "items": [{"icon":"✨","title":"Résultat en 14 jours","desc":"Peau visiblement plus lumineuse dès la 2ème semaine d'utilisation"},{"icon":"🌱","title":"0% chimique","desc":"Formulé uniquement avec des ingrédients naturels et certifiés bio"},{"icon":"💧","title":"Hydratation 24h","desc":"Technologie micro-encapsulation pour une hydratation qui dure"}] } }
  ]
}

EXEMPLE 2 — Tech/SaaS audacieux:
{
  "theme": { "primaryColor": "#6366f1", "bgColor": "#0a0a0a", "textColor": "#f5f5f5", "radius": "0.75rem", "fontHeading": "Space Grotesk", "fontBody": "DM Sans" },
  "sections": [
    { "id": "h1", "type": "hero", "visible": true, "data": { "title": "Multipliez vos ventes par 3 en 30 jours", "subtitle": "L'outil IA qui analyse votre marché, optimise vos prix et automatise votre marketing. Rejoignez +500 e-commerçants africains.", "ctaText": "Essayer gratuitement", "imageUrl": "" } },
    { "id": "st1", "type": "stats", "visible": true, "data": { "items": [{"value":"+247%","label":"Croissance moyenne"},{"value":"30 sec","label":"Pour démarrer"},{"value":"500+","label":"Boutiques actives"},{"value":"99.9%","label":"Disponibilité"}] } }
  ]
}

═══════════════════════════════════════
TYPES DE BLOCS ET LEURS DATA
═══════════════════════════════════════

- header: { storeName, links: [{ label, href }] }
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
- footer: { storeName, links: [{ label, href }], socials: [{ platform, url }] }

═══════════════════════════════════════
RÈGLES ABSOLUES
═══════════════════════════════════════

- Écris en français naturel, adapté au marché africain francophone
- Chaque titre doit provoquer une ÉMOTION ou un DÉSIR
- Les chiffres doivent être SPÉCIFIQUES (pas "beaucoup" mais "2,847")
- NE CHANGE PAS les URLs d'images existantes (garde les champs imageUrl vides si pas d'image)
- COMMENCE TOUJOURS par un header et TERMINE par un footer
- Renvoie UNIQUEMENT du JSON valide, pas de markdown ni commentaires

FORMAT DE RÉPONSE:
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

Transforme complètement le design et le contenu de cette landing page selon le prompt du vendeur. Crée une page qui rivalise avec les meilleures marques D2C au monde. Garde les images existantes mais change tout le reste (couleurs, polices, textes, structure, ambiance). Assure-toi d'inclure un header et un footer.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-pro-preview",
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
