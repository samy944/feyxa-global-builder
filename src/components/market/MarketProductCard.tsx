import { Link } from "react-router-dom";
import { Store, MapPin } from "lucide-react";

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
}: MarketProductCardProps) {
  const imageUrl =
    Array.isArray(images) && images.length > 0 ? images[0] : null;

  const formatPrice = (p: number) => {
    if (currency === "XOF") return `${p.toLocaleString("fr-FR")} FCFA`;
    return `€${p.toFixed(2)}`;
  };

  return (
    <Link
      to={`/market/product/${slug}`}
      className="group block overflow-hidden transition-opacity duration-200 hover:opacity-90"
      style={{ borderRadius: "0.75rem" }}
    >
      {/* Image */}
      <div
        className="aspect-square relative overflow-hidden"
        style={{ background: "#1A1A1F", borderRadius: "0.75rem" }}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ color: "#333" }}>
            <Store size={36} />
          </div>
        )}
        {compare_at_price && compare_at_price > price && (
          <div
            className="absolute top-2.5 right-2.5 text-[10px] px-2 py-0.5"
            style={{
              background: "rgba(239,68,68,0.9)",
              color: "#FFFFFF",
              borderRadius: "0.375rem",
              fontWeight: 600,
            }}
          >
            -{Math.round(((compare_at_price - price) / compare_at_price) * 100)}%
          </div>
        )}
      </div>

      {/* Info */}
      <div className="pt-3.5 pb-1 space-y-1.5">
        <h3
          className="text-sm leading-snug line-clamp-2"
          style={{ color: "#FFFFFF", fontWeight: 500 }}
        >
          {name}
        </h3>

        <div className="flex items-center gap-1.5 text-xs" style={{ color: "#6B7280" }}>
          <Store size={11} />
          <Link
            to={`/market/vendor/${store_slug}`}
            className="transition-colors duration-200 hover:opacity-70"
            onClick={(e) => e.stopPropagation()}
          >
            {store_name}
          </Link>
          {store_city && (
            <>
              <span style={{ color: "#333" }}>·</span>
              <MapPin size={10} />
              <span>{store_city}</span>
            </>
          )}
        </div>

        <div className="flex items-baseline gap-2 pt-0.5">
          <span style={{ color: "#FFFFFF", fontWeight: 600, fontSize: "0.9375rem" }}>
            {formatPrice(price)}
          </span>
          {compare_at_price && compare_at_price > price && (
            <span className="line-through" style={{ color: "#6B7280", fontSize: "0.75rem" }}>
              {formatPrice(compare_at_price)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
