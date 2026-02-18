import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MarketLayout } from "@/components/market/MarketLayout";
import { MarketProductCard } from "@/components/market/MarketProductCard";
import { MarketSearch } from "@/components/market/MarketSearch";
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
  stores: { name: string; slug: string; city: string | null; currency: string };
}

export default function MarketCategory() {
  const { slug } = useParams<{ slug: string }>();
  const [category, setCategory] = useState<{ name: string; description: string | null } | null>(null);
  const [products, setProducts] = useState<MarketProduct[]>([]);
  const [loading, setLoading] = useState(true);

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
      .select("id, name, slug, price, compare_at_price, images, stock_quantity, stores!inner(name, slug, city, currency)")
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

          <MarketSearch className="max-w-lg mb-10" />

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={24} className="animate-spin text-primary" />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground">Aucun produit dans cette catégorie.</p>
            </div>
          ) : (
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
          )}
        </div>
      </section>
    </MarketLayout>
  );
}
