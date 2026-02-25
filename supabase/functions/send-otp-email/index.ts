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
    // Verify service role authorization
    const authHeader = req.headers.get("Authorization");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!authHeader || !authHeader.includes(serviceRoleKey!)) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { email, otp, label } = await req.json();

    if (!email || !otp) {
      return new Response(JSON.stringify({ error: "email and otp required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate HTML email content
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .container { max-width: 480px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 32px 24px; text-align: center; }
    .header h1 { color: #ffffff; font-size: 22px; margin: 0; font-weight: 600; }
    .body { padding: 32px 24px; }
    .body p { color: #3f3f46; font-size: 15px; line-height: 1.6; margin: 0 0 16px; }
    .otp-box { background: #f4f4f5; border: 2px dashed #d4d4d8; border-radius: 10px; padding: 24px; text-align: center; margin: 24px 0; }
    .otp-code { font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #1a1a2e; font-family: 'SF Mono', 'Fira Code', monospace, sans-serif; }
    .label { display: inline-block; background: #e0f2fe; color: #0369a1; padding: 4px 12px; border-radius: 6px; font-size: 13px; font-weight: 500; margin-bottom: 16px; }
    .footer { padding: 20px 24px; background: #fafafa; border-top: 1px solid #f0f0f0; }
    .footer p { color: #a1a1aa; font-size: 12px; line-height: 1.5; margin: 0; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔐 Feyxa — Code de vérification</h1>
    </div>
    <div class="body">
      <span class="label">${label || "Vérification"}</span>
      <p>Bonjour,</p>
      <p>Voici votre code de vérification à usage unique :</p>
      <div class="otp-box">
        <div class="otp-code">${otp}</div>
      </div>
      <p>Ce code expire dans <strong>10 minutes</strong>. Ne le partagez avec personne.</p>
      <p>Si vous n'avez pas demandé ce code, ignorez simplement cet email.</p>
    </div>
    <div class="footer">
      <p>Cet email a été envoyé automatiquement par Feyxa.<br>© ${new Date().getFullYear()} Feyxa. Tous droits réservés.</p>
    </div>
  </div>
</body>
</html>`;

    // Send email using Lovable's email API
    const response = await fetch("https://api.lovable.dev/api/v1/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        to: email,
        subject: `${otp} — Votre code Feyxa (${label || "Vérification"})`,
        html: htmlContent,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Lovable email API error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Failed to send email", details: errorText }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`OTP email sent successfully to ${email}`);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("send-otp-email error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
