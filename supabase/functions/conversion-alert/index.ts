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

    // Get all stores with a conversion_threshold setting
    const { data: stores } = await supabase
      .from("stores")
      .select("id, name, settings, currency")
      .eq("is_active", true)
      .eq("is_banned", false);

    if (!stores || stores.length === 0) {
      return new Response(JSON.stringify({ message: "No stores", alerted: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const now = new Date();
    const d7 = new Date(now.getTime() - 7 * 86400000).toISOString().split("T")[0];

    // Anti-spam: check recent conversion alerts (last 24h)
    const oneDayAgo = new Date(now.getTime() - 24 * 3600000).toISOString();
    const { data: recentNotifs } = await supabase
      .from("notifications")
      .select("store_id")
      .eq("type", "conversion_alert")
      .gte("created_at", oneDayAgo);

    const alreadyAlerted = new Set((recentNotifs || []).map((n: any) => n.store_id));

    let alerted = 0;

    for (const store of stores) {
      const settings = (store.settings as Record<string, any>) || {};
      const threshold = settings.conversion_threshold;

      // Skip stores without a threshold or already alerted
      if (!threshold || threshold <= 0) continue;
      if (alreadyAlerted.has(store.id)) continue;

      // Get tracking events for the last 7 days
      const { data: events } = await supabase
        .from("tracking_events")
        .select("event_type, event_count, event_value")
        .eq("store_id", store.id)
        .gte("event_date", d7);

      if (!events || events.length === 0) continue;

      let pageViews = 0;
      let purchases = 0;
      let revenue = 0;

      for (const e of events) {
        if (e.event_type === "page_view") pageViews += e.event_count;
        if (e.event_type === "purchase") {
          purchases += e.event_count;
          revenue += e.event_value;
        }
      }

      if (pageViews < 10) continue; // Not enough traffic to judge

      const conversionRate = (purchases / pageViews) * 100;

      if (conversionRate < threshold) {
        const notification = {
          store_id: store.id,
          type: "conversion_alert",
          title: `⚠️ Taux de conversion bas (${conversionRate.toFixed(2)}%)`,
          body: `Votre taux de conversion sur les 7 derniers jours (${conversionRate.toFixed(2)}%) est en dessous de votre seuil de ${threshold}%. ${pageViews} visites, ${purchases} achats. Revenu: ${revenue.toLocaleString()} ${store.currency}.`,
          metadata: {
            conversion_rate: parseFloat(conversionRate.toFixed(2)),
            threshold,
            page_views: pageViews,
            purchases,
            revenue,
            period: "7d",
          },
        };

        const { error } = await supabase.from("notifications").insert(notification);
        if (!error) alerted++;
        else console.error("Insert notification error:", error);
      }
    }

    return new Response(
      JSON.stringify({ message: "Conversion alert check complete", alerted, checked: stores.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("conversion-alert error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
