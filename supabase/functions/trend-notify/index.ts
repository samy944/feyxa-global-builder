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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const now = new Date();
    const d7 = new Date(now.getTime() - 7 * 86400000).toISOString();
    const d14 = new Date(now.getTime() - 14 * 86400000).toISOString();

    // Get recent orders and items for 7d
    const { data: recentOrders } = await supabase
      .from("orders")
      .select("id, created_at")
      .gte("created_at", d14)
      .in("status", ["new", "confirmed", "packed", "shipped", "delivered"]);

    const orders = recentOrders || [];
    const orderIds = orders.map((o) => o.id);

    if (orderIds.length === 0) {
      return new Response(JSON.stringify({ message: "No orders to analyze", notified: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: allItems } = await supabase
      .from("order_items")
      .select("product_id, product_name, quantity, order_id")
      .in("order_id", orderIds);

    const items = allItems || [];
    const orderDateMap: Record<string, string> = {};
    orders.forEach((o) => { orderDateMap[o.id] = o.created_at; });

    // Calculate sales per product for current 7d vs previous 7d
    const sales7d: Record<string, { name: string; sales: number }> = {};
    const salesPrev: Record<string, number> = {};

    items.forEach((item) => {
      if (!item.product_id) return;
      const orderDate = orderDateMap[item.order_id];
      if (!orderDate) return;

      if (orderDate >= d7) {
        if (!sales7d[item.product_id]) sales7d[item.product_id] = { name: item.product_name, sales: 0 };
        sales7d[item.product_id].sales += item.quantity;
      } else {
        salesPrev[item.product_id] = (salesPrev[item.product_id] || 0) + item.quantity;
      }
    });

    // Find trending products (top 10 by sales + positive growth)
    const trending = Object.entries(sales7d)
      .map(([pid, data]) => ({
        productId: pid,
        name: data.name,
        sales: data.sales,
        prevSales: salesPrev[pid] || 0,
        growth: salesPrev[pid] ? ((data.sales - salesPrev[pid]) / salesPrev[pid]) * 100 : data.sales > 0 ? 100 : 0,
      }))
      .filter((p) => p.sales >= 2)
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 10);

    if (trending.length === 0) {
      return new Response(JSON.stringify({ message: "No trending products found", notified: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get product -> store mapping
    const trendingIds = trending.map((t) => t.productId);
    const { data: products } = await supabase
      .from("products")
      .select("id, store_id, name")
      .in("id", trendingIds);

    const productStoreMap: Record<string, string> = {};
    (products || []).forEach((p) => { productStoreMap[p.id] = p.store_id; });

    // Check for recent notifications to avoid spam (last 24h)
    const oneDayAgo = new Date(now.getTime() - 24 * 3600000).toISOString();
    const { data: recentNotifs } = await supabase
      .from("notifications")
      .select("metadata")
      .eq("type", "trend")
      .gte("created_at", oneDayAgo);

    const alreadyNotified = new Set<string>();
    (recentNotifs || []).forEach((n) => {
      const pid = (n.metadata as any)?.product_id;
      if (pid) alreadyNotified.add(pid);
    });

    // Create notifications for store owners
    const notifications: any[] = [];
    trending.forEach((t) => {
      const storeId = productStoreMap[t.productId];
      if (!storeId || alreadyNotified.has(t.productId)) return;

      const rank = trending.indexOf(t) + 1;
      const emoji = rank <= 3 ? "🔥" : t.growth > 50 ? "🚀" : "📈";

      notifications.push({
        store_id: storeId,
        type: "trend",
        title: `${emoji} "${t.name}" est en tendance !`,
        body: `Votre produit est #${rank} sur le marketplace cette semaine avec ${t.sales} ventes${t.growth > 0 ? ` (+${Math.round(t.growth)}%)` : ""}.`,
        metadata: {
          product_id: t.productId,
          rank,
          sales_7d: t.sales,
          growth: Math.round(t.growth),
        },
      });
    });

    let notified = 0;
    if (notifications.length > 0) {
      const { error } = await supabase.from("notifications").insert(notifications);
      if (error) {
        console.error("Insert notifications error:", error);
      } else {
        notified = notifications.length;
      }
    }

    return new Response(
      JSON.stringify({ message: `Trend check complete`, notified, trending: trending.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("trend-notify error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
