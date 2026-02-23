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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub as string;

    const { order_id, store_id, regenerate } = await req.json();
    if (!order_id || !store_id) {
      return new Response(JSON.stringify({ error: "order_id and store_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use service role for DB operations
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify user is store member
    const { data: isMember } = await adminClient.rpc("is_store_member", {
      _store_id: store_id,
      _user_id: userId,
    });
    if (!isMember) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If regenerate, invalidate old tokens
    if (regenerate) {
      await adminClient
        .from("delivery_confirmations")
        .update({ expires_at: new Date().toISOString() })
        .eq("order_id", order_id)
        .is("used_at", null);
    }

    // Check if active token exists
    const { data: existing } = await adminClient
      .from("delivery_confirmations")
      .select("id, token_hash, expires_at")
      .eq("order_id", order_id)
      .is("used_at", null)
      .gt("expires_at", new Date().toISOString())
      .limit(1)
      .maybeSingle();

    if (existing && !regenerate) {
      // Return existing - but we can't reverse the hash. Store raw token temporarily? 
      // Actually we need to generate a new one since we can't reverse hash
    }

    // Generate cryptographically secure token
    const rawToken = crypto.randomUUID() + "-" + crypto.randomUUID();

    // Hash token using SHA-256
    const encoder = new TextEncoder();
    const data = encoder.encode(rawToken);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const tokenHash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

    // Generate 6-digit OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));

    // Hash OTP too
    const otpData = encoder.encode(otp);
    const otpHashBuffer = await crypto.subtle.digest("SHA-256", otpData);
    const otpHashArray = Array.from(new Uint8Array(otpHashBuffer));
    const otpHash = otpHashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    // Insert confirmation record
    const { error: insertErr } = await adminClient
      .from("delivery_confirmations")
      .insert({
        order_id,
        store_id,
        token_hash: tokenHash,
        expires_at: expiresAt,
        otp_code: otpHash,
        method: "qr",
      });

    if (insertErr) throw insertErr;

    return new Response(
      JSON.stringify({
        token: rawToken,
        otp,
        expires_at: expiresAt,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message || "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
