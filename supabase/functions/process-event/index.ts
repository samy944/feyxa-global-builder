import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Handler registry: event_type → handler functions ──
const HANDLER_MAP: Record<string, string[]> = {
  "order.created": [
    "fintech.create_escrow",
    "commerce.decrement_stock",
    "commerce.send_confirmation_email",
    "commerce.create_notification",
  ],
  "payment.paid": [
    "fintech.update_payment_status",
    "commerce.update_order_status",
  ],
  "delivery.delivered": [
    "logistics.mark_delivered",
    "fintech.release_escrow",
  ],
  "delivery.confirmed": [
    "fintech.release_escrow",
    "trust.audit_log",
  ],
  "payout.requested": [
    "fintech.process_payout",
    "trust.audit_log",
  ],
  "ticket.created": [
    "trust.create_notification",
    "trust.auto_assign",
  ],
  "order.delivered": [
    "risk.recalculate_seller",
  ],
  "order.cancelled": [
    "risk.recalculate_buyer",
    "risk.recalculate_seller",
  ],
  "order.completed": [
    "ranking.recalculate_product",
    "risk.recalculate_seller",
    "inventory.recalculate",
  ],
  "review.added": [
    "ranking.recalculate_product",
  ],
  "return.processed": [
    "ranking.recalculate_product",
    "risk.recalculate_seller",
    "risk.recalculate_buyer",
    "inventory.recalculate",
  ],
  "stock.updated": [
    "inventory.recalculate",
  ],
};

