import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MarketLayout } from "@/components/market/MarketLayout";
import { MarketHero } from "@/components/market/MarketHero";
import { MarketCategoryCard } from "@/components/market/MarketCategoryCard";
import { MarketProductCard } from "@/components/market/MarketProductCard";
import { useLocation } from "@/hooks/useLocation";
import { Loader2, ArrowRight, Star, MapPin, TrendingUp, Sparkles, Grid3X3 } from "lucide-react";
import { motion } from "framer-motion";

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

interface FeaturedStore {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  city: string | null;
  description: string | null;
  productCount: number;
}

export default function MarketHome() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const { country } = useLocation();
  const [products, setProducts] = useState<MarketProduct[]>([]);
  const [trendingProducts, setTrendingProducts] = useState<MarketProduct[]>([]);
  const [categories, setCategories] = useState<MarketCategory[]>([]);
  const [featuredStores, setFeaturedStores] = useState<FeaturedStore[]>([]);
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
    if (!query) fetchFeaturedStores();
    if (!query) fetchTrendingProducts();
    setProducts([]);
    setHasMore(true);
    fetchProducts(0);
  }, [query, country?.id]);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from("marketplace_categories")
      .select("id, name, slug, image_url")
      .order("sort_order");
    if (data) setCategories(data);
  };

  const fetchFeaturedStores = async () => {
    const { data } = await supabase
      .from("stores")
      .select("id, name, slug, logo_url, city, description")
      .eq("is_active", true)
      .eq("is_banned", false)
      .order("created_at", { ascending: false })
      .limit(6);

    if (data) {
      // Get product counts for each store
      const storesWithCounts = await Promise.all(
        data.map(async (store) => {
          const { count } = await supabase
            .from("products")
            .select("id", { count: "exact", head: true })
            .eq("store_id", store.id)
            .eq("is_published", true)
            .eq("is_marketplace_published", true)
            .gt("stock_quantity", 0);
          return { ...store, productCount: count || 0 };
        })
      );
      setFeaturedStores(storesWithCounts.filter((s) => s.productCount > 0));
    }
  };

  const fetchTrendingProducts = async () => {
    const { data } = await supabase
      .from("products")
      .select("id, name, slug, price, compare_at_price, images, stock_quantity, stores!inner(name, slug, city, currency)")
      .eq("is_published", true)
      .eq("is_marketplace_published", true)
      .gt("stock_quantity", 0)
      .eq("stores.is_active", true)
      .eq("stores.is_banned", false)
      .order("review_count", { ascending: false })
      .limit(4);
    if (data) setTrendingProducts(data as unknown as MarketProduct[]);
  };

  const fetchProducts = async (offset = 0) => {
    if (offset === 0) setLoading(true);
    else setLoadingMore(true);

    if (country) {
      let q = supabase
        .from("product_listings")
        .select("id, price, currency_code, stock_qty, product_id, products!inner(id, name, slug, images, compare_at_price, is_published, is_marketplace_published, stores!inner(name, slug, city, currency, is_active, is_banned))")
        .eq("country_id", country.id)
        .eq("is_available", true)
        .gt("stock_qty", 0)
        .eq("products.is_published", true)
        .eq("products.is_marketplace_published", true)
        .eq("products.stores.is_active", true)
        .eq("products.stores.is_banned", false)
        .order("created_at", { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1);

      if (query) q = q.ilike("products.name", `%${query}%`);

      const { data } = await q;
      const newProducts = ((data || []) as any[]).map((l: any) => ({
        id: l.products.id,
        name: l.products.name,
        slug: l.products.slug,
        price: l.price,
        compare_at_price: l.products.compare_at_price,
        images: l.products.images,
        stock_quantity: l.stock_qty,
        stores: {
          name: l.products.stores.name,
          slug: l.products.stores.slug,
          city: l.products.stores.city,
          currency: l.currency_code,
        },
      }));

      if (offset === 0) setProducts(newProducts);
      else setProducts((prev) => [...prev, ...newProducts]);
      setHasMore(newProducts.length === PAGE_SIZE);
    } else {
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

      if (query) q = q.ilike("name", `%${query}%`);

      const { data } = await q;
      const newProducts = (data || []) as unknown as MarketProduct[];

      if (offset === 0) setProducts(newProducts);
      else setProducts((prev) => [...prev, ...newProducts]);
      setHasMore(newProducts.length === PAGE_SIZE);
    }

    setLoading(false);
    setLoadingMore(false);
  };

  return (
    <MarketLayout>
      {/* Hero */}
      <MarketHero />

      {/* ─── Categories ─── */}
      {!query && categories.length > 0 && (
        <section style={{ background: "#0b0f14", paddingTop: "4rem", paddingBottom: "5rem" }}>
          <div className="container">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(71,210,30,0.1)" }}>
                  <Grid3X3 size={15} style={{ color: "hsl(var(--primary))" }} />
                </div>
                <h2 style={{ color: "#FFFFFF", fontSize: "1.25rem", fontWeight: 600, letterSpacing: "-0.01em" }}>
                  Catégories
                </h2>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 max-w-3xl mx-auto">
              {categories.map((cat, i) => (
                <MarketCategoryCard key={cat.id} {...cat} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── Trending Products ─── */}
      {!query && trendingProducts.length > 0 && (
        <section style={{ background: "#0d1117", paddingTop: "4rem", paddingBottom: "4rem" }}>
          <div className="container">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(239,68,68,0.1)" }}>
                  <TrendingUp size={15} style={{ color: "#EF4444" }} />
                </div>
                <h2 style={{ color: "#FFFFFF", fontSize: "1.25rem", fontWeight: 600, letterSpacing: "-0.01em" }}>
                  Tendances
                </h2>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              {trendingProducts.map((p, i) => (
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
          </div>
        </section>
      )}

      {/* ─── Featured Stores ─── */}
      {!query && featuredStores.length > 0 && (
        <section style={{ background: "#0b0f14", paddingTop: "4rem", paddingBottom: "5rem" }}>
          <div className="container">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(71,210,30,0.1)" }}>
                  <Sparkles size={15} style={{ color: "hsl(var(--primary))" }} />
                </div>
                <h2 style={{ color: "#FFFFFF", fontSize: "1.25rem", fontWeight: 600, letterSpacing: "-0.01em" }}>
                  Boutiques à découvrir
                </h2>
              </div>
              <Link
                to="/market#all-products"
                className="text-xs font-medium flex items-center gap-1 transition-opacity hover:opacity-80"
                style={{ color: "hsl(var(--primary))" }}
              >
                Voir tout <ArrowRight size={12} />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {featuredStores.map((store, i) => (
                <motion.div
                  key={store.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.4 }}
                >
                  <Link
                    to={`/market/vendor/${store.slug}`}
                    className="flex items-center gap-4 p-4 rounded-xl transition-all duration-200 hover:bg-white/[0.03] group"
                    style={{
                      border: "1px solid rgba(255,255,255,0.06)",
                      background: "rgba(255,255,255,0.02)",
                    }}
                  >
                    <div
                      className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0 overflow-hidden"
                      style={{ background: "rgba(255,255,255,0.06)" }}
                    >
                      {store.logo_url ? (
                        <img src={store.logo_url} alt={store.name} className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-lg font-bold" style={{ color: "hsl(var(--primary))" }}>
                          {store.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3
                        className="text-sm font-semibold truncate group-hover:text-white transition-colors"
                        style={{ color: "rgba(255,255,255,0.85)" }}
                      >
                        {store.name}
                      </h3>
                      <div className="flex items-center gap-3 mt-0.5">
                        {store.city && (
                          <span className="flex items-center gap-1 text-xs" style={{ color: "#6B7280" }}>
                            <MapPin size={10} /> {store.city}
                          </span>
                        )}
                        <span className="text-xs" style={{ color: "#6B7280" }}>
                          {store.productCount} produit{store.productCount !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                    <ArrowRight size={14} style={{ color: "rgba(255,255,255,0.2)" }} className="shrink-0 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── All Products ─── */}
      <section id="all-products" style={{ background: "#0b0f14", paddingTop: "4rem", paddingBottom: "6rem" }}>
        <div className="container">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(71,210,30,0.1)" }}>
                <Star size={15} style={{ color: "hsl(var(--primary))" }} />
              </div>
              <h2 style={{ color: "#FFFFFF", fontSize: "1.25rem", fontWeight: 600, letterSpacing: "-0.01em" }}>
                {query ? `Résultats pour « ${query} »` : "Tous les produits"}
              </h2>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-28">
              <Loader2 size={20} className="animate-spin" style={{ color: "#6B7280" }} />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-28">
              <p style={{ color: "#6B7280", fontSize: "0.9375rem" }}>Aucun produit trouvé.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
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
                <div className="flex justify-center mt-16">
                  <button
                    onClick={() => fetchProducts(products.length)}
                    disabled={loadingMore}
                    className="inline-flex items-center gap-2 px-8 py-3 text-sm transition-opacity duration-200 hover:opacity-80 disabled:opacity-50"
                    style={{
                      borderRadius: "0.5rem",
                      border: "1px solid rgba(255,255,255,0.08)",
                      background: "transparent",
                      color: "#FFFFFF",
                      fontWeight: 500,
                    }}
                  >
                    {loadingMore && <Loader2 size={15} className="animate-spin" />}
                    {loadingMore ? "Chargement…" : "Voir plus"}
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
