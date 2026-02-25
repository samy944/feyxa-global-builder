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

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY not configured");
      return new Response(JSON.stringify({ error: "Email service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:480px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#0E0E11 0%,#1a1a2e 100%);padding:32px 24px;text-align:center;">
      <span style="display:inline-block;background:#E5FB26;border-radius:8px;width:36px;height:36px;line-height:36px;font-weight:bold;font-size:16px;color:#0E0E11;">F</span>
      <span style="color:#ffffff;font-size:18px;font-weight:700;letter-spacing:0.04em;margin-left:10px;vertical-align:middle;">FEYXA</span>
    </div>
    <div style="padding:32px 24px;">
      <span style="display:inline-block;background:#e0f2fe;color:#0369a1;padding:4px 12px;border-radius:6px;font-size:13px;font-weight:500;margin-bottom:16px;">${label || "Vérification"}</span>
      <p style="color:#3f3f46;font-size:15px;line-height:1.6;margin:0 0 16px;">Bonjour,</p>
      <p style="color:#3f3f46;font-size:15px;line-height:1.6;margin:0 0 16px;">Voici votre code de vérification à usage unique :</p>
      <div style="background:#f4f4f5;border:2px dashed #d4d4d8;border-radius:10px;padding:24px;text-align:center;margin:24px 0;">
        <div style="font-size:36px;font-weight:700;letter-spacing:8px;color:#0E0E11;font-family:'SF Mono','Fira Code',monospace,sans-serif;">${otp}</div>
      </div>
      <p style="color:#3f3f46;font-size:15px;line-height:1.6;margin:0 0 16px;">Ce code expire dans <strong>10 minutes</strong>. Ne le partagez avec personne.</p>
      <p style="color:#3f3f46;font-size:15px;line-height:1.6;margin:0 0 16px;">Si vous n'avez pas demandé ce code, ignorez simplement cet email.</p>
    </div>
    <div style="padding:20px 24px;background:#fafafa;border-top:1px solid #f0f0f0;">
      <p style="color:#a1a1aa;font-size:12px;line-height:1.5;margin:0;text-align:center;">Cet email a été envoyé automatiquement par Feyxa.<br>© ${new Date().getFullYear()} Feyxa. Tous droits réservés.</p>
    </div>
  </div>
</body>
</html>`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Feyxa <onboarding@resend.dev>",
        to: [email],
        subject: `${otp} — Votre code Feyxa (${label || "Vérification"})`,
        html: htmlContent,
      }),
    });

    if (!res.ok) {
      const errorBody = await res.text();
      console.error("Resend API error:", res.status, errorBody);
      return new Response(JSON.stringify({ error: "Failed to send email", details: errorBody }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await res.json();
    console.log(`OTP email sent to ${email} via Resend:`, result.id);

    return new Response(
      JSON.stringify({ success: true, id: result.id }),
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
