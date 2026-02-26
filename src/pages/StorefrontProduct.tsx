import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingCart, Heart, ChevronLeft, Minus, Plus, Star, Truck, Shield,
  RotateCcw, Check, ShoppingBag, ChevronDown, Share2, ZoomIn,
} from "lucide-react";
import { getThemeById, getThemeCSSVars, type StorefrontTheme } from "@/lib/storefront-themes";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import { SFCartDrawer } from "@/components/storefront/shared/SFCartDrawer";
import type { StoreData, ProductData } from "@/components/storefront/types";

export default function StorefrontProduct() {
  const { slug, productSlug } = useParams<{ slug: string; productSlug: string }>();
  const [store, setStore] = useState<StoreData | null>(null);
  const [product, setProduct] = useState<ProductData | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [openAccordion, setOpenAccordion] = useState<string | null>("description");
  const { addItem } = useCart();
  const { toggle, isInWishlist } = useWishlist();

  useEffect(() => {
    if (!slug || !productSlug) return;
    loadData();
  }, [slug, productSlug]);

  const loadData = async () => {
    setLoading(true);
    const { data: storeData } = await supabase
      .from("stores").select("*").eq("slug", slug!).eq("is_active", true).single();
    if (!storeData) { setLoading(false); return; }
    setStore(storeData as StoreData);

    const { data: productData } = await supabase
      .from("products").select("*").eq("store_id", storeData.id).eq("slug", productSlug!).eq("is_published", true).single();
    if (productData) {
      setProduct(productData as unknown as ProductData);
      const { data: related } = await supabase
        .from("products").select("*").eq("store_id", storeData.id).eq("is_published", true)
        .neq("id", productData.id).limit(4);
      setRelatedProducts((related as ProductData[]) || []);
    }
    setLoading(false);
  };

  const themeObj = store?.theme as Record<string, any> | null;
  const themeId = themeObj?.storefront_theme_id || themeObj?.storefront_template_id || "minimal";
  const colorOverrides = themeObj?.color_overrides as Partial<StorefrontTheme["colors"]> | null;

  const sfTheme: StorefrontTheme = useMemo(() => {
    const base = getThemeById(themeId);
    if (!colorOverrides || Object.keys(colorOverrides).length === 0) return base;
    return { ...base, colors: { ...base.colors, ...colorOverrides } };
  }, [themeId, colorOverrides]);

  const cssVars = useMemo(() => getThemeCSSVars(sfTheme), [sfTheme]);
  const c = sfTheme.colors;

  useEffect(() => {
    const fonts = [sfTheme.fonts.heading, sfTheme.fonts.body].filter((f, i, arr) => arr.indexOf(f) === i);
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?${fonts.map(f => `family=${f.replace(/ /g, "+")}:wght@400;500;600;700`).join("&")}&display=swap`;
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, [sfTheme]);

  const formatPrice = (price: number) => {
    if (!store) return price.toString();
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency: store.currency, maximumFractionDigits: 0 }).format(price);
  };

  const images: string[] = product?.images && Array.isArray(product.images) ? (product.images as string[]) : [];
  const discount = product?.compare_at_price && product.compare_at_price > product.price
    ? Math.round((1 - product.price / product.compare_at_price) * 100) : null;

  const handleAddToCart = () => {
    if (!product || !store) return;
    addItem({
      productId: product.id, name: product.name, price: product.price, currency: store.currency,
      image: images[0] || null, storeId: store.id, storeName: store.name, storeSlug: store.slug,
      slug: product.slug, maxStock: product.stock_quantity,
    }, quantity);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const themeStyle: React.CSSProperties = {
    ...cssVars as React.CSSProperties,
    backgroundColor: `hsl(${c.background})`,
    color: `hsl(${c.foreground})`,
    fontFamily: `"${sfTheme.fonts.body}", system-ui, sans-serif`,
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: `hsl(${c.background})` }}>
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="h-8 w-8 border-2 rounded-full" style={{ borderColor: `hsl(${c.border})`, borderTopColor: `hsl(${c.primary})` }} />
      </div>
    );
  }

  if (!store || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={themeStyle}>
        <div className="text-center">
          <ShoppingBag size={48} className="mx-auto mb-4" style={{ color: `hsl(${c.mutedForeground})` }} />
          <h1 className="text-xl font-bold">Produit introuvable</h1>
          <Link to={`/store/${slug}`} className="inline-flex items-center gap-1.5 mt-6 text-sm font-medium hover:underline" style={{ color: `hsl(${c.primary})` }}>
            <ChevronLeft size={14} /> Retour à la boutique
          </Link>
        </div>
      </div>
    );
  }

  const inWishlist = isInWishlist(product.id);

  const accordions = [
    { id: "description", title: "Description", content: "Découvrez ce produit exceptionnel, conçu pour répondre à vos besoins avec qualité et style. Chaque détail a été pensé pour offrir la meilleure expérience possible." },
    { id: "shipping", title: "Livraison & Retours", content: "Livraison rapide sous 2-5 jours ouvrés. Retours gratuits sous 14 jours. Emballage soigné et suivi de commande en temps réel." },
    { id: "care", title: "Entretien", content: "Suivez les instructions d'entretien sur l'étiquette pour prolonger la durée de vie de votre produit." },
  ];

  return (
    <div className="min-h-screen" style={themeStyle}>
      {/* Branded Cart Drawer */}
      <SFCartDrawer theme={sfTheme} storeName={store.name} storeSlug={store.slug} currency={store.currency} />

      {/* Slim Header */}
      <header className="sticky top-0 z-50 border-b backdrop-blur-xl" style={{ backgroundColor: `hsl(${c.background} / 0.95)`, borderColor: `hsl(${c.border})` }}>
        <div className="container flex items-center justify-between h-14">
          <Link to={`/store/${store.slug}`} className="flex items-center gap-2 text-sm font-medium hover:opacity-70 transition-opacity">
            <ChevronLeft size={16} />
            <span style={{ fontFamily: `"${sfTheme.fonts.heading}", sans-serif` }}>{store.name}</span>
          </Link>
          <div className="flex items-center gap-2">
            <button onClick={() => { navigator.clipboard.writeText(window.location.href); }} className="h-8 w-8 rounded-full flex items-center justify-center hover:opacity-70" style={{ color: `hsl(${c.mutedForeground})` }}>
              <Share2 size={14} />
            </button>
          </div>
        </div>
      </header>

      {/* ── BIG BRAND SPLIT LAYOUT ── */}
      <div className="lg:grid lg:grid-cols-2 lg:min-h-[calc(100vh-3.5rem)]">
        {/* LEFT: Giant scrollable image gallery */}
        <div className="lg:sticky lg:top-14 lg:h-[calc(100vh-3.5rem)] lg:overflow-y-auto">
          <div className="space-y-1">
            {images.length > 0 ? images.map((img, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.1 }}
                className="relative cursor-zoom-in group"
                onClick={() => { setSelectedImage(i); setZoomOpen(true); }}
              >
                <img src={img} alt={`${product.name} - ${i + 1}`} className="w-full object-cover" loading={i > 0 ? "lazy" : "eager"} />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <ZoomIn size={24} style={{ color: `hsl(${c.foreground})` }} />
                </div>
                {i === 0 && discount && (
                  <span className="absolute top-4 left-4 text-sm font-bold px-4 py-2 rounded-full" style={{ backgroundColor: `hsl(0 84% 60%)`, color: "white" }}>
                    -{discount}%
                  </span>
                )}
              </motion.div>
            )) : (
              <div className="aspect-square flex items-center justify-center" style={{ backgroundColor: `hsl(${c.muted})` }}>
                <ShoppingBag size={64} style={{ color: `hsl(${c.mutedForeground})` }} />
              </div>
            )}
          </div>

          {/* Thumbnail strip (mobile) */}
          {images.length > 1 && (
            <div className="flex gap-2 p-4 overflow-x-auto lg:hidden">
              {images.map((img, i) => (
                <button key={i} onClick={() => setSelectedImage(i)} className="shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all" style={{ borderColor: i === selectedImage ? `hsl(${c.primary})` : `hsl(${c.border})` }}>
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT: Product info (sticky on desktop) */}
        <div className="lg:overflow-y-auto lg:h-[calc(100vh-3.5rem)]">
          <div className="px-6 py-8 lg:px-12 lg:py-14 max-w-lg mx-auto lg:max-w-none">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-[11px] mb-6" style={{ color: `hsl(${c.mutedForeground})` }}>
              <Link to={`/store/${store.slug}`} className="hover:underline">{store.name}</Link>
              <span>/</span>
              {product.category && <><span>{product.category}</span><span>/</span></>}
              <span style={{ color: `hsl(${c.foreground})` }}>{product.name}</span>
            </nav>

            {/* Category Badge */}
            {product.category && (
              <span className="inline-block text-[10px] uppercase tracking-[0.15em] font-semibold px-3 py-1 rounded-full mb-4" style={{ backgroundColor: `hsl(${c.primary} / 0.1)`, color: `hsl(${c.primary})` }}>
                {product.category}
              </span>
            )}

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl font-bold leading-tight" style={{ fontFamily: `"${sfTheme.fonts.heading}", sans-serif` }}>
              {product.name}
            </h1>

            {/* Rating placeholder */}
            <div className="flex items-center gap-2 mt-3">
              <div className="flex">
                {[1, 2, 3, 4, 5].map(i => (
                  <Star key={i} size={13} fill={i <= 4 ? `hsl(${c.primary})` : "none"} style={{ color: i <= 4 ? `hsl(${c.primary})` : `hsl(${c.border})` }} />
                ))}
              </div>
              <span className="text-xs" style={{ color: `hsl(${c.mutedForeground})` }}>4.0 · 12 avis</span>
            </div>

            {/* Price block */}
            <div className="flex items-baseline gap-3 mt-6">
              <span className="text-3xl font-bold" style={{ color: `hsl(${c.foreground})` }}>
                {formatPrice(product.price)}
              </span>
              {product.compare_at_price && product.compare_at_price > product.price && (
                <>
                  <span className="text-lg line-through" style={{ color: `hsl(${c.mutedForeground})` }}>
                    {formatPrice(product.compare_at_price)}
                  </span>
                  <span className="text-sm font-bold px-2 py-0.5 rounded" style={{ backgroundColor: `hsl(0 84% 60% / 0.1)`, color: `hsl(0 84% 60%)` }}>
                    -{discount}%
                  </span>
                </>
              )}
            </div>

            {/* Stock Status */}
            <div className="mt-3">
              {product.stock_quantity > 5 ? (
                <span className="inline-flex items-center gap-1.5 text-sm font-medium" style={{ color: `hsl(142 72% 29%)` }}>
                  <Check size={14} /> En stock
                </span>
              ) : product.stock_quantity > 0 ? (
                <div>
                  <span className="text-sm font-medium text-orange-500">⚡ Plus que {product.stock_quantity} en stock</span>
                  <div className="mt-1.5 h-1.5 rounded-full overflow-hidden w-32" style={{ backgroundColor: `hsl(${c.muted})` }}>
                    <div className="h-full rounded-full bg-orange-500" style={{ width: `${Math.min(100, (product.stock_quantity / 20) * 100)}%` }} />
                  </div>
                </div>
              ) : (
                <span className="text-sm font-medium text-red-500">Rupture de stock</span>
              )}
            </div>

            {/* Divider */}
            <div className="h-px my-8" style={{ backgroundColor: `hsl(${c.border})` }} />

            {/* Quantity selector */}
            <div className="space-y-3">
              <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: `hsl(${c.mutedForeground})` }}>Quantité</label>
              <div className="flex items-center border rounded-xl overflow-hidden w-fit" style={{ borderColor: `hsl(${c.border})` }}>
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="h-12 w-12 flex items-center justify-center hover:opacity-70 transition-opacity" style={{ backgroundColor: `hsl(${c.muted})` }}>
                  <Minus size={14} />
                </button>
                <span className="h-12 w-14 flex items-center justify-center text-sm font-bold">{quantity}</span>
                <button onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))} className="h-12 w-12 flex items-center justify-center hover:opacity-70 transition-opacity" style={{ backgroundColor: `hsl(${c.muted})` }}>
                  <Plus size={14} />
                </button>
              </div>
            </div>

            {/* Add to Cart + Wishlist */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleAddToCart}
                disabled={product.stock_quantity === 0}
                className="flex-1 h-14 rounded-xl text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all hover:brightness-110 disabled:opacity-50"
                style={{ backgroundColor: `hsl(${c.primary})`, color: `hsl(${c.primaryForeground})` }}
              >
                <AnimatePresence mode="wait">
                  {addedToCart ? (
                    <motion.span key="added" initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-2">
                      <Check size={16} /> Ajouté au panier
                    </motion.span>
                  ) : (
                    <motion.span key="add" initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="flex items-center gap-2">
                      <ShoppingCart size={16} /> Ajouter au panier — {formatPrice(product.price * quantity)}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
              <button
                onClick={() => toggle(product.id)}
                className="h-14 w-14 rounded-xl border flex items-center justify-center transition-all hover:scale-105"
                style={{ borderColor: `hsl(${c.border})`, backgroundColor: inWishlist ? `hsl(347 77% 50% / 0.08)` : "transparent" }}
              >
                <Heart size={18} fill={inWishlist ? `hsl(347, 77%, 50%)` : "none"} style={{ color: inWishlist ? `hsl(347, 77%, 50%)` : `hsl(${c.mutedForeground})` }} />
              </button>
            </div>

            {/* Trust row */}
            <div className="grid grid-cols-3 gap-3 mt-8">
              {[
                { icon: <Truck size={16} />, label: "Livraison rapide", sub: "2-5 jours" },
                { icon: <Shield size={16} />, label: "Paiement sécurisé", sub: "100% protégé" },
                { icon: <RotateCcw size={16} />, label: "Retours gratuits", sub: "14 jours" },
              ].map((b, i) => (
                <div key={i} className="text-center p-3 rounded-xl" style={{ backgroundColor: `hsl(${c.muted})` }}>
                  <span className="block mx-auto mb-1" style={{ color: `hsl(${c.primary})` }}>{b.icon}</span>
                  <span className="text-[10px] font-bold block">{b.label}</span>
                  <span className="text-[9px]" style={{ color: `hsl(${c.mutedForeground})` }}>{b.sub}</span>
                </div>
              ))}
            </div>

            {/* Divider */}
            <div className="h-px my-8" style={{ backgroundColor: `hsl(${c.border})` }} />

            {/* Accordions */}
            <div className="space-y-0">
              {accordions.map((acc) => (
                <div key={acc.id} className="border-b" style={{ borderColor: `hsl(${c.border})` }}>
                  <button
                    onClick={() => setOpenAccordion(openAccordion === acc.id ? null : acc.id)}
                    className="w-full flex items-center justify-between py-5 text-left"
                  >
                    <span className="text-sm font-semibold">{acc.title}</span>
                    <motion.span animate={{ rotate: openAccordion === acc.id ? 180 : 0 }} transition={{ duration: 0.2 }}>
                      <ChevronDown size={16} style={{ color: `hsl(${c.mutedForeground})` }} />
                    </motion.span>
                  </button>
                  <AnimatePresence>
                    {openAccordion === acc.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <p className="text-sm leading-relaxed pb-5" style={{ color: `hsl(${c.mutedForeground})` }}>
                          {acc.content}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── MOBILE STICKY BAR ── */}
      <div className="fixed bottom-0 inset-x-0 z-40 border-t backdrop-blur-xl p-3 lg:hidden" style={{ backgroundColor: `hsl(${c.background} / 0.95)`, borderColor: `hsl(${c.border})` }}>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <p className="text-lg font-bold">{formatPrice(product.price)}</p>
            {product.compare_at_price && product.compare_at_price > product.price && (
              <p className="text-[10px] line-through" style={{ color: `hsl(${c.mutedForeground})` }}>{formatPrice(product.compare_at_price)}</p>
            )}
          </div>
          <button
            onClick={handleAddToCart}
            disabled={product.stock_quantity === 0}
            className="h-12 px-8 rounded-xl text-sm font-bold flex items-center gap-2 transition-all hover:brightness-110 disabled:opacity-50"
            style={{ backgroundColor: `hsl(${c.primary})`, color: `hsl(${c.primaryForeground})` }}
          >
            {addedToCart ? <><Check size={14} /> Ajouté</> : <><ShoppingCart size={14} /> Ajouter</>}
          </button>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="container py-16 lg:pb-20">
          <h2 className="text-2xl font-bold mb-8" style={{ fontFamily: `"${sfTheme.fonts.heading}", sans-serif` }}>Vous aimerez aussi</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {relatedProducts.map((p) => {
              const pImg = p.images && Array.isArray(p.images) && (p.images as string[]).length > 0 ? (p.images as string[])[0] : null;
              return (
                <Link key={p.id} to={`/store/${store.slug}/product/${p.slug}`} className="group">
                  <div className="aspect-[3/4] rounded-xl overflow-hidden" style={{ backgroundColor: `hsl(${c.muted})` }}>
                    {pImg ? <img src={pImg} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /> : <div className="h-full flex items-center justify-center"><ShoppingBag size={24} style={{ color: `hsl(${c.mutedForeground})` }} /></div>}
                  </div>
                  <h3 className="text-sm font-medium mt-3 line-clamp-1">{p.name}</h3>
                  <p className="text-sm font-bold mt-0.5" style={{ color: `hsl(${c.primary})` }}>{formatPrice(p.price)}</p>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t py-8" style={{ borderColor: `hsl(${c.border})` }}>
        <div className="container text-center">
          <p className="text-xs" style={{ color: `hsl(${c.mutedForeground})` }}>
            © {new Date().getFullYear()} {store.name} · Propulsé par <Link to="/" className="hover:underline" style={{ color: `hsl(${c.primary})` }}>Feyxa</Link>
          </p>
        </div>
      </footer>

      {/* Zoom Modal */}
      <AnimatePresence>
        {zoomOpen && images[selectedImage] && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center cursor-zoom-out"
            onClick={() => setZoomOpen(false)}
          >
            <img src={images[selectedImage]} alt="" className="max-w-[90vw] max-h-[90vh] object-contain" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
