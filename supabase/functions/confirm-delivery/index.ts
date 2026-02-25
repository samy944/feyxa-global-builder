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

// In-memory rate limiter
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX = 8;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }
  entry.count++;
  return entry.count <= RATE_LIMIT_MAX;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || req.headers.get("cf-connecting-ip")
      || "unknown";

    if (!checkRateLimit(clientIp)) {
      return new Response(
        JSON.stringify({ error: "Trop de tentatives. Réessayez plus tard." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { token, otp, method } = body;

    if (!token && !otp) {
      return new Response(
        JSON.stringify({ error: "Token ou OTP requis" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (token && (typeof token !== "string" || token.length < 10 || token.length > 500)) {
      return new Response(
        JSON.stringify({ error: "Token invalide" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (otp && (typeof otp !== "string" || !/^[0-9]{4,8}$/.test(otp))) {
      return new Response(
        JSON.stringify({ error: "Format OTP invalide" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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
        JSON.stringify({ error: "Token invalide, expiré ou déjà utilisé", status: "invalid" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const orderId = confirmation.order_id;
    const order = confirmation.orders;

    // Mark confirmation as used
    await adminClient
      .from("delivery_confirmations")
      .update({ used_at: new Date().toISOString(), method: method === "otp" ? "otp" : "qr" })
      .eq("id", confirmation.id);

    // Emit delivery.confirmed event → Infrastructure Engine handles order status, escrow, audit
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const eventResp = await fetch(`${supabaseUrl}/functions/v1/process-event`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({
        event_type: "delivery.confirmed",
        aggregate_type: "delivery",
        aggregate_id: orderId,
        store_id: confirmation.store_id,
        payload: {
          order_number: order.order_number,
          method: method === "otp" ? "otp" : "qr",
          confirmation_id: confirmation.id,
        },
      }),
    });

    const eventResult = await eventResp.json();

    return new Response(
      JSON.stringify({
        success: true,
        order_number: order.order_number,
        escrow_released: eventResult?.success || false,
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
