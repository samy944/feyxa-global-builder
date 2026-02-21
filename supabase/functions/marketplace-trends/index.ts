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

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) throw new Error("Unauthorized");

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

    // Parse period from query params (default 30)
    const url = new URL(req.url);
    const periodDays = Math.min(Math.max(Number(url.searchParams.get("days")) || 30, 7), 90);

    const now = new Date();
    const d7 = new Date(now.getTime() - 7 * 86400000).toISOString();
    const dPeriod = new Date(now.getTime() - periodDays * 86400000).toISOString();
    const dDoublePeriod = new Date(now.getTime() - periodDays * 2 * 86400000).toISOString();

    // Fetch orders for double the period (for comparison)
    const { data: recentOrders } = await supabase
      .from("orders")
      .select("id, total, status, created_at, store_id")
      .gte("created_at", dDoublePeriod)
      .in("status", ["new", "confirmed", "packed", "shipped", "delivered"]);

    const orders = recentOrders || [];
    const orderIds = orders.map((o) => o.id);

    const { data: allItems } = await supabase
      .from("order_items")
      .select("product_id, product_name, quantity, total, order_id, created_at")
      .in("order_id", orderIds.length > 0 ? orderIds : ["00000000-0000-0000-0000-000000000000"]);

    const items = allItems || [];

    const orderDateMap: Record<string, string> = {};
    orders.forEach((o) => { orderDateMap[o.id] = o.created_at; });

    const { data: mktProducts } = await supabase
      .from("products")
      .select("id, name, slug, price, stock_quantity, images, avg_rating, review_count, store_id, marketplace_category_id, is_marketplace_published")
      .eq("is_marketplace_published", true);

    const products = mktProducts || [];

    const { data: categories } = await supabase
      .from("marketplace_categories")
      .select("id, name, slug");

    const catMap: Record<string, string> = {};
    (categories || []).forEach((c) => { catMap[c.id] = c.name; });

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
    const statsPeriod = calcProductStats(dPeriod);
    const statsPrev: Record<string, { sales: number }> = {};
    items.forEach((item) => {
      const orderDate = orderDateMap[item.order_id];
      if (!orderDate || orderDate >= dPeriod || orderDate < dDoublePeriod || !item.product_id) return;
      if (!statsPrev[item.product_id]) statsPrev[item.product_id] = { sales: 0 };
      statsPrev[item.product_id].sales += item.quantity;
    });

    const totalSalesPeriod = Object.values(statsPeriod).reduce((s, v) => s + v.sales, 0) || 1;
    const totalOrdersPeriod = orders.filter((o) => o.created_at >= dPeriod).length || 1;

    const enriched = products.map((p) => {
      const sPeriod = statsPeriod[p.id] || { sales: 0, revenue: 0, orders: 0, name: p.name };
      const sPrevSales = statsPrev[p.id]?.sales || 0;

      const salesWeight = sPeriod.sales / totalSalesPeriod;
      const growthRate = sPrevSales > 0 ? (sPeriod.sales - sPrevSales) / sPrevSales : sPeriod.sales > 0 ? 1 : 0;
      const conversionRate = sPeriod.orders / totalOrdersPeriod;

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
        sales_period: sPeriod.sales,
        revenue_period: sPeriod.revenue,
        growth_rate: Math.round(growthRate * 100),
        trend_score: Math.round(trendScore * 1000) / 1000,
      };
    });

    const top7d = [...enriched].sort((a, b) => b.sales_7d - a.sales_7d).slice(0, 10);
    const topPeriod = [...enriched].sort((a, b) => b.sales_period - a.sales_period).slice(0, 10);

    const emerging = enriched
      .filter((p) => p.sales_period >= 2 && p.growth_rate > 0)
      .sort((a, b) => b.growth_rate - a.growth_rate)
      .slice(0, 10);

    const trending = [...enriched].sort((a, b) => b.trend_score - a.trend_score).slice(0, 10);

    // Category trends
    const catStats: Record<string, { name: string; sales_period: number; sales_prev: number; products: number }> = {};
    enriched.forEach((p) => {
      const cat = p.category || "Autre";
      if (!catStats[cat]) catStats[cat] = { name: cat, sales_period: 0, sales_prev: 0, products: 0 };
      catStats[cat].sales_period += p.sales_period;
      catStats[cat].products += 1;
    });
    Object.entries(statsPrev).forEach(([pid, v]) => {
      const prod = products.find((p) => p.id === pid);
      const cat = prod?.marketplace_category_id ? catMap[prod.marketplace_category_id] || "Autre" : "Autre";
      if (catStats[cat]) catStats[cat].sales_prev += v.sales;
    });

    const categoryTrends = Object.values(catStats)
      .map((c) => ({
        name: c.name,
        sales_period: c.sales_period,
        sales_prev: c.sales_prev,
        products: c.products,
        growth: c.sales_prev > 0 ? Math.round(((c.sales_period - c.sales_prev) / c.sales_prev) * 100) : c.sales_period > 0 ? 100 : 0,
      }))
      .sort((a, b) => b.growth - a.growth);

    // Daily time-series for the selected period
    const dailySales: Record<string, { date: string; sales: number; revenue: number; orders: number }> = {};
    for (let i = periodDays - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      const key = d.toISOString().slice(0, 10);
      dailySales[key] = { date: key, sales: 0, revenue: 0, orders: 0 };
    }
    orders.forEach((o) => {
      if (o.created_at < dPeriod) return;
      const key = o.created_at.slice(0, 10);
      if (dailySales[key]) {
        dailySales[key].orders += 1;
        dailySales[key].revenue += Number(o.total);
      }
    });
    items.forEach((item) => {
      const orderDate = orderDateMap[item.order_id];
      if (!orderDate || orderDate < dPeriod) return;
      const key = orderDate.slice(0, 10);
      if (dailySales[key]) {
        dailySales[key].sales += item.quantity;
      }
    });
    const dailyTimeSeries = Object.values(dailySales);

    // Weekly aggregation
    const numWeeks = Math.ceil(periodDays / 7);
    const weeklyData: { week: string; sales: number; revenue: number; orders: number }[] = [];
    for (let w = 0; w < numWeeks; w++) {
      const weekStart = new Date(now.getTime() - (w + 1) * 7 * 86400000);
      const weekEnd = new Date(now.getTime() - w * 7 * 86400000);
      const label = w === 0 ? "S-actuelle" : `S-${w}`;
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
      JSON.stringify({ periodDays, top7d, topPeriod, emerging, trending, categoryTrends, dailyTimeSeries, weeklyData }),
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
