import { Link } from "react-router-dom";
import { Store, MapPin, ShoppingCart, Sparkles, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { useCart } from "@/hooks/useCart";

interface MarketProductCardProps {
  id: string;
  name: string;
  slug: string;
  price: number;
  compare_at_price?: number | null;
  images?: any;
  store_name: string;
  store_slug: string;
  store_city?: string | null;
  currency: string;
  avg_rating?: number | null;
  review_count?: number | null;
  index?: number;
  badge?: "promo" | "new" | "top" | null;
}

export function MarketProductCard({
  id,
  name,
  slug,
  price,
  compare_at_price,
  images,
  store_name,
  store_slug,
  store_city,
  currency,
  index = 0,
  badge,
}: MarketProductCardProps) {
  const imageUrl = Array.isArray(images) && images.length > 0 ? images[0] : null;
  const { addItem } = useCart();

  const formatPrice = (p: number) => {
    if (currency === "XOF") return `${p.toLocaleString("fr-FR")} FCFA`;
    return `€${p.toFixed(2)}`;
  };

  const discount = compare_at_price && compare_at_price > price
    ? Math.round(((compare_at_price - price) / compare_at_price) * 100)
    : null;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      productId: id,
      name,
      price,
      image: imageUrl,
      storeSlug: store_slug,
      storeName: store_name,
      storeId: "",
      slug,
      currency,
      maxStock: 99,
    });
  };

  const badgeConfig = {
    promo: { label: "Promo", icon: Sparkles, bg: "rgba(239,68,68,0.9)" },
    new: { label: "Nouveau", icon: Sparkles, bg: "rgba(59,130,246,0.9)" },
    top: { label: "Top", icon: TrendingUp, bg: "rgba(234,179,8,0.9)" },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.3), duration: 0.4 }}
    >
      <Link
        to={`/market/product/${slug}`}
        className="group block rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg"
        style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        {/* Image */}
        <div className="aspect-square relative overflow-hidden" style={{ background: "#111318" }}>
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ color: "#333" }}>
              <Store size={36} />
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1">
            {discount && (
              <span className="text-[10px] px-2 py-0.5 font-semibold rounded-md" style={{ background: "rgba(239,68,68,0.9)", color: "#FFF" }}>
                -{discount}%
              </span>
            )}
            {badge && badgeConfig[badge] && (
              <span className="text-[10px] px-2 py-0.5 font-semibold rounded-md flex items-center gap-1" style={{ background: badgeConfig[badge].bg, color: "#FFF" }}>
                {badgeConfig[badge].label}
              </span>
            )}
          </div>

          {/* Quick add button */}
          <button
            onClick={handleAddToCart}
            className="absolute bottom-2.5 right-2.5 h-9 w-9 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0"
            style={{
              background: "hsl(var(--primary))",
              color: "#0E0E11",
            }}
            title="Ajouter au panier"
          >
            <ShoppingCart size={15} />
          </button>
        </div>

        {/* Info */}
        <div className="p-3.5 space-y-2">
          <h3 className="text-sm leading-snug line-clamp-2 font-medium" style={{ color: "#FFFFFF" }}>
            {name}
          </h3>

          <div className="flex items-center gap-1.5 text-[11px]" style={{ color: "#6B7280" }}>
            <Store size={10} />
            <span className="truncate">{store_name}</span>
            {store_city && (
              <>
                <span style={{ color: "#333" }}>·</span>
                <MapPin size={9} />
                <span>{store_city}</span>
              </>
            )}
          </div>

          <div className="flex items-baseline gap-2">
            <span className="font-bold text-[0.9375rem]" style={{ color: "#FFFFFF" }}>
              {formatPrice(price)}
            </span>
            {compare_at_price && compare_at_price > price && (
              <span className="line-through text-xs" style={{ color: "#6B7280" }}>
                {formatPrice(compare_at_price)}
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
