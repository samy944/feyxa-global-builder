import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, serviceKey);

    // Find tickets open or pending_seller for more than 48 hours without a seller reply
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

    const { data: tickets, error } = await sb
      .from("support_tickets")
      .select("id, store_id, subject, seller_id")
      .in("status", ["open", "pending_seller"])
      .lt("updated_at", cutoff);

    if (error) throw error;
    if (!tickets || tickets.length === 0) {
      return new Response(JSON.stringify({ escalated: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Escalate each
    const ids = tickets.map((t) => t.id);
    const { error: updateErr } = await sb
      .from("support_tickets")
      .update({ status: "escalated", escalated_at: new Date().toISOString() })
      .in("id", ids);

    if (updateErr) throw updateErr;

    // Create notifications for each store
    const notifications = tickets.map((t) => ({
      store_id: t.store_id,
      type: "ticket_escalated",
      title: "⚠️ Ticket escaladé",
      body: `Le ticket "${t.subject}" a été escaladé (pas de réponse sous 48h)`,
      metadata: { ticket_id: t.id },
    }));

    await sb.from("notifications").insert(notifications);

    return new Response(JSON.stringify({ escalated: ids.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Escalate tickets error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
