import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SECTION_TYPES = [
  "header", "hero", "benefits", "social-proof", "product-highlights", "pricing",
  "countdown", "faq", "guarantee", "cta", "collection-grid", "lead-capture",
  "image", "video", "rich-text", "columns", "testimonials-grid", "stats",
  "comparison-table", "tabs", "trust-badges", "announcement-bar", "whatsapp-button",
  "sticky-cta", "before-after", "gallery", "footer",
];

const SYSTEM_PROMPT = `You are an expert web designer and landing page strategist. Your job is to analyze a website and produce a COMPLETE landing page structure that captures its essence while being potentially even better.

You must return a JSON object with this exact structure:
{
  "theme": {
    "primaryColor": "<hex color>",
    "bgColor": "<hex color>",
    "textColor": "<hex color>",
    "radius": "<CSS border-radius value like 0.75rem>",
    "fontHeading": "<Google Font name>",
    "fontBody": "<Google Font name>"
  },
  "sections": [
    {
      "id": "<random 8-char string>",
      "type": "<section type>",
      "visible": true,
      "data": { ... section-specific data ... }
    }
  ]
}

AVAILABLE SECTION TYPES AND THEIR DATA SHAPES:

- "header": { "logo": "", "storeName": "...", "links": [{"label":"...", "href":"#..."}], "ctaText": "...", "ctaHref": "#cta" }
- "hero": { "title": "...", "subtitle": "...", "ctaText": "...", "imageUrl": "" }
- "benefits": { "title": "...", "items": [{ "icon": "<emoji>", "title": "...", "desc": "..." }] }
- "stats": { "items": [{ "value": "...", "label": "..." }] }
- "social-proof": { "title": "...", "stats": [{"value":"...", "label":"..."}], "testimonials": [{"name":"...", "text":"...", "rating":5}] }
- "testimonials-grid": { "title": "...", "items": [{ "name": "...", "text": "...", "rating": 5, "avatar": "" }] }
- "product-highlights": { "title": "...", "items": [] }
- "pricing": { "title": "...", "items": [{ "name": "...", "price": 0, "features": ["..."], "highlight": false }] }
- "faq": { "title": "...", "items": [{ "q": "...", "a": "..." }] }
- "cta": { "title": "...", "subtitle": "...", "ctaText": "..." }
- "guarantee": { "title": "...", "text": "...", "icon": "🛡️" }
- "countdown": { "title": "...", "endDate": "<ISO date>" }
- "lead-capture": { "title": "...", "placeholder": "...", "buttonText": "...", "incentive": "..." }
- "columns": { "title": "...", "cols": 3, "items": [{"title":"...", "content":"..."}] }
- "comparison-table": { "title": "...", "headers": ["..."], "rows": [["..."]] }
- "trust-badges": { "items": [{ "icon": "<emoji>", "label": "..." }] }
- "rich-text": { "content": "..." }
- "image": { "url": "...", "alt": "...", "caption": "..." }
- "video": { "url": "...", "poster": "", "autoplay": false }
- "announcement-bar": { "text": "..." }
- "whatsapp-button": { "phone": "", "message": "...", "label": "..." }
- "gallery": { "title": "...", "images": [] }
- "tabs": { "items": [{ "label": "...", "content": "..." }] }
- "before-after": { "title": "...", "beforeImage": "", "afterImage": "", "beforeLabel": "Avant", "afterLabel": "Après" }
- "sticky-cta": { "text": "...", "ctaText": "...", "price": "" }
- "footer": { "storeName": "...", "description": "...", "links": [{"label":"...", "href":"#"}], "phone": "", "email": "", "socials": {"instagram":"","facebook":"","tiktok":""} }

RULES:
1. ALWAYS start with a "header" section and end with a "footer" section.
2. Adapt the content from the source website. Rewrite and IMPROVE the copy to be more compelling and conversion-focused.
3. Use the original language of the source website.
4. Generate AT LEAST 6 sections and at most 15.
5. Each section "id" must be a unique 8-character alphanumeric string.
6. Capture the visual mood: colors, typography feel, spacing density.
7. The theme fonts MUST be valid Google Fonts names.
8. Make it conversion-optimized: clear CTAs, social proof, trust signals.
9. Return ONLY the JSON object. No markdown fences, no extra text.
10. If the source has testimonials, reviews, or social proof, include them.
11. If the source has pricing, include a pricing section.
12. If the source has FAQs, include them.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ error: "URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch the website HTML
    let html = "";
    try {
      const resp = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; Feyxa/1.0)" },
        redirect: "follow",
      });
      html = await resp.text();
      // Keep more content for better analysis (30k chars)
      html = html.substring(0, 30000);
    } catch (e) {
      return new Response(
        JSON.stringify({ error: `Failed to fetch URL: ${e.message}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Analyzing URL for landing clone:", url, "HTML length:", html.length);

    const aiResponse = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            {
              role: "user",
              content: `Analyze this website and create a complete landing page that captures its content, structure, and visual identity. Make it conversion-optimized.\n\nURL: ${url}\n\nHTML:\n${html}`,
            },
          ],
        }),
      }
    );

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Trop de requêtes, réessayez dans quelques instants." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Crédits IA insuffisants." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ error: "L'analyse IA a échoué" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    const raw = aiData.choices?.[0]?.message?.content || "";

    // Parse JSON from response
    let result;
    try {
      const jsonStr = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      result = JSON.parse(jsonStr);
    } catch {
      console.error("Failed to parse AI response:", raw.substring(0, 500));
      return new Response(
        JSON.stringify({ error: "Échec du parsing de la réponse IA", raw: raw.substring(0, 200) }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate structure
    if (!result.theme || !result.sections || !Array.isArray(result.sections)) {
      return new Response(
        JSON.stringify({ error: "Réponse IA invalide : structure manquante" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Filter only valid section types
    result.sections = result.sections.filter((s: any) =>
      SECTION_TYPES.includes(s.type) && s.id && s.data
    );

    console.log("Clone successful:", result.sections.length, "sections generated");

    return new Response(JSON.stringify({ success: true, ...result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("clone-landing error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
