import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SITE_URL = "https://feyxa.com";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const now = new Date().toISOString().split("T")[0];

  // Static pages
  const staticPages = [
    { loc: "/", priority: "1.0", changefreq: "weekly" },
    { loc: "/market", priority: "0.9", changefreq: "daily" },
    { loc: "/login", priority: "0.3", changefreq: "monthly" },
    { loc: "/signup", priority: "0.5", changefreq: "monthly" },
  ];

  // Fetch published marketplace products
  const { data: products } = await supabase
    .from("products")
    .select("slug, updated_at")
    .eq("is_published", true)
    .eq("is_marketplace_published", true)
    .order("updated_at", { ascending: false })
    .limit(1000);

  // Fetch active stores
  const { data: stores } = await supabase
    .from("stores")
    .select("slug, updated_at")
    .eq("is_active", true)
    .eq("is_banned", false)
    .order("updated_at", { ascending: false })
    .limit(500);

  // Fetch marketplace categories
  const { data: categories } = await supabase
    .from("marketplace_categories")
    .select("slug")
    .order("sort_order", { ascending: true });

  // Build XML
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

  for (const p of staticPages) {
    xml += `  <url>
    <loc>${SITE_URL}${p.loc}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>
`;
  }

  if (categories) {
    for (const cat of categories) {
      xml += `  <url>
    <loc>${SITE_URL}/market/category/${cat.slug}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>
`;
    }
  }

  if (stores) {
    for (const s of stores) {
      const lastmod = s.updated_at?.split("T")[0] || now;
      xml += `  <url>
    <loc>${SITE_URL}/market/vendor/${s.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>
`;
    }
  }

  if (products) {
    for (const p of products) {
      const lastmod = p.updated_at?.split("T")[0] || now;
      xml += `  <url>
    <loc>${SITE_URL}/market/product/${p.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
    }
  }

  xml += `</urlset>`;

  return new Response(xml, {
    headers: {
      ...corsHeaders,
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
});
