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

  try {
    const body = await req.json();
    const { order_number, phone } = body;

    // Validate order_number
    if (!order_number || typeof order_number !== "string" || order_number.length < 3 || order_number.length > 50) {
      return new Response(
        JSON.stringify({ error: "Numéro de commande invalide" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate phone
    if (!phone || typeof phone !== "string" || !/^\+?[0-9]{8,15}$/.test(phone.replace(/\s/g, ""))) {
      return new Response(
        JSON.stringify({ error: "Numéro de téléphone invalide" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const cleanPhone = phone.replace(/\s/g, "");

    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: order, error: orderErr } = await sb
      .from("orders")
      .select("id, order_number, status, total, subtotal, currency, shipping_phone, shipping_city, shipping_quarter, shipping_address, notes, payment_method, created_at, store_id, order_items(id, product_name, quantity, unit_price, total), stores!inner(name, slug, logo_url)")
      .eq("order_number", order_number.trim())
      .eq("shipping_phone", cleanPhone)
      .maybeSingle();

    if (orderErr) throw orderErr;
    if (!order) {
      return new Response(
        JSON.stringify({ error: "Commande introuvable" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get escrow info (limited fields only)
    const { data: escrow } = await sb
      .from("escrow_records")
      .select("id, status, release_at")
      .eq("order_id", order.id)
      .maybeSingle();

    return new Response(
      JSON.stringify({ order, escrow }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Track order error:", err);
    return new Response(JSON.stringify({ error: "Erreur interne" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
