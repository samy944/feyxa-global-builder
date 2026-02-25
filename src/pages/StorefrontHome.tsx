import { useState, useEffect, useMemo } from "react";
import { useSeoHead } from "@/hooks/useSeoHead";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import {
  ShoppingBag, Search, ShoppingCart, Star, ChevronRight,
  Mail, ArrowRight, Menu, User, Heart, Package, Truck, Shield, Clock,
} from "lucide-react";
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
  settings: any;
}

interface ProductData {
  id: string;
  name: string;
  slug: string;
  price: number;
  compare_at_price: number | null;
  images: any;
  stock_quantity: number;
  category?: string | null;
  created_at: string;
}

// ─── Reusable Section Title ───
function SectionTitle({ title, subtitle, theme, action }: {
  title: string; subtitle?: string; theme: StorefrontTheme; action?: React.ReactNode;
}) {
  return (
    <div className="flex items-end justify-between mb-6">
      <div>
        <h2
          className="text-xl sm:text-2xl font-bold"
          style={{ fontFamily: `"${theme.fonts.heading}", sans-serif`, color: `hsl(${theme.colors.foreground})` }}
        >
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm mt-1" style={{ color: `hsl(${theme.colors.mutedForeground})` }}>
            {subtitle}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

// ─── Product Card ───
function ProductCard({ product, theme, formatPrice, index }: {
  product: ProductData; theme: StorefrontTheme; formatPrice: (p: number) => string; index: number;
}) {
  const imgRatioClass = theme.style.productImageRatio === "portrait"
    ? "aspect-[3/4]"
    : theme.style.productImageRatio === "landscape"
      ? "aspect-[4/3]"
      : "aspect-square";

  const discount = product.compare_at_price && product.compare_at_price > product.price
    ? Math.round((1 - product.price / product.compare_at_price) * 100)
    : null;

  return (
    <motion.div
      initial={theme.style.animateCards ? { opacity: 0, y: 12 } : false}
      animate={theme.style.animateCards ? { opacity: 1, y: 0 } : undefined}
      transition={theme.style.animateCards ? { delay: index * 0.04, duration: 0.3 } : undefined}
      className={`group ${theme.style.borderRadius} border overflow-hidden transition-all hover:shadow-lg`}
      style={{
        backgroundColor: `hsl(${theme.colors.card})`,
        borderColor: `hsl(${theme.colors.border})`,
        boxShadow: theme.style.cardShadow,
      }}
    >
      <div
        className={`${imgRatioClass} relative flex items-center justify-center overflow-hidden`}
        style={{ backgroundColor: `hsl(${theme.colors.muted})` }}
      >
        {product.images && Array.isArray(product.images) && (product.images as string[]).length > 0 ? (
          <img
            src={(product.images as string[])[0]}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <ShoppingBag size={28} style={{ color: `hsl(${theme.colors.mutedForeground})` }} />
        )}
        {/* Discount badge */}
        {theme.style.showBadges && discount && (
          <span
            className={`absolute top-2 left-2 text-[11px] font-semibold px-2 py-0.5 ${theme.style.borderRadius}`}
            style={{
              backgroundColor: `hsl(${theme.colors.primary})`,
              color: `hsl(${theme.colors.primaryForeground})`,
            }}
          >
            -{discount}%
          </span>
        )}
        {/* Wishlist */}
        <button
          className="absolute top-2 right-2 h-8 w-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ backgroundColor: `hsl(${theme.colors.card} / 0.85)` }}
        >
          <Heart size={14} style={{ color: `hsl(${theme.colors.foreground})` }} />
        </button>
      </div>
      <div className="p-3 sm:p-4">
        {product.category && (
          <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: `hsl(${theme.colors.mutedForeground})` }}>
            {product.category}
          </p>
        )}
        <h3
          className="text-sm font-medium line-clamp-2 leading-snug"
          style={{ color: `hsl(${theme.colors.cardForeground})` }}
        >
          {product.name}
        </h3>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-sm font-bold" style={{ color: `hsl(${theme.colors.primary})` }}>
            {formatPrice(product.price)}
          </span>
          {product.compare_at_price && product.compare_at_price > product.price && (
            <span className="text-xs line-through" style={{ color: `hsl(${theme.colors.mutedForeground})` }}>
              {formatPrice(product.compare_at_price)}
            </span>
          )}
        </div>
        {theme.style.showBadges && product.stock_quantity <= 0 && (
          <span className="text-xs text-red-500 mt-1 inline-block">Rupture de stock</span>
        )}
      </div>
    </motion.div>
  );
}

