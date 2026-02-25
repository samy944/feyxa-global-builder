import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { domain } = await req.json();
    if (!domain || typeof domain !== "string") {
      return new Response(JSON.stringify({ error: "Domain required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const cleanDomain = domain.replace(/^(https?:\/\/)?/i, "").replace(/\/.*$/, "").trim();

    // Check A records via DNS over HTTPS (Cloudflare)
    const aRes = await fetch(`https://cloudflare-dns.com/dns-query?name=${cleanDomain}&type=A`, {
      headers: { Accept: "application/dns-json" },
    });
    const aData = await aRes.json();

    // Check CNAME records
    const cnameRes = await fetch(`https://cloudflare-dns.com/dns-query?name=${cleanDomain}&type=CNAME`, {
      headers: { Accept: "application/dns-json" },
    });
    const cnameData = await cnameRes.json();

    // Check TXT record for verification
    const txtRes = await fetch(`https://cloudflare-dns.com/dns-query?name=_lovable.${cleanDomain}&type=TXT`, {
      headers: { Accept: "application/dns-json" },
    });
    const txtData = await txtRes.json();

    const aRecords = (aData.Answer || []).filter((r: any) => r.type === 1).map((r: any) => r.data);
    const cnameRecords = (cnameData.Answer || []).filter((r: any) => r.type === 5).map((r: any) => r.data);
    const txtRecords = (txtData.Answer || []).filter((r: any) => r.type === 16).map((r: any) => r.data?.replace(/"/g, ""));

    const pointsToLovable = aRecords.includes("185.158.133.1");
    const hasVerifyTxt = txtRecords.some((t: string) => t.startsWith("lovable_verify="));

    return new Response(
      JSON.stringify({
        domain: cleanDomain,
        a_records: aRecords,
        cname_records: cnameRecords,
        txt_records: txtRecords,
        points_to_lovable: pointsToLovable,
        has_verification: hasVerifyTxt,
        status: pointsToLovable && hasVerifyTxt ? "verified" : pointsToLovable ? "partial" : "not_configured",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
