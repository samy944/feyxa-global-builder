import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MarketProductCard } from "@/components/market/MarketProductCard";
import { motion } from "framer-motion";

interface SimilarProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  compare_at_price: number | null;
  images: any;
  avg_rating: number | null;
  review_count: number | null;
  stores: { name: string; slug: string; city: string | null; currency: string };
}

interface SimilarProductsProps {
  productId: string;
  storeId: string;
  categoryId: string | null;
  tags: string[] | null;
}

export function SimilarProducts({ productId, storeId, categoryId, tags }: SimilarProductsProps) {
  const [products, setProducts] = useState<SimilarProduct[]>([]);

  useEffect(() => {
    fetchSimilar();
  }, [productId, storeId, categoryId]);

  const fetchSimilar = async () => {
    const results: SimilarProduct[] = [];
    const seenIds = new Set<string>([productId]);

    // 1. Same category products
    if (categoryId) {
      const { data } = await supabase
        .from("products")
        .select("id, name, slug, price, compare_at_price, images, avg_rating, review_count, stores!inner(name, slug, city, currency)")
        .eq("is_published", true)
        .eq("is_marketplace_published", true)
        .eq("marketplace_category_id", categoryId)
        .neq("id", productId)
        .gt("stock_quantity", 0)
        .eq("stores.is_active", true)
        .eq("stores.is_banned", false)
        .order("avg_rating", { ascending: false, nullsFirst: false })
        .limit(8);

      (data as unknown as SimilarProduct[] || []).forEach((p) => {
        if (!seenIds.has(p.id)) { seenIds.add(p.id); results.push(p); }
      });
    }

    // 2. Same store products (fill up to 8)
    if (results.length < 8) {
      const { data } = await supabase
        .from("products")
        .select("id, name, slug, price, compare_at_price, images, avg_rating, review_count, stores!inner(name, slug, city, currency)")
        .eq("is_published", true)
        .eq("is_marketplace_published", true)
        .eq("store_id", storeId)
        .neq("id", productId)
        .gt("stock_quantity", 0)
        .eq("stores.is_active", true)
        .eq("stores.is_banned", false)
        .order("created_at", { ascending: false })
        .limit(8 - results.length);

      (data as unknown as SimilarProduct[] || []).forEach((p) => {
        if (!seenIds.has(p.id)) { seenIds.add(p.id); results.push(p); }
      });
    }

    setProducts(results.slice(0, 8));
  };

  if (products.length === 0) return null;

  return (
    <section className="py-12 border-t border-border">
      <div className="container">
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-heading text-2xl text-foreground mb-8"
        >
          PRODUITS SIMILAIRES
        </motion.h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {products.map((p, i) => (
            <MarketProductCard
              key={p.id}
              id={p.id}
              name={p.name}
              slug={p.slug}
              price={p.price}
              compare_at_price={p.compare_at_price}
              images={p.images}
              store_name={p.stores.name}
              store_slug={p.stores.slug}
              store_city={p.stores.city}
              currency={p.stores.currency}
              avg_rating={p.avg_rating}
              review_count={p.review_count}
              index={i}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
