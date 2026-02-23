import { useState, useEffect, useMemo } from "react";
import { useSeoHead } from "@/hooks/useSeoHead";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { ShoppingBag, Search, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { initStoreTracking, trackPageView } from "@/lib/tracking";
import { getThemeById, getThemeCSSVars, type StorefrontTheme } from "@/lib/storefront-themes";

interface StoreData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  currency: string;
  theme: any;
}

interface ProductData {
  id: string;
  name: string;
  slug: string;
  price: number;
  compare_at_price: number | null;
  images: any;
  stock_quantity: number;
}

export default function StorefrontHome() {
  const { slug } = useParams<{ slug: string }>();
  const [store, setStore] = useState<StoreData | null>(null);
  const [products, setProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useSeoHead({
    title: store ? `${store.name} — Boutique Feyxa` : "Boutique Feyxa",
    description: store?.description?.slice(0, 155) || `Visitez la boutique ${store?.name || ""} sur Feyxa.`,
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

  // Resolve theme
  const sfTheme: StorefrontTheme = useMemo(() => {
    const themeObj = store?.theme as Record<string, any> | null;
    const themeId = themeObj?.storefront_theme_id || "classic";
    return getThemeById(themeId);
  }, [store?.theme]);

  const cssVars = useMemo(() => getThemeCSSVars(sfTheme), [sfTheme]);

  // Load Google Fonts for the theme
  useEffect(() => {
    const fonts = [sfTheme.fonts.heading, sfTheme.fonts.body].filter(
      (f, i, arr) => arr.indexOf(f) === i
    );
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?${fonts.map((f) => `family=${f.replace(/ /g, "+")}:wght@400;500;600;700`).join("&")}&display=swap`;
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, [sfTheme]);

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const formatPrice = (price: number) => {
    if (!store) return price.toString();
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: store.currency,
      maximumFractionDigits: 0,
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
          <Button variant="hero" className="mt-6" asChild>
            <Link to="/">Retour à Feyxa</Link>
          </Button>
        </div>
      </div>
    );
  }

  const imgRatioClass = sfTheme.style.productImageRatio === "portrait"
    ? "aspect-[3/4]"
    : sfTheme.style.productImageRatio === "landscape"
      ? "aspect-[4/3]"
      : "aspect-square";

  return (
    <div
      className="min-h-screen"
      style={{
        ...cssVars as React.CSSProperties,
        backgroundColor: `hsl(${sfTheme.colors.background})`,
        color: `hsl(${sfTheme.colors.foreground})`,
        fontFamily: `"${sfTheme.fonts.body}", system-ui, sans-serif`,
      }}
    >
      {/* Store header */}
      <header
        className={`border-b`}
        style={{
          backgroundColor: sfTheme.style.headerStyle === "transparent"
            ? "transparent"
            : sfTheme.style.headerStyle === "gradient"
              ? `hsl(${sfTheme.colors.accent})`
              : `hsl(${sfTheme.colors.card})`,
          borderColor: `hsl(${sfTheme.colors.border})`,
          color: sfTheme.style.headerStyle === "gradient" || sfTheme.style.headerStyle === "transparent"
            ? `hsl(${sfTheme.colors.foreground})`
            : `hsl(${sfTheme.colors.cardForeground})`,
        }}
      >
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {store.logo_url ? (
              <img
                src={store.logo_url}
                alt={store.name}
                className={`h-10 w-10 ${sfTheme.style.borderRadius} object-cover`}
              />
            ) : (
              <div
                className={`h-10 w-10 ${sfTheme.style.borderRadius} flex items-center justify-center font-bold text-sm`}
                style={{
                  backgroundColor: `hsl(${sfTheme.colors.primary})`,
                  color: `hsl(${sfTheme.colors.primaryForeground})`,
                }}
              >
                {store.name[0]}
              </div>
            )}
            <div>
              <h1 className="font-bold" style={{ fontFamily: `"${sfTheme.fonts.heading}", sans-serif` }}>
                {store.name}
              </h1>
              {store.description && (
                <p className="text-xs" style={{ color: `hsl(${sfTheme.colors.mutedForeground})` }}>
                  {store.description}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              className={`h-9 w-9 ${sfTheme.style.borderRadius} flex items-center justify-center transition-colors`}
              style={{ color: `hsl(${sfTheme.colors.foreground})` }}
            >
              <ShoppingCart size={18} />
            </button>
          </div>
        </div>
      </header>

      <div className="container py-8">
        {/* Search */}
        <div className="relative max-w-md mx-auto mb-8">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: `hsl(${sfTheme.colors.mutedForeground})` }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un produit..."
            className={`w-full h-10 ${sfTheme.style.borderRadius} border pl-9 pr-4 text-sm focus:outline-none focus:ring-2`}
            style={{
              backgroundColor: `hsl(${sfTheme.colors.card})`,
              borderColor: `hsl(${sfTheme.colors.border})`,
              color: `hsl(${sfTheme.colors.foreground})`,
              boxShadow: `0 0 0 0 hsl(${sfTheme.colors.primary})`,
            }}
          />
        </div>

        {/* Products grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <PackageIcon size={40} style={{ color: `hsl(${sfTheme.colors.mutedForeground})` }} className="mx-auto mb-3" />
            <p style={{ color: `hsl(${sfTheme.colors.mutedForeground})` }}>Aucun produit trouvé</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((product, i) => (
              <motion.div
                key={product.id}
                initial={sfTheme.style.animateCards ? { opacity: 0, y: 10 } : false}
                animate={sfTheme.style.animateCards ? { opacity: 1, y: 0 } : undefined}
                transition={sfTheme.style.animateCards ? { delay: i * 0.03 } : undefined}
                className={`group ${sfTheme.style.borderRadius} border overflow-hidden transition-shadow hover:shadow-lg`}
                style={{
                  backgroundColor: `hsl(${sfTheme.colors.card})`,
                  borderColor: `hsl(${sfTheme.colors.border})`,
                  boxShadow: sfTheme.style.cardShadow,
                }}
              >
                <div
                  className={`${imgRatioClass} flex items-center justify-center overflow-hidden`}
                  style={{ backgroundColor: `hsl(${sfTheme.colors.muted})` }}
                >
                  {product.images && Array.isArray(product.images) && (product.images as string[]).length > 0 ? (
                    <img
                      src={(product.images as string[])[0]}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <ShoppingBag size={24} style={{ color: `hsl(${sfTheme.colors.mutedForeground})` }} />
                  )}
                </div>
                <div className="p-3">
                  <h3
                    className="text-sm font-medium line-clamp-2"
                    style={{ color: `hsl(${sfTheme.colors.cardForeground})` }}
                  >
                    {product.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className="text-sm font-bold"
                      style={{ color: `hsl(${sfTheme.colors.primary})` }}
                    >
                      {formatPrice(product.price)}
                    </span>
                    {product.compare_at_price && product.compare_at_price > product.price && (
                      <span
                        className="text-xs line-through"
                        style={{ color: `hsl(${sfTheme.colors.mutedForeground})` }}
                      >
                        {formatPrice(product.compare_at_price)}
                      </span>
                    )}
                  </div>
                  {sfTheme.style.showBadges && product.stock_quantity <= 0 && (
                    <span className="text-xs text-red-500 mt-1 inline-block">Rupture de stock</span>
                  )}
                  {sfTheme.style.showBadges && product.compare_at_price && product.compare_at_price > product.price && product.stock_quantity > 0 && (
                    <span
                      className={`text-[10px] font-medium mt-1 inline-block px-1.5 py-0.5 ${sfTheme.style.borderRadius}`}
                      style={{
                        backgroundColor: `hsl(${sfTheme.colors.primary} / 0.1)`,
                        color: `hsl(${sfTheme.colors.primary})`,
                      }}
                    >
                      -{Math.round((1 - product.price / product.compare_at_price) * 100)}%
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer
        className="border-t py-6 mt-12"
        style={{
          backgroundColor: `hsl(${sfTheme.colors.card})`,
          borderColor: `hsl(${sfTheme.colors.border})`,
        }}
      >
        <div className="container text-center">
          <p className="text-xs" style={{ color: `hsl(${sfTheme.colors.mutedForeground})` }}>
            Boutique propulsée par{" "}
            <Link to="/" className="hover:underline" style={{ color: `hsl(${sfTheme.colors.primary})` }}>Feyxa</Link>
          </p>
        </div>
      </footer>
    </div>
  );
}

function PackageIcon({ size, className, style }: { size: number; className?: string; style?: React.CSSProperties }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
      <path d="m7.5 4.27 9 5.15" /><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" />
    </svg>
  );
}
