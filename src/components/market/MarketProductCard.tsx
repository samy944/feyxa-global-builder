import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Store, MapPin, Star } from "lucide-react";

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
}

export function MarketProductCard({
  name,
  slug,
  price,
  compare_at_price,
  images,
  store_name,
  store_slug,
  store_city,
  currency,
  avg_rating,
  review_count,
  index = 0,
}: MarketProductCardProps) {
  const imageUrl =
    Array.isArray(images) && images.length > 0
      ? images[0]
      : null;

  const formatPrice = (p: number) => {
    if (currency === "XOF") return `${p.toLocaleString("fr-FR")} FCFA`;
    return `€${p.toFixed(2)}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.4 }}
    >
      <Link
        to={`/market/product/${slug}`}
        className="group block rounded-xl border border-border bg-card overflow-hidden hover:border-primary/30 hover:shadow-glow transition-all duration-300"
      >
        {/* Image */}
        <div className="aspect-square bg-secondary relative overflow-hidden">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
              <Store size={40} />
            </div>
          )}
          {compare_at_price && compare_at_price > price && (
            <div className="absolute top-2 right-2 bg-destructive text-destructive-foreground text-[10px] font-semibold px-2 py-0.5 rounded-full">
              -{Math.round(((compare_at_price - price) / compare_at_price) * 100)}%
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-4 space-y-2">
          <h3 className="font-medium text-foreground text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">
            {name}
          </h3>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Store size={11} />
            <Link
              to={`/market/vendor/${store_slug}`}
              className="hover:text-foreground transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              {store_name}
            </Link>
            {store_city && (
              <>
                <span className="text-border">·</span>
                <MapPin size={10} />
                <span>{store_city}</span>
              </>
            )}
          </div>

          {avg_rating != null && avg_rating > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Star size={11} className="fill-primary text-primary" />
              <span>{avg_rating.toFixed(1)}</span>
              {review_count != null && review_count > 0 && (
                <span>({review_count})</span>
              )}
            </div>
          )}

          <div className="flex items-baseline gap-2">
            <span className="font-bold text-foreground">{formatPrice(price)}</span>
            {compare_at_price && compare_at_price > price && (
              <span className="text-xs text-muted-foreground line-through">
                {formatPrice(compare_at_price)}
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
