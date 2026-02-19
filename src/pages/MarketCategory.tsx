import { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MarketLayout } from "@/components/market/MarketLayout";
import { MarketProductCard } from "@/components/market/MarketProductCard";
import { MarketSearch } from "@/components/market/MarketSearch";
import { MarketFilters, FilterValues, defaultFilters } from "@/components/market/MarketFilters";
import { motion } from "framer-motion";
import { Loader2, ChevronRight } from "lucide-react";

interface MarketProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  compare_at_price: number | null;
  images: any;
  stock_quantity: number;
  avg_rating: number | null;
  review_count: number | null;
  stores: { name: string; slug: string; city: string | null; currency: string };
}

export default function MarketCategory() {
  const { slug } = useParams<{ slug: string }>();
  const [category, setCategory] = useState<{ name: string; description: string | null } | null>(null);
  const [products, setProducts] = useState<MarketProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterValues>(defaultFilters);

  useEffect(() => {
    if (!slug) return;
    fetchCategory();
    fetchProducts();
  }, [slug]);

  const fetchCategory = async () => {
    const { data } = await supabase
      .from("marketplace_categories")
      .select("name, description")
      .eq("slug", slug!)
      .single();
    if (data) {
      setCategory(data);
      document.title = `${data.name} — Feyxa Market`;
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    const { data: cat } = await supabase
      .from("marketplace_categories")
      .select("id")
      .eq("slug", slug!)
      .single();

    if (!cat) { setLoading(false); return; }

    const { data } = await supabase
      .from("products")
      .select("id, name, slug, price, compare_at_price, images, stock_quantity, avg_rating, review_count, stores!inner(name, slug, city, currency)")
      .eq("is_published", true)
      .eq("is_marketplace_published", true)
      .eq("marketplace_category_id", cat.id)
      .gt("stock_quantity", 0)
      .eq("stores.is_active", true)
      .eq("stores.is_banned", false)
      .order("created_at", { ascending: false })
      .limit(48);

    if (data) setProducts(data as unknown as MarketProduct[]);
    setLoading(false);
  };

  // Client-side filtering & sorting
  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (filters.minPrice !== null) {
      result = result.filter((p) => p.price >= filters.minPrice!);
    }
    if (filters.maxPrice !== null) {
      result = result.filter((p) => p.price <= filters.maxPrice!);
    }
    if (filters.minRating !== null) {
      result = result.filter((p) => (p.avg_rating ?? 0) >= filters.minRating!);
    }

    switch (filters.sortBy) {
      case "price_asc":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price_desc":
        result.sort((a, b) => b.price - a.price);
        break;
      case "rating":
        result.sort((a, b) => (b.avg_rating ?? 0) - (a.avg_rating ?? 0));
        break;
      // "recent" keeps original order
    }

    return result;
  }, [products, filters]);

  const currency = products[0]?.stores?.currency || "XOF";

  return (
    <MarketLayout>
      <section className="py-12">
        <div className="container">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-8">
            <Link to="/market" className="hover:text-foreground transition-colors">Market</Link>
            <ChevronRight size={14} />
            <span className="text-foreground">{category?.name || "..."}</span>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="font-heading text-3xl sm:text-4xl text-foreground">
              {category?.name?.toUpperCase() || "..."}
            </h1>
            {category?.description && (
              <p className="text-muted-foreground mt-2">{category.description}</p>
            )}
          </motion.div>

          <MarketSearch className="max-w-lg mb-6" />

          <MarketFilters
            filters={filters}
            onChange={setFilters}
            resultCount={filteredProducts.length}
            currency={currency}
          />

          <div className="mt-8">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 size={24} className="animate-spin text-primary" />
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-muted-foreground">Aucun produit ne correspond à vos critères.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
                {filteredProducts.map((p, i) => (
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
            )}
          </div>
        </div>
      </section>
    </MarketLayout>
  );
}
