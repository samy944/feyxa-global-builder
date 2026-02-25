import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MarketLayout } from "@/components/market/MarketLayout";
import { MarketHero } from "@/components/market/MarketHero";
import { MarketCategoryCard } from "@/components/market/MarketCategoryCard";
import { MarketProductCard } from "@/components/market/MarketProductCard";
import { MarketSectionHeader } from "@/components/market/MarketSectionHeader";
import { MarketProductSkeleton, MarketStoreSkeleton } from "@/components/market/MarketStoreSkeleton";
import { useLocation } from "@/hooks/useLocation";
import { ArrowRight, Star, MapPin, TrendingUp, Grid3X3, Clock, Percent, Store as StoreIcon } from "lucide-react";
import { motion } from "framer-motion";

interface MarketProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  compare_at_price: number | null;
  images: any;
  stock_quantity: number;
  created_at?: string;
  avg_rating?: number | null;
  review_count?: number | null;
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
  const [newProducts, setNewProducts] = useState<MarketProduct[]>([]);
  const [dealProducts, setDealProducts] = useState<MarketProduct[]>([]);
  const [categories, setCategories] = useState<MarketCategory[]>([]);
  const [featuredStores, setFeaturedStores] = useState<FeaturedStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [sectionsLoading, setSectionsLoading] = useState(true);
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
    if (!query) {
      setSectionsLoading(true);
      Promise.all([fetchFeaturedStores(), fetchTrendingProducts(), fetchNewProducts(), fetchDealProducts()])
        .finally(() => setSectionsLoading(false));
    }
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
      const storesWithCounts = await Promise.all(
        data.map(async (store) => {
          const { count } = await supabase
            .from("products")
            .select("id", { count: "exact", head: true })
            .eq("store_id", store.id)
            .eq("is_published", true)
            .gt("stock_quantity", 0);
          return { ...store, productCount: count || 0 };
        })
      );
      setFeaturedStores(storesWithCounts);
    }
  };

  const fetchTrendingProducts = async () => {
    const { data } = await supabase
      .from("products")
      .select("id, name, slug, price, compare_at_price, images, stock_quantity, avg_rating, review_count, stores!inner(name, slug, city, currency)")
      .eq("is_published", true)
      .gt("stock_quantity", 0)
      .eq("stores.is_active", true)
      .eq("stores.is_banned", false)
      .order("review_count", { ascending: false })
      .limit(8);
    if (data) setTrendingProducts(data as unknown as MarketProduct[]);
  };

  const fetchNewProducts = async () => {
    const { data } = await supabase
      .from("products")
      .select("id, name, slug, price, compare_at_price, images, stock_quantity, created_at, stores!inner(name, slug, city, currency)")
      .eq("is_published", true)
      .gt("stock_quantity", 0)
      .eq("stores.is_active", true)
      .eq("stores.is_banned", false)
      .order("created_at", { ascending: false })
      .limit(8);
    if (data) setNewProducts(data as unknown as MarketProduct[]);
  };

  const fetchDealProducts = async () => {
    const { data } = await supabase
      .from("products")
      .select("id, name, slug, price, compare_at_price, images, stock_quantity, stores!inner(name, slug, city, currency)")
      .eq("is_published", true)
      .gt("stock_quantity", 0)
      .not("compare_at_price", "is", null)
      .eq("stores.is_active", true)
      .eq("stores.is_banned", false)
      .order("created_at", { ascending: false })
      .limit(8);
    if (data) {
      setDealProducts(
        (data as unknown as MarketProduct[]).filter(
          (p) => p.compare_at_price && p.compare_at_price > p.price
        )
      );
    }
  };

  const fetchProducts = async (offset = 0) => {
    if (offset === 0) setLoading(true);
    else setLoadingMore(true);

    // Fetch ranking scores to join client-side
    const { data: rankings } = await supabase
      .from("product_ranking_scores")
      .select("product_id, score, trending_badge");

    const rankMap = new Map((rankings || []).map(r => [r.product_id, r]));

    let q = supabase
      .from("products")
      .select("id, name, slug, price, compare_at_price, images, stock_quantity, avg_rating, review_count, stores!inner(name, slug, city, currency)")
      .eq("is_published", true)
      .gt("stock_quantity", 0)
      .eq("stores.is_active", true)
      .eq("stores.is_banned", false)
      .order("created_at", { ascending: false })
      .range(offset, offset + PAGE_SIZE * 3 - 1); // fetch more to sort client-side

    if (query) q = q.ilike("name", `%${query}%`);

    const { data } = await q;
    let np = (data || []) as unknown as MarketProduct[];

    // Sort by ranking score DESC (fallback to created_at already applied)
    if (!query) {
      np.sort((a, b) => {
        const sa = rankMap.get(a.id)?.score || 0;
        const sb = rankMap.get(b.id)?.score || 0;
        return sb - sa;
      });
    }

    // Apply trending badge
    np = np.map(p => ({
      ...p,
      _trending: rankMap.get(p.id)?.trending_badge || false,
    }));

    // Paginate after sort
    np = np.slice(0, offset === 0 ? PAGE_SIZE : PAGE_SIZE);

    if (offset === 0) setProducts(np);
    else setProducts((prev) => [...prev, ...np]);
    setHasMore(np.length === PAGE_SIZE);

    setLoading(false);
    setLoadingMore(false);
  };

  const renderProductCard = (p: MarketProduct & { _trending?: boolean }, i: number, badge?: "promo" | "new" | "top" | null) => (
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
      badge={p._trending ? "top" : badge}
    />
  );

  const sectionBg1 = "#0a0e13";
  const sectionBg2 = "#0c1017";

  return (
    <MarketLayout>
      <MarketHero />

      {!query ? (
        <>
          {/* ── Trending Products ── */}
          <section style={{ background: sectionBg1, padding: "3.5rem 0 4rem" }}>
            <div className="container">
              <MarketSectionHeader icon={TrendingUp} iconColor="#EF4444" iconBg="rgba(239,68,68,0.1)" title="Produits populaires" linkTo="/market#all-products" />
              {sectionsLoading ? (
                <MarketProductSkeleton count={4} />
              ) : trendingProducts.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                  {trendingProducts.map((p, i) => renderProductCard(p, i, "top"))}
                </div>
              ) : null}
            </div>
          </section>

          {/* ── Featured Stores ── */}
          {(sectionsLoading || featuredStores.length > 0) && (
            <section style={{ background: sectionBg2, padding: "3.5rem 0 4rem" }}>
              <div className="container">
                <MarketSectionHeader icon={StoreIcon} title="Boutiques en vedette" />
                {sectionsLoading ? (
                  <MarketStoreSkeleton />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {featuredStores.map((store, i) => (
                      <motion.div key={store.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05, duration: 0.4 }}>
                        <Link
                          to={`/market/vendor/${store.slug}`}
                          className="flex items-center gap-4 p-5 rounded-xl transition-all duration-300 hover:bg-white/[0.03] group"
                          style={{ border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}
                        >
                          <div className="h-14 w-14 rounded-xl flex items-center justify-center shrink-0 overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                            {store.logo_url ? (
                              <img src={store.logo_url} alt={store.name} className="h-full w-full object-cover" />
                            ) : (
                              <span className="text-xl font-bold" style={{ color: "hsl(var(--primary))" }}>
                                {store.name.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold truncate" style={{ color: "rgba(255,255,255,0.9)" }}>{store.name}</h3>
                            <div className="flex items-center gap-3 mt-1">
                              {store.city && (
                                <span className="flex items-center gap-1 text-[11px]" style={{ color: "#6B7280" }}>
                                  <MapPin size={10} /> {store.city}
                                </span>
                              )}
                              <span className="text-[11px]" style={{ color: "#6B7280" }}>
                                {store.productCount} produit{store.productCount !== 1 ? "s" : ""}
                              </span>
                            </div>
                          </div>
                          <ArrowRight size={14} style={{ color: "rgba(255,255,255,0.15)" }} className="shrink-0 group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ── Categories ── */}
          {categories.length > 0 && (
            <section style={{ background: sectionBg1, padding: "3.5rem 0 4rem" }}>
              <div className="container">
                <MarketSectionHeader icon={Grid3X3} title="Catégories principales" />
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {categories.map((cat, i) => (
                    <MarketCategoryCard key={cat.id} {...cat} index={i} />
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* ── New Arrivals ── */}
          {(sectionsLoading || newProducts.length > 0) && (
            <section style={{ background: sectionBg2, padding: "3.5rem 0 4rem" }}>
              <div className="container">
                <MarketSectionHeader icon={Clock} iconColor="#3B82F6" iconBg="rgba(59,130,246,0.1)" title="Nouveautés" linkTo="/market#all-products" />
                {sectionsLoading ? (
                  <MarketProductSkeleton count={4} />
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                    {newProducts.map((p, i) => renderProductCard(p, i, "new"))}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ── Best Deals ── */}
          {(sectionsLoading || dealProducts.length > 0) && (
            <section style={{ background: sectionBg1, padding: "3.5rem 0 4rem" }}>
              <div className="container">
                <MarketSectionHeader icon={Percent} iconColor="#F59E0B" iconBg="rgba(245,158,11,0.1)" title="Meilleures offres" linkTo="/market#all-products" />
                {sectionsLoading ? (
                  <MarketProductSkeleton count={4} />
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                    {dealProducts.map((p, i) => renderProductCard(p, i, "promo"))}
                  </div>
                )}
              </div>
            </section>
          )}
        </>
      ) : null}

      {/* ── All Products / Search Results ── */}
      <section id="all-products" style={{ background: sectionBg2, padding: "3.5rem 0 5rem" }}>
        <div className="container">
          <MarketSectionHeader icon={Star} title={query ? `Résultats pour « ${query} »` : "Tous les produits"} />
          {loading ? (
            <MarketProductSkeleton />
          ) : products.length === 0 ? (
            <div className="text-center py-24">
              <p style={{ color: "#6B7280", fontSize: "0.9375rem" }}>Aucun produit trouvé.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {products.map((p, i) => renderProductCard(p, i))}
              </div>
              {hasMore && (
                <div className="flex justify-center mt-14">
                  <button
                    onClick={() => fetchProducts(products.length)}
                    disabled={loadingMore}
                    className="inline-flex items-center gap-2 px-8 py-3 text-sm font-medium transition-all duration-200 hover:bg-white/[0.04] disabled:opacity-50 rounded-lg"
                    style={{ border: "1px solid rgba(255,255,255,0.08)", background: "transparent", color: "#FFFFFF" }}
                  >
                    {loadingMore ? (
                      <span className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : null}
                    Voir plus de produits
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
