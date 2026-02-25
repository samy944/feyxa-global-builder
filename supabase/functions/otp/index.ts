import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function generateOtp(): string {
  const chars = "0123456789";
  let otp = "";
  for (let i = 0; i < 6; i++) {
    otp += chars[Math.floor(Math.random() * chars.length)];
  }
  return otp;
}

async function hashCode(code: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(code);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function sendOtpEmail(email: string, otp: string, purpose: string): Promise<boolean> {
  const purposeLabels: Record<string, string> = {
    login_2fa: "Connexion",
    withdrawal: "Retrait de fonds",
    email_verify: "Vérification email",
  };
  const label = purposeLabels[purpose] || "Vérification";

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    console.error("LOVABLE_API_KEY not configured");
    return false;
  }

  // Use Lovable AI to generate and send the email via the completions endpoint
  // We'll use Supabase Auth admin email instead
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  // Send email using Supabase Auth admin API (magic link workaround won't work)
  // Instead, use the Supabase built-in email sending via the auth.admin API
  // The best approach: use Resend or similar, but since we have LOVABLE_API_KEY,
  // we can use the Lovable email API

  try {
    // Use fetch to call Lovable's email sending capability
    const response = await fetch(`${SUPABASE_URL}/functions/v1/send-otp-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ email, otp, label }),
    });

    if (!response.ok) {
      // Fallback: log the OTP for debugging (remove in production)
      console.error("Failed to send email via send-otp-email function", await response.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error("Email sending error:", err);
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    const { action, user_id, email, code, purpose = "login_2fa" } = body;

    if (action === "generate") {
      if (!user_id || !email) {
        return new Response(JSON.stringify({ error: "user_id and email required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Rate limit: max 5 OTPs per user per 15 minutes
      const { count } = await supabaseAdmin
        .from("otp_codes")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user_id)
        .eq("purpose", purpose)
        .gte("created_at", new Date(Date.now() - 15 * 60 * 1000).toISOString());

      if ((count || 0) >= 5) {
        return new Response(
          JSON.stringify({ error: "Trop de tentatives. Réessayez dans 15 minutes." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Invalidate previous unused OTPs
      await supabaseAdmin
        .from("otp_codes")
        .delete()
        .eq("user_id", user_id)
        .eq("purpose", purpose)
        .is("used_at", null);

      const otp = generateOtp();
      const codeHash = await hashCode(otp);

      // Store OTP
      await supabaseAdmin.from("otp_codes").insert({
        user_id,
        code_hash: codeHash,
        purpose,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      });

      // Send OTP via email
      const emailSent = await sendOtpEmail(email, otp, purpose);

      console.log(`OTP generated for ${email} (${purpose}) - email sent: ${emailSent}`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: emailSent 
            ? "Code de vérification envoyé par email" 
            : "Code généré mais l'envoi par email a échoué",
          email_sent: emailSent,
        }),
        { 
          headers: { 
            ...corsHeaders, 
            "Content-Type": "application/json",
            "Cache-Control": "no-store, no-cache, must-revalidate",
          } 
        }
      );
    }

    if (action === "verify") {
      if (!user_id || !code) {
        return new Response(JSON.stringify({ error: "user_id and code required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const codeHash = await hashCode(code);

      // Find valid OTP
      const { data: otpRecord } = await supabaseAdmin
        .from("otp_codes")
        .select("*")
        .eq("user_id", user_id)
        .eq("purpose", purpose)
        .eq("code_hash", codeHash)
        .is("used_at", null)
        .gte("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!otpRecord) {
        const { data: latestOtp } = await supabaseAdmin
          .from("otp_codes")
          .select("id, attempts, max_attempts")
          .eq("user_id", user_id)
          .eq("purpose", purpose)
          .is("used_at", null)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (latestOtp) {
          await supabaseAdmin
            .from("otp_codes")
            .update({ attempts: latestOtp.attempts + 1 })
            .eq("id", latestOtp.id);

          if (latestOtp.attempts + 1 >= latestOtp.max_attempts) {
            await supabaseAdmin
              .from("otp_codes")
              .update({ used_at: new Date().toISOString() })
              .eq("id", latestOtp.id);

            return new Response(
              JSON.stringify({ error: "Trop de tentatives. Demandez un nouveau code." }),
              { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        }

        return new Response(
          JSON.stringify({ error: "Code invalide ou expiré." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Mark as used
      await supabaseAdmin
        .from("otp_codes")
        .update({ used_at: new Date().toISOString() })
        .eq("id", otpRecord.id);

      return new Response(
        JSON.stringify({ success: true, verified: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "log_login") {
      const { ip_address, user_agent, success: loginSuccess, failure_reason } = body;
      
      await supabaseAdmin.from("login_activity").insert({
        user_id,
        ip_address: ip_address || null,
        user_agent: user_agent || null,
        success: loginSuccess ?? true,
        failure_reason: failure_reason || null,
      });

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
