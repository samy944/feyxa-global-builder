import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const selectFields = "id, order_number, status, total, subtotal, currency, shipping_phone, shipping_city, shipping_quarter, shipping_address, notes, payment_method, created_at, store_id, customer_email, order_items(id, product_name, quantity, unit_price, total), stores!inner(name, slug, logo_url)";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { order_number, phone, email, token } = body;

    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let order: any = null;

    // Method 1: Direct token access (from email link)
    if (token && typeof token === "string" && token.length >= 32 && token.length <= 128) {
      const { data, error } = await sb
        .from("orders")
        .select(selectFields)
        .eq("tracking_token", token)
        .maybeSingle();
      if (error) throw error;
      order = data;
    }
    // Method 2: Email + order_number
    else if (email && order_number) {
      if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return new Response(
          JSON.stringify({ error: "Email invalide" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (typeof order_number !== "string" || order_number.length < 3 || order_number.length > 50) {
        return new Response(
          JSON.stringify({ error: "Numéro de commande invalide" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const { data, error } = await sb
        .from("orders")
        .select(selectFields)
        .eq("order_number", order_number.trim())
        .eq("customer_email", email.trim().toLowerCase())
        .maybeSingle();
      if (error) throw error;
      order = data;
    }
    // Method 3: Phone + order_number (existing)
    else if (phone && order_number) {
      if (typeof phone !== "string" || !/^\+?[0-9]{8,15}$/.test(phone.replace(/\s/g, ""))) {
        return new Response(
          JSON.stringify({ error: "Numéro de téléphone invalide" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (typeof order_number !== "string" || order_number.length < 3 || order_number.length > 50) {
        return new Response(
          JSON.stringify({ error: "Numéro de commande invalide" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const cleanPhone = phone.replace(/\s/g, "");
      const { data, error } = await sb
        .from("orders")
        .select(selectFields)
        .eq("order_number", order_number.trim())
        .eq("shipping_phone", cleanPhone)
        .maybeSingle();
      if (error) throw error;
      order = data;
    } else {
      return new Response(
        JSON.stringify({ error: "Paramètres insuffisants" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!order) {
      return new Response(
        JSON.stringify({ error: "Commande introuvable" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get escrow info
    const { data: escrow } = await sb
      .from("escrow_records")
      .select("id, status, release_at")
      .eq("order_id", order.id)
      .maybeSingle();

    // Strip tracking_token from response for security
    delete order.tracking_token;
    delete order.customer_email;

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
