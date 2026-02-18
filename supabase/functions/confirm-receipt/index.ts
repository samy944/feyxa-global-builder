import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { order_id, order_number, phone } = await req.json();

    if (!order_id && (!order_number || !phone)) {
      return new Response(
        JSON.stringify({ error: "order_id or (order_number + phone) required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, serviceKey);

    // Find the order
    let query = sb.from("orders").select("id, shipping_phone, status");
    if (order_id) {
      query = query.eq("id", order_id);
    } else {
      query = query.eq("order_number", order_number).eq("shipping_phone", phone);
    }

    const { data: order, error: orderErr } = await query.maybeSingle();
    if (orderErr) throw orderErr;
    if (!order) {
      return new Response(
        JSON.stringify({ error: "Commande introuvable" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Find held escrow for this order
    const { data: escrow, error: escrowErr } = await sb
      .from("escrow_records")
      .select("id, status")
      .eq("order_id", order.id)
      .eq("status", "held")
      .maybeSingle();

    if (escrowErr) throw escrowErr;
    if (!escrow) {
      return new Response(
        JSON.stringify({ error: "Aucun escrow en attente pour cette commande" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Release escrow
    const { data: released, error: releaseErr } = await sb.rpc("release_escrow", {
      _escrow_id: escrow.id,
    });
    if (releaseErr) throw releaseErr;

    // Update order status to delivered
    await sb.from("orders").update({ status: "delivered" }).eq("id", order.id);

    return new Response(
      JSON.stringify({ success: true, released }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Confirm receipt error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
