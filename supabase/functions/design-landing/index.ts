import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function generateImage(apiKey: string, prompt: string, storeId: string, supabaseAdmin: any): Promise<string | null> {
  try {
    const imagePrompt = `Create a stunning, ultra high-resolution commercial photograph. Style: editorial, premium, modern. ${prompt}. Requirements: photorealistic, cinematic lighting, clean composition, no text or watermarks, no logos, sharp focus, 16:9 aspect ratio.`;

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
      console.error("Image gen failed:", response.status);
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
    console.error("Image generation error:", e);
    return null;
  }
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
      ? `Tu es un directeur artistique légendaire — ex-Apple, ex-Stripe. Tu crées des identités visuelles qui définissent des époques.

CONTEXTE:
- Boutique: ${storeName || "N/A"}
- Produit: ${productName || "N/A"}
- Thème actuel: ${JSON.stringify(currentTheme || {})}

MISSION: Génère un thème visuel RÉVOLUTIONNAIRE. Pas joli — INOUBLIABLE.

PRINCIPES:
1. Palette: harmonieuse (analogues, complémentaires split, triadiques). Couleurs RICHES et PROFONDES, jamais fades.
2. Contraste: WCAG AA minimum. Fond sombre → texte clair, et vice versa.
3. Typo: Combine display distinctive + sans-serif élégante. Combos:
   - "Playfair Display" + "Inter" (luxe classique)
   - "Space Grotesk" + "DM Sans" (tech moderne)
   - "Clash Display" + "Satoshi" (avant-garde)
   - "Fraunces" + "Outfit" (artisanal premium)
   - "Syne" + "Work Sans" (bold créatif)
   - "Cabinet Grotesk" + "General Sans" (startup)
   - "Instrument Serif" + "Plus Jakarta Sans" (editorial)
4. Radius: cohérent — "0" brutaliste, "0.5rem" moderne, "1rem" friendly, "9999px" pill

GÉNÈRE exactement ce JSON:
{
  "theme": { "primaryColor": "#HEX", "bgColor": "#HEX", "textColor": "#HEX", "radius": "Xrem", "fontHeading": "...", "fontBody": "..." }
}`
      : `Tu es le meilleur designer de landing pages au monde. Tu as généré +$500M en revenus pour des marques D2C. Tu crées des pages qui CONVERTISSENT et qui sont visuellement EXCEPTIONNELLES.

CONTEXTE:
- Boutique: ${storeName || "N/A"}
- Produit: ${productName || "N/A"}
- Thème actuel: ${JSON.stringify(currentTheme || {})}

═══════════════════════════════════════
🎯 TA MISSION
═══════════════════════════════════════
Créer une landing page PREMIUM qui rivalise avec Apple, Glossier, Allbirds. Chaque section doit être pensée pour CONVERTIR.

═══════════════════════════════════════
🔥 COPYWRITING D'ÉLITE
═══════════════════════════════════════
- Titres: COURTS, PERCUTANTS, ÉMOTIONNELS. Max 8 mots. Utilise des verbes d'action.
  ✅ "Révélez votre éclat naturel"
  ✅ "Le secret des femmes qui rayonnent"
  ❌ "Notre nouveau produit de beauté pour la peau"
  
- Sous-titres: Éliminent l'objection #1. Max 2 lignes.
- CTA: Verbe + résultat. "Obtenir mon kit" pas "Acheter".
- Chiffres: TOUJOURS spécifiques. "+2,847 clients" pas "des milliers".
- Témoignages: Noms RÉALISTES africains avec villes. Ex: "Aminata K., Abidjan", "Fatou D., Dakar"

═══════════════════════════════════════
🎨 DESIGN PREMIUM
═══════════════════════════════════════
- Palette: Couleurs RICHES, harmonieuses. Accent fort sur CTA uniquement.
- Typo: Police display DISTINCTIVE pour titres. Combos recommandés:
  "Space Grotesk"+"DM Sans", "Syne"+"Work Sans", "Clash Display"+"Satoshi", "Instrument Serif"+"Plus Jakarta Sans"
- Espacement: GÉNÉREUX. Les pages premium RESPIRENT.
- Structure: 8-12 sections pour une page complète et persuasive.

═══════════════════════════════════════
📐 STRUCTURE OPTIMALE
═══════════════════════════════════════
1. header — Logo + navigation clean
2. hero — Accroche ÉMOTIONNELLE + sous-titre + CTA + imageUrl (REMPLIS avec une description pour la génération IA entre crochets, ex: "[Photo lifestyle femme souriante utilisant le produit]")
3. trust-badges — 4 badges de crédibilité avec émojis
4. benefits — 3-4 bénéfices avec icônes émojis et descriptions percutantes
5. image ou gallery — Visuels produit (imageUrl avec descriptions entre crochets)
6. testimonials-grid — 3-4 témoignages RÉALISTES avec noms/villes africaines
7. stats — 4 chiffres impressionnants et SPÉCIFIQUES
8. product-highlights — Caractéristiques techniques
9. faq — 4-6 questions/réponses éliminant les objections
10. cta — CTA final avec urgence subtile
11. footer — Liens et réseaux sociaux

═══════════════════════════════════════
🖼️ IMAGES — CRITIQUE
═══════════════════════════════════════
Pour CHAQUE champ imageUrl dans hero, image, gallery, before-after:
- Remplis avec une DESCRIPTION entre crochets pour la génération IA automatique
- Ex: "[Photo produit sur fond blanc minimaliste avec éclairage studio]"
- Ex: "[Photo lifestyle femme africaine souriante utilisant le produit dans un salon moderne]"
- Ex: "[Flat lay du produit avec des éléments naturels, feuilles, fleurs]"
- NE LAISSE AUCUN imageUrl VIDE si la section nécessite une image

═══════════════════════════════════════
TYPES DE BLOCS ET DATA
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
- gallery: { title, images: [{ url, alt }] }
- product-highlights: { title, items: [{ icon, title, desc }] }
- collection-grid: { title, columns }
- footer: { storeName, links: [{ label, href }], socials: [{ platform, url }] }

═══════════════════════════════════════
RÈGLES ABSOLUES
═══════════════════════════════════════
- Français naturel, adapté au marché africain francophone
- COMMENCE par header, TERMINE par footer
- imageUrl: remplis avec descriptions entre crochets [...]
- JSON UNIQUEMENT, pas de markdown
- Chaque titre provoque ÉMOTION ou DÉSIR
- Chiffres SPÉCIFIQUES partout

FORMAT DE RÉPONSE:
{
  "theme": { "primaryColor": "#...", "bgColor": "#...", "textColor": "#...", "radius": "...", "fontHeading": "...", "fontBody": "..." },
  "sections": [...],
  "seoTitle": "...",
  "seoDescription": "..."
}`;

    const userPrompt = themeOnly
      ? `PROMPT DU VENDEUR: "${prompt}"\n\nGénère uniquement un nouveau thème visuel spectaculaire.`
      : `PROMPT DU VENDEUR: "${prompt}"

Sections actuelles:
${JSON.stringify(sections, null, 2)}

CRÉE une landing page EXCEPTIONNELLE. Design premium, copywriting de conversion, structure optimale. Remplis les imageUrl avec des descriptions entre crochets pour la génération automatique d'images. Assure-toi d'inclure header et footer.`;

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

    // Auto-generate images if requested and storeId provided
    if (generateImages && storeId && parsed.sections && !themeOnly) {
      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      );

      const imagePromises: Promise<void>[] = [];

      for (const section of parsed.sections) {
        // Hero image
        if (section.type === "hero" && section.data?.imageUrl && section.data.imageUrl.startsWith("[")) {
          const desc = section.data.imageUrl.replace(/^\[|\]$/g, "");
          const sectionRef = section;
          imagePromises.push(
            generateImage(LOVABLE_API_KEY, `${desc}. For brand: ${storeName || "e-commerce"}. Product: ${productName || "premium product"}`, storeId, supabaseAdmin)
              .then(url => { if (url) sectionRef.data.imageUrl = url; else sectionRef.data.imageUrl = ""; })
          );
        }

        // Image section
        if (section.type === "image" && section.data?.url && section.data.url.startsWith("[")) {
          const desc = section.data.url.replace(/^\[|\]$/g, "");
          const sectionRef = section;
          imagePromises.push(
            generateImage(LOVABLE_API_KEY, `${desc}. For brand: ${storeName || "e-commerce"}`, storeId, supabaseAdmin)
              .then(url => { if (url) sectionRef.data.url = url; else sectionRef.data.url = ""; })
          );
        }

        // Gallery images
        if (section.type === "gallery" && section.data?.images) {
          for (let i = 0; i < section.data.images.length; i++) {
            const img = section.data.images[i];
            const imgUrl = typeof img === "string" ? img : img?.url;
            if (imgUrl && imgUrl.startsWith("[")) {
              const desc = imgUrl.replace(/^\[|\]$/g, "");
              const idx = i;
              const sectionRef = section;
              imagePromises.push(
                generateImage(LOVABLE_API_KEY, `${desc}. For brand: ${storeName || "e-commerce"}`, storeId, supabaseAdmin)
                  .then(url => {
                    if (url) {
                      if (typeof sectionRef.data.images[idx] === "string") {
                        sectionRef.data.images[idx] = url;
                      } else {
                        sectionRef.data.images[idx].url = url;
                      }
                    }
                  })
              );
            }
          }
        }

        // Before-after images
        if (section.type === "before-after") {
          if (section.data?.beforeImage && section.data.beforeImage.startsWith("[")) {
            const desc = section.data.beforeImage.replace(/^\[|\]$/g, "");
            const sectionRef = section;
            imagePromises.push(
              generateImage(LOVABLE_API_KEY, desc, storeId, supabaseAdmin)
                .then(url => { if (url) sectionRef.data.beforeImage = url; else sectionRef.data.beforeImage = ""; })
            );
          }
          if (section.data?.afterImage && section.data.afterImage.startsWith("[")) {
            const desc = section.data.afterImage.replace(/^\[|\]$/g, "");
            const sectionRef = section;
            imagePromises.push(
              generateImage(LOVABLE_API_KEY, desc, storeId, supabaseAdmin)
                .then(url => { if (url) sectionRef.data.afterImage = url; else sectionRef.data.afterImage = ""; })
            );
          }
        }
      }

      // Generate up to 4 images in parallel (avoid rate limits)
      const batches = [];
      for (let i = 0; i < imagePromises.length; i += 3) {
        batches.push(imagePromises.slice(i, i + 3));
      }
      for (const batch of batches) {
        await Promise.allSettled(batch);
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
