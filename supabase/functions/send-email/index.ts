import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function sendViaResend(config: Record<string, any>, from: string, to: string, subject: string, html: string) {
  const apiKey = config.api_key;
  if (!apiKey) throw new Error("Resend API key not configured");

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ from, to: [to], subject, html }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Resend error ${res.status}: ${err}`);
  }
  const data = await res.json();
  return data.id;
}

async function sendViaSendGrid(config: Record<string, any>, from: string, to: string, subject: string, html: string) {
  const apiKey = config.api_key;
  if (!apiKey) throw new Error("SendGrid API key not configured");

  const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: from },
      subject,
      content: [{ type: "text/html", value: html }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`SendGrid error ${res.status}: ${err}`);
  }
  return res.headers.get("X-Message-Id") || "sent";
}

async function sendViaMailgun(config: Record<string, any>, from: string, to: string, subject: string, html: string) {
  const apiKey = config.api_key;
  const domain = config.domain;
  const region = config.region || "us";
  if (!apiKey || !domain) throw new Error("Mailgun API key and domain required");

  const baseUrl = region === "eu" ? "https://api.eu.mailgun.net" : "https://api.mailgun.net";

  const form = new FormData();
  form.append("from", from);
  form.append("to", to);
  form.append("subject", subject);
  form.append("html", html);

  const res = await fetch(`${baseUrl}/v3/${domain}/messages`, {
    method: "POST",
    headers: { Authorization: `Basic ${btoa(`api:${apiKey}`)}` },
    body: form,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Mailgun error ${res.status}: ${err}`);
  }
  const data = await res.json();
  return data.id;
}

async function sendViaSmtp(_config: Record<string, any>, _from: string, _to: string, _subject: string, _html: string) {
  // SMTP sending requires a Deno SMTP client
  // For Deno edge runtime, direct SMTP is limited
  // Fall back to logging a warning
  throw new Error("SMTP direct sending is not supported in edge functions. Use Resend, SendGrid, or Mailgun instead.");
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

    const { to, subject, html, template_slug, variables, provider_id } = await req.json();

    if (!to || (!html && !template_slug)) {
      return new Response(JSON.stringify({ error: "to and (html or template_slug) required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Resolve template if needed
    let finalHtml = html || "";
    let finalSubject = subject || "";

    if (template_slug) {
      const { data: template } = await supabaseAdmin
        .from("email_templates")
        .select("*")
        .eq("slug", template_slug)
        .eq("is_active", true)
        .single();

      if (!template) {
        return new Response(JSON.stringify({ error: `Template '${template_slug}' not found` }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Load branding for variable replacement
      const { data: branding } = await supabaseAdmin
        .from("platform_branding")
        .select("*")
        .limit(1)
        .single();

      const brandVars: Record<string, string> = {
        platform_name: branding?.platform_name || "Feyxa",
        logo_url: branding?.logo_url || "",
        primary_color: branding?.primary_color || "#E5FB26",
        secondary_color: branding?.secondary_color || "#0E0E11",
        button_color: branding?.button_color || "#E5FB26",
        button_text_color: branding?.button_text_color || "#0E0E11",
        footer_text: branding?.footer_text || "© Feyxa",
        ...(variables || {}),
      };

      finalHtml = (template as any).html_body;
      finalSubject = (template as any).subject;

      // Replace all {{var}} placeholders
      Object.entries(brandVars).forEach(([key, val]) => {
        finalHtml = finalHtml.split(`{{${key}}}`).join(val);
        finalSubject = finalSubject.split(`{{${key}}}`).join(val);
      });
    }

    // Get provider
    let provider: any;
    if (provider_id) {
      const { data } = await supabaseAdmin.from("email_providers").select("*").eq("id", provider_id).single();
      provider = data;
    } else {
      // Get default active provider
      const { data } = await supabaseAdmin
        .from("email_providers")
        .select("*")
        .eq("is_active", true)
        .eq("is_default", true)
        .single();
      provider = data;

      if (!provider) {
        // Fallback to any active provider
        const { data: fallback } = await supabaseAdmin
          .from("email_providers")
          .select("*")
          .eq("is_active", true)
          .limit(1)
          .single();
        provider = fallback;
      }
    }

    if (!provider) {
      return new Response(JSON.stringify({ error: "No active email provider found" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const fromAddr = `${provider.from_name} <${provider.from_email}>`;
    const config = provider.config as Record<string, any>;

    // If config references a secret name, resolve it
    if (config.api_key_secret) {
      const secretVal = Deno.env.get(config.api_key_secret);
      if (secretVal) config.api_key = secretVal;
    }

    let messageId: string;
    try {
      switch (provider.provider_type) {
        case "resend":
          messageId = await sendViaResend(config, fromAddr, to, finalSubject, finalHtml);
          break;
        case "sendgrid":
          messageId = await sendViaSendGrid(config, provider.from_email, to, finalSubject, finalHtml);
          break;
        case "mailgun":
          messageId = await sendViaMailgun(config, fromAddr, to, finalSubject, finalHtml);
          break;
        case "smtp":
          messageId = await sendViaSmtp(config, fromAddr, to, finalSubject, finalHtml);
          break;
        default:
          throw new Error(`Unsupported provider type: ${provider.provider_type}`);
      }

      // Log success
      await supabaseAdmin.from("email_logs").insert({
        provider_id: provider.id,
        template_slug: template_slug || null,
        recipient: to,
        subject: finalSubject,
        status: "sent",
        provider_message_id: messageId,
      });

      return new Response(
        JSON.stringify({ success: true, message_id: messageId }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (sendError: any) {
      // Log failure
      await supabaseAdmin.from("email_logs").insert({
        provider_id: provider.id,
        template_slug: template_slug || null,
        recipient: to,
        subject: finalSubject,
        status: "failed",
        error_message: sendError.message,
      });

      return new Response(
        JSON.stringify({ error: sendError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
