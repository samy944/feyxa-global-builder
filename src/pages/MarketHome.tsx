import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MarketLayout } from "@/components/market/MarketLayout";
import { MarketSearch } from "@/components/market/MarketSearch";
import { MarketCategoryCard } from "@/components/market/MarketCategoryCard";
import { MarketProductCard } from "@/components/market/MarketProductCard";
import { useLocation } from "@/hooks/useLocation";
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
  const { country } = useLocation();
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
  }, [query, country?.id]);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from("marketplace_categories")
      .select("id, name, slug, image_url")
      .order("sort_order");
    if (!data) return;
    setCategories(data);
  };

  const fetchProducts = async (offset = 0) => {
    if (offset === 0) setLoading(true);
    else setLoadingMore(true);

    // If country is selected, use product_listings for localized data
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

      if (query) {
        q = q.ilike("products.name", `%${query}%`);
      }

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
      // Fallback: no country selected, show all products
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
      <section
        className="relative flex flex-col items-center justify-center text-center"
        style={{
          background: "#0E0E11",
          paddingTop: "clamp(6rem, 14vh, 10rem)",
          paddingBottom: "clamp(5rem, 12vh, 8rem)",
        }}
      >
        <h1
          style={{
            color: "#FFFFFF",
            fontSize: "clamp(2.75rem, 6vw + 0.5rem, 4.5rem)",
            fontWeight: 600,
            letterSpacing: "-0.02em",
            lineHeight: 1.05,
          }}
        >
          Commerce nouvelle génération.
        </h1>
        <p
          className="mt-5 mx-auto"
          style={{
            color: "#9CA3AF",
            fontSize: "1.125rem",
            fontWeight: 400,
            lineHeight: 1.6,
            maxWidth: "420px",
          }}
        >
          Découvrez des produits d'exception.
        </p>

        <div
          className="mt-12 w-full px-4"
          style={{ maxWidth: "min(70%, 600px)", margin: "3rem auto 0" }}
        >
          <MarketSearch />
        </div>
      </section>

      {/* Categories */}
      {!query && (
        <section style={{ background: "#0E0E11", paddingTop: "4rem", paddingBottom: "5rem" }}>
          <div className="container">
            <h2
              className="text-center mb-14"
              style={{
                color: "#FFFFFF",
                fontSize: "1.375rem",
                fontWeight: 600,
                letterSpacing: "-0.01em",
              }}
            >
              Catégories
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 max-w-3xl mx-auto">
              {categories.map((cat, i) => (
                <MarketCategoryCard key={cat.id} {...cat} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Products */}
      <section style={{ background: "#0E0E11", paddingTop: "4rem", paddingBottom: "6rem" }}>
        <div className="container">
          <h2
            className="mb-12"
            style={{
              color: "#FFFFFF",
              fontSize: "1.375rem",
              fontWeight: 600,
              letterSpacing: "-0.01em",
            }}
          >
            {query ? `Résultats pour « ${query} »` : "Produits récents"}
          </h2>

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