export default function StorefrontHome() {
  const { slug } = useParams<{ slug: string }>();
  const [store, setStore] = useState<StoreData | null>(null);
  const [products, setProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [email, setEmail] = useState("");

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

  const sfTheme: StorefrontTheme = useMemo(() => {
    const themeObj = store?.theme as Record<string, any> | null;
    const themeId = themeObj?.storefront_theme_id || "classic";
    return getThemeById(themeId);
  }, [store?.theme]);

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

  // Derived data
  const categories = useMemo(() => {
    const cats = [...new Set(products.filter((p) => p.category).map((p) => p.category!))];
    return cats.slice(0, 8);
  }, [products]);

  const featuredProducts = useMemo(() => products.slice(0, 8), [products]);
  const newArrivals = useMemo(() => [...products].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 4), [products]);
  const onSale = useMemo(() => products.filter((p) => p.compare_at_price && p.compare_at_price > p.price).slice(0, 4), [products]);

  const filtered = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  const navItems = useMemo(() => {
    const settingsNav = (store?.settings as any)?.storefront_nav as { url: string; label: string }[] | undefined;
    return settingsNav || [
      { url: "#", label: "Accueil" },
      { url: "#produits", label: "Produits" },
      { url: "#contact", label: "Contact" },
    ];
  }, [store?.settings]);

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

      {/* ════════ HEADER ════════ */}
      <header
        className="sticky top-0 z-50 border-b backdrop-blur-md"
        style={{
          backgroundColor: sfTheme.style.headerStyle === "transparent"
            ? `hsl(${sfTheme.colors.background} / 0.85)`
            : sfTheme.style.headerStyle === "gradient"
              ? `hsl(${sfTheme.colors.primary})`
              : `hsl(${sfTheme.colors.card} / 0.95)`,
          borderColor: `hsl(${sfTheme.colors.border})`,
          color: sfTheme.style.headerStyle === "gradient"
            ? `hsl(${sfTheme.colors.primaryForeground})`
            : `hsl(${sfTheme.colors.foreground})`,
        }}
      >
        <div className="container flex items-center justify-between h-14 sm:h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <button className="sm:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              <Menu size={20} />
            </button>
            {store.logo_url ? (
              <img src={store.logo_url} alt={store.name} className={`h-8 w-8 ${sfTheme.style.borderRadius} object-cover`} />
            ) : (
              <div
                className={`h-8 w-8 ${sfTheme.style.borderRadius} flex items-center justify-center font-bold text-xs`}
                style={{ backgroundColor: `hsl(${sfTheme.colors.primary})`, color: `hsl(${sfTheme.colors.primaryForeground})` }}
              >
                {store.name[0]}
              </div>
            )}
            <span className="font-bold text-sm sm:text-base" style={{ fontFamily: `"${sfTheme.fonts.heading}", sans-serif` }}>
              {store.name}
            </span>
          </div>

          {/* Nav desktop */}
          <nav className="hidden sm:flex items-center gap-6">
            {navItems.map((item, i) => (
              <a key={i} href={item.url} className="text-sm font-medium hover:opacity-70 transition-opacity">
                {item.label}
              </a>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <button className="h-9 w-9 rounded-full flex items-center justify-center hover:opacity-70">
              <Search size={18} />
            </button>
            <button className="h-9 w-9 rounded-full flex items-center justify-center hover:opacity-70">
              <User size={18} />
            </button>
            <button className="h-9 w-9 rounded-full flex items-center justify-center hover:opacity-70 relative">
              <ShoppingCart size={18} />
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="sm:hidden border-t overflow-hidden"
            style={{ borderColor: `hsl(${sfTheme.colors.border})`, backgroundColor: `hsl(${sfTheme.colors.card})` }}
          >
            <div className="p-4 space-y-3">
              {navItems.map((item, i) => (
                <a key={i} href={item.url} className="block text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>
                  {item.label}
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </header>

      {/* ════════ HERO BANNER ════════ */}
      <section
        className="relative overflow-hidden"
        style={{ backgroundColor: `hsl(${sfTheme.colors.muted})` }}
      >
        <div className="container py-12 sm:py-20 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-xl"
          >
            <h1
              className="text-3xl sm:text-5xl font-bold leading-tight"
              style={{ fontFamily: `"${sfTheme.fonts.heading}", sans-serif` }}
            >
              {store.name}
            </h1>
            {store.description && (
              <p className="text-base sm:text-lg mt-4 leading-relaxed" style={{ color: `hsl(${sfTheme.colors.mutedForeground})` }}>
                {store.description}
              </p>
            )}
            <div className="flex gap-3 mt-6">
              <a
                href="#produits"
                className={`inline-flex items-center gap-2 px-6 py-3 ${sfTheme.style.borderRadius} text-sm font-semibold transition-opacity hover:opacity-90`}
                style={{
                  backgroundColor: `hsl(${sfTheme.colors.primary})`,
                  color: `hsl(${sfTheme.colors.primaryForeground})`,
                }}
              >
                Découvrir <ArrowRight size={16} />
              </a>
            </div>
          </motion.div>
        </div>
        {/* Decorative gradient */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background: `radial-gradient(ellipse at 80% 50%, hsl(${sfTheme.colors.primary} / 0.3) 0%, transparent 60%)`,
          }}
        />
      </section>

      {/* ════════ TRUST BADGES ════════ */}
      <section
        className="border-b"
        style={{
          backgroundColor: `hsl(${sfTheme.colors.card})`,
          borderColor: `hsl(${sfTheme.colors.border})`,
        }}
      >
        <div className="container py-4 flex flex-wrap justify-center gap-6 sm:gap-10">
          {[
            { icon: <Truck size={18} />, label: "Livraison rapide" },
            { icon: <Shield size={18} />, label: "Paiement sécurisé" },
            { icon: <Clock size={18} />, label: "Support 24/7" },
            { icon: <Package size={18} />, label: "Retours faciles" },
          ].map((b, i) => (
            <div key={i} className="flex items-center gap-2 text-sm" style={{ color: `hsl(${sfTheme.colors.mutedForeground})` }}>
              <span style={{ color: `hsl(${sfTheme.colors.primary})` }}>{b.icon}</span>
              {b.label}
            </div>
          ))}
        </div>
      </section>

      {/* ════════ CATEGORIES ════════ */}
      {categories.length > 0 && (
        <section className="container py-10 sm:py-14">
          <SectionTitle title="Catégories" subtitle="Parcourez par catégorie" theme={sfTheme} />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {categories.map((cat, i) => (
              <motion.div
                key={cat}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className={`${sfTheme.style.borderRadius} border p-4 sm:p-6 text-center cursor-pointer transition-all hover:shadow-md`}
                style={{
                  backgroundColor: `hsl(${sfTheme.colors.card})`,
                  borderColor: `hsl(${sfTheme.colors.border})`,
                }}
              >
                <div
                  className={`h-10 w-10 mx-auto ${sfTheme.style.borderRadius} flex items-center justify-center mb-3`}
                  style={{ backgroundColor: `hsl(${sfTheme.colors.primary} / 0.1)` }}
                >
                  <Package size={20} style={{ color: `hsl(${sfTheme.colors.primary})` }} />
                </div>
                <p className="text-sm font-medium" style={{ color: `hsl(${sfTheme.colors.cardForeground})` }}>
                  {cat}
                </p>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* ════════ FEATURED PRODUCTS ════════ */}
      <section id="produits" className="container py-10 sm:py-14">
        <SectionTitle
          title="Produits vedettes"
          subtitle={`${products.length} produit${products.length > 1 ? "s" : ""} disponible${products.length > 1 ? "s" : ""}`}
          theme={sfTheme}
        />

        {/* Search bar */}
        <div className="relative max-w-md mb-6">
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
            }}
          />
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingBag size={40} style={{ color: `hsl(${sfTheme.colors.mutedForeground})` }} className="mx-auto mb-3" />
            <p style={{ color: `hsl(${sfTheme.colors.mutedForeground})` }}>Aucun produit trouvé</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {(search ? filtered : featuredProducts).map((product, i) => (
              <ProductCard key={product.id} product={product} theme={sfTheme} formatPrice={formatPrice} index={i} />
            ))}
          </div>
        )}

        {!search && products.length > 8 && (
          <div className="text-center mt-8">
            <button
              className={`inline-flex items-center gap-2 px-6 py-2.5 ${sfTheme.style.borderRadius} border text-sm font-medium transition-opacity hover:opacity-80`}
              style={{ borderColor: `hsl(${sfTheme.colors.border})`, color: `hsl(${sfTheme.colors.foreground})` }}
              onClick={() => setSearch(" ")}
            >
              Voir tous les produits <ChevronRight size={16} />
            </button>
          </div>
        )}
      </section>

      {/* ════════ ON SALE ════════ */}
      {onSale.length > 0 && (
        <section
          className="py-10 sm:py-14"
          style={{ backgroundColor: `hsl(${sfTheme.colors.primary} / 0.04)` }}
        >
          <div className="container">
            <SectionTitle title="🔥 Promotions" subtitle="Profitez de nos meilleures offres" theme={sfTheme} />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {onSale.map((product, i) => (
                <ProductCard key={product.id} product={product} theme={sfTheme} formatPrice={formatPrice} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ════════ NEW ARRIVALS ════════ */}
      {newArrivals.length > 0 && (
        <section className="container py-10 sm:py-14">
          <SectionTitle title="Nouveautés" subtitle="Derniers produits ajoutés" theme={sfTheme} />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {newArrivals.map((product, i) => (
              <ProductCard key={product.id} product={product} theme={sfTheme} formatPrice={formatPrice} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* ════════ TESTIMONIALS ════════ */}
      <section
        className="py-10 sm:py-14"
        style={{ backgroundColor: `hsl(${sfTheme.colors.card})` }}
      >
        <div className="container">
          <SectionTitle title="Ce que disent nos clients" theme={sfTheme} />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { name: "Aminata K.", text: "Produits de qualité et livraison rapide. Je recommande !" },
              { name: "Jean-Paul M.", text: "Excellent service client, très professionnel." },
              { name: "Fatou D.", text: "Ma boutique préférée ! Toujours satisfaite de mes achats." },
            ].map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`${sfTheme.style.borderRadius} border p-5`}
                style={{ borderColor: `hsl(${sfTheme.colors.border})`, backgroundColor: `hsl(${sfTheme.colors.background})` }}
              >
                <div className="flex gap-0.5 mb-3">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} size={14} fill={`hsl(${sfTheme.colors.primary})`} style={{ color: `hsl(${sfTheme.colors.primary})` }} />
                  ))}
                </div>
                <p className="text-sm leading-relaxed" style={{ color: `hsl(${sfTheme.colors.foreground})` }}>
                  "{t.text}"
                </p>
                <p className="text-xs font-semibold mt-3" style={{ color: `hsl(${sfTheme.colors.mutedForeground})` }}>
                  — {t.name}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════ NEWSLETTER ════════ */}
      <section className="container py-10 sm:py-14" id="contact">
        <div
          className={`${sfTheme.style.borderRadius} p-8 sm:p-12 text-center`}
          style={{
            backgroundColor: `hsl(${sfTheme.colors.primary} / 0.06)`,
            border: `1px solid hsl(${sfTheme.colors.primary} / 0.15)`,
          }}
        >
          <Mail size={28} className="mx-auto mb-4" style={{ color: `hsl(${sfTheme.colors.primary})` }} />
          <h3
            className="text-lg sm:text-xl font-bold"
            style={{ fontFamily: `"${sfTheme.fonts.heading}", sans-serif` }}
          >
            Restez informé
          </h3>
          <p className="text-sm mt-2 max-w-md mx-auto" style={{ color: `hsl(${sfTheme.colors.mutedForeground})` }}>
            Recevez nos offres exclusives et nouveautés directement dans votre boîte mail.
          </p>
          <div className="flex gap-2 max-w-sm mx-auto mt-5">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre@email.com"
              className={`flex-1 h-10 ${sfTheme.style.borderRadius} border px-4 text-sm focus:outline-none focus:ring-2`}
              style={{
                backgroundColor: `hsl(${sfTheme.colors.card})`,
                borderColor: `hsl(${sfTheme.colors.border})`,
                color: `hsl(${sfTheme.colors.foreground})`,
              }}
            />
            <button
              className={`${sfTheme.style.borderRadius} px-5 h-10 text-sm font-semibold transition-opacity hover:opacity-90`}
              style={{
                backgroundColor: `hsl(${sfTheme.colors.primary})`,
                color: `hsl(${sfTheme.colors.primaryForeground})`,
              }}
            >
              S'inscrire
            </button>
          </div>
        </div>
      </section>

      {/* ════════ FOOTER ════════ */}
      <footer
        className="border-t py-10"
        style={{
          backgroundColor: `hsl(${sfTheme.colors.card})`,
          borderColor: `hsl(${sfTheme.colors.border})`,
        }}
      >
        <div className="container">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                {store.logo_url ? (
                  <img src={store.logo_url} alt={store.name} className={`h-8 w-8 ${sfTheme.style.borderRadius} object-cover`} />
                ) : (
                  <div
                    className={`h-8 w-8 ${sfTheme.style.borderRadius} flex items-center justify-center font-bold text-xs`}
                    style={{ backgroundColor: `hsl(${sfTheme.colors.primary})`, color: `hsl(${sfTheme.colors.primaryForeground})` }}
                  >
                    {store.name[0]}
                  </div>
                )}
                <span className="font-bold text-sm" style={{ fontFamily: `"${sfTheme.fonts.heading}", sans-serif` }}>
                  {store.name}
                </span>
              </div>
              {store.description && (
                <p className="text-xs leading-relaxed" style={{ color: `hsl(${sfTheme.colors.mutedForeground})` }}>
                  {store.description}
                </p>
              )}
            </div>

            {/* Links */}
            <div>
              <h4 className="text-sm font-semibold mb-3">Navigation</h4>
              <div className="space-y-2">
                {navItems.map((item, i) => (
                  <a
                    key={i}
                    href={item.url}
                    className="block text-xs hover:underline"
                    style={{ color: `hsl(${sfTheme.colors.mutedForeground})` }}
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            </div>

            {/* Info */}
            <div>
              <h4 className="text-sm font-semibold mb-3">Informations</h4>
              <div className="space-y-2 text-xs" style={{ color: `hsl(${sfTheme.colors.mutedForeground})` }}>
                <p>Livraison : {(store.settings as any)?.city || "Disponible"}</p>
                <p>Devise : {store.currency}</p>
              </div>
            </div>
          </div>

          <div
            className="border-t mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3"
            style={{ borderColor: `hsl(${sfTheme.colors.border})` }}
          >
            <p className="text-xs" style={{ color: `hsl(${sfTheme.colors.mutedForeground})` }}>
              © {new Date().getFullYear()} {store.name}. Tous droits réservés.
            </p>
            <p className="text-xs" style={{ color: `hsl(${sfTheme.colors.mutedForeground})` }}>
              Propulsé par{" "}
              <Link to="/" className="hover:underline" style={{ color: `hsl(${sfTheme.colors.primary})` }}>Feyxa</Link>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