// ── Handler implementations ──
async function runHandler(
  admin: any,
  handlerName: string,
  eventType: string,
  payload: any,
  aggregateId: string,
  storeId: string | null
): Promise<{ success: boolean; error?: string }> {
  try {
    switch (handlerName) {
      // ── FINTECH ENGINE ──
      case "fintech.create_escrow": {
        const pm = payload.payment_method;
        if (pm === "cod") return { success: true }; // skip for COD
        const { error } = await admin.rpc("create_escrow_for_order", { _order_id: aggregateId });
        if (error) throw error;
        return { success: true };
      }

      case "fintech.update_payment_status": {
        const { error } = await admin
          .from("orders")
          .update({ payment_status: "paid" })
          .eq("id", aggregateId);
        if (error) throw error;
        return { success: true };
      }

      case "fintech.release_escrow": {
        const { data: escrow } = await admin
          .from("escrow_records")
          .select("id, status")
          .eq("order_id", aggregateId)
          .eq("status", "held")
          .maybeSingle();
        if (escrow) {
          await admin.rpc("release_escrow", { _escrow_id: escrow.id });
        }
        return { success: true };
      }

      case "fintech.process_payout": {
        // Payout is already handled by request_payout RPC, this logs the event
        return { success: true };
      }

      // ── COMMERCE ENGINE ──
      case "commerce.decrement_stock": {
        // Stock is already decremented in Checkout before order creation (validation + reserve)
        // This handler is a no-op to avoid double decrement
        return { success: true };
      }

      case "commerce.send_confirmation_email": {
        const email = payload.customer_email;
        if (!email) return { success: true };
        
        const url = Deno.env.get("SUPABASE_URL")!;
        const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        
        await fetch(`${url}/functions/v1/send-order-confirmation`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${key}`,
          },
          body: JSON.stringify({
            order_id: aggregateId,
            order_number: payload.order_number,
            tracking_token: payload.tracking_token,
            email: email,
            customer_name: payload.customer_name || "",
            store_name: payload.store_name || "",
            total: payload.total,
            currency: payload.currency,
            items: payload.items?.map((i: any) => ({
              name: i.name || i.product_name,
              quantity: i.quantity,
              price: i.price || i.unit_price,
            })) || [],
          }),
        });
        return { success: true };
      }

      case "commerce.create_notification": {
        if (!storeId) return { success: true };
        const { error } = await admin.from("notifications").insert({
          store_id: storeId,
          type: "order",
          title: `Nouvelle commande ${payload.order_number || ""}`,
          body: `Commande de ${payload.total || 0} ${payload.currency || "XOF"} reçue.`,
          metadata: { order_id: aggregateId },
        });
        if (error) throw error;
        return { success: true };
      }

      case "commerce.update_order_status": {
        const newStatus = payload.new_status || "processing";
        const { error } = await admin
          .from("orders")
          .update({ status: newStatus })
          .eq("id", aggregateId);
        if (error) throw error;
        return { success: true };
      }

      // ── LOGISTICS ENGINE ──
      case "logistics.mark_delivered": {
        const { error } = await admin
          .from("orders")
          .update({ status: "delivered" })
          .eq("id", aggregateId);
        if (error) throw error;
        return { success: true };
      }

      // ── TRUST & COMPLIANCE ENGINE ──
      case "trust.audit_log": {
        if (!storeId) return { success: true };
        const { error } = await admin.from("audit_logs").insert({
          store_id: storeId,
          action: eventType,
          target_type: eventType.split(".")[0],
          target_id: aggregateId,
          metadata: { event_type: eventType, via: "event_bus" },
        });
        if (error) throw error;
        return { success: true };
      }

      case "trust.create_notification": {
        if (!storeId) return { success: true };
        const { error } = await admin.from("notifications").insert({
          store_id: storeId,
          type: "ticket",
          title: `Nouveau ticket support`,
          body: payload.subject || "Un client a ouvert un ticket.",
          metadata: { ticket_id: aggregateId },
        });
        if (error) throw error;
        return { success: true };
      }

      case "trust.auto_assign": {
        // V1: no auto-assign logic yet, placeholder
        return { success: true };
      }

      // ── RISK ENGINE ──
      case "risk.recalculate_seller": {
        if (!storeId) return { success: true };
        const url = Deno.env.get("SUPABASE_URL")!;
        const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        await fetch(`${url}/functions/v1/calculate-risk-scores`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
          body: JSON.stringify({ action: "calculate_one", target_type: "seller", target_id: storeId }),
        });
        return { success: true };
      }

      case "risk.recalculate_buyer": {
        if (!payload?.customer_user_id) return { success: true };
        const url3 = Deno.env.get("SUPABASE_URL")!;
        const key3 = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        await fetch(`${url3}/functions/v1/calculate-risk-scores`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${key3}` },
          body: JSON.stringify({ action: "calculate_one", target_type: "user", target_id: payload.customer_user_id }),
        });
        return { success: true };
      }

      case "ranking.recalculate_product": {
        const productIds = payload?.product_ids || (payload?.product_id ? [payload.product_id] : [aggregateId]);
        const url4 = Deno.env.get("SUPABASE_URL")!;
        const key4 = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        await fetch(`${url4}/functions/v1/calculate-rankings`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${key4}` },
          body: JSON.stringify({ product_ids: productIds }),
        });
        return { success: true };
      }

      case "inventory.recalculate": {
        const pids = payload?.product_ids || (payload?.product_id ? [payload.product_id] : [aggregateId]);
        const url5 = Deno.env.get("SUPABASE_URL")!;
        const key5 = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        await fetch(`${url5}/functions/v1/calculate-inventory`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${key5}` },
          body: JSON.stringify({ product_ids: pids }),
        });
        return { success: true };
      }

      default:
        return { success: true };
    }
  } catch (err: any) {
    return { success: false, error: err.message || String(err) };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const body = await req.json();
    const { event_type, aggregate_type, aggregate_id, store_id, payload } = body;

    if (!event_type || !aggregate_id) {
      return new Response(
        JSON.stringify({ error: "event_type and aggregate_id required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const idempotencyKey = `${event_type}:${aggregate_id}`;
    const aggType = aggregate_type || event_type.split(".")[0];

    // 1. Insert event (skip if already exists)
    const { data: existing } = await admin
      .from("events_log")
      .select("id, status")
      .eq("idempotency_key", idempotencyKey)
      .maybeSingle();

    let eventId: string;

    if (existing) {
      if (existing.status === "completed") {
        return new Response(
          JSON.stringify({ success: true, event_id: existing.id, skipped: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      eventId = existing.id;
    } else {
      const { data: inserted, error: insertErr } = await admin
        .from("events_log")
        .insert({
          event_type,
          aggregate_type: aggType,
          aggregate_id,
          store_id: store_id || null,
          payload: payload || {},
          idempotency_key: idempotencyKey,
          status: "processing",
        })
        .select("id")
        .single();

      if (insertErr) throw insertErr;
      eventId = inserted.id;
    }

    // 2. Update status to processing
    await admin
      .from("events_log")
      .update({ status: "processing" })
      .eq("id", eventId);

    // 3. Dispatch to handlers
    const handlers = HANDLER_MAP[event_type] || [];
    let allSuccess = true;
    let lastError = "";

    for (const handlerName of handlers) {
      const start = Date.now();
      const result = await runHandler(admin, handlerName, event_type, payload || {}, aggregate_id, store_id);
      const duration = Date.now() - start;

      // Log handler execution
      await admin.from("event_handlers_log").insert({
        event_id: eventId,
        handler_name: handlerName,
        status: result.success ? "success" : "failed",
        duration_ms: duration,
        error_message: result.error || null,
      });

      if (!result.success) {
        allSuccess = false;
        lastError = result.error || "Unknown error";
      }
    }

    // 4. Update event status
    const now = new Date().toISOString();
    const nextRetry = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    const updatePayload: Record<string, any> = {
      status: allSuccess ? "completed" : "failed",
      processed_at: allSuccess ? now : null,
      error_message: allSuccess ? null : lastError,
    };
    if (!allSuccess) {
      updatePayload.next_retry_at = nextRetry;
    }
    await admin
      .from("events_log")
      .update(updatePayload)
      .eq("id", eventId);

    return new Response(
      JSON.stringify({ success: allSuccess, event_id: eventId, handlers_run: handlers.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("process-event error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
