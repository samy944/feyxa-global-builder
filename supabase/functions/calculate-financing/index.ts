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
    const body = await req.json().catch(() => ({}));
    const targetStoreId = body.store_id;

    // Get all active stores (or specific one)
    let query = admin.from("stores").select("id").eq("is_active", true).eq("is_banned", false);
    if (targetStoreId) query = query.eq("id", targetStoreId);
    const { data: stores } = await query;

    if (!stores?.length) {
      return new Response(JSON.stringify({ calculated: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let calculated = 0;
    let offersGenerated = 0;

    const now = new Date();
    const d90 = new Date(now.getTime() - 90 * 86400000).toISOString();
    const d30 = new Date(now.getTime() - 30 * 86400000).toISOString();

    for (const store of stores) {
      // 1. Calculate sales_90d
      const { data: orders90 } = await admin
        .from("orders")
        .select("total")
        .eq("store_id", store.id)
        .in("status", ["delivered", "completed"])
        .gte("created_at", d90);

      const sales90d = orders90?.reduce((s, o) => s + Number(o.total), 0) ?? 0;

      // 2. Get return rate
      const { count: totalOrders } = await admin
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("store_id", store.id)
        .gte("created_at", d90);

      const { count: returnCount } = await admin
        .from("return_requests")
        .select("id", { count: "exact", head: true })
        .eq("store_id", store.id)
        .gte("created_at", d90);

      const returnRate = totalOrders && totalOrders > 0
        ? Math.round(((returnCount ?? 0) / totalOrders) * 100)
        : 0;

      // 3. Get risk score from risk_scores table
      const { data: riskData } = await admin
        .from("risk_scores")
        .select("score")
        .eq("target_id", store.id)
        .eq("target_type", "seller")
        .maybeSingle();

      const riskScore = riskData?.score ?? 50;

      // 4. Get reputation (ranking_score avg or risk inverted)
      const reputationScore = Math.max(0, 100 - (riskScore ?? 50));

      // 5. Eligibility formula
      // Normalize sales_90d to 0-100 scale (cap at 5M XOF = 100)
      const salesNorm = Math.min((sales90d / 5000000) * 100, 100);
      const eligibilityScore = Math.round(
        (salesNorm * 0.4) +
        (reputationScore * 0.3) -
        (riskScore * 0.2) -
        (returnRate * 0.1)
      );

      // 6. Trust multiplier based on history
      const { count: completedOrders } = await admin
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("store_id", store.id)
        .in("status", ["delivered", "completed"]);

      let trustMultiplier = 0.8;
      if ((completedOrders ?? 0) > 100) trustMultiplier = 1.2;
      else if ((completedOrders ?? 0) > 50) trustMultiplier = 1.0;
      else if ((completedOrders ?? 0) > 20) trustMultiplier = 0.9;

      // 7. Max eligible amount
      const maxEligible = Math.round(sales90d * 0.3 * trustMultiplier);
      const isEligible = eligibilityScore >= 40 && sales90d >= 100000 && returnRate < 15;

      // 8. Check if frozen due to high risk
      const frozen = riskScore >= 70;
      const frozenReason = frozen ? "Score de risque élevé" : null;

      // 9. Upsert financing score
      await admin.from("seller_financing_scores").upsert({
        store_id: store.id,
        sales_90d: sales90d,
        return_rate: returnRate,
        risk_score: riskScore,
        reputation_score: reputationScore,
        eligibility_score: eligibilityScore,
        max_eligible_amount: maxEligible,
        is_eligible: isEligible && !frozen,
        frozen,
        frozen_reason: frozenReason,
        last_calculated_at: now.toISOString(),
      }, { onConflict: "store_id" });

      calculated++;

      // 10. Auto-generate offer if eligible and no active/offered financing
      if (isEligible && !frozen && maxEligible >= 50000) {
        const { data: existing } = await admin
          .from("financing_offers")
          .select("id")
          .eq("store_id", store.id)
          .in("status", ["offered", "active"])
          .limit(1);

        if (!existing?.length) {
          const repaymentPct = 15;
          const totalRepayable = Math.round(maxEligible * 1.08); // 8% fee
          await admin.from("financing_offers").insert({
            store_id: store.id,
            offered_amount: maxEligible,
            repayment_percentage: repaymentPct,
            total_repayable: totalRepayable,
            remaining_balance: totalRepayable,
          });
          offersGenerated++;

          // Notify seller
          await admin.from("notifications").insert({
            store_id: store.id,
            type: "financing",
            title: "💰 Feyxa Capital : Offre de financement disponible",
            body: `Vous êtes éligible à un financement de ${maxEligible.toLocaleString("fr-FR")} FCFA. Consultez votre espace Capital.`,
            metadata: { max_amount: maxEligible },
          });
        }
      }

      // 11. Check missed payout cycles for active financing
      const { data: activeOffer } = await admin
        .from("financing_offers")
        .select("id, missed_cycles, created_at")
        .eq("store_id", store.id)
        .eq("status", "active")
        .maybeSingle();

      if (activeOffer) {
        // Check if any repayment in last 30 days
        const { count: recentRepayments } = await admin
          .from("financing_repayments")
          .select("id", { count: "exact", head: true })
          .eq("offer_id", activeOffer.id)
          .gte("created_at", d30);

        if ((recentRepayments ?? 0) === 0) {
          const newMissed = activeOffer.missed_cycles + 1;
          await admin.from("financing_offers")
            .update({ missed_cycles: newMissed, updated_at: now.toISOString() })
            .eq("id", activeOffer.id);

          if (newMissed >= 3) {
            // Default the offer
            await admin.from("financing_offers")
              .update({ status: "defaulted", defaulted_at: now.toISOString() })
              .eq("id", activeOffer.id);

            // Escalate risk
            await admin.from("notifications").insert({
              store_id: store.id,
              type: "risk",
              title: "⚠️ Financement en défaut",
              body: "Votre financement a été marqué en défaut après 3 cycles sans remboursement.",
            });
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ calculated, offers_generated: offersGenerated }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("calculate-financing error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
