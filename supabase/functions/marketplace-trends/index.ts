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

    // Verify user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) throw new Error("Unauthorized");

    // Verify user has a store (vendor access only)
    const { data: store } = await supabase
      .from("stores")
      .select("id")
      .eq("owner_id", user.id)
      .limit(1)
      .maybeSingle();

    if (!store) {
      return new Response(JSON.stringify({ error: "Vendor access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const now = new Date();
    const d7 = new Date(now.getTime() - 7 * 86400000).toISOString();
    const d30 = new Date(now.getTime() - 30 * 86400000).toISOString();
    const d60 = new Date(now.getTime() - 60 * 86400000).toISOString();

    // Fetch marketplace orders with items for last 60 days (to compare periods)
    const { data: recentOrders } = await supabase
      .from("orders")
      .select("id, total, status, created_at, store_id")
      .gte("created_at", d60)
      .in("status", ["new", "confirmed", "packed", "shipped", "delivered"]);

    const orders = recentOrders || [];
    const orderIds = orders.map((o) => o.id);

    const { data: allItems } = await supabase
      .from("order_items")
      .select("product_id, product_name, quantity, total, order_id, created_at")
      .in("order_id", orderIds.length > 0 ? orderIds : ["00000000-0000-0000-0000-000000000000"]);

    const items = allItems || [];

    // Map order dates to items
    const orderDateMap: Record<string, string> = {};
    orders.forEach((o) => { orderDateMap[o.id] = o.created_at; });

    // Fetch marketplace products
    const { data: mktProducts } = await supabase
      .from("products")
      .select("id, name, slug, price, stock_quantity, images, avg_rating, review_count, store_id, marketplace_category_id, is_marketplace_published")
      .eq("is_marketplace_published", true);

    const products = mktProducts || [];

    // Fetch categories
    const { data: categories } = await supabase
      .from("marketplace_categories")
      .select("id, name, slug");

    const catMap: Record<string, string> = {};
    (categories || []).forEach((c) => { catMap[c.id] = c.name; });

    // Calculate product stats for 7d and 30d
    function calcProductStats(periodStart: string) {
      const stats: Record<string, { name: string; sales: number; revenue: number; orders: number }> = {};
      items.forEach((item) => {
        const orderDate = orderDateMap[item.order_id];
        if (!orderDate || orderDate < periodStart || !item.product_id) return;
        if (!stats[item.product_id]) {
          stats[item.product_id] = { name: item.product_name, sales: 0, revenue: 0, orders: 0 };
        }
        stats[item.product_id].sales += item.quantity;
        stats[item.product_id].revenue += Number(item.total);
        stats[item.product_id].orders += 1;
      });
      return stats;
    }

    const stats7d = calcProductStats(d7);
    const stats30d = calcProductStats(d30);
    const statsPrev30d: Record<string, { sales: number }> = {};
    items.forEach((item) => {
      const orderDate = orderDateMap[item.order_id];
      if (!orderDate || orderDate >= d30 || orderDate < d60 || !item.product_id) return;
      if (!statsPrev30d[item.product_id]) statsPrev30d[item.product_id] = { sales: 0 };
      statsPrev30d[item.product_id].sales += item.quantity;
    });

    // Enrich products with trend_score
    const totalSales30d = Object.values(stats30d).reduce((s, v) => s + v.sales, 0) || 1;
    const totalOrders30d = orders.filter((o) => o.created_at >= d30).length || 1;

    const enriched = products.map((p) => {
      const s30 = stats30d[p.id] || { sales: 0, revenue: 0, orders: 0, name: p.name };
      const sPrev = statsPrev30d[p.id]?.sales || 0;

      const salesWeight = s30.sales / totalSales30d;
      const growthRate = sPrev > 0 ? (s30.sales - sPrev) / sPrev : s30.sales > 0 ? 1 : 0;
      const conversionRate = s30.orders / totalOrders30d;

      const trendScore = (salesWeight * 0.5) + (growthRate * 0.3) + (conversionRate * 0.2);

      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: p.price,
        image: Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : null,
        avg_rating: p.avg_rating || 0,
        review_count: p.review_count || 0,
        store_id: p.store_id,
        category: p.marketplace_category_id ? catMap[p.marketplace_category_id] || null : null,
        sales_7d: stats7d[p.id]?.sales || 0,
        revenue_7d: stats7d[p.id]?.revenue || 0,
        sales_30d: s30.sales,
        revenue_30d: s30.revenue,
        growth_rate: Math.round(growthRate * 100),
        trend_score: Math.round(trendScore * 1000) / 1000,
      };
    });

    // Top products
    const top7d = [...enriched].sort((a, b) => b.sales_7d - a.sales_7d).slice(0, 10);
    const top30d = [...enriched].sort((a, b) => b.sales_30d - a.sales_30d).slice(0, 10);

    // Emerging (high growth, at least some sales)
    const emerging = enriched
      .filter((p) => p.sales_30d >= 2 && p.growth_rate > 0)
      .sort((a, b) => b.growth_rate - a.growth_rate)
      .slice(0, 10);

    // Trending by score
    const trending = [...enriched].sort((a, b) => b.trend_score - a.trend_score).slice(0, 10);

    // Category trends
    const catStats: Record<string, { name: string; sales_30d: number; sales_prev: number; products: number }> = {};
    enriched.forEach((p) => {
      const cat = p.category || "Autre";
      if (!catStats[cat]) catStats[cat] = { name: cat, sales_30d: 0, sales_prev: 0, products: 0 };
      catStats[cat].sales_30d += p.sales_30d;
      catStats[cat].products += 1;
    });
    // Add prev period category sales
    Object.entries(statsPrev30d).forEach(([pid, v]) => {
      const prod = products.find((p) => p.id === pid);
      const cat = prod?.marketplace_category_id ? catMap[prod.marketplace_category_id] || "Autre" : "Autre";
      if (catStats[cat]) catStats[cat].sales_prev += v.sales;
    });

    const categoryTrends = Object.values(catStats)
      .map((c) => ({
        ...c,
        growth: c.sales_prev > 0 ? Math.round(((c.sales_30d - c.sales_prev) / c.sales_prev) * 100) : c.sales_30d > 0 ? 100 : 0,
      }))
      .sort((a, b) => b.growth - a.growth);

    // Daily time-series for last 30 days
    const dailySales: Record<string, { date: string; sales: number; revenue: number; orders: number }> = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      const key = d.toISOString().slice(0, 10);
      dailySales[key] = { date: key, sales: 0, revenue: 0, orders: 0 };
    }
    orders.forEach((o) => {
      if (o.created_at < d30) return;
      const key = o.created_at.slice(0, 10);
      if (dailySales[key]) {
        dailySales[key].orders += 1;
        dailySales[key].revenue += Number(o.total);
      }
    });
    items.forEach((item) => {
      const orderDate = orderDateMap[item.order_id];
      if (!orderDate || orderDate < d30) return;
      const key = orderDate.slice(0, 10);
      if (dailySales[key]) {
        dailySales[key].sales += item.quantity;
      }
    });
    const dailyTimeSeries = Object.values(dailySales);

    // Weekly aggregation
    const weeklyData: { week: string; sales: number; revenue: number; orders: number }[] = [];
    for (let w = 0; w < 4; w++) {
      const weekStart = new Date(now.getTime() - (w + 1) * 7 * 86400000);
      const weekEnd = new Date(now.getTime() - w * 7 * 86400000);
      const label = `S-${w === 0 ? "actuelle" : w}`;
      let sales = 0, revenue = 0, ordersCount = 0;
      dailyTimeSeries.forEach((d) => {
        const dt = new Date(d.date);
        if (dt >= weekStart && dt < weekEnd) {
          sales += d.sales;
          revenue += d.revenue;
          ordersCount += d.orders;
        }
      });
      weeklyData.unshift({ week: label, sales, revenue, orders: ordersCount });
    }

    return new Response(
      JSON.stringify({ top7d, top30d, emerging, trending, categoryTrends, dailyTimeSeries, weeklyData }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("marketplace-trends error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
