import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  const d = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[CREATE-SUBSCRIPTION] ${step}${d}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { provider, price_id, plan_slug, success_url, cancel_url } = await req.json();

    // Authenticate user
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user?.email) throw new Error("User not authenticated");

    const user = userData.user;
    const origin = req.headers.get("origin") || "https://localhost:3000";
    const finalSuccess = success_url || `${origin}/dashboard?subscription=success`;
    const finalCancel = cancel_url || `${origin}/dashboard?subscription=cancel`;

    logStep("User authenticated", { email: user.email, provider });

    if (provider === "stripe") {
      const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
      if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not configured");

      const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

      // Find or create Stripe customer
      const customers = await stripe.customers.list({ email: user.email, limit: 1 });
      let customerId: string;
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
      } else {
        const customer = await stripe.customers.create({ email: user.email });
        customerId = customer.id;
      }

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        line_items: [{ price: price_id, quantity: 1 }],
        mode: "subscription",
        success_url: finalSuccess,
        cancel_url: finalCancel,
        metadata: { plan_slug: plan_slug || "", user_id: user.id },
      });

      logStep("Stripe subscription session created", { sessionId: session.id });

      return new Response(JSON.stringify({ url: session.url }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (provider === "fedapay") {
      const fedapayKey = Deno.env.get("FEDAPAY_SECRET_KEY");
      if (!fedapayKey) throw new Error("FEDAPAY_SECRET_KEY is not configured");

      const isLive = fedapayKey.startsWith("sk_live");
      const baseUrl = isLive
        ? "https://api.fedapay.com/v1"
        : "https://sandbox-api.fedapay.com/v1";

      // Get plan details from DB
      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );

      const { data: plan } = await supabaseAdmin
        .from("platform_plans")
        .select("*")
        .eq("slug", plan_slug)
        .single();

      if (!plan) throw new Error("Plan not found");

      const txRes = await fetch(`${baseUrl}/transactions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${fedapayKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          description: `Abonnement Feyxa — ${plan.name}`,
          amount: Math.round(plan.price),
          currency: { iso: (plan.currency || "XOF").toUpperCase() },
          callback_url: finalSuccess,
          customer: { email: user.email, firstname: user.user_metadata?.full_name || "Vendeur" },
        }),
      });

      if (!txRes.ok) {
        const errBody = await txRes.text();
        throw new Error(`FedaPay transaction failed [${txRes.status}]: ${errBody}`);
      }

      const txData = await txRes.json();
      const transactionId = txData.v1?.transaction?.id;

      const tokenRes = await fetch(`${baseUrl}/transactions/${transactionId}/token`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${fedapayKey}`,
          "Content-Type": "application/json",
        },
      });

      if (!tokenRes.ok) {
        const errBody = await tokenRes.text();
        throw new Error(`FedaPay token failed [${tokenRes.status}]: ${errBody}`);
      }

      const tokenData = await tokenRes.json();

      logStep("FedaPay subscription transaction created", { transactionId });

      return new Response(JSON.stringify({ url: tokenData.url || tokenData.token, transaction_id: transactionId }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    throw new Error(`Unknown provider: ${provider}`);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
