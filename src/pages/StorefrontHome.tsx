import { useState, useEffect, useMemo } from "react";
import { useSeoHead } from "@/hooks/useSeoHead";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { initStoreTracking, trackPageView } from "@/lib/tracking";
import { getThemeById, getThemeCSSVars, type StorefrontTheme } from "@/lib/storefront-themes";
import { getTemplateById, mergeSectionsConfig, type SFSectionConfig } from "@/lib/storefront-templates";
import { StorefrontRenderer } from "@/components/storefront/StorefrontRenderer";
import type { StoreData, ProductData } from "@/components/storefront/types";

export default function StorefrontHome() {
  const { slug } = useParams<{ slug: string }>();
  const [store, setStore] = useState<StoreData | null>(null);
  const [products, setProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);

  useSeoHead({
    title: store ? `${store.name} — Boutique` : "Boutique",
    description: store?.description?.slice(0, 155) || `Visitez la boutique ${store?.name || ""}.`,
    image: store?.logo_url || undefined,
    url: typeof window !== "undefined" ? window.location.href : "",
  });

  useEffect(() => {
    if (!slug) return;
    loadStore();
  }, [slug]);

  const loadStore = async () => {
    const { data: storeData } = await supabase
      .from("stores")
      .select("*")
      .eq("slug", slug!)
      .eq("is_active", true)
      .single();

    if (storeData) {
      setStore(storeData as StoreData);
      initStoreTracking(storeData.id, storeData.currency).then(() => trackPageView());
      const { data: prods } = await supabase
        .from("products")
        .select("*")
        .eq("store_id", storeData.id)
        .eq("is_published", true)
        .order("created_at", { ascending: false });
      setProducts((prods as ProductData[]) || []);
    }
    setLoading(false);
  };

  // Resolve template & theme
  const themeObj = store?.theme as Record<string, any> | null;
  const templateId = themeObj?.storefront_template_id || themeObj?.storefront_theme_id || "minimal";
  const themeId = themeObj?.storefront_theme_id || templateId;
  const colorOverrides = themeObj?.color_overrides as Partial<StorefrontTheme["colors"]> | null;

  const sfTheme: StorefrontTheme = useMemo(() => {
    const base = getThemeById(themeId);
    if (!colorOverrides || Object.keys(colorOverrides).length === 0) return base;
    return { ...base, colors: { ...base.colors, ...colorOverrides } };
  }, [themeId, colorOverrides]);
  const template = useMemo(() => getTemplateById(templateId), [templateId]);
  const sectionsConfig: SFSectionConfig[] = useMemo(
    () => mergeSectionsConfig(themeObj?.sections_config as SFSectionConfig[] | null, template),
    [themeObj, template]
  );

  const cssVars = useMemo(() => getThemeCSSVars(sfTheme), [sfTheme]);

  // Load Google Fonts
  useEffect(() => {
    const fonts = [sfTheme.fonts.heading, sfTheme.fonts.body].filter((f, i, arr) => arr.indexOf(f) === i);
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?${fonts.map((f) => `family=${f.replace(/ /g, "+")}:wght@400;500;600;700`).join("&")}&display=swap`;
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, [sfTheme]);

  const formatPrice = (price: number) => {
    if (!store) return price.toString();
    return new Intl.NumberFormat("fr-FR", {
      style: "currency", currency: store.currency, maximumFractionDigits: 0,
    }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: `hsl(${sfTheme.colors.background})` }}>
        <div className="animate-pulse" style={{ color: `hsl(${sfTheme.colors.mutedForeground})` }}>Chargement...</div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-center">
        <div>
          <ShoppingBag size={48} className="mx-auto text-muted-foreground mb-4" />
          <h1 className="text-xl font-bold text-foreground">Boutique introuvable</h1>
          <p className="text-muted-foreground mt-2">Cette boutique n'existe pas ou n'est plus active.</p>
          <Button className="mt-6" asChild><Link to="/">Retour</Link></Button>
        </div>
      </div>
    );
  }

  const themeStyle: React.CSSProperties = {
    ...cssVars as React.CSSProperties,
    backgroundColor: `hsl(${sfTheme.colors.background})`,
    color: `hsl(${sfTheme.colors.foreground})`,
    fontFamily: `"${sfTheme.fonts.body}", system-ui, sans-serif`,
  };

  return (
    <div className="min-h-screen" style={themeStyle}>
      <StorefrontRenderer
        templateId={templateId}
        store={store}
        products={products}
        theme={sfTheme}
        formatPrice={formatPrice}
        sectionsConfig={sectionsConfig}
      />
    </div>
  );
}
