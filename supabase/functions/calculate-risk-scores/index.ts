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

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const body = await req.json().catch(() => ({}));
    const action = body.action || "calculate_all";
    const targetId = body.target_id;
    const targetType = body.target_type; // 'user' | 'seller'

    const results: any = { users: 0, sellers: 0, reputation: 0 };

    // ── BUYER RISK SCORES ──
    if (action === "calculate_all" || (action === "calculate_one" && targetType === "user")) {
      const userFilter = targetId ? `AND c.user_id = '${targetId}'` : "";

      const { data: buyers } = await admin.rpc("sql" as any, {}) as any;
      // Use raw queries via from() instead
      
      // Get all customers with user_id
      let custQuery = admin.from("customers").select("user_id").not("user_id", "is", null);
      if (targetId) custQuery = custQuery.eq("user_id", targetId);
      const { data: customers } = await custQuery;
      
      const userIds = [...new Set((customers || []).map((c: any) => c.user_id).filter(Boolean))];
      
      for (const userId of userIds) {
        // Get all orders for this user's customers
        const { data: userCustomers } = await admin
          .from("customers")
          .select("id")
          .eq("user_id", userId);
        
        const customerIds = (userCustomers || []).map((c: any) => c.id);
        if (customerIds.length === 0) continue;

        const { data: orders } = await admin
          .from("orders")
          .select("id, status, payment_status, payment_method")
          .in("customer_id", customerIds);

        const totalOrders = (orders || []).length;
        if (totalOrders === 0) continue;

        // COD failure rate: orders with COD where payment failed or cancelled
        const codOrders = (orders || []).filter((o: any) => o.payment_method === "cod");
        const codFailed = codOrders.filter((o: any) => o.status === "cancelled" || o.payment_status === "failed");
        const codFailureRate = codOrders.length > 0 ? codFailed.length / codOrders.length : 0;

        // Return rate
        const returnedOrders = (orders || []).filter((o: any) => o.status === "returned");
        const returnRate = returnedOrders.length / totalOrders;

        // Cancelled rate as proxy for disputes
        const cancelledOrders = (orders || []).filter((o: any) => o.status === "cancelled");
        const disputeRate = cancelledOrders.length / totalOrders;

        // Payment failure rate
        const paymentFailed = (orders || []).filter((o: any) => o.payment_status === "failed");
        const paymentFailureRate = paymentFailed.length / totalOrders;

        // Score calculation (100 = perfect, 0 = worst)
        const rawScore = 100
          - (codFailureRate * 30)
          - (returnRate * 25)
          - (disputeRate * 25)
          - (paymentFailureRate * 20);
        const score = Math.max(0, Math.min(100, Math.round(rawScore)));

        const factors = {
          cod_failure_rate: Math.round(codFailureRate * 100) / 100,
          return_rate: Math.round(returnRate * 100) / 100,
          dispute_rate: Math.round(disputeRate * 100) / 100,
          payment_failure_rate: Math.round(paymentFailureRate * 100) / 100,
          total_orders: totalOrders,
          cod_orders: codOrders.length,
          cod_failed: codFailed.length,
        };

        // Automations
        const codDisabled = score < 40;
        const manualReview = score < 30;

        // Get previous score
        const { data: existing } = await admin
          .from("user_risk_scores")
          .select("id, score, admin_override_score")
          .eq("user_id", userId)
          .maybeSingle();

        const finalScore = existing?.admin_override_score ?? score;

        const upsertData = {
          user_id: userId,
          score: finalScore,
          cod_failure_rate: factors.cod_failure_rate,
          return_rate: factors.return_rate,
          dispute_rate: factors.dispute_rate,
          payment_failure_rate: factors.payment_failure_rate,
          total_orders: totalOrders,
          factors,
          cod_disabled: codDisabled,
          manual_review: manualReview,
          last_calculated_at: new Date().toISOString(),
        };

        if (existing) {
          await admin.from("user_risk_scores").update(upsertData).eq("id", existing.id);
          // Log history if score changed
          if (existing.score !== finalScore) {
            await admin.from("risk_score_history").insert({
              target_type: "user",
              target_id: userId,
              previous_score: existing.score,
              new_score: finalScore,
              change_reason: "auto_calculation",
              factors,
            });
          }
        } else {
          await admin.from("user_risk_scores").insert(upsertData);
          await admin.from("risk_score_history").insert({
            target_type: "user",
            target_id: userId,
            previous_score: null,
            new_score: finalScore,
            change_reason: "initial_calculation",
            factors,
          });
        }
        results.users++;
      }
    }

    // ── SELLER RISK SCORES + REPUTATION ──
    if (action === "calculate_all" || (action === "calculate_one" && targetType === "seller")) {
      let storeQuery = admin.from("stores").select("id, owner_id, name").eq("is_active", true);
      if (targetId) storeQuery = storeQuery.eq("id", targetId);
      const { data: stores } = await storeQuery;

      for (const store of (stores || [])) {
        const { data: orders } = await admin
          .from("orders")
          .select("id, status, payment_status, created_at, updated_at")
          .eq("store_id", store.id);

        const totalOrders = (orders || []).length;

        // Late shipment: orders that took > 3 days to move from 'new' to 'processing'
        const { data: statusHistory } = await admin
          .from("order_status_history")
          .select("order_id, previous_status, new_status, created_at")
          .eq("store_id", store.id);

        let lateShipments = 0;
        const orderCreatedMap = new Map((orders || []).map((o: any) => [o.id, new Date(o.created_at)]));
        
        for (const h of (statusHistory || [])) {
          if (h.new_status === "processing" && h.previous_status === "new") {
            const created = orderCreatedMap.get(h.order_id);
            if (created) {
              const diff = (new Date(h.created_at).getTime() - created.getTime()) / (1000 * 60 * 60);
              if (diff > 72) lateShipments++;
            }
          }
        }

        const lateShipmentRate = totalOrders > 0 ? lateShipments / totalOrders : 0;
        const cancelledOrders = (orders || []).filter((o: any) => o.status === "cancelled").length;
        const cancellationRate = totalOrders > 0 ? cancelledOrders / totalOrders : 0;
        const returnedOrders = (orders || []).filter((o: any) => o.status === "returned").length;
        const returnRate = totalOrders > 0 ? returnedOrders / totalOrders : 0;
        const disputeRate = 0; // No disputes table yet, placeholder
        const slaCompliance = 100 - (lateShipmentRate * 100);

        const rawScore = 100
          - (lateShipmentRate * 25)
          - (cancellationRate * 25)
          - (returnRate * 20)
          - (disputeRate * 20)
          - ((100 - slaCompliance) / 100 * 10);
        const score = Math.max(0, Math.min(100, Math.round(rawScore)));

        const factors = {
          late_shipment_rate: Math.round(lateShipmentRate * 100) / 100,
          cancellation_rate: Math.round(cancellationRate * 100) / 100,
          return_rate: Math.round(returnRate * 100) / 100,
          dispute_rate: 0,
          sla_compliance: Math.round(slaCompliance * 100) / 100,
          total_orders: totalOrders,
          late_shipments: lateShipments,
          cancelled: cancelledOrders,
          returned: returnedOrders,
        };

        const visibilityReduced = score < 50;
        const payoutsFrozen = score < 30;
        const manualReview = score < 40;

        const { data: existing } = await admin
          .from("seller_risk_scores")
          .select("id, score, admin_override_score")
          .eq("store_id", store.id)
          .maybeSingle();

        const finalScore = existing?.admin_override_score ?? score;

        const upsertData = {
          store_id: store.id,
          score: finalScore,
          late_shipment_rate: factors.late_shipment_rate,
          cancellation_rate: factors.cancellation_rate,
          return_rate: factors.return_rate,
          dispute_rate: 0,
          sla_compliance: factors.sla_compliance,
          total_orders: totalOrders,
          factors,
          visibility_reduced: visibilityReduced,
          payouts_frozen: payoutsFrozen,
          manual_review: manualReview,
          last_calculated_at: new Date().toISOString(),
        };

        if (existing) {
          await admin.from("seller_risk_scores").update(upsertData).eq("id", existing.id);
          if (existing.score !== finalScore) {
            await admin.from("risk_score_history").insert({
              target_type: "seller",
              target_id: store.id,
              previous_score: existing.score,
              new_score: finalScore,
              change_reason: "auto_calculation",
              factors,
            });
          }
        } else {
          await admin.from("seller_risk_scores").insert(upsertData);
          await admin.from("risk_score_history").insert({
            target_type: "seller",
            target_id: store.id,
            previous_score: null,
            new_score: finalScore,
            change_reason: "initial_calculation",
            factors,
          });
        }
        results.sellers++;

        // ── REPUTATION ──
        const { data: products } = await admin
          .from("products")
          .select("avg_rating, review_count")
          .eq("store_id", store.id);

        const totalReviews = (products || []).reduce((sum: number, p: any) => sum + (p.review_count || 0), 0);
        const avgRating = totalReviews > 0
          ? (products || []).reduce((sum: number, p: any) => sum + (p.avg_rating || 0) * (p.review_count || 0), 0) / totalReviews
          : 0;

        // Delivery speed: % delivered within 5 days
        const deliveredOrders = (orders || []).filter((o: any) => o.status === "delivered");
        let fastDeliveries = 0;
        for (const o of deliveredOrders) {
          const diff = (new Date(o.updated_at).getTime() - new Date(o.created_at).getTime()) / (1000 * 60 * 60 * 24);
          if (diff <= 5) fastDeliveries++;
        }
        const deliverySpeedScore = deliveredOrders.length > 0
          ? Math.round((fastDeliveries / deliveredOrders.length) * 100)
          : 50;

        // Product quality = avg rating normalized to 0-100
        const productQualityScore = Math.round((avgRating / 5) * 100);

        // Response time: placeholder (no ticket response tracking yet)
        const responseTimeHours = 0;

        // Reputation score
        const reputationScore = Math.round(
          (avgRating / 5) * 30 +
          (deliverySpeedScore / 100) * 25 +
          (productQualityScore / 100) * 20 +
          (slaCompliance / 100) * 25
        );

        // Verified badge: rating >= 4.5 && reviews >= 50
        const verifiedBadge = avgRating >= 4.5 && totalReviews >= 50;

        // Ranking score
        const totalSales = deliveredOrders.length;
        const riskPenalty = Math.max(0, 50 - score);
        const rankingScore = Math.round(
          (totalSales * 0.3) +
          (reputationScore * 0.4) +
          (slaCompliance * 0.2) -
          (riskPenalty * 0.1)
        );

        const repData = {
          store_id: store.id,
          avg_rating: Math.round(avgRating * 100) / 100,
          response_time_hours: responseTimeHours,
          delivery_speed_score: deliverySpeedScore,
          product_quality_score: productQualityScore,
          reputation_score: reputationScore,
          verified_badge: verifiedBadge,
          total_reviews: totalReviews,
          total_sales: totalSales,
          ranking_score: rankingScore,
        };

        const { data: existingRep } = await admin
          .from("seller_reputation")
          .select("id")
          .eq("store_id", store.id)
          .maybeSingle();

        if (existingRep) {
          await admin.from("seller_reputation").update(repData).eq("id", existingRep.id);
        } else {
          await admin.from("seller_reputation").insert(repData);
        }
        results.reputation++;
      }
    }

    // ── ADMIN OVERRIDE ──
    if (action === "override") {
      const { target_type: tt, target_id: tid, override_score, reason, admin_id } = body;
      if (!tt || !tid || override_score === undefined) {
        return new Response(JSON.stringify({ error: "Missing params" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const table = tt === "user" ? "user_risk_scores" : "seller_risk_scores";
      const idCol = tt === "user" ? "user_id" : "store_id";

      const { data: existing } = await admin
        .from(table)
        .select("id, score")
        .eq(idCol, tid)
        .maybeSingle();

      if (!existing) {
        return new Response(JSON.stringify({ error: "Score not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      await admin.from(table).update({
        score: override_score,
        admin_override_score: override_score,
        admin_override_reason: reason || "Admin override",
        admin_override_by: admin_id || null,
      }).eq("id", existing.id);

      await admin.from("risk_score_history").insert({
        target_type: tt,
        target_id: tid,
        previous_score: existing.score,
        new_score: override_score,
        change_reason: `admin_override: ${reason || ""}`,
        changed_by: admin_id || null,
        factors: { override: true },
      });

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, ...results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("calculate-risk-scores error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
