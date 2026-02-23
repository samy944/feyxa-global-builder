import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/** Generate a single AI image, upload to storage, return public URL */
async function generateImage(
  apiKey: string,
  prompt: string,
  storeId: string,
  supabaseAdmin: any,
): Promise<string | null> {
  try {
    const imagePrompt = `Create a stunning, ultra-professional commercial photograph.
Style: High-end editorial photography, cinematic lighting, shallow depth of field.
Subject: ${prompt}
Requirements:
- Ultra high resolution, razor-sharp details
- Professional studio or lifestyle photography
- Clean, balanced composition with intentional negative space
- Rich, sophisticated color palette
- Photorealistic, NOT illustration or cartoon
- No text, watermarks, logos, or overlays
- Magazine-quality, suitable for a luxury brand landing page`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [{ role: "user", content: imagePrompt }],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      console.error("Image generation failed:", response.status);
      return null;
    }

    const aiResult = await response.json();
    const imageData = aiResult.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!imageData) return null;

    const base64Match = imageData.match(/^data:image\/(png|jpeg|webp);base64,(.+)$/);
    if (!base64Match) return null;

    const mimeType = `image/${base64Match[1]}`;
    const extension = base64Match[1] === "jpeg" ? "jpg" : base64Match[1];
    const rawBase64 = base64Match[2];

    const binaryStr = atob(rawBase64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    const fileName = `${storeId}/ai-generated/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;
    const { error: uploadError } = await supabaseAdmin.storage
      .from("store-assets")
      .upload(fileName, bytes, { contentType: mimeType, upsert: false });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return null;
    }

    const { data: urlData } = supabaseAdmin.storage.from("store-assets").getPublicUrl(fileName);
    return urlData.publicUrl;
  } catch (e) {
    console.error("generateImage error:", e);
    return null;
  }
}

/** Determine image prompts needed from generated sections */
function extractImagePrompts(sections: any[], storeName: string, productName: string): { sectionIndex: number; field: string; prompt: string }[] {
  const prompts: { sectionIndex: number; field: string; prompt: string }[] = [];

  for (let i = 0; i < sections.length; i++) {
    const s = sections[i];
    const type = s.type;
    const data = s.data || {};

    if (type === "hero" && (!data.imageUrl || data.imageUrl === "")) {
      prompts.push({
        sectionIndex: i,
        field: "imageUrl",
        prompt: `Hero image for ${productName || storeName || "an e-commerce brand"}. ${data.title || ""} — premium lifestyle product photography, wide aspect ratio, cinematic.`,
      });
    }

    if (type === "image" && (!data.url || data.url === "")) {
      prompts.push({
        sectionIndex: i,
        field: "url",
        prompt: `${data.alt || data.caption || `Product lifestyle image for ${productName || storeName}`}. Premium editorial photography.`,
      });
    }

    if (type === "before-after") {
      if (!data.beforeImage || data.beforeImage === "") {
        prompts.push({
          sectionIndex: i,
          field: "beforeImage",
          prompt: `Before state photo: ${data.beforeLabel || "before"} — ${productName || storeName}. Realistic, editorial.`,
        });
      }
      if (!data.afterImage || data.afterImage === "") {
        prompts.push({
          sectionIndex: i,
          field: "afterImage",
          prompt: `After state photo: ${data.afterLabel || "after"} — ${productName || storeName}. Stunning transformation, editorial.`,
        });
      }
    }

    if (type === "gallery" && Array.isArray(data.images)) {
      const emptyCount = data.images.filter((img: string) => !img || img === "").length;
      if (emptyCount > 0 && data.images.length <= 6) {
        for (let j = 0; j < data.images.length; j++) {
          if (!data.images[j] || data.images[j] === "") {
            prompts.push({
              sectionIndex: i,
              field: `images.${j}`,
              prompt: `Gallery photo ${j + 1} for ${productName || storeName}. Premium product/lifestyle photography, varied angles.`,
            });
          }
        }
      }
    }
  }

  return prompts;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { sections, prompt, storeName, productName, currentTheme, themeOnly, storeId, generateImages } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    if (!prompt || typeof prompt !== "string" || prompt.trim().length < 3) {
      return new Response(JSON.stringify({ error: "Le prompt doit contenir au moins 3 caractères." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = themeOnly
      ? `Tu es un directeur artistique légendaire. Tu crées des identités visuelles au niveau Apple, Hermès, Stripe.

CONTEXTE:
- Boutique: ${storeName || "N/A"}
- Produit: ${productName || "N/A"}
- Thème actuel: ${JSON.stringify(currentTheme || {})}

GÉNÈRE un thème visuel EXCEPTIONNEL. Pense luxe, sophistication, impact.

PRINCIPES:
1. Palette harmonieuse (analogues, complémentaires split, triadiques). Couleurs RICHES, jamais fades.
2. Contraste WCAG AA minimum (4.5:1).
3. Typographie: police display distinctive + sans-serif élégante.
   Combos premium: "Playfair Display"+"Inter", "Space Grotesk"+"DM Sans", "Clash Display"+"Satoshi", "Fraunces"+"Outfit", "Syne"+"Work Sans"
4. Radius cohérent: "0" brutaliste, "0.5rem" moderne, "1.5rem" playful

FORMAT (JSON uniquement):
{
  "theme": { "primaryColor": "...", "bgColor": "...", "textColor": "...", "radius": "...", "fontHeading": "...", "fontBody": "..." }
}`
      : `Tu es le meilleur designer et stratège de conversion au monde. Tu as conçu les landing pages d'Apple, Stripe, Tesla, Glossier. Chaque page que tu crées génère des millions.

CONTEXTE:
- Boutique: ${storeName || "N/A"}  
- Produit: ${productName || "N/A"}
- Thème actuel: ${JSON.stringify(currentTheme || {})}

═══════════════════════════════════════
PHILOSOPHIE DE DESIGN
═══════════════════════════════════════

Tu ne fais pas de "templates". Tu crées des EXPÉRIENCES. Chaque pixel a un but. Chaque mot vend.

RÈGLES D'OR:
1. **HERO MAGNÉTIQUE** : Le titre doit ARRÊTER le scroll. Pas de description produit plate. Un BÉNÉFICE émotionnel puissant.
   - BON: "La peau que vous méritez enfin" 
   - MAUVAIS: "Découvrez notre crème hydratante"
2. **PREUVE SOCIALE IMMÉDIATE** : Juste après le hero. Chiffres spécifiques (+2,847 clients, pas "des milliers").
3. **BÉNÉFICES, PAS FEATURES** : "Réveillez-vous avec une peau éclatante" > "Contient de l'acide hyaluronique"
4. **CTA IRRÉSISTIBLES** : Verbe d'action + résultat. "Obtenir mon teint parfait" > "Acheter"
5. **RYTHME VISUEL** : Alterner sections denses et sections aérées. Respiration.
6. **URGENCE SUBTILE** : Countdown, stock limité, offre temporaire — mais élégant, pas spam.

═══════════════════════════════════════
TYPOGRAPHIE & COULEURS
═══════════════════════════════════════

- Polices: Combine display + sans-serif. 
  Top combos: "Playfair Display"+"Inter", "Space Grotesk"+"DM Sans", "Clash Display"+"Satoshi", "Fraunces"+"Outfit", "Syne"+"Work Sans"
- Couleurs: Palette harmonieuse, accent unique sur CTA. Pas de rainbow.
- Contraste fort titre/fond. Le titre doit DOMINER.

═══════════════════════════════════════
STRUCTURE HAUTE CONVERSION (adapte selon contexte)
═══════════════════════════════════════

1. header — Nav minimale
2. hero — Accroche émotionnelle + CTA + image produit
3. trust-badges / social-proof — Crédibilité immédiate
4. benefits — 3-4 bénéfices avec icônes expressives
5. product-highlights / image — Mise en valeur visuelle forte
6. testimonials-grid — Vrais témoignages avec noms/villes
7. stats — Chiffres impressionnants et spécifiques
8. faq — Éliminer les objections
9. guarantee — Rassurer
10. cta — CTA final avec urgence
11. footer — Liens et socials

═══════════════════════════════════════
EXEMPLE RÉFÉRENCE — Luxe Beauté (4.2% taux conversion)
═══════════════════════════════════════

{
  "theme": { "primaryColor": "#c9a87c", "bgColor": "#0d0d0d", "textColor": "#f5f5f5", "radius": "0.5rem", "fontHeading": "Playfair Display", "fontBody": "Inter" },
  "sections": [
    { "id": "hdr", "type": "header", "visible": true, "data": { "storeName": "Luxe Beauté", "links": [{"label":"Produits","href":"#products"},{"label":"Avis","href":"#reviews"},{"label":"FAQ","href":"#faq"}] } },
    { "id": "h1", "type": "hero", "visible": true, "data": { "title": "La peau que vous méritez enfin", "subtitle": "Notre sérum aux 12 actifs naturels transforme votre routine en 14 jours. +3,200 femmes conquises. Résultats visibles ou remboursé.", "ctaText": "Révéler mon éclat →", "imageUrl": "" } },
    { "id": "tb1", "type": "trust-badges", "visible": true, "data": { "items": [{"icon":"🌿","label":"100% Naturel"},{"icon":"⭐","label":"4.9/5 — 1,247 avis"},{"icon":"🇨🇲","label":"Made in Africa"},{"icon":"🚀","label":"Livraison 24h"}] } },
    { "id": "b1", "type": "benefits", "visible": true, "data": { "title": "Pourquoi 3,247 femmes l'adorent", "items": [{"icon":"✨","title":"Résultat en 14 jours","desc":"Peau visiblement plus lumineuse dès la 2ème semaine"},{"icon":"🌱","title":"0% chimique","desc":"Uniquement des ingrédients naturels certifiés bio"},{"icon":"💧","title":"Hydratation 24h","desc":"Micro-encapsulation pour une hydratation longue durée"},{"icon":"🛡️","title":"Garanti ou remboursé","desc":"30 jours pour tester sans risque"}] } },
    { "id": "st1", "type": "stats", "visible": true, "data": { "items": [{"value":"3,247+","label":"Clientes satisfaites"},{"value":"14 jours","label":"Résultats visibles"},{"value":"4.9/5","label":"Note moyenne"},{"value":"98%","label":"Taux satisfaction"}] } },
    { "id": "tg1", "type": "testimonials-grid", "visible": true, "data": { "title": "Ce qu'elles en disent", "items": [{"name":"Amina K.","text":"Ma peau n'a jamais été aussi belle. Je reçois des compliments tous les jours.","rating":5,"avatar":""},{"name":"Fatou D.","text":"J'ai essayé 10 produits avant celui-ci. C'est le seul qui a vraiment marché.","rating":5,"avatar":""},{"name":"Marie L.","text":"Livraison rapide, packaging magnifique, et le produit est incroyable.","rating":5,"avatar":""}] } },
    { "id": "fq1", "type": "faq", "visible": true, "data": { "title": "Questions fréquentes", "items": [{"q":"En combien de temps vais-je voir des résultats ?","a":"La plupart de nos clientes voient une amélioration visible en 14 jours d'utilisation quotidienne."},{"q":"Le sérum convient-il aux peaux sensibles ?","a":"Oui, notre formule est hypoallergénique et testée dermatologiquement."},{"q":"Comment fonctionne la garantie ?","a":"Si vous n'êtes pas satisfaite dans les 30 jours, nous vous remboursons intégralement."}] } },
    { "id": "cta1", "type": "cta", "visible": true, "data": { "title": "Rejoignez 3,247 femmes qui ont transformé leur peau", "subtitle": "Offre limitée : -20% sur votre première commande", "ctaText": "Obtenir mon sérum →" } },
    { "id": "ft1", "type": "footer", "visible": true, "data": { "storeName": "Luxe Beauté", "links": [{"label":"CGV","href":"#"},{"label":"Contact","href":"#"},{"label":"Politique de retour","href":"#"}], "socials": [{"platform":"instagram","url":"#"},{"platform":"whatsapp","url":"#"}] } }
  ],
  "seoTitle": "Luxe Beauté — Révélez votre éclat naturel",
  "seoDescription": "Sérum bio aux 12 actifs naturels. +3,200 femmes conquises. Résultats visibles en 14 jours ou remboursé."
}

═══════════════════════════════════════
TYPES DE BLOCS ET FORMAT DATA
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
- Chaque titre doit provoquer ÉMOTION ou DÉSIR
- Les chiffres doivent être SPÉCIFIQUES
- Laisse les champs imageUrl/url VIDES ("") — les images seront générées automatiquement par l'IA après
- COMMENCE par header, TERMINE par footer
- UNIQUEMENT du JSON valide

FORMAT:
{
  "theme": { "primaryColor": "...", "bgColor": "...", "textColor": "...", "radius": "...", "fontHeading": "...", "fontBody": "..." },
  "sections": [...],
  "seoTitle": "...",
  "seoDescription": "..."
}`;

    const userPrompt = themeOnly
      ? `PROMPT DU VENDEUR: "${prompt}"\n\nGénère uniquement un nouveau thème visuel (couleurs, polices, radius) correspondant au style demandé. Ne touche pas aux sections.`
      : `PROMPT DU VENDEUR: "${prompt}"

Sections actuelles:
${JSON.stringify(sections, null, 2)}

Transforme COMPLÈTEMENT cette landing page. Crée un design de niveau Apple/Stripe. Laisse les champs imageUrl VIDES — les images seront générées par l'IA automatiquement ensuite.`;

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
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Crédits IA insuffisants." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erreur du service IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
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

    // === AUTO IMAGE GENERATION ===
    const shouldGenerateImages = generateImages !== false && !themeOnly && storeId && parsed.sections;
    
    if (shouldGenerateImages) {
      const imagePrompts = extractImagePrompts(parsed.sections, storeName || "", productName || "");
      
      if (imagePrompts.length > 0) {
        console.log(`Generating ${imagePrompts.length} AI images...`);
        
        const supabaseAdmin = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
        );

        // Generate images in parallel (max 3 at a time to avoid rate limits)
        const batchSize = 3;
        for (let b = 0; b < imagePrompts.length; b += batchSize) {
          const batch = imagePrompts.slice(b, b + batchSize);
          const results = await Promise.allSettled(
            batch.map((ip) => generateImage(LOVABLE_API_KEY, ip.prompt, storeId, supabaseAdmin))
          );

          for (let j = 0; j < results.length; j++) {
            const r = results[j];
            if (r.status === "fulfilled" && r.value) {
              const ip = batch[j];
              const section = parsed.sections[ip.sectionIndex];
              
              if (ip.field.startsWith("images.")) {
                const idx = parseInt(ip.field.split(".")[1]);
                if (section.data?.images) {
                  section.data.images[idx] = r.value;
                }
              } else {
                if (!section.data) section.data = {};
                section.data[ip.field] = r.value;
              }
            }
          }
        }

        parsed.imagesGenerated = imagePrompts.length;
      }
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
