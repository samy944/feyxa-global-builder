import { useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LandingSectionRenderer } from "@/components/landing/LandingSectionRenderer";
import { LandingSection } from "@/lib/landing-templates";
import { useSeoHead } from "@/hooks/useSeoHead";
import { initStoreTracking, trackPageView, trackViewContent } from "@/lib/tracking";

const DEFAULT_THEME = {
  primaryColor: "#3b82f6",
  bgColor: "#ffffff",
  textColor: "#0f172a",
  radius: "0.75rem",
  fontHeading: "Clash Display",
  fontBody: "Manrope",
};

export default function LandingPagePublic() {
  const { slug } = useParams<{ slug: string }>();
  const [landing, setLanding] = useState<any>(null);
  const [sections, setSections] = useState<LandingSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [variantId, setVariantId] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;

    const fetchLanding = async () => {
      const { data, error: err } = await supabase
        .from("landing_pages")
        .select("*, stores(slug, currency, name)")
        .eq("slug", slug)
        .eq("status", "published")
        .maybeSingle();

      if (err || !data) {
        setError(true);
        setLoading(false);
        return;
      }

      setLanding(data);

      // A/B test logic
      if (data.ab_enabled) {
        const { data: variants } = await supabase
          .from("landing_ab_variants")
          .select("*")
          .eq("landing_page_id", data.id)
          .order("variant_name");

        if (variants && variants.length >= 2) {
          const split = data.ab_split || 50;
          const rand = Math.random() * 100;
          const chosen = rand < split ? variants[0] : variants[1];
          setSections((chosen.sections as unknown as LandingSection[]) || []);
          setVariantId(chosen.id);

          // Increment view
          await supabase
            .from("landing_ab_variants")
            .update({ views: (chosen.views || 0) + 1 })
            .eq("id", chosen.id);
        } else {
          setSections((data.sections as unknown as LandingSection[]) || []);
        }
      } else {
        setSections((data.sections as unknown as LandingSection[]) || []);
      }

      // Init tracking
      if (data.store_id) {
        initStoreTracking(data.store_id, data.stores?.currency);
        trackPageView();
        if (data.product_id) {
          trackViewContent({ id: data.product_id, name: data.title, price: 0, currency: data.stores?.currency || "XOF" });
        }
      }

      setLoading(false);
    };

    fetchLanding();
  }, [slug]);

  const theme = useMemo(() => {
    if (!landing?.theme) return DEFAULT_THEME;
    return { ...DEFAULT_THEME, ...(landing.theme as any) };
  }, [landing]);

  // Load Google Fonts
  useEffect(() => {
    if (!theme.fontHeading && !theme.fontBody) return;
    const families = [theme.fontHeading, theme.fontBody].filter(Boolean).map(f => f.replace(/ /g, "+")).join("&family=");
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?family=${families}:wght@400;500;600;700&display=swap`;
    document.head.appendChild(link);
    return () => { link.remove(); };
  }, [theme.fontHeading, theme.fontBody]);

  useSeoHead({
    title: landing?.seo_title || landing?.title || "Landing Page",
    description: landing?.seo_description || "",
    image: landing?.og_image_url,
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: theme.bgColor }}>
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: theme.primaryColor }} />
      </div>
    );
  }

  if (error || !landing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Page introuvable</h1>
          <p className="text-muted-foreground">Cette landing page n'existe pas ou n'est plus disponible.</p>
        </div>
      </div>
    );
  }

  const handleCtaClick = () => {
    // If linked to a product, redirect to checkout or store
    if (landing.product_id && landing.stores?.slug) {
      window.location.href = `/store/${landing.stores.slug}`;
    }

    // Track CTA click for A/B
    if (variantId) {
      supabase
        .from("landing_ab_variants")
        .update({ clicks: (sections as any).__clicks ? (sections as any).__clicks + 1 : 1 })
        .eq("id", variantId)
        .then(() => {});
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.bgColor, fontFamily: `"${theme.fontBody}", sans-serif` }}>
      {sections.filter(s => s.visible).map((section) => (
        <LandingSectionRenderer
          key={section.id}
          section={section}
          theme={theme}
          onCtaClick={handleCtaClick}
        />
      ))}
    </div>
  );
}
