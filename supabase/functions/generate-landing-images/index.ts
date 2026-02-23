import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { prompt, storeId, context } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    if (!prompt || typeof prompt !== "string" || prompt.trim().length < 3) {
      return new Response(JSON.stringify({ error: "Le prompt doit contenir au moins 3 caractères." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!storeId) {
      return new Response(JSON.stringify({ error: "storeId requis." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build an enhanced prompt for high-quality image generation
    const imagePrompt = `Create a professional, high-quality commercial photograph for an e-commerce landing page.

Style: Modern, clean, premium product photography with natural lighting.
Context: ${context || "E-commerce product/brand visual"}
User request: ${prompt}

Requirements:
- Ultra high resolution, sharp details
- Professional studio or lifestyle photography style
- Clean composition with good use of negative space
- Warm, inviting color palette that works well on web
- No text, watermarks, or logos in the image
- Photorealistic, NOT illustration or cartoon style`;

    // Call the image generation model
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [
          { role: "user", content: imagePrompt },
        ],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Trop de requêtes. Réessayez dans quelques instants." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Crédits IA insuffisants." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI image gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erreur du service de génération d'images" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResult = await response.json();
    const imageData = aiResult.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageData) {
      console.error("No image returned from AI:", JSON.stringify(aiResult).slice(0, 500));
      return new Response(JSON.stringify({ error: "L'IA n'a pas généré d'image. Essayez un autre prompt." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Extract base64 data
    const base64Match = imageData.match(/^data:image\/(png|jpeg|webp);base64,(.+)$/);
    if (!base64Match) {
      return new Response(JSON.stringify({ error: "Format d'image invalide retourné par l'IA." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const mimeType = `image/${base64Match[1]}`;
    const extension = base64Match[1] === "jpeg" ? "jpg" : base64Match[1];
    const rawBase64 = base64Match[2];

    // Decode base64 to Uint8Array
    const binaryStr = atob(rawBase64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    // Upload to Supabase Storage
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const fileName = `${storeId}/ai-generated/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from("store-assets")
      .upload(fileName, bytes, {
        contentType: mimeType,
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return new Response(JSON.stringify({ error: "Erreur lors de l'upload de l'image." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from("store-assets")
      .getPublicUrl(fileName);

    return new Response(JSON.stringify({
      url: urlData.publicUrl,
      alt: prompt.slice(0, 100),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-landing-images error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erreur inconnue" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
