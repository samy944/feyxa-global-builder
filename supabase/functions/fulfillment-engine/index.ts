import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const { action, ...params } = await req.json();

    switch (action) {
      // ── Check low warehouse stock & alert ──
      case "check_low_stock": {
        const { data: lowStock } = await admin
          .from("warehouse_inventory")
          .select("id, product_id, warehouse_id, store_id, quantity, products(name), warehouses(name)")
          .lt("quantity", 10)
          .gt("quantity", 0);

        const alerts: string[] = [];
        for (const item of lowStock || []) {
          const productName = (item as any).products?.name || "Produit";
          const warehouseName = (item as any).warehouses?.name || "Entrepôt";

          // Check no recent alert
          const { data: recent } = await admin
            .from("notifications")
            .select("id")
            .eq("store_id", item.store_id)
            .eq("type", "fulfillment")
            .ilike("title", `%stock bas%`)
            .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
            .limit(1);

          if (!recent?.length) {
            await admin.from("notifications").insert({
              store_id: item.store_id,
              type: "fulfillment",
              title: `⚠️ Stock bas à l'entrepôt`,
              body: `${productName} : ${item.quantity} unités restantes à ${warehouseName}.`,
              metadata: { product_id: item.product_id, warehouse_id: item.warehouse_id },
            });
            alerts.push(item.product_id);
          }
        }

        return new Response(
          JSON.stringify({ success: true, alerts_sent: alerts.length }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // ── Check SLA breaches ──
      case "check_sla": {
        const now = new Date().toISOString();
        const { data: breached } = await admin
          .from("outbound_shipments")
          .select("id, order_id, store_id, warehouse_id, sla_deadline, status, warehouses(name)")
          .in("status", ["pending", "picking", "packed"])
          .lt("sla_deadline", now);

        for (const ship of breached || []) {
          const whName = (ship as any).warehouses?.name || "Entrepôt";
          await admin.from("notifications").insert({
            store_id: ship.store_id,
            type: "fulfillment",
            title: `🚨 SLA dépassé`,
            body: `Commande non expédiée depuis ${whName}. Délai dépassé.`,
            metadata: { outbound_id: ship.id, order_id: ship.order_id },
          });
        }

        return new Response(
          JSON.stringify({ success: true, sla_breaches: breached?.length || 0 }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // ── Get fulfillment stats for a store ──
      case "store_stats": {
        const storeId = params.store_id;
        if (!storeId) throw new Error("store_id required");

        // Total units in warehouses
        const { data: inv } = await admin
          .from("warehouse_inventory")
          .select("quantity, reserved_quantity")
          .eq("store_id", storeId);

        const totalUnits = (inv || []).reduce((s, i) => s + i.quantity, 0);
        const reservedUnits = (inv || []).reduce((s, i) => s + i.reserved_quantity, 0);

        // Inbound shipments count
        const { count: pendingInbound } = await admin
          .from("inbound_shipments")
          .select("id", { count: "exact", head: true })
          .eq("store_id", storeId)
          .in("status", ["draft", "in_transit"]);

        // Outbound shipments stats
        const { count: totalOutbound } = await admin
          .from("outbound_shipments")
          .select("id", { count: "exact", head: true })
          .eq("store_id", storeId);

        const { count: deliveredOutbound } = await admin
          .from("outbound_shipments")
          .select("id", { count: "exact", head: true })
          .eq("store_id", storeId)
          .eq("status", "delivered");

        // SLA compliance
        const { count: slaBreaches } = await admin
          .from("outbound_shipments")
          .select("id", { count: "exact", head: true })
          .eq("store_id", storeId)
          .lt("sla_deadline", new Date().toISOString())
          .in("status", ["pending", "picking", "packed"]);

        const slaRate = totalOutbound
          ? Math.round(((totalOutbound - (slaBreaches || 0)) / totalOutbound) * 100)
          : 100;

        return new Response(
          JSON.stringify({
            total_units: totalUnits,
            reserved_units: reservedUnits,
            available_units: totalUnits - reservedUnits,
            pending_inbound: pendingInbound || 0,
            total_outbound: totalOutbound || 0,
            delivered_outbound: deliveredOutbound || 0,
            sla_compliance: slaRate,
            sla_breaches: slaBreaches || 0,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: "Unknown action" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (err: any) {
    console.error("fulfillment-engine error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
