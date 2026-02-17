import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing auth");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Get authenticated user using service role
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) throw new Error("Unauthorized");

    // Get user's store
    const { data: store } = await supabase
      .from("stores")
      .select("id, name, currency")
      .eq("owner_id", user.id)
      .limit(1)
      .maybeSingle();

    if (!store) {
      return new Response(JSON.stringify({ error: "No store found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7).toISOString();

    // Fetch metrics in parallel
    const [ordersToday, ordersWeek, pendingOrders, lowStockProducts] = await Promise.all([
      supabase
        .from("orders")
        .select("total, status, payment_status")
        .eq("store_id", store.id)
        .gte("created_at", todayStart),
      supabase
        .from("orders")
        .select("total, status")
        .eq("store_id", store.id)
        .gte("created_at", weekStart),
      supabase
        .from("orders")
        .select("id, order_number, status, total, shipping_city")
        .eq("store_id", store.id)
        .in("status", ["new", "confirmed", "packed"]),
      supabase
        .from("products")
        .select("id, name, stock_quantity, low_stock_threshold")
        .eq("store_id", store.id)
        .eq("is_published", true),
    ]);

    const todayData = ordersToday.data || [];
    const weekData = ordersWeek.data || [];
    const pending = pendingOrders.data || [];
    const products = lowStockProducts.data || [];

    const todayRevenue = todayData.reduce((s, o) => s + Number(o.total), 0);
    const weekRevenue = weekData.reduce((s, o) => s + Number(o.total), 0);
    const newOrders = pending.filter((o) => o.status === "new").length;
    const toShip = pending.filter((o) => o.status === "confirmed" || o.status === "packed").length;
    const lowStock = products.filter((p) => p.stock_quantity <= (p.low_stock_threshold || 5));
    const codPending = todayData.filter((o) => o.payment_status === "cod" || o.payment_status === "pending").length;

    const metrics = {
      todayRevenue,
      todayOrders: todayData.length,
      weekRevenue,
      weekOrders: weekData.length,
      newOrders,
      toShip,
      lowStockCount: lowStock.length,
      lowStockItems: lowStock.map((p) => p.name).slice(0, 5),
      codPending,
      currency: store.currency,
      storeName: store.name,
    };

    // Call Lovable AI for smart actions
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
            content: `Tu es l'assistant IA de Feyxa, une plateforme e-commerce africaine. Tu analyses les métriques d'une boutique et proposes exactement 3 actions prioritaires concrètes et actionables pour la journée. Réponds UNIQUEMENT avec un JSON valide, sans markdown ni backticks, au format:
{"summary":"résumé en 1-2 phrases","actions":[{"title":"titre court","description":"explication concrète","priority":"high|medium|low","icon":"package|truck|alert|trending-up|phone|star"}]}
Utilise un ton professionnel mais chaleureux. Les montants sont en ${store.currency}.`,
          },
          {
            role: "user",
            content: `Voici les métriques de la boutique "${store.name}" ce matin:
- Revenu aujourd'hui: ${todayRevenue} ${store.currency} (${todayData.length} commandes)
- Revenu cette semaine: ${weekRevenue} ${store.currency} (${weekData.length} commandes)
- Commandes nouvelles à confirmer: ${newOrders}
- Commandes à expédier: ${toShip}
- Produits en stock faible (${lowStock.length}): ${lowStock.map(p => `${p.name} (${p.stock_quantity} restants)`).join(", ") || "aucun"}
- Paiements en attente (COD/pending): ${codPending}

Propose 3 actions prioritaires pour aujourd'hui.`,
          },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      console.error("AI error:", status, await aiResponse.text());
      // Return metrics without AI if AI fails
      return new Response(JSON.stringify({ metrics, ai: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content || "";

    let ai = null;
    try {
      // Clean potential markdown wrappers
      const cleaned = aiContent.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      ai = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse AI response:", aiContent);
      ai = { summary: "Analyse en cours...", actions: [] };
    }

    return new Response(JSON.stringify({ metrics, ai }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("smart-ops error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
