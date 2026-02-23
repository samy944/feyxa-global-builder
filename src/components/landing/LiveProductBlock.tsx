import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Star } from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-50px" },
  transition: { duration: 0.5 },
};

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  compare_at_price: number | null;
  images: any;
  avg_rating: number | null;
  review_count: number | null;
  stock_quantity: number;
  variants?: Variant[];
}

interface Variant {
  id: string;
  name: string;
  price: number;
  stock_quantity: number;
}

interface LiveProductBlockProps {
  storeId: string;
  productId?: string | null;
  collectionId?: string | null;
  title: string;
  theme: {
    primaryColor: string;
    bgColor: string;
    textColor: string;
    radius: string;
    fontHeading: string;
    fontBody: string;
  };
  onAddToCart?: (product: Product, variant?: Variant) => void;
  mode: "highlights" | "collection";
  columns?: number;
}

export function LiveProductBlock({
  storeId,
  productId,
  collectionId,
  title,
  theme: t,
  onAddToCart,
  mode,
  columns = 3,
}: LiveProductBlockProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!storeId) return;

    const fetchProducts = async () => {
      setLoading(true);

      if (productId) {
        // Single product mode
        const { data } = await supabase
          .from("products")
          .select("id, name, slug, price, compare_at_price, images, avg_rating, review_count, stock_quantity")
          .eq("id", productId)
          .eq("is_published", true)
          .single();

        if (data) {
          const { data: variants } = await supabase
            .from("product_variants")
            .select("id, name, price, stock_quantity")
            .eq("product_id", data.id);

          setProducts([{ ...data, variants: variants || [] }]);
        }
      } else if (collectionId) {
        // Collection mode
        const { data: cpData } = await supabase
          .from("collection_products")
          .select("product_id, sort_order")
          .eq("collection_id", collectionId)
          .order("sort_order");

        if (cpData && cpData.length > 0) {
          const productIds = cpData.map((cp) => cp.product_id);
          const { data } = await supabase
            .from("products")
            .select("id, name, slug, price, compare_at_price, images, avg_rating, review_count, stock_quantity")
            .in("id", productIds)
            .eq("is_published", true);

          if (data) {
            // Maintain sort order
            const sorted = productIds
              .map((pid) => data.find((p) => p.id === pid))
              .filter(Boolean) as Product[];
            setProducts(sorted);
          }
        }
      } else {
        // Fallback: latest published products from this store
        const { data } = await supabase
          .from("products")
          .select("id, name, slug, price, compare_at_price, images, avg_rating, review_count, stock_quantity")
          .eq("store_id", storeId)
          .eq("is_published", true)
          .order("created_at", { ascending: false })
          .limit(mode === "highlights" ? 4 : 12);

        setProducts(data || []);
      }

      setLoading(false);
    };

    fetchProducts();
  }, [storeId, productId, collectionId, mode]);

  const getImageUrl = (product: Product) => {
    const images = product.images;
    if (Array.isArray(images) && images.length > 0) {
      return typeof images[0] === "string" ? images[0] : (images[0] as any)?.url || "";
    }
    return "";
  };

  if (loading) {
    return (
      <section className="py-16 md:py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12" style={{ fontFamily: `"${t.fontHeading}", sans-serif`, color: t.textColor }}>
            {title}
          </h2>
          <div className={`grid gap-6 ${columns === 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-2 md:grid-cols-3"}`}>
            {Array.from({ length: columns }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-square rounded-xl bg-black/5 mb-4" style={{ borderRadius: t.radius }} />
                <div className="h-4 bg-black/5 rounded w-3/4 mb-2" />
                <div className="h-4 bg-black/5 rounded w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    return (
      <motion.section {...fadeUp} className="py-16 md:py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12" style={{ fontFamily: `"${t.fontHeading}", sans-serif`, color: t.textColor }}>
            {title}
          </h2>
          <p className="text-center opacity-50 text-sm" style={{ color: t.textColor }}>
            Aucun produit disponible
          </p>
        </div>
      </motion.section>
    );
  }

  // Single product detailed view
  if (productId && products.length === 1) {
    const product = products[0];
    const imageUrl = getImageUrl(product);
    const allImages = Array.isArray(product.images) ? product.images : [];

    return (
      <motion.section {...fadeUp} className="py-16 md:py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12" style={{ fontFamily: `"${t.fontHeading}", sans-serif`, color: t.textColor }}>
            {title}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Images */}
            <div>
              {imageUrl ? (
                <img src={imageUrl} alt={product.name} className="w-full aspect-square object-cover rounded-xl" style={{ borderRadius: t.radius }} loading="lazy" />
              ) : (
                <div className="w-full aspect-square rounded-xl bg-black/5" style={{ borderRadius: t.radius }} />
              )}
              {allImages.length > 1 && (
                <div className="flex gap-2 mt-3 overflow-x-auto">
                  {allImages.slice(0, 5).map((img: any, i: number) => {
                    const src = typeof img === "string" ? img : img?.url || "";
                    return (
                      <img key={i} src={src} alt="" className="w-16 h-16 object-cover rounded-lg shrink-0 border border-black/5" loading="lazy" />
                    );
                  })}
                </div>
              )}
            </div>

            {/* Info */}
            <div>
              <h3 className="text-2xl font-bold mb-3" style={{ color: t.textColor }}>{product.name}</h3>

              {(product.avg_rating ?? 0) > 0 && (
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`w-4 h-4 ${i < Math.round(product.avg_rating || 0) ? "fill-yellow-400 text-yellow-400" : "text-black/10"}`} />
                    ))}
                  </div>
                  <span className="text-xs opacity-50" style={{ color: t.textColor }}>({product.review_count || 0} avis)</span>
                </div>
              )}

              <div className="flex items-baseline gap-3 mb-6">
                <span className="text-3xl font-bold" style={{ color: t.primaryColor }}>
                  {product.price.toLocaleString()} FCFA
                </span>
                {product.compare_at_price && (
                  <span className="text-lg line-through opacity-40" style={{ color: t.textColor }}>
                    {product.compare_at_price.toLocaleString()} FCFA
                  </span>
                )}
              </div>

              {/* Variants */}
              {product.variants && product.variants.length > 0 && (
                <div className="mb-6">
                  <p className="text-xs font-semibold uppercase tracking-wider opacity-50 mb-2" style={{ color: t.textColor }}>Variantes</p>
                  <div className="flex flex-wrap gap-2">
                    {product.variants.map((v) => (
                      <button
                        key={v.id}
                        onClick={() => onAddToCart?.(product, v)}
                        disabled={v.stock_quantity <= 0}
                        className="px-4 py-2 text-sm border rounded-lg transition-all hover:border-current disabled:opacity-30 disabled:cursor-not-allowed"
                        style={{ borderColor: t.primaryColor + "40", color: t.textColor, borderRadius: t.radius }}
                      >
                        {v.name} — {v.price.toLocaleString()} FCFA
                        {v.stock_quantity <= 0 && <span className="ml-1 text-[10px]">(Épuisé)</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 mb-4 text-xs opacity-50" style={{ color: t.textColor }}>
                {product.stock_quantity > 0 ? (
                  <span>✓ En stock ({product.stock_quantity} disponibles)</span>
                ) : (
                  <span className="text-red-500">Épuisé</span>
                )}
              </div>

              <button
                onClick={() => onAddToCart?.(product)}
                disabled={product.stock_quantity <= 0}
                className="w-full py-4 text-lg font-semibold text-white transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ backgroundColor: t.primaryColor, borderRadius: t.radius }}
              >
                Acheter maintenant
              </button>
            </div>
          </div>
        </div>
      </motion.section>
    );
  }

  // Grid view (multiple products)
  const gridCols = columns === 2 ? "grid-cols-1 sm:grid-cols-2" : columns === 4 ? "grid-cols-2 md:grid-cols-4" : "grid-cols-2 md:grid-cols-3";

  return (
    <motion.section {...fadeUp} className="py-16 md:py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12" style={{ fontFamily: `"${t.fontHeading}", sans-serif`, color: t.textColor }}>
          {title}
        </h2>
        <div className={`grid gap-6 ${gridCols}`}>
          {products.map((product) => {
            const imageUrl = getImageUrl(product);
            return (
              <div key={product.id} className="group overflow-hidden bg-white border border-black/5" style={{ borderRadius: t.radius }}>
                <div className="aspect-square overflow-hidden relative">
                  {imageUrl ? (
                    <img src={imageUrl} alt={product.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" loading="lazy" />
                  ) : (
                    <div className="w-full h-full bg-black/5 flex items-center justify-center text-sm opacity-30">Pas d'image</div>
                  )}
                  {product.compare_at_price && product.compare_at_price > product.price && (
                    <span className="absolute top-3 left-3 px-2 py-1 text-[10px] font-bold text-white rounded" style={{ backgroundColor: t.primaryColor }}>
                      -{Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)}%
                    </span>
                  )}
                  {product.stock_quantity <= 0 && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">Épuisé</span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-sm mb-1 truncate" style={{ color: t.textColor }}>{product.name}</h3>
                  {(product.avg_rating ?? 0) > 0 && (
                    <div className="flex items-center gap-1 mb-2">
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`w-3 h-3 ${i < Math.round(product.avg_rating || 0) ? "fill-yellow-400 text-yellow-400" : "text-black/10"}`} />
                        ))}
                      </div>
                      <span className="text-[10px] opacity-40">({product.review_count})</span>
                    </div>
                  )}
                  <div className="flex items-baseline gap-2">
                    <span className="text-base font-bold" style={{ color: t.primaryColor }}>
                      {product.price.toLocaleString()} FCFA
                    </span>
                    {product.compare_at_price && (
                      <span className="text-xs line-through opacity-40" style={{ color: t.textColor }}>
                        {product.compare_at_price.toLocaleString()}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => onAddToCart?.(product)}
                    disabled={product.stock_quantity <= 0}
                    className="mt-3 w-full py-2.5 text-xs font-semibold text-white transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ backgroundColor: t.primaryColor, borderRadius: t.radius }}
                  >
                    Ajouter au panier
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.section>
  );
}
