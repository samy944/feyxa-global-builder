import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function sha256(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { token, otp, method } = body;

    // Validate inputs
    if (!token && !otp) {
      return new Response(
        JSON.stringify({ error: "Token ou OTP requis" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate token format
    if (token && (typeof token !== "string" || token.length < 10 || token.length > 500)) {
      return new Response(
        JSON.stringify({ error: "Token invalide" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate OTP format (typically 6 digits)
    if (otp && (typeof otp !== "string" || !/^[0-9]{4,8}$/.test(otp))) {
      return new Response(
        JSON.stringify({ error: "Format OTP invalide" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate method
    if (method && !["qr", "otp"].includes(method)) {
      return new Response(
        JSON.stringify({ error: "Méthode invalide" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let confirmation: any = null;

    if (method === "otp" && otp) {
      // OTP flow: hash the OTP and find match
      const otpHash = await sha256(otp);
      const { data, error } = await adminClient
        .from("delivery_confirmations")
        .select("*, orders!inner(id, order_number, status, store_id)")
        .eq("otp_code", otpHash)
        .is("used_at", null)
        .gt("expires_at", new Date().toISOString())
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      confirmation = data;
    } else if (token) {
      // QR token flow: hash and find
      const tokenHash = await sha256(token);
      const { data, error } = await adminClient
        .from("delivery_confirmations")
        .select("*, orders!inner(id, order_number, status, store_id)")
        .eq("token_hash", tokenHash)
        .is("used_at", null)
        .gt("expires_at", new Date().toISOString())
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      confirmation = data;
    }

    if (!confirmation) {
      return new Response(
        JSON.stringify({
          error: "Token invalide, expiré ou déjà utilisé",
          status: "invalid",
        }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const orderId = confirmation.order_id;
    const order = confirmation.orders;

    // Mark confirmation as used
    const { error: updateErr } = await adminClient
      .from("delivery_confirmations")
      .update({
        used_at: new Date().toISOString(),
        method: method === "otp" ? "otp" : "qr",
      })
      .eq("id", confirmation.id);

    if (updateErr) throw updateErr;

    // Update order status to delivered
    const { error: orderErr } = await adminClient
      .from("orders")
      .update({ status: "delivered" })
      .eq("id", orderId);

    if (orderErr) throw orderErr;

    // Try to release escrow if exists
    const { data: escrow } = await adminClient
      .from("escrow_records")
      .select("id, status")
      .eq("order_id", orderId)
      .eq("status", "held")
      .maybeSingle();

    let escrowReleased = false;
    if (escrow) {
      const { data: released } = await adminClient.rpc("release_escrow", {
        _escrow_id: escrow.id,
      });
      escrowReleased = !!released;
    }

    // Audit log
    await adminClient.from("audit_logs").insert({
      store_id: confirmation.store_id,
      action: "delivery_confirmed",
      target_type: "order",
      target_id: orderId,
      metadata: {
        method: method === "otp" ? "otp" : "qr",
        confirmation_id: confirmation.id,
        escrow_released: escrowReleased,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        order_number: order.order_number,
        escrow_released: escrowReleased,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({ error: "Erreur interne" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
