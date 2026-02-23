import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MarketLayout } from "@/components/market/MarketLayout";
import { MarketSearch } from "@/components/market/MarketSearch";
import { MarketProductCard } from "@/components/market/MarketProductCard";
import { MarketCategoryCard } from "@/components/market/MarketCategoryCard";
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
      {/* Hero — Apple minimal */}
      <section
        className="relative flex flex-col items-center justify-center text-center"
        style={{
          background: "#111114",
          paddingTop: "clamp(5rem, 12vh, 9rem)",
          paddingBottom: "clamp(4rem, 10vh, 7rem)",
        }}
      >
        <h1
          className="font-heading text-foreground"
          style={{
            fontSize: "clamp(3rem, 6vw + 1rem, 4.5rem)",
            fontWeight: 600,
            letterSpacing: "-0.02em",
            lineHeight: 1.05,
          }}
        >
          Feyxa Market
        </h1>
        <p
          className="mt-4 max-w-md mx-auto"
          style={{ color: "#9CA3AF", fontSize: "1.05rem", fontWeight: 400, lineHeight: 1.6 }}
        >
          Découvrez l'essentiel.
        </p>

        <div className="mt-10 w-full" style={{ maxWidth: "min(70%, 640px)", margin: "2.5rem auto 0" }}>
          <MarketSearch />
        </div>
      </section>

      {/* Categories */}
      {!query && (
        <section className="py-20" style={{ background: "#111114" }}>
          <div className="container">
            <h2
              className="font-heading text-foreground mb-12 text-center"
              style={{ fontSize: "1.5rem", fontWeight: 600, letterSpacing: "-0.01em" }}
            >
              Catégories
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-6 max-w-3xl mx-auto">
              {categories.map((cat, i) => (
                <MarketCategoryCard key={cat.id} {...cat} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Products */}
      <section className="py-20" style={{ background: "#111114" }}>
        <div className="container">
          <div className="flex items-center justify-between mb-10">
            <h2
              className="font-heading text-foreground"
              style={{ fontSize: "1.5rem", fontWeight: 600, letterSpacing: "-0.01em" }}
            >
              {query ? `Résultats pour « ${query} »` : "Produits récents"}
            </h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 size={22} className="animate-spin" style={{ color: "#9CA3AF" }} />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-24">
              <p style={{ color: "#9CA3AF" }}>Aucun produit trouvé.</p>
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
                <div className="flex justify-center mt-14">
                  <button
                    onClick={() => fetchProducts(products.length)}
                    disabled={loadingMore}
                    className="inline-flex items-center gap-2 px-8 py-3 text-sm font-medium text-foreground transition-colors duration-200 disabled:opacity-50"
                    style={{
                      borderRadius: "0.5rem",
                      border: "1px solid rgba(255,255,255,0.1)",
                      background: "transparent",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                  >
                    {loadingMore && <Loader2 size={16} className="animate-spin" />}
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
