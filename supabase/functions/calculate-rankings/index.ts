import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json().catch(() => ({}));
    const productIds: string[] | null = body.product_ids || null;

    const d30 = new Date(Date.now() - 30 * 86400000).toISOString();
    const TRENDING_THRESHOLD = 15; // score increase to earn trending badge
    const DROP_THRESHOLD = -20; // score drop to alert seller

    // ── 1. Get all published products (or subset) ──
    let productsQuery = supabase
      .from("products")
      .select("id, store_id, avg_rating, review_count")
      .eq("is_published", true)
      .gt("stock_quantity", 0);

    if (productIds && productIds.length > 0) {
      productsQuery = productsQuery.in("id", productIds);
    }

    const { data: products, error: pErr } = await productsQuery;
    if (pErr) throw pErr;
    if (!products || products.length === 0) {
      return new Response(JSON.stringify({ message: "No products to rank", ranked: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const productMap = new Map(products.map((p) => [p.id, p]));
    const storeIds = [...new Set(products.map((p) => p.store_id))];

    // ── 2. Sales last 30d per product ──
    const { data: recentOrders } = await supabase
      .from("orders")
      .select("id")
      .gte("created_at", d30)
      .in("status", ["new", "confirmed", "packed", "shipped", "delivered"]);

    const orderIds = (recentOrders || []).map((o) => o.id);
    const salesMap: Record<string, number> = {};

    if (orderIds.length > 0) {
      // Batch in chunks of 200
      for (let i = 0; i < orderIds.length; i += 200) {
        const chunk = orderIds.slice(i, i + 200);
        const { data: items } = await supabase
          .from("order_items")
          .select("product_id, quantity")
          .in("order_id", chunk);

        (items || []).forEach((item) => {
          if (item.product_id) {
            salesMap[item.product_id] = (salesMap[item.product_id] || 0) + item.quantity;
          }
        });
      }
    }

    // ── 3. Conversion rates (page_view → add_to_cart) per product ──
    const conversionMap: Record<string, number> = {};
    const { data: views } = await supabase
      .from("analytics_events")
      .select("product_id")
      .eq("event_type", "page_view")
      .gte("created_at", d30)
      .not("product_id", "is", null);

    const viewCounts: Record<string, number> = {};
    (views || []).forEach((v) => {
      if (v.product_id) viewCounts[v.product_id] = (viewCounts[v.product_id] || 0) + 1;
    });

    const { data: atcEvents } = await supabase
      .from("analytics_events")
      .select("product_id")
      .eq("event_type", "add_to_cart")
      .gte("created_at", d30)
      .not("product_id", "is", null);

    const atcCounts: Record<string, number> = {};
    (atcEvents || []).forEach((a) => {
      if (a.product_id) atcCounts[a.product_id] = (atcCounts[a.product_id] || 0) + 1;
    });

    for (const pid of Object.keys(viewCounts)) {
      const v = viewCounts[pid];
      const a = atcCounts[pid] || 0;
      conversionMap[pid] = v > 0 ? (a / v) * 100 : 0;
    }

    // ── 4. Seller SLA & risk from existing tables ──
    const sellerSlaMap: Record<string, number> = {};
    const riskPenaltyMap: Record<string, number> = {};

    if (storeIds.length > 0) {
      const { data: sellerScores } = await supabase
        .from("seller_risk_scores")
        .select("store_id, score, sla_compliance")
        .in("store_id", storeIds);

      (sellerScores || []).forEach((s) => {
        sellerSlaMap[s.store_id] = s.sla_compliance || 100;
        // Risk penalty: inverse of score (100 = no risk, 0 = max risk)
        riskPenaltyMap[s.store_id] = Math.max(0, 100 - (s.score || 100));
      });
    }

    // ── 5. Return rates per product ──
    const returnMap: Record<string, number> = {};
    // Calculate from orders with status 'returned' or 'refunded'
    const { data: returnedOrders } = await supabase
      .from("orders")
      .select("id")
      .gte("created_at", d30)
      .in("status", ["returned", "refunded"]);

    if (returnedOrders && returnedOrders.length > 0) {
      const returnOrderIds = returnedOrders.map((o) => o.id);
      for (let i = 0; i < returnOrderIds.length; i += 200) {
        const chunk = returnOrderIds.slice(i, i + 200);
        const { data: returnItems } = await supabase
          .from("order_items")
          .select("product_id, quantity")
          .in("order_id", chunk);

        (returnItems || []).forEach((item) => {
          if (item.product_id) {
            returnMap[item.product_id] = (returnMap[item.product_id] || 0) + item.quantity;
          }
        });
      }
    }

    // ── 6. Get existing scores for delta comparison ──
    const existingScoreMap: Record<string, { score: number; trending_badge: boolean }> = {};
    const { data: existingScores } = await supabase
      .from("product_ranking_scores")
      .select("product_id, score, trending_badge");

    (existingScores || []).forEach((s) => {
      existingScoreMap[s.product_id] = { score: s.score, trending_badge: s.trending_badge };
    });

    // ── 7. Calculate scores ──
    const upserts: any[] = [];
    const notifications: any[] = [];
    const now = new Date().toISOString();

    // Normalize: find max sales for scaling
    const maxSales = Math.max(1, ...Object.values(salesMap));

    for (const product of products) {
      const pid = product.id;
      const sales = salesMap[pid] || 0;
      const rating = product.avg_rating || 0;
      const reviewCount = product.review_count || 0;
      const convRate = conversionMap[pid] || 0;
      const sellerSla = sellerSlaMap[product.store_id] || 100;
      const riskPenalty = riskPenaltyMap[product.store_id] || 0;
      const totalSold = sales + (returnMap[pid] || 0);
      const returnRate = totalSold > 0 ? ((returnMap[pid] || 0) / totalSold) * 100 : 0;

      // Normalize to 0-100 scale
      const normalizedSales = (sales / maxSales) * 100;
      const normalizedConv = Math.min(convRate, 100);
      const normalizedRating = (rating / 5) * 100;
      const normalizedSla = sellerSla;
      const normalizedReturn = Math.min(returnRate, 100);
      const normalizedRisk = Math.min(riskPenalty, 100);

      // Amazon-like formula
      const score = Math.round(
        (normalizedSales * 0.40) +
        (normalizedConv * 0.20) +
        (normalizedRating * 0.15) +
        (normalizedSla * 0.15) -
        (normalizedReturn * 0.05) -
        (normalizedRisk * 0.05)
      );

      const previousScore = existingScoreMap[pid]?.score || 0;
      const delta = score - previousScore;
      const wasTrending = existingScoreMap[pid]?.trending_badge || false;
      const isTrending = delta >= TRENDING_THRESHOLD || (wasTrending && delta >= 0);

      upserts.push({
        product_id: pid,
        score,
        sales_30d: sales,
        sales_weight: Math.round(normalizedSales * 100) / 100,
        conversion_rate: Math.round(normalizedConv * 100) / 100,
        rating: Math.round(normalizedRating * 100) / 100,
        review_count: reviewCount,
        seller_sla: Math.round(normalizedSla * 100) / 100,
        return_rate: Math.round(normalizedReturn * 100) / 100,
        risk_penalty: Math.round(normalizedRisk * 100) / 100,
        previous_score: previousScore,
        trending_badge: isTrending,
        last_calculated_at: now,
      });

      // Alert seller if score drops sharply
      if (delta <= DROP_THRESHOLD && product.store_id) {
        notifications.push({
          store_id: product.store_id,
          type: "ranking",
          title: `⚠️ Score en baisse pour "${product.id}"`,
          body: `Le score de classement a chuté de ${Math.abs(delta)} points (${previousScore} → ${score}). Vérifiez la qualité de service.`,
          metadata: { product_id: pid, old_score: previousScore, new_score: score, delta },
        });
      }
    }

    // ── 8. Upsert scores in batches ──
    let ranked = 0;
    for (let i = 0; i < upserts.length; i += 100) {
      const batch = upserts.slice(i, i + 100);
      const { error } = await supabase
        .from("product_ranking_scores")
        .upsert(batch, { onConflict: "product_id" });
      if (error) console.error("Upsert error:", error);
      else ranked += batch.length;
    }

    // ── 9. Send notifications ──
    if (notifications.length > 0) {
      await supabase.from("notifications").insert(notifications);
    }

    return new Response(
      JSON.stringify({ message: "Rankings calculated", ranked, notifications: notifications.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("calculate-rankings error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
