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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Non autorisé" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Auth client to get current user
    const supabaseAuth = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await supabaseAuth.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Non autorisé" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub;

    const { action, store_id, email, role, invitation_id, token_hash } = await req.json();

    // Service client for admin operations
    const supabaseAdmin = createClient(supabaseUrl, serviceKey);

    // ===== SEND INVITATION =====
    if (action === "send") {
      if (!store_id || !email || !role) {
        return new Response(JSON.stringify({ error: "store_id, email et role requis" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check caller is admin/owner
      const { data: roleCheck } = await supabaseAdmin.rpc("get_store_role", {
        _store_id: store_id,
        _user_id: userId,
      });
      if (!roleCheck || !["owner", "admin"].includes(roleCheck)) {
        return new Response(JSON.stringify({ error: "Permissions insuffisantes" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check no pending invitation for same email+store
      const { data: existing } = await supabaseAdmin
        .from("store_invitations")
        .select("id")
        .eq("store_id", store_id)
        .eq("email", email.toLowerCase().trim())
        .eq("status", "pending")
        .maybeSingle();

      if (existing) {
        return new Response(JSON.stringify({ error: "Invitation déjà en attente pour cet email" }), {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Generate secure token
      const rawToken = crypto.randomUUID() + "-" + crypto.randomUUID();
      const encoder = new TextEncoder();
      const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(rawToken));
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const tokenHash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

      // Get store name for email
      const { data: storeData } = await supabaseAdmin
        .from("stores")
        .select("name")
        .eq("id", store_id)
        .single();

      // Get inviter name
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("full_name")
        .eq("id", userId)
        .single();

      // Save invitation
      const { data: invitation, error: insertErr } = await supabaseAdmin
        .from("store_invitations")
        .insert({
          store_id,
          email: email.toLowerCase().trim(),
          role,
          token_hash: tokenHash,
          invited_by: userId,
        })
        .select()
        .single();

      if (insertErr) {
        console.error("Insert error:", insertErr);
        return new Response(JSON.stringify({ error: "Erreur lors de la création de l'invitation" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Audit log
      await supabaseAdmin.from("audit_logs").insert({
        store_id,
        user_id: userId,
        action: "invite_sent",
        target_type: "store_invitation",
        target_id: invitation.id,
        metadata: { email: email.toLowerCase().trim(), role },
      });

      // Build accept URL
      const origin = req.headers.get("origin") || "https://feyxa-global-builder.lovable.app";
      const acceptUrl = `${origin}/invite/accept?token=${rawToken}`;

      // Note: In production, send actual email via SMTP/service.
      // For now, return the link so it can be shared manually.
      console.log(`Invitation link for ${email}: ${acceptUrl}`);

      return new Response(
        JSON.stringify({
          success: true,
          invitation_id: invitation.id,
          accept_url: acceptUrl,
          store_name: storeData?.name,
          inviter_name: profile?.full_name,
          message: `Invitation envoyée à ${email}`,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // ===== ACCEPT INVITATION =====
    if (action === "accept") {
      if (!token_hash) {
        return new Response(JSON.stringify({ error: "Token requis" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Hash the provided token
      const encoder = new TextEncoder();
      const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(token_hash));
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashedToken = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

      const { data: result } = await supabaseAdmin.rpc("accept_invitation", {
        _token_hash: hashedToken,
        _user_id: userId,
      });

      return new Response(JSON.stringify(result || { success: false, error: "Erreur inconnue" }), {
        status: result?.success ? 200 : 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ===== REVOKE INVITATION =====
    if (action === "revoke") {
      if (!invitation_id) {
        return new Response(JSON.stringify({ error: "invitation_id requis" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: inv } = await supabaseAdmin
        .from("store_invitations")
        .select("store_id, email")
        .eq("id", invitation_id)
        .eq("status", "pending")
        .single();

      if (!inv) {
        return new Response(JSON.stringify({ error: "Invitation introuvable" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check permissions
      const { data: rCheck } = await supabaseAdmin.rpc("get_store_role", {
        _store_id: inv.store_id,
        _user_id: userId,
      });
      if (!rCheck || !["owner", "admin"].includes(rCheck)) {
        return new Response(JSON.stringify({ error: "Permissions insuffisantes" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      await supabaseAdmin
        .from("store_invitations")
        .update({ status: "revoked" })
        .eq("id", invitation_id);

      await supabaseAdmin.from("audit_logs").insert({
        store_id: inv.store_id,
        user_id: userId,
        action: "invite_revoked",
        target_type: "store_invitation",
        target_id: invitation_id,
        metadata: { email: inv.email },
      });

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Action inconnue" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Team invite error:", err);
    return new Response(JSON.stringify({ error: "Erreur serveur" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
