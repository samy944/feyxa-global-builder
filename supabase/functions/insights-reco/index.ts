import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { insights, products } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `Tu es un analyste e-commerce expert pour Feyxa, plateforme africaine. Analyse les métriques et produits d'une boutique. Retourne EXACTEMENT un JSON (sans markdown, sans backticks) au format:
{"recommendations":[{"title":"titre court","description":"explication actionable","type":"price|stock|performance|general","priority":"high|medium|low"}]}
Donne 3-5 recommandations concrètes et actionables. Ton professionnel mais accessible. Montants en ${insights.currency || "XOF"}.`,
          },
          {
            role: "user",
            content: `Métriques boutique:
- Revenu total: ${insights.totalRevenue} ${insights.currency}
- Commandes: ${insights.totalOrders} (${insights.pendingOrders} en attente)
- Marge moyenne: ${insights.avgMargin?.toFixed(1)}%
- Taux livraison: ${insights.conversionRate?.toFixed(1)}%
- Produits: ${insights.totalProducts}
- Note moyenne: ${insights.avgRating?.toFixed(1)}/5
- Produit star: ${insights.topProduct?.name || "aucun"} (${insights.topProduct?.revenue || 0} ${insights.currency})
- Produits stock faible: ${insights.lowStockProducts?.map((p: any) => `${p.name} (${p.stock})`).join(", ") || "aucun"}

Top produits (prix, coût, stock):
${(products || []).slice(0, 10).map((p: any) => `- ${p.name}: prix=${p.price}, coût=${p.cost_price || "?"}, stock=${p.stock_quantity}, note=${p.avg_rating || 0}`).join("\n")}

Donne tes recommandations.`,
          },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ recommendations: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    let parsed;
    try {
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = { recommendations: [] };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("insights-reco error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
