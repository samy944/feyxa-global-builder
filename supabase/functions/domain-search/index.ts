import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, domain, sld, tlds } = await req.json();

    const apiUser = Deno.env.get("NAMECHEAP_API_USER");
    const apiKey = Deno.env.get("NAMECHEAP_API_KEY");
    const clientIp = Deno.env.get("NAMECHEAP_CLIENT_IP") || "0.0.0.0";
    const useSandbox = Deno.env.get("NAMECHEAP_SANDBOX") === "true";

    if (!apiUser || !apiKey) {
      return new Response(
        JSON.stringify({ error: "Domain registration is not configured. Please add NAMECHEAP_API_USER and NAMECHEAP_API_KEY secrets." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 503 }
      );
    }

    const baseUrl = useSandbox
      ? "https://api.sandbox.namecheap.com/xml.response"
      : "https://api.namecheap.com/xml.response";

    const commonParams = `ApiUser=${apiUser}&ApiKey=${apiKey}&UserName=${apiUser}&ClientIp=${clientIp}`;

    // ─── CHECK AVAILABILITY ───
    if (action === "check") {
      const searchDomain = domain || `${sld}.com`;
      const domainList = tlds && sld
        ? tlds.map((tld: string) => `${sld}.${tld}`).join(",")
        : searchDomain;

      const url = `${baseUrl}?${commonParams}&Command=namecheap.domains.check&DomainList=${encodeURIComponent(domainList)}`;
      const res = await fetch(url);
      const xml = await res.text();

      // Parse XML results
      const results: Array<{ domain: string; available: boolean; premium: boolean; price?: number }> = [];
      const regex = /Domain="([^"]+)"[^>]*Available="([^"]+)"[^>]*?(?:IsPremiumName="([^"]*)")?[^>]*?(?:PremiumRegistrationPrice="([^"]*)")?/gi;
      let match;
      while ((match = regex.exec(xml)) !== null) {
        results.push({
          domain: match[1],
          available: match[2].toLowerCase() === "true",
          premium: match[3]?.toLowerCase() === "true" || false,
          price: match[4] ? parseFloat(match[4]) : undefined,
        });
      }

      // Get pricing for available non-premium domains
      if (results.some((r) => r.available && !r.premium)) {
        const pricingUrl = `${baseUrl}?${commonParams}&Command=namecheap.users.getPricing&ProductType=DOMAIN&ProductCategory=REGISTER&ActionName=REGISTER`;
        const pRes = await fetch(pricingUrl);
        const pXml = await pRes.text();

        // Extract prices by TLD
        const priceMap = new Map<string, number>();
        const priceRegex = /Name="([^"]+)"[^>]*>[\s\S]*?<Price Currency="USD"[^>]*>([\d.]+)<\/Price>/gi;
        let pm;
        while ((pm = priceRegex.exec(pXml)) !== null) {
          priceMap.set(pm[1].toLowerCase(), parseFloat(pm[2]));
        }

        for (const r of results) {
          if (r.available && !r.premium && !r.price) {
            const tld = r.domain.split(".").slice(1).join(".");
            r.price = priceMap.get(tld) || undefined;
          }
        }
      }

      return new Response(JSON.stringify({ results }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── REGISTER DOMAIN ───
    if (action === "register") {
      if (!domain) throw new Error("domain is required for registration");

      // Use default registrant info — in production this should come from user profile
      const regParams = [
        `DomainName=${encodeURIComponent(domain)}`,
        "Years=1",
        "RegistrantFirstName=Feyxa",
        "RegistrantLastName=Platform",
        "RegistrantAddress1=123 Commerce St",
        "RegistrantCity=Cotonou",
        "RegistrantStateProvince=Littoral",
        "RegistrantPostalCode=00000",
        "RegistrantCountry=BJ",
        "RegistrantPhone=+229.00000000",
        "RegistrantEmailAddress=domains@feyxa.app",
        "TechFirstName=Feyxa",
        "TechLastName=Platform",
        "TechAddress1=123 Commerce St",
        "TechCity=Cotonou",
        "TechStateProvince=Littoral",
        "TechPostalCode=00000",
        "TechCountry=BJ",
        "TechPhone=+229.00000000",
        "TechEmailAddress=domains@feyxa.app",
        "AdminFirstName=Feyxa",
        "AdminLastName=Platform",
        "AdminAddress1=123 Commerce St",
        "AdminCity=Cotonou",
        "AdminStateProvince=Littoral",
        "AdminPostalCode=00000",
        "AdminCountry=BJ",
        "AdminPhone=+229.00000000",
        "AdminEmailAddress=domains@feyxa.app",
        "AuxBillingFirstName=Feyxa",
        "AuxBillingLastName=Platform",
        "AuxBillingAddress1=123 Commerce St",
        "AuxBillingCity=Cotonou",
        "AuxBillingStateProvince=Littoral",
        "AuxBillingPostalCode=00000",
        "AuxBillingCountry=BJ",
        "AuxBillingPhone=+229.00000000",
        "AuxBillingEmailAddress=domains@feyxa.app",
        // Auto-set DNS to point to Feyxa
        "Nameservers=dns1.registrar-servers.com,dns2.registrar-servers.com",
      ].join("&");

      const url = `${baseUrl}?${commonParams}&Command=namecheap.domains.create&${regParams}`;
      const res = await fetch(url);
      const xml = await res.text();

      const success = xml.includes('Registered="true"') || xml.includes('Registered="True"');
      if (!success) {
        const errMatch = xml.match(/<Error[^>]*>([\s\S]*?)<\/Error>/i);
        throw new Error(errMatch ? errMatch[1] : "Domain registration failed");
      }

      // Auto-configure DNS to point to Feyxa
      const sldPart = domain.split(".")[0];
      const tldPart = domain.split(".").slice(1).join(".");
      const dnsParams = [
        `SLD=${sldPart}`,
        `TLD=${tldPart}`,
        "HostName1=@",
        "RecordType1=A",
        "Address1=185.158.133.1",
        "HostName2=www",
        "RecordType2=A",
        "Address2=185.158.133.1",
        "HostName3=_lovable",
        "RecordType3=TXT",
        "Address3=lovable_verify=feyxa",
      ].join("&");

      await fetch(`${baseUrl}?${commonParams}&Command=namecheap.domains.dns.setHosts&${dnsParams}`);

      return new Response(JSON.stringify({ success: true, domain }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error(`Unknown action: ${action}`);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[DOMAIN-SEARCH]", msg);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
