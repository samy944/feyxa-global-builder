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
import { Loader2, ArrowRight, Star, MapPin, TrendingUp, Sparkles, Grid3X3, Clock, Percent, Store as StoreIcon } from "lucide-react";
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

  const getPublishedIds = async () => {
    const { data: listings } = await supabase
      .from("marketplace_listings")
      .select("product_id")
      .eq("status", "published");
    return (listings || []).map((l) => l.product_id);
  };

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
            .from("marketplace_listings")
            .select("id", { count: "exact", head: true })
            .eq("store_id", store.id)
            .eq("status", "published");
          return { ...store, productCount: count || 0 };
        })
      );
      setFeaturedStores(storesWithCounts.filter((s) => s.productCount > 0));
    }
  };

  const fetchTrendingProducts = async () => {
    const publishedIds = await getPublishedIds();
    if (publishedIds.length === 0) { setTrendingProducts([]); return; }

    const { data } = await supabase
      .from("products")
      .select("id, name, slug, price, compare_at_price, images, stock_quantity, stores!inner(name, slug, city, currency)")
      .in("id", publishedIds)
      .eq("is_published", true)
      .gt("stock_quantity", 0)
      .eq("stores.is_active", true)
      .eq("stores.is_banned", false)
      .order("review_count", { ascending: false })
      .limit(8);
    if (data) setTrendingProducts(data as unknown as MarketProduct[]);
  };

  const fetchNewProducts = async () => {
    const publishedIds = await getPublishedIds();
    if (publishedIds.length === 0) { setNewProducts([]); return; }

    const { data } = await supabase
      .from("products")
      .select("id, name, slug, price, compare_at_price, images, stock_quantity, created_at, stores!inner(name, slug, city, currency)")
      .in("id", publishedIds)
      .eq("is_published", true)
      .gt("stock_quantity", 0)
      .eq("stores.is_active", true)
      .eq("stores.is_banned", false)
      .order("created_at", { ascending: false })
      .limit(8);
    if (data) setNewProducts(data as unknown as MarketProduct[]);
  };

  const fetchDealProducts = async () => {
    const publishedIds = await getPublishedIds();
    if (publishedIds.length === 0) { setDealProducts([]); return; }

    const { data } = await supabase
      .from("products")
      .select("id, name, slug, price, compare_at_price, images, stock_quantity, stores!inner(name, slug, city, currency)")
      .in("id", publishedIds)
      .eq("is_published", true)
      .gt("stock_quantity", 0)
      .not("compare_at_price", "is", null)
      .eq("stores.is_active", true)
      .eq("stores.is_banned", false)
      .order("created_at", { ascending: false })
      .limit(8);
    // Filter only real deals
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

    if (country) {
      let q = supabase
        .from("product_listings")
        .select("id, price, currency_code, stock_qty, product_id, products!inner(id, name, slug, images, compare_at_price, is_published, stores!inner(name, slug, city, currency, is_active, is_banned))")
        .eq("country_id", country.id)
        .eq("is_available", true)
        .gt("stock_qty", 0)
        .eq("products.is_published", true)
        .eq("products.stores.is_active", true)
        .eq("products.stores.is_banned", false)
        .order("created_at", { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1);

      if (query) q = q.ilike("products.name", `%${query}%`);

      const { data } = await q;

      const publishedIds = new Set(await getPublishedIds());

      const newProducts = ((data || []) as any[])
        .filter((l: any) => publishedIds.has(l.products.id))
        .map((l: any) => ({
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
      const publishedIds = await getPublishedIds();
      if (publishedIds.length === 0) {
        if (offset === 0) setProducts([]);
        setHasMore(false);
        setLoading(false);
        setLoadingMore(false);
        return;
      }

      let q = supabase
        .from("products")
        .select("id, name, slug, price, compare_at_price, images, stock_quantity, stores!inner(name, slug, city, currency)")
        .in("id", publishedIds)
        .eq("is_published", true)
        .gt("stock_quantity", 0)
        .eq("stores.is_active", true)
        .eq("stores.is_banned", false)
        .order("created_at", { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1);

      if (query) q = q.ilike("name", `%${query}%`);

      const { data } = await q;
      const np = (data || []) as unknown as MarketProduct[];

      if (offset === 0) setProducts(np);
      else setProducts((prev) => [...prev, ...np]);
      setHasMore(np.length === PAGE_SIZE);
    }

    setLoading(false);
    setLoadingMore(false);
  };

  const renderProductCard = (p: MarketProduct, i: number, badge?: "promo" | "new" | "top" | null) => (
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
      badge={badge}
    />
  );

  const sectionBg1 = "#0a0e13";
  const sectionBg2 = "#0c1017";

  return (
    <MarketLayout>
      {/* ── Hero ── */}
      <MarketHero />

      {!query ? (
        <>
          {/* ── Trending Products ── */}
          <section style={{ background: sectionBg1, padding: "3.5rem 0 4rem" }}>
            <div className="container">
              <MarketSectionHeader
                icon={TrendingUp}
                iconColor="#EF4444"
                iconBg="rgba(239,68,68,0.1)"
                title="Produits populaires"
                linkTo="/market#all-products"
              />
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
                <MarketSectionHeader
                  icon={StoreIcon}
                  title="Boutiques en vedette"
                />
                {sectionsLoading ? (
                  <MarketStoreSkeleton />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {featuredStores.map((store, i) => (
                      <motion.div
                        key={store.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05, duration: 0.4 }}
                      >
                        <Link
                          to={`/market/vendor/${store.slug}`}
                          className="flex items-center gap-4 p-5 rounded-xl transition-all duration-300 hover:bg-white/[0.03] group"
                          style={{
                            border: "1px solid rgba(255,255,255,0.06)",
                            background: "rgba(255,255,255,0.02)",
                          }}
                        >
                          <div
                            className="h-14 w-14 rounded-xl flex items-center justify-center shrink-0 overflow-hidden"
                            style={{ background: "rgba(255,255,255,0.06)" }}
                          >
                            {store.logo_url ? (
                              <img src={store.logo_url} alt={store.name} className="h-full w-full object-cover" />
                            ) : (
                              <span className="text-xl font-bold" style={{ color: "hsl(var(--primary))" }}>
                                {store.name.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold truncate" style={{ color: "rgba(255,255,255,0.9)" }}>
                              {store.name}
                            </h3>
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
                <MarketSectionHeader
                  icon={Grid3X3}
                  title="Catégories principales"
                />
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
                <MarketSectionHeader
                  icon={Clock}
                  iconColor="#3B82F6"
                  iconBg="rgba(59,130,246,0.1)"
                  title="Nouveautés"
                  linkTo="/market#all-products"
                />
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
                <MarketSectionHeader
                  icon={Percent}
                  iconColor="#F59E0B"
                  iconBg="rgba(245,158,11,0.1)"
                  title="Meilleures offres"
                  linkTo="/market#all-products"
                />
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
          <MarketSectionHeader
            icon={Star}
            title={query ? `Résultats pour « ${query} »` : "Tous les produits"}
          />

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
                    style={{
                      border: "1px solid rgba(255,255,255,0.08)",
                      background: "transparent",
                      color: "#FFFFFF",
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
