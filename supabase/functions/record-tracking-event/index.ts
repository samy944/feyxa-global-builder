import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ALLOWED_EVENT_TYPES = [
  "page_view", "view_content", "add_to_cart", "remove_from_cart",
  "begin_checkout", "initiate_checkout", "purchase", "search", "wishlist_add",
  "click", "scroll", "session_start", "session_end",
];

const ALLOWED_CURRENCIES = ["XOF", "XAF", "EUR", "USD", "GNF", "NGN"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { store_id, event_type, value, currency } = body;

    // Validate store_id format (UUID)
    if (!store_id || typeof store_id !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(store_id)) {
      return new Response(JSON.stringify({ error: "Invalid store_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate event_type
    if (!event_type || typeof event_type !== "string" || !ALLOWED_EVENT_TYPES.includes(event_type)) {
      return new Response(JSON.stringify({ error: "Invalid event_type" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate value
    const numValue = Number(value) || 0;
    if (numValue < 0 || numValue > 1_000_000_000) {
      return new Response(JSON.stringify({ error: "Value out of range" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate currency
    const safeCurrency = (typeof currency === "string" && ALLOWED_CURRENCIES.includes(currency.toUpperCase()))
      ? currency.toUpperCase()
      : "XOF";

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const today = new Date().toISOString().split("T")[0];

    const { error } = await supabase.rpc("upsert_tracking_event", {
      _store_id: store_id,
      _event_type: event_type,
      _event_date: today,
      _value: numValue,
      _currency: safeCurrency,
    });

    if (error) {
      console.error("Error upserting tracking event:", error);
      return new Response(JSON.stringify({ error: "Failed to record event" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
