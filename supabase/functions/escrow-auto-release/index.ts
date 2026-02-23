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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, serviceKey);

    // Find all held escrows past their release_at date
    const { data: dueEscrows, error: fetchErr } = await sb
      .from("escrow_records")
      .select("id, order_id")
      .eq("status", "held")
      .lte("release_at", new Date().toISOString());

    if (fetchErr) throw fetchErr;

    let released = 0;
    for (const escrow of dueEscrows ?? []) {
      // Skip if there's an active return request (dispute) on this order
      const { data: activeReturns } = await sb
        .from("return_requests")
        .select("id")
        .eq("order_id", escrow.order_id)
        .not("status", "in", '("rejected","refunded")')
        .limit(1);

      if (activeReturns && activeReturns.length > 0) {
        console.log(`Skipping escrow ${escrow.id}: active return request on order ${escrow.order_id}`);
        continue;
      }

      const { data: ok, error } = await sb.rpc("release_escrow", {
        _escrow_id: escrow.id,
      });
      if (error) {
        console.error(`Failed to release ${escrow.id}:`, error.message);
      } else if (ok) {
        released++;
      }
    }

    return new Response(
      JSON.stringify({
        message: `Auto-release complete: ${released}/${(dueEscrows ?? []).length} released`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Escrow auto-release error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
