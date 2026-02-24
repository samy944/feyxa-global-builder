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
  console.log(`[CREATE-CHECKOUT] ${step}${d}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { provider, order_ids, amount, currency, customer_email, customer_name, success_url, cancel_url } =
      await req.json();

    logStep("Request received", { provider, amount, currency });

    const origin = req.headers.get("origin") || "https://localhost:3000";
    const finalSuccess = success_url || `${origin}/checkout?status=success`;
    const finalCancel = cancel_url || `${origin}/checkout?status=cancel`;

    if (provider === "stripe") {
      const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
      if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not configured");

      const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

      const session = await stripe.checkout.sessions.create({
        customer_email: customer_email || undefined,
        line_items: [
          {
            price_data: {
              currency: (currency || "XOF").toLowerCase(),
              product_data: {
                name: `Commande Feyxa${order_ids?.length > 1 ? ` (${order_ids.length} commandes)` : ""}`,
              },
              unit_amount: Math.round(amount),
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: finalSuccess,
        cancel_url: finalCancel,
        metadata: {
          order_ids: JSON.stringify(order_ids || []),
        },
      });

      logStep("Stripe session created", { sessionId: session.id });

      return new Response(JSON.stringify({ url: session.url, session_id: session.id }), {
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

      // Create FedaPay transaction
      const txRes = await fetch(`${baseUrl}/transactions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${fedapayKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          description: `Commande Feyxa${order_ids?.length > 1 ? ` (${order_ids.length} commandes)` : ""}`,
          amount: Math.round(amount),
          currency: { iso: (currency || "XOF").toUpperCase() },
          callback_url: finalSuccess,
          customer: customer_email
            ? { email: customer_email, firstname: customer_name || "Client" }
            : undefined,
        }),
      });

      if (!txRes.ok) {
        const errBody = await txRes.text();
        throw new Error(`FedaPay transaction creation failed [${txRes.status}]: ${errBody}`);
      }

      const txData = await txRes.json();
      const transactionId = txData.v1?.transaction?.id;
      logStep("FedaPay transaction created", { transactionId });

      // Generate payment token/URL
      const tokenRes = await fetch(`${baseUrl}/transactions/${transactionId}/token`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${fedapayKey}`,
          "Content-Type": "application/json",
        },
      });

      if (!tokenRes.ok) {
        const errBody = await tokenRes.text();
        throw new Error(`FedaPay token generation failed [${tokenRes.status}]: ${errBody}`);
      }

      const tokenData = await tokenRes.json();
      const paymentUrl = tokenData.url || tokenData.token;
      logStep("FedaPay payment URL generated", { paymentUrl });

      return new Response(JSON.stringify({ url: paymentUrl, transaction_id: transactionId }), {
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
