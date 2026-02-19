import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MarketLayout } from "@/components/market/MarketLayout";
import { MarketSearch } from "@/components/market/MarketSearch";
import { MarketProductCard } from "@/components/market/MarketProductCard";
import { MarketCategoryCard } from "@/components/market/MarketCategoryCard";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

interface MarketProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  compare_at_price: number | null;
  images: any;
  stock_quantity: number;
  stores: {
    name: string;
    slug: string;
    city: string | null;
    currency: string;
  };
}

interface MarketCategory {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  productCount?: number;
}

export default function MarketHome() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const [products, setProducts] = useState<MarketProduct[]>([]);
  const [categories, setCategories] = useState<MarketCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 12;

  useEffect(() => {
    document.title = query
      ? `"${query}" — Feyxa Market`
      : "Feyxa Market — Marketplace e-commerce Afrique";
  }, [query]);

  useEffect(() => {
    fetchCategories();
    setProducts([]);
    setHasMore(true);
    fetchProducts(0);
  }, [query]);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from("marketplace_categories")
      .select("id, name, slug, image_url")
      .order("sort_order");
    if (!data) return;

    // Fetch product counts per category
    const { data: countData } = await supabase
      .from("products")
      .select("marketplace_category_id")
      .eq("is_published", true)
      .eq("is_marketplace_published", true)
      .gt("stock_quantity", 0);

    const counts: Record<string, number> = {};
    countData?.forEach((p) => {
      if (p.marketplace_category_id) {
        counts[p.marketplace_category_id] = (counts[p.marketplace_category_id] || 0) + 1;
      }
    });

    setCategories(data.map((cat) => ({ ...cat, productCount: counts[cat.id] || 0 })));
  };

  const fetchProducts = async (offset = 0) => {
    if (offset === 0) setLoading(true);
    else setLoadingMore(true);

    let q = supabase
      .from("products")
      .select("id, name, slug, price, compare_at_price, images, stock_quantity, stores!inner(name, slug, city, currency)")
      .eq("is_published", true)
      .eq("is_marketplace_published", true)
      .gt("stock_quantity", 0)
      .eq("stores.is_active", true)
      .eq("stores.is_banned", false)
      .order("created_at", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    if (query) {
      q = q.ilike("name", `%${query}%`);
    }

    const { data } = await q;
    const newProducts = (data || []) as unknown as MarketProduct[];

    if (offset === 0) {
      setProducts(newProducts);
    } else {
      setProducts((prev) => [...prev, ...newProducts]);
    }

    setHasMore(newProducts.length === PAGE_SIZE);
    setLoading(false);
    setLoadingMore(false);
  };

  return (
    <MarketLayout>
      {/* Hero */}
      <section className="bg-hero relative py-20">
        <div className="absolute inset-0 grid-pattern opacity-20" />
        <div className="container relative z-10 text-center space-y-6">
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-heading text-4xl sm:text-5xl lg:text-6xl text-foreground"
          >
            FEYXA MARKET
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground max-w-md mx-auto"
          >
            Découvrez des produits uniques de vendeurs à travers l'Afrique et le monde.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-xl mx-auto"
          >
            <MarketSearch />
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      {!query && (
        <section id="categories" className="py-16">
          <div className="container">
            <h2 className="font-heading text-2xl text-foreground mb-8">CATÉGORIES</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
              {categories.map((cat, i) => (
                <MarketCategoryCard key={cat.id} {...cat} productCount={cat.productCount} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Products */}
      <section className="pb-20">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-heading text-2xl text-foreground">
              {query ? `RÉSULTATS POUR "${query.toUpperCase()}"` : "PRODUITS RÉCENTS"}
            </h2>
            {!loading && (
              <span className="text-sm text-muted-foreground">{products.length} produits</span>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={24} className="animate-spin text-primary" />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground">Aucun produit trouvé.</p>
            </div>
          ) : (
            <>
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
                    index={i}
                  />
                ))}
              </div>
              {hasMore && (
                <div className="flex justify-center mt-10">
                  <button
                    onClick={() => fetchProducts(products.length)}
                    disabled={loadingMore}
                    className="inline-flex items-center gap-2 px-8 py-3 rounded-xl border border-border bg-card text-foreground font-semibold hover:border-primary/30 hover:shadow-glow transition-all duration-300 disabled:opacity-50"
                  >
                    {loadingMore ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : null}
                    {loadingMore ? "Chargement…" : "Voir plus de produits"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </MarketLayout>
  );
}
