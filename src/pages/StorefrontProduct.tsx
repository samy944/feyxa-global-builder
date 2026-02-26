import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, Heart, ChevronLeft, Minus, Plus, Star, Truck, Shield, RotateCcw, Check, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getThemeById, getThemeCSSVars, type StorefrontTheme } from "@/lib/storefront-themes";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import { toast } from "sonner";
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
      // Related products
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

  // Google Fonts
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
      productId: product.id,
      name: product.name,
      price: product.price,
      currency: store.currency,
      image: images[0] || null,
      storeId: store.id,
      storeName: store.name,
      storeSlug: store.slug,
      slug: product.slug,
      maxStock: product.stock_quantity,
    }, quantity);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const themeStyle: React.CSSProperties = {
    ...cssVars as React.CSSProperties,
    backgroundColor: `hsl(${sfTheme.colors.background})`,
    color: `hsl(${sfTheme.colors.foreground})`,
    fontFamily: `"${sfTheme.fonts.body}", system-ui, sans-serif`,
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: `hsl(${sfTheme.colors.background})` }}>
        <div className="animate-pulse" style={{ color: `hsl(${sfTheme.colors.mutedForeground})` }}>Chargement...</div>
      </div>
    );
  }

  if (!store || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={themeStyle}>
        <div className="text-center">
          <ShoppingBag size={48} className="mx-auto mb-4" style={{ color: `hsl(${sfTheme.colors.mutedForeground})` }} />
          <h1 className="text-xl font-bold">Produit introuvable</h1>
          <Button className="mt-6" asChild><Link to={`/store/${slug}`}>Retour à la boutique</Link></Button>
        </div>
      </div>
    );
  }

  const inWishlist = isInWishlist(product.id);

  return (
    <div className="min-h-screen" style={themeStyle}>
      {/* Header Bar */}
      <header className="sticky top-0 z-50 border-b backdrop-blur-md" style={{ backgroundColor: `hsl(${sfTheme.colors.background} / 0.95)`, borderColor: `hsl(${sfTheme.colors.border})` }}>
        <div className="container flex items-center justify-between h-14">
          <Link to={`/store/${store.slug}`} className="flex items-center gap-2 text-sm font-medium hover:opacity-70 transition-opacity" style={{ color: `hsl(${sfTheme.colors.foreground})` }}>
            <ChevronLeft size={16} />
            <span style={{ fontFamily: `"${sfTheme.fonts.heading}", sans-serif` }}>{store.name}</span>
          </Link>
        </div>
      </header>

      <div className="container py-6 sm:py-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs mb-6" style={{ color: `hsl(${sfTheme.colors.mutedForeground})` }}>
          <Link to={`/store/${store.slug}`} className="hover:underline">Boutique</Link>
          <span>/</span>
          {product.category && <><span>{product.category}</span><span>/</span></>}
          <span style={{ color: `hsl(${sfTheme.colors.foreground})` }}>{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14">
          {/* Image Gallery */}
          <div>
            <motion.div
              key={selectedImage}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="relative overflow-hidden rounded-lg"
              style={{ backgroundColor: `hsl(${sfTheme.colors.muted})`, aspectRatio: "1" }}
            >
              {images[selectedImage] ? (
                <img src={images[selectedImage]} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ShoppingBag size={64} style={{ color: `hsl(${sfTheme.colors.mutedForeground})` }} />
                </div>
              )}
              {discount && (
                <span className="absolute top-4 left-4 text-sm font-bold px-3 py-1.5 rounded-full" style={{ backgroundColor: `hsl(0 84% 60%)`, color: "white" }}>
                  -{discount}%
                </span>
              )}
            </motion.div>
            {images.length > 1 && (
              <div className="flex gap-2 mt-3 overflow-x-auto">
                {images.map((img, i) => (
                  <button key={i} onClick={() => setSelectedImage(i)} className="shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-all" style={{ borderColor: i === selectedImage ? `hsl(${sfTheme.colors.primary})` : `hsl(${sfTheme.colors.border})` }}>
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div>
            {product.category && (
              <span className="text-xs uppercase tracking-widest font-medium" style={{ color: `hsl(${sfTheme.colors.primary})` }}>{product.category}</span>
            )}
            <h1 className="text-2xl sm:text-3xl font-bold mt-2 leading-tight" style={{ fontFamily: `"${sfTheme.fonts.heading}", sans-serif` }}>{product.name}</h1>

            {/* Price */}
            <div className="flex items-baseline gap-3 mt-4">
              <span className="text-3xl font-bold" style={{ color: `hsl(${sfTheme.colors.primary})` }}>{formatPrice(product.price)}</span>
              {product.compare_at_price && product.compare_at_price > product.price && (
                <span className="text-lg line-through" style={{ color: `hsl(${sfTheme.colors.mutedForeground})` }}>{formatPrice(product.compare_at_price)}</span>
              )}
            </div>

            {/* Stock Status */}
            <div className="mt-4">
              {product.stock_quantity > 5 ? (
                <span className="inline-flex items-center gap-1.5 text-sm" style={{ color: `hsl(142 72% 29%)` }}>
                  <Check size={14} /> En stock
                </span>
              ) : product.stock_quantity > 0 ? (
                <span className="inline-flex items-center gap-1.5 text-sm text-orange-500">
                  ⚡ Plus que {product.stock_quantity} en stock
                </span>
              ) : (
                <span className="text-sm text-red-500">Rupture de stock</span>
              )}
            </div>

            {/* Quantity + Add to Cart */}
            <div className="mt-8 space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">Quantité</span>
                <div className="flex items-center border rounded-lg overflow-hidden" style={{ borderColor: `hsl(${sfTheme.colors.border})` }}>
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="h-10 w-10 flex items-center justify-center hover:opacity-70" style={{ backgroundColor: `hsl(${sfTheme.colors.muted})` }}>
                    <Minus size={14} />
                  </button>
                  <span className="h-10 w-12 flex items-center justify-center text-sm font-medium">{quantity}</span>
                  <button onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))} className="h-10 w-10 flex items-center justify-center hover:opacity-70" style={{ backgroundColor: `hsl(${sfTheme.colors.muted})` }}>
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleAddToCart}
                  disabled={product.stock_quantity === 0}
                  className="flex-1 h-12 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all hover:brightness-110 disabled:opacity-50"
                  style={{ backgroundColor: `hsl(${sfTheme.colors.primary})`, color: `hsl(${sfTheme.colors.primaryForeground})` }}
                >
                  <AnimatePresence mode="wait">
                    {addedToCart ? (
                      <motion.span key="added" initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-2">
                        <Check size={16} /> Ajouté !
                      </motion.span>
                    ) : (
                      <motion.span key="add" initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="flex items-center gap-2">
                        <ShoppingCart size={16} /> Ajouter au panier
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>
                <button
                  onClick={() => toggle(product.id)}
                  className="h-12 w-12 rounded-lg border flex items-center justify-center transition-all hover:scale-105"
                  style={{ borderColor: `hsl(${sfTheme.colors.border})`, backgroundColor: inWishlist ? `hsl(347 77% 50% / 0.1)` : "transparent" }}
                >
                  <Heart size={18} fill={inWishlist ? `hsl(347, 77%, 50%)` : "none"} style={{ color: inWishlist ? `hsl(347, 77%, 50%)` : `hsl(${sfTheme.colors.mutedForeground})` }} />
                </button>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="mt-8 grid grid-cols-3 gap-3">
              {[
                { icon: <Truck size={16} />, label: "Livraison rapide" },
                { icon: <Shield size={16} />, label: "Paiement sécurisé" },
                { icon: <RotateCcw size={16} />, label: "Retours faciles" },
              ].map((badge, i) => (
                <div key={i} className="flex flex-col items-center gap-1.5 p-3 rounded-lg text-center" style={{ backgroundColor: `hsl(${sfTheme.colors.muted})` }}>
                  <span style={{ color: `hsl(${sfTheme.colors.primary})` }}>{badge.icon}</span>
                  <span className="text-[10px] font-medium" style={{ color: `hsl(${sfTheme.colors.mutedForeground})` }}>{badge.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="mt-16">
            <h2 className="text-xl font-bold mb-6" style={{ fontFamily: `"${sfTheme.fonts.heading}", sans-serif` }}>Vous aimerez aussi</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {relatedProducts.map((p) => {
                const pImg = p.images && Array.isArray(p.images) && (p.images as string[]).length > 0 ? (p.images as string[])[0] : null;
                return (
                  <Link key={p.id} to={`/store/${store.slug}/product/${p.slug}`} className="group">
                    <div className="aspect-square rounded-lg overflow-hidden" style={{ backgroundColor: `hsl(${sfTheme.colors.muted})` }}>
                      {pImg ? <img src={pImg} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /> : <div className="h-full flex items-center justify-center"><ShoppingBag size={24} style={{ color: `hsl(${sfTheme.colors.mutedForeground})` }} /></div>}
                    </div>
                    <h3 className="text-sm font-medium mt-2 line-clamp-1" style={{ color: `hsl(${sfTheme.colors.foreground})` }}>{p.name}</h3>
                    <p className="text-sm font-bold" style={{ color: `hsl(${sfTheme.colors.primary})` }}>{formatPrice(p.price)}</p>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t py-8 mt-10" style={{ borderColor: `hsl(${sfTheme.colors.border})` }}>
        <div className="container text-center">
          <p className="text-xs" style={{ color: `hsl(${sfTheme.colors.mutedForeground})` }}>
            © {new Date().getFullYear()} {store.name} · Propulsé par <Link to="/" className="hover:underline" style={{ color: `hsl(${sfTheme.colors.primary})` }}>Feyxa</Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
