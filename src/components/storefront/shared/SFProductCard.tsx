import { useState } from "react";
import { motion } from "framer-motion";
import { ShoppingBag, Heart, ShoppingCart, Eye, Check, Star } from "lucide-react";
import { Link } from "react-router-dom";
import type { ProductData } from "../types";
import type { StorefrontTheme } from "@/lib/storefront-themes";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";

interface Props {
  product: ProductData;
  theme: StorefrontTheme;
  formatPrice: (p: number) => string;
  index: number;
  templateId: string;
  storeSlug: string;
  storeName: string;
  storeId: string;
  currency: string;
}

export function SFProductCard({ product, theme, formatPrice, index, templateId, storeSlug, storeName, storeId, currency }: Props) {
  const [addedToCart, setAddedToCart] = useState(false);
  const { addItem } = useCart();
  const { toggle, isInWishlist } = useWishlist();
  const inWishlist = isInWishlist(product.id);

  const discount = product.compare_at_price && product.compare_at_price > product.price
    ? Math.round((1 - product.price / product.compare_at_price) * 100) : null;

  const images = product.images && Array.isArray(product.images) ? (product.images as string[]) : [];
  const img = images.length > 0 ? images[0] : null;
  const img2 = images.length > 1 ? images[1] : null;

  const imgRatio = theme.style.productImageRatio === "portrait" ? "aspect-[3/4]"
    : theme.style.productImageRatio === "landscape" ? "aspect-[4/3]" : "aspect-square";

  const productLink = `/store/${storeSlug}/product/${product.slug}`;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      currency,
      image: img,
      storeId,
      storeName,
      storeSlug,
      slug: product.slug,
      maxStock: product.stock_quantity,
    });
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 1500);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggle(product.id);
  };

  // ── MINIMAL ──
  if (templateId === "minimal") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.03, duration: 0.4 }}
        className="group"
      >
        <Link to={productLink}>
          <div className={`${imgRatio} relative overflow-hidden`} style={{ backgroundColor: `hsl(${theme.colors.muted})` }}>
            {img ? (
              <>
                <img src={img} alt={product.name} className="w-full h-full object-cover transition-opacity duration-700" loading="lazy" />
                {img2 && <img src={img2} alt="" className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-700" loading="lazy" />}
              </>
            ) : (
              <div className="h-full flex items-center justify-center"><ShoppingBag size={24} style={{ color: `hsl(${theme.colors.mutedForeground})` }} /></div>
            )}
            {/* Overlay Actions */}
            <div className="absolute inset-x-0 bottom-0 p-3 flex justify-between items-end translate-y-full group-hover:translate-y-0 transition-transform duration-300">
              <button onClick={handleAddToCart} className="h-9 px-4 rounded-full text-xs font-medium flex items-center gap-1.5 backdrop-blur-md transition-all hover:scale-105" style={{ backgroundColor: `hsl(${theme.colors.foreground} / 0.9)`, color: `hsl(${theme.colors.background})` }}>
                {addedToCart ? <><Check size={12} /> Ajouté</> : <><ShoppingCart size={12} /> Ajouter</>}
              </button>
              <button onClick={handleWishlist} className="h-9 w-9 rounded-full flex items-center justify-center backdrop-blur-md" style={{ backgroundColor: `hsl(${theme.colors.background} / 0.8)` }}>
                <Heart size={14} fill={inWishlist ? `hsl(347, 77%, 50%)` : "none"} style={{ color: inWishlist ? `hsl(347, 77%, 50%)` : `hsl(${theme.colors.foreground})` }} />
              </button>
            </div>
          </div>
          <div className="mt-3 space-y-1">
            <h3 className="text-sm font-medium line-clamp-1" style={{ color: `hsl(${theme.colors.foreground})` }}>{product.name}</h3>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold" style={{ color: `hsl(${theme.colors.foreground})` }}>{formatPrice(product.price)}</span>
              {product.compare_at_price && product.compare_at_price > product.price && (
                <span className="text-xs line-through" style={{ color: `hsl(${theme.colors.mutedForeground})` }}>{formatPrice(product.compare_at_price)}</span>
              )}
            </div>
          </div>
        </Link>
      </motion.div>
    );
  }

  // ── TECH ──
  if (templateId === "tech") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.04, duration: 0.3 }}
        className="group rounded-xl border overflow-hidden transition-all duration-300 hover:shadow-[0_0_30px_rgba(99,102,241,0.15)] hover:border-transparent"
        style={{ backgroundColor: `hsl(${theme.colors.card})`, borderColor: `hsl(${theme.colors.border})` }}
      >
        <Link to={productLink}>
          <div className={`${imgRatio} relative overflow-hidden`} style={{ backgroundColor: `hsl(${theme.colors.muted})` }}>
            {img ? (
              <img src={img} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy" />
            ) : (
              <div className="h-full flex items-center justify-center"><ShoppingBag size={24} style={{ color: `hsl(${theme.colors.mutedForeground})` }} /></div>
            )}
            {discount && (
              <span className="absolute top-2.5 left-2.5 text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: `hsl(${theme.colors.primary})`, color: `hsl(${theme.colors.primaryForeground})` }}>
                -{discount}%
              </span>
            )}
            {/* Quick Actions */}
            <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
              <button onClick={handleWishlist} className="h-8 w-8 rounded-full flex items-center justify-center backdrop-blur-md border" style={{ backgroundColor: `hsl(${theme.colors.card} / 0.9)`, borderColor: `hsl(${theme.colors.border})` }}>
                <Heart size={13} fill={inWishlist ? `hsl(347, 77%, 50%)` : "none"} style={{ color: inWishlist ? `hsl(347, 77%, 50%)` : `hsl(${theme.colors.cardForeground})` }} />
              </button>
              <button onClick={handleAddToCart} className="h-8 w-8 rounded-full flex items-center justify-center" style={{ backgroundColor: `hsl(${theme.colors.primary})`, color: `hsl(${theme.colors.primaryForeground})` }}>
                {addedToCart ? <Check size={13} /> : <ShoppingCart size={13} />}
              </button>
            </div>
          </div>
          <div className="p-3.5">
            {product.category && <p className="text-[9px] uppercase tracking-widest mb-1 font-semibold" style={{ color: `hsl(${theme.colors.primary})` }}>{product.category}</p>}
            <h3 className="text-xs font-medium line-clamp-2 leading-relaxed" style={{ color: `hsl(${theme.colors.cardForeground})` }}>{product.name}</h3>
            <div className="flex items-baseline gap-2 mt-2">
              <p className="text-sm font-bold" style={{ color: `hsl(${theme.colors.primary})` }}>{formatPrice(product.price)}</p>
              {product.compare_at_price && product.compare_at_price > product.price && (
                <span className="text-[10px] line-through" style={{ color: `hsl(${theme.colors.mutedForeground})` }}>{formatPrice(product.compare_at_price)}</span>
              )}
            </div>
          </div>
        </Link>
      </motion.div>
    );
  }

  // ── FASHION ──
  if (templateId === "fashion") {
    return (
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ delay: index * 0.05, duration: 0.5 }}
        className="group"
      >
        <Link to={productLink}>
          <div className="aspect-[3/4] relative overflow-hidden" style={{ backgroundColor: `hsl(${theme.colors.muted})` }}>
            {img ? (
              <>
                <img src={img} alt={product.name} className="w-full h-full object-cover group-hover:scale-[1.06] transition-transform duration-[900ms]" loading="lazy" />
                {img2 && <img src={img2} alt="" className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-700" loading="lazy" />}
              </>
            ) : (
              <div className="h-full flex items-center justify-center"><ShoppingBag size={28} style={{ color: `hsl(${theme.colors.mutedForeground})` }} /></div>
            )}
            {discount && (
              <span className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wider px-2 py-1" style={{ backgroundColor: `hsl(${theme.colors.foreground})`, color: `hsl(${theme.colors.background})` }}>
                Sale
              </span>
            )}
            {/* Bottom Actions */}
            <div className="absolute inset-x-0 bottom-0 p-3 flex gap-2 opacity-0 group-hover:opacity-100 translate-y-3 group-hover:translate-y-0 transition-all duration-300">
              <button onClick={handleAddToCart} className="flex-1 h-10 text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5 backdrop-blur-sm transition-all" style={{ backgroundColor: `hsl(${theme.colors.foreground} / 0.9)`, color: `hsl(${theme.colors.background})` }}>
                {addedToCart ? <><Check size={12} /> Ajouté</> : <><ShoppingCart size={12} /> Ajouter</>}
              </button>
              <button onClick={handleWishlist} className="h-10 w-10 flex items-center justify-center backdrop-blur-sm" style={{ backgroundColor: `hsl(${theme.colors.background} / 0.9)` }}>
                <Heart size={14} fill={inWishlist ? `hsl(347, 77%, 50%)` : "none"} style={{ color: inWishlist ? `hsl(347, 77%, 50%)` : `hsl(${theme.colors.foreground})` }} />
              </button>
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-[11px] uppercase tracking-wider font-medium" style={{ color: `hsl(${theme.colors.foreground})`, fontFamily: `"${theme.fonts.heading}", serif` }}>{product.name}</h3>
            <div className="flex gap-2 mt-1 items-baseline">
              <span className="text-sm font-medium" style={{ color: `hsl(${theme.colors.foreground})` }}>{formatPrice(product.price)}</span>
              {product.compare_at_price && product.compare_at_price > product.price && (
                <span className="text-xs line-through" style={{ color: `hsl(${theme.colors.mutedForeground})` }}>{formatPrice(product.compare_at_price)}</span>
              )}
            </div>
          </div>
        </Link>
      </motion.div>
    );
  }

  // ── MARKETPLACE (default) ──
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      transition={{ delay: index * 0.02 }}
      className="group rounded-lg border overflow-hidden hover:shadow-lg transition-all duration-300"
      style={{ backgroundColor: `hsl(${theme.colors.card})`, borderColor: `hsl(${theme.colors.border})` }}
    >
      <Link to={productLink}>
        <div className="aspect-square relative overflow-hidden" style={{ backgroundColor: `hsl(${theme.colors.muted})` }}>
          {img ? (
            <img src={img} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
          ) : (
            <div className="h-full flex items-center justify-center"><ShoppingBag size={24} style={{ color: `hsl(${theme.colors.mutedForeground})` }} /></div>
          )}
          {discount && (
            <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: `hsl(0 84% 60%)`, color: "white" }}>
              -{discount}%
            </span>
          )}
          {/* Quick Actions */}
          <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
            <button onClick={handleWishlist} className="h-7 w-7 rounded-full flex items-center justify-center shadow-md" style={{ backgroundColor: `hsl(${theme.colors.card})` }}>
              <Heart size={12} fill={inWishlist ? `hsl(347, 77%, 50%)` : "none"} style={{ color: inWishlist ? `hsl(347, 77%, 50%)` : `hsl(${theme.colors.mutedForeground})` }} />
            </button>
          </div>
        </div>
        <div className="p-3">
          <h3 className="text-xs line-clamp-2 leading-snug font-medium" style={{ color: `hsl(${theme.colors.cardForeground})` }}>{product.name}</h3>
          <div className="flex items-baseline gap-1.5 mt-1.5">
            <p className="text-sm font-bold" style={{ color: `hsl(${theme.colors.primary})` }}>{formatPrice(product.price)}</p>
            {product.compare_at_price && product.compare_at_price > product.price && (
              <span className="text-[10px] line-through" style={{ color: `hsl(${theme.colors.mutedForeground})` }}>{formatPrice(product.compare_at_price)}</span>
            )}
          </div>
          {product.stock_quantity <= 5 && product.stock_quantity > 0 && (
            <p className="text-[10px] text-orange-500 mt-1">Plus que {product.stock_quantity} en stock</p>
          )}
          <button onClick={handleAddToCart} className="w-full mt-2.5 h-8 rounded-md text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all hover:brightness-110" style={{ backgroundColor: `hsl(${theme.colors.primary})`, color: `hsl(${theme.colors.primaryForeground})` }}>
            {addedToCart ? <><Check size={12} /> Ajouté !</> : <><ShoppingCart size={12} /> Ajouter au panier</>}
          </button>
        </div>
      </Link>
    </motion.div>
  );
}
