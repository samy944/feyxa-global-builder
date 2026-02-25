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

    const now = new Date();
    const d7 = new Date(now.getTime() - 7 * 86400000).toISOString();
    const d30 = new Date(now.getTime() - 30 * 86400000).toISOString();
    const d60 = new Date(now.getTime() - 60 * 86400000).toISOString();

    const STOCKOUT_ALERT_DAYS = 7;
    const HIGH_DEMAND_GROWTH = 50; // %

    // ── 1. Release expired stock locks ──
    await supabase.rpc("release_expired_stock_locks");

    // ── 2. Get products ──
    let pq = supabase
      .from("products")
      .select("id, store_id, stock_quantity, is_published")
      .eq("is_published", true);

    if (productIds?.length) pq = pq.in("id", productIds);
    const { data: products } = await pq;
    if (!products?.length) {
      return new Response(JSON.stringify({ message: "No products", calculated: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── 3. Sales data (7d and 30d) ──
    const { data: orders7 } = await supabase
      .from("orders").select("id").gte("created_at", d7)
      .in("status", ["new", "confirmed", "packed", "shipped", "delivered"]);
    const { data: orders30 } = await supabase
      .from("orders").select("id").gte("created_at", d30)
      .in("status", ["new", "confirmed", "packed", "shipped", "delivered"]);
    const { data: orders60 } = await supabase
      .from("orders").select("id").gte("created_at", d60).lt("created_at", d30)
      .in("status", ["new", "confirmed", "packed", "shipped", "delivered"]);

    const fetchSales = async (orderIds: string[]) => {
      const map: Record<string, number> = {};
      for (let i = 0; i < orderIds.length; i += 200) {
        const chunk = orderIds.slice(i, i + 200);
        const { data: items } = await supabase
          .from("order_items").select("product_id, quantity").in("order_id", chunk);
        (items || []).forEach((it) => {
          if (it.product_id) map[it.product_id] = (map[it.product_id] || 0) + it.quantity;
        });
      }
      return map;
    };

    const ids7 = (orders7 || []).map(o => o.id);
    const ids30 = (orders30 || []).map(o => o.id);
    const ids60 = (orders60 || []).map(o => o.id);

    const [sales7dMap, sales30dMap, salesPrev30dMap] = await Promise.all([
      fetchSales(ids7),
      fetchSales(ids30),
      fetchSales(ids60),
    ]);

    // ── 4. Calculate metrics per product ──
    const upserts: any[] = [];
    const notifications: any[] = [];
    const autoHideIds: string[] = [];
    const rankingPenaltyIds: string[] = [];

    for (const product of products) {
      const pid = product.id;
      const stock = product.stock_quantity || 0;
      const s7 = sales7dMap[pid] || 0;
      const s30 = sales30dMap[pid] || 0;
      const sPrev30 = salesPrev30dMap[pid] || 0;

      // Weighted forecast
      const avgDaily7 = s7 / 7;
      const avgDaily30 = s30 / 30;
      const avgDaily = avgDaily7 * 0.6 + avgDaily30 * 0.4;
      const forecast30 = Math.round(avgDaily * 30 * 10) / 10;
      const daysUntilStockout = avgDaily > 0 ? Math.round((stock / avgDaily) * 10) / 10 : 999;
      const growthRate = sPrev30 > 0 ? Math.round(((s30 - sPrev30) / sPrev30) * 100 * 10) / 10 : (s30 > 0 ? 100 : 0);
      const recommendedStock = Math.ceil(avgDaily * 45); // 45 days buffer

      let stockStatus = "healthy";
      if (stock === 0) stockStatus = "out_of_stock";
      else if (daysUntilStockout < 3) stockStatus = "critical";
      else if (daysUntilStockout < 7) stockStatus = "low";
      else if (daysUntilStockout < 14) stockStatus = "warning";

      const highDemand = growthRate >= HIGH_DEMAND_GROWTH && s30 >= 5;

      upserts.push({
        product_id: pid,
        country_id: null,
        sales_7d: s7,
        sales_30d: s30,
        avg_daily_sales: Math.round(avgDaily * 100) / 100,
        growth_rate: growthRate,
        forecast_next_30d: forecast30,
        days_until_stockout: daysUntilStockout,
        recommended_stock_level: recommendedStock,
        stock_status: stockStatus,
        high_demand: highDemand,
        last_calculated_at: now.toISOString(),
      });

      // ── Automations ──
      // Alert seller if stockout < 7 days
      if (daysUntilStockout < STOCKOUT_ALERT_DAYS && daysUntilStockout > 0 && stock > 0) {
        notifications.push({
          store_id: product.store_id,
          type: "inventory",
          title: `⚠️ Rupture estimée dans ${Math.round(daysUntilStockout)}j`,
          body: `"${pid}" n'a plus que ${stock} unités. Réapprovisionnement recommandé : ${recommendedStock} unités.`,
          metadata: { product_id: pid, days_until_stockout: daysUntilStockout, recommended: recommendedStock },
        });
      }

      // Auto-hide if out of stock
      if (stock === 0) {
        autoHideIds.push(pid);
      }

      // Reduce ranking if oversell risk (critical stock + high demand)
      if (stockStatus === "critical" && highDemand) {
        rankingPenaltyIds.push(pid);
      }
    }

    // ── 5. Upsert metrics ──
    let calculated = 0;
    for (let i = 0; i < upserts.length; i += 100) {
      const batch = upserts.slice(i, i + 100);
      const { error } = await supabase
        .from("inventory_metrics")
        .upsert(batch, { onConflict: "product_id,country_id" });
      if (error) console.error("Upsert error:", error);
      else calculated += batch.length;
    }

    // ── 6. Auto-hide out-of-stock listings ──
    if (autoHideIds.length > 0) {
      await supabase
        .from("marketplace_listings")
        .update({ status: "hidden" })
        .in("product_id", autoHideIds)
        .eq("status", "published");
    }

    // ── 7. Temporary ranking penalty for oversell risk ──
    if (rankingPenaltyIds.length > 0) {
      for (const pid of rankingPenaltyIds) {
        const { data: existing } = await supabase
          .from("product_ranking_scores")
          .select("score")
          .eq("product_id", pid)
          .maybeSingle();
        if (existing) {
          const penalizedScore = Math.max(0, existing.score - 10);
          await supabase
            .from("product_ranking_scores")
            .update({ score: penalizedScore, risk_penalty: 10 })
            .eq("product_id", pid);
        }
      }
    }

    // ── 8. Send notifications (deduplicate last 24h) ──
    if (notifications.length > 0) {
      const oneDayAgo = new Date(now.getTime() - 24 * 3600000).toISOString();
      const { data: recent } = await supabase
        .from("notifications")
        .select("metadata")
        .eq("type", "inventory")
        .gte("created_at", oneDayAgo);

      const alreadyNotified = new Set<string>();
      (recent || []).forEach((n) => {
        const pid = (n.metadata as any)?.product_id;
        if (pid) alreadyNotified.add(pid);
      });

      const fresh = notifications.filter(n => !alreadyNotified.has((n.metadata as any)?.product_id));
      if (fresh.length > 0) {
        await supabase.from("notifications").insert(fresh);
      }
    }

    return new Response(
      JSON.stringify({ message: "Inventory calculated", calculated, auto_hidden: autoHideIds.length, penalties: rankingPenaltyIds.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("calculate-inventory error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
