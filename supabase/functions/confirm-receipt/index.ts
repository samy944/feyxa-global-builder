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
    const body = await req.json();
    const { order_id, order_number, phone } = body;

    // Validate inputs
    if (!order_id && (!order_number || !phone)) {
      return new Response(
        JSON.stringify({ error: "order_id or (order_number + phone) required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate order_id format if provided
    if (order_id && (typeof order_id !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(order_id))) {
      return new Response(
        JSON.stringify({ error: "Format order_id invalide" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate order_number if provided
    if (order_number && (typeof order_number !== "string" || order_number.length < 3 || order_number.length > 50)) {
      return new Response(
        JSON.stringify({ error: "Numéro de commande invalide" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate phone if provided
    if (phone && (typeof phone !== "string" || !/^\+?[0-9]{8,15}$/.test(phone.replace(/\s/g, "")))) {
      return new Response(
        JSON.stringify({ error: "Numéro de téléphone invalide" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find the order
    let query = sb.from("orders").select("id, shipping_phone, status");
    if (order_id) {
      query = query.eq("id", order_id);
    } else {
      const cleanPhone = phone.replace(/\s/g, "");
      query = query.eq("order_number", order_number.trim()).eq("shipping_phone", cleanPhone);
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
    return new Response(JSON.stringify({ error: "Erreur interne" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
