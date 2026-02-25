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

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    // First, timeout stale processing events
    await admin.rpc("timeout_stale_events");

    // Find failed events ready for retry
    const { data: failedEvents, error: fetchErr } = await admin
      .from("events_log")
      .select("*")
      .eq("status", "failed")
      .lte("next_retry_at", new Date().toISOString())
      .order("next_retry_at", { ascending: true })
      .limit(20);

    if (fetchErr) throw fetchErr;
    if (!failedEvents || failedEvents.length === 0) {
      return new Response(
        JSON.stringify({ retried: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let retried = 0;
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    for (const event of failedEvents) {
      if (event.retry_count >= event.max_retries) {
        // Max retries reached, mark as permanently failed
        await admin
          .from("events_log")
          .update({ status: "max_retries_exceeded" })
          .eq("id", event.id);
        continue;
      }

      // Increment retry count and calculate next retry with exponential backoff
      const newRetryCount = event.retry_count + 1;
      const backoffMinutes = 5 * Math.pow(3, newRetryCount); // 15min, 45min, 135min
      const nextRetry = new Date(Date.now() + backoffMinutes * 60 * 1000).toISOString();

      await admin
        .from("events_log")
        .update({
          retry_count: newRetryCount,
          next_retry_at: nextRetry,
          status: "pending",
        })
        .eq("id", event.id);

      // Re-dispatch to process-event
      try {
        await fetch(`${supabaseUrl}/functions/v1/process-event`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${serviceRoleKey}`,
          },
          body: JSON.stringify({
            event_type: event.event_type,
            aggregate_type: event.aggregate_type,
            aggregate_id: event.aggregate_id,
            store_id: event.store_id,
            payload: event.payload,
          }),
        });
        retried++;
      } catch (callErr: any) {
        console.error(`Retry failed for event ${event.id}:`, callErr.message);
        await admin
          .from("events_log")
          .update({
            status: "failed",
            error_message: `Retry call failed: ${callErr.message}`,
          })
          .eq("id", event.id);
      }
    }

    return new Response(
      JSON.stringify({ retried, total_found: failedEvents.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("retry-failed-events error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
