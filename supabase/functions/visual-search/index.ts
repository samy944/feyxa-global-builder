import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Non autorisé" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Non autorisé" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { image_base64, mime_type = "image/jpeg" } = await req.json();

    if (!image_base64 || typeof image_base64 !== "string") {
      return new Response(JSON.stringify({ error: "No image provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate mime type
    if (!ALLOWED_MIME_TYPES.includes(mime_type)) {
      return new Response(JSON.stringify({ error: "Type d'image non supporté" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check base64 size (~5MB limit → base64 is ~33% larger)
    if (image_base64.length > 7_000_000) {
      return new Response(JSON.stringify({ error: "Image too large (max 5MB)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Step 1: Analyze image with AI vision to extract search keywords
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `Tu es un expert en identification de produits e-commerce. Analyse l'image et retourne UNIQUEMENT un JSON valide avec:
- "keywords": tableau de 5-10 mots-clés décrivant le produit (type, couleur, matière, style, catégorie)
- "category": la catégorie la plus probable parmi: mode-vetements, electronique, maison-deco, beaute-sante, sports-loisirs, alimentation, auto-moto, bebe-enfants
- "description": description courte du produit en 10 mots max

Réponds UNIQUEMENT avec le JSON, sans markdown ni explication.`,
          },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: `data:${mime_type};base64,${image_base64}`,
                },
              },
              {
                type: "text",
                text: "Identifie ce produit et retourne les mots-clés de recherche.",
              },
            ],
          },
        ],
        temperature: 0.2,
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Trop de requêtes, réessayez dans un moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Crédits IA insuffisants." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await aiResponse.text();
      console.error("AI error:", status, t);
      throw new Error("AI analysis failed");
    }

    const aiData = await aiResponse.json();
    const rawContent = aiData.choices?.[0]?.message?.content || "";

    // Parse AI response (strip markdown fences if present)
    let analysis: { keywords: string[]; category: string; description: string };
    try {
      const cleaned = rawContent.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      analysis = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse AI response:", rawContent);
      analysis = { keywords: [], category: "", description: "Produit non identifié" };
    }

    // Step 2: Search products using extracted keywords
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const keywords = analysis.keywords || [];
    if (keywords.length === 0) {
      return new Response(
        JSON.stringify({ products: [], analysis, message: "Aucun produit identifié dans l'image." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Sanitize keywords to prevent injection in ilike
    const sanitizedKeywords = keywords
      .filter((kw: string) => typeof kw === "string" && kw.length > 0 && kw.length <= 100)
      .map((kw: string) => kw.replace(/[%_\\]/g, ""));

    const orConditions = sanitizedKeywords
      .map((kw: string) => `name.ilike.%${kw}%,description.ilike.%${kw}%`)
      .join(",");

    if (!orConditions) {
      return new Response(
        JSON.stringify({ products: [], analysis, message: "Aucun mot-clé valide." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // First: try category + keyword match
    let query = adminClient
      .from("products")
      .select(
        "id, name, slug, price, compare_at_price, images, avg_rating, review_count, stores!inner(name, slug, city, currency)"
      )
      .eq("is_published", true)
      .eq("is_marketplace_published", true)
      .gt("stock_quantity", 0)
      .eq("stores.is_active", true)
      .eq("stores.is_banned", false);

    // Try matching category first
    let categorySlug = analysis.category;
    if (categorySlug && typeof categorySlug === "string" && categorySlug.length <= 50) {
      const { data: catData } = await adminClient
        .from("marketplace_categories")
        .select("id")
        .eq("slug", categorySlug)
        .maybeSingle();

      if (catData) {
        query = query.eq("marketplace_category_id", catData.id);
      }
    }

    // Search with OR on keywords
    query = query.or(orConditions).limit(12);

    const { data: products, error: dbError } = await query;

    if (dbError) {
      console.error("DB error:", dbError);
    }

    let results = products || [];

    // If not enough results, broaden search without category filter
    if (results.length < 4) {
      const broadQuery = adminClient
        .from("products")
        .select(
          "id, name, slug, price, compare_at_price, images, avg_rating, review_count, stores!inner(name, slug, city, currency)"
        )
        .eq("is_published", true)
        .eq("is_marketplace_published", true)
        .gt("stock_quantity", 0)
        .eq("stores.is_active", true)
        .eq("stores.is_banned", false)
        .or(orConditions)
        .limit(12);

      const { data: broadResults } = await broadQuery;
      if (broadResults && broadResults.length > results.length) {
        results = broadResults;
      }
    }

    // Deduplicate
    const seen = new Set<string>();
    results = results.filter((p: any) => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });

    return new Response(
      JSON.stringify({
        products: results.slice(0, 12),
        analysis: {
          keywords: analysis.keywords,
          category: analysis.category,
          description: analysis.description,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("visual-search error:", e);
    return new Response(
      JSON.stringify({ error: "Erreur interne" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
