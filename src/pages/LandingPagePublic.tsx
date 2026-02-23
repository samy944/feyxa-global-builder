import { useParams } from "react-router-dom";
import { useEffect, useMemo, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LandingSectionRenderer } from "@/components/landing/LandingSectionRenderer";
import { LandingSection } from "@/lib/landing-templates";
import { useSeoHead } from "@/hooks/useSeoHead";
import { initStoreTracking, trackPageView, trackViewContent } from "@/lib/tracking";
import { CartProvider, useCart } from "@/hooks/useCart";
import { CartDrawer } from "@/components/market/CartDrawer";
import { ShoppingBag } from "lucide-react";

const DEFAULT_THEME = {
  primaryColor: "#3b82f6",
  bgColor: "#ffffff",
  textColor: "#0f172a",
  radius: "0.75rem",
  fontHeading: "Clash Display",
  fontBody: "Manrope",
};

export default function LandingPagePublic() {
  return (
    <CartProvider>
      <LandingPageContent />
    </CartProvider>
  );
}

function LandingPageContent() {
  const { slug, subpage } = useParams<{ slug: string; subpage?: string }>();
  const [landing, setLanding] = useState<any>(null);
  const [sections, setSections] = useState<LandingSection[]>([]);
  const [subpages, setSubpages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [variantId, setVariantId] = useState<string | null>(null);
  const [store, setStore] = useState<any>(null);
  const { addItem, totalItems, setIsOpen } = useCart();

  useEffect(() => {
    if (!slug) return;

    const fetchLanding = async () => {
      setLoading(true);
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
      setStore(data.stores);

      // Fetch subpages
      const { data: subpagesData } = await supabase
        .from("landing_subpages")
        .select("*")
        .eq("landing_page_id", data.id)
        .order("sort_order");

      const subs = subpagesData || [];
      setSubpages(subs);

      // Determine which sections to show
      let activeSections: LandingSection[] = [];

      if (subs.length > 0) {
        // Multi-page mode
        let activePage: any;
        if (subpage) {
          activePage = subs.find((s: any) => s.slug === subpage);
        }
        if (!activePage) {
          activePage = subs.find((s: any) => s.is_home) || subs[0];
        }
        activeSections = (activePage?.sections as unknown as LandingSection[]) || [];
      } else {
        // Legacy single-page mode with A/B testing
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
            activeSections = (chosen.sections as unknown as LandingSection[]) || [];
            setVariantId(chosen.id);

            await supabase
              .from("landing_ab_variants")
              .update({ views: (chosen.views || 0) + 1 })
              .eq("id", chosen.id);
          } else {
            activeSections = (data.sections as unknown as LandingSection[]) || [];
          }
        } else {
          activeSections = (data.sections as unknown as LandingSection[]) || [];
        }
      }

      setSections(activeSections);

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
  }, [slug, subpage]);

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

  const handleAddToCart = useCallback((product: any, variant?: any) => {
    if (!landing || !store) return;
    const imageUrl = Array.isArray(product.images) && product.images.length > 0
      ? (typeof product.images[0] === "string" ? product.images[0] : product.images[0]?.url || "")
      : null;

    addItem({
      productId: variant ? `${product.id}_${variant.id}` : product.id,
      name: variant ? `${product.name} — ${variant.name}` : product.name,
      price: variant?.price ?? product.price,
      currency: store.currency || "XOF",
      image: imageUrl,
      storeId: landing.store_id,
      storeName: store.name || "",
      storeSlug: store.slug || "",
      slug: product.slug,
      maxStock: variant?.stock_quantity ?? product.stock_quantity,
    });
  }, [landing, store, addItem]);

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
    if (landing.product_id && landing.stores?.slug) {
      window.location.href = `/store/${landing.stores.slug}`;
    }
    if (variantId) {
      supabase
        .from("landing_ab_variants")
        .update({ clicks: (sections as any).__clicks ? (sections as any).__clicks + 1 : 1 })
        .eq("id", variantId)
        .then(() => {});
    }
  };

  return (
    <div className="min-h-screen relative" style={{ backgroundColor: theme.bgColor, fontFamily: `"${theme.fontBody}", sans-serif` }}>
      {/* Floating cart button */}
      {totalItems > 0 && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-5 py-3 text-white font-semibold shadow-xl transition-all hover:scale-105 active:scale-95"
          style={{ backgroundColor: theme.primaryColor, borderRadius: theme.radius }}
        >
          <ShoppingBag size={20} />
          <span>{totalItems}</span>
        </button>
      )}

      <CartDrawer />

      {sections.filter(s => s.visible).map((section) => (
        <LandingSectionRenderer
          key={section.id}
          section={section}
          theme={theme}
          onCtaClick={handleCtaClick}
          storeId={landing.store_id}
          productId={landing.product_id}
          collectionId={landing.collection_id}
          onAddToCart={handleAddToCart}
          subpages={subpages}
          landingSlug={slug}
        />
      ))}
    </div>
  );
}
