import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are a brand identity extraction expert. Analyze the provided content (HTML or screenshot) and extract the visual identity.

Return a JSON object with this exact structure:
{
  "colors": {
    "primary": "<HSL string like '217 91% 60%'>",
    "secondary": "<HSL string>",
    "accent": "<HSL string>",
    "background": "<HSL string>",
    "foreground": "<HSL string>"
  },
  "fonts": {
    "heading": "<Google Font name>",
    "body": "<Google Font name>"
  },
  "style": {
    "borderRadius": "<rounded-sm|rounded-md|rounded-lg|rounded-xl|rounded-2xl|rounded-none>",
    "vibe": "<one of: minimal, bold, elegant, playful, corporate, luxury>"
  },
  "logoUrl": "<extracted logo URL or null>"
}

Rules:
- Colors MUST be valid HSL values without "hsl()" wrapper, just "H S% L%" format
- Font names must be valid Google Fonts
- If you can't determine a value, use sensible defaults
- Extract the dominant visual mood
- Return ONLY the JSON, no markdown fences`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, screenshot_base64 } = await req.json();

    if (!url && !screenshot_base64) {
      return new Response(
        JSON.stringify({ error: "Provide either 'url' or 'screenshot_base64'" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let userContent: any[];

    if (screenshot_base64) {
      // Vision mode: analyze screenshot
      userContent = [
        {
          type: "text",
          text: "Analyze this website screenshot and extract the brand identity (colors, fonts, style).",
        },
        {
          type: "image_url",
          image_url: { url: `data:image/png;base64,${screenshot_base64}` },
        },
      ];
    } else {
      // URL mode: fetch HTML then analyze
      let html = "";
      try {
        const resp = await fetch(url, {
          headers: { "User-Agent": "Mozilla/5.0 (compatible; Feyxa/1.0)" },
          redirect: "follow",
        });
        html = await resp.text();
        // Trim to first 15k chars to stay within context limits
        html = html.substring(0, 15000);
      } catch (e) {
        return new Response(
          JSON.stringify({ error: `Failed to fetch URL: ${e.message}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      userContent = [
        {
          type: "text",
          text: `Analyze this website HTML and extract the brand identity (colors, fonts, style, logo URL).\n\nURL: ${url}\n\nHTML:\n${html}`,
        },
      ];
    }

    const aiResponse = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userContent },
          ],
        }),
      }
    );

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ error: "AI analysis failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    const raw = aiData.choices?.[0]?.message?.content || "";

    // Parse JSON from response (strip markdown fences if present)
    let brandData;
    try {
      const jsonStr = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      brandData = JSON.parse(jsonStr);
    } catch {
      console.error("Failed to parse AI response:", raw);
      return new Response(
        JSON.stringify({ error: "Failed to parse brand data", raw }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ success: true, brand: brandData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("clone-brand error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
