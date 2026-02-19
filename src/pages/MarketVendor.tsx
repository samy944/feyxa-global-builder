import { useEffect, useState } from "react";
import { useSeoHead } from "@/hooks/useSeoHead";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MarketLayout } from "@/components/market/MarketLayout";
import { MarketProductCard } from "@/components/market/MarketProductCard";
import { motion } from "framer-motion";
import { Loader2, ChevronRight, MapPin, Truck, RotateCcw, Calendar, Star, Award } from "lucide-react";

interface VendorStore {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  city: string | null;
  currency: string;
  delivery_delay: string | null;
  return_policy: string | null;
  logo_url: string | null;
  created_at: string;
}

interface MarketProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  compare_at_price: number | null;
  images: any;
  stock_quantity: number;
}

interface VendorStats {
  avgRating: number;
  totalReviews: number;
}

export default function MarketVendor() {
  const { slug } = useParams<{ slug: string }>();
  const [store, setStore] = useState<VendorStore | null>(null);
  const [products, setProducts] = useState<MarketProduct[]>([]);
  const [stats, setStats] = useState<VendorStats>({ avgRating: 0, totalReviews: 0 });
  const [loading, setLoading] = useState(true);

  useSeoHead({
    title: store ? `${store.name} — Vendeur Feyxa Market` : "Feyxa Market",
    description: store?.description?.slice(0, 155) || `Découvrez la boutique ${store?.name || ""} sur Feyxa Market.`,
    image: store?.logo_url || undefined,
    url: typeof window !== "undefined" ? window.location.href : "",
  });

  useEffect(() => {
    if (!slug) return;
    fetchVendor();
  }, [slug]);

  const fetchVendor = async () => {
    setLoading(true);
    const { data: storeData } = await supabase
      .from("stores")
      .select("id, name, slug, description, city, currency, delivery_delay, return_policy, logo_url, created_at")
      .eq("slug", slug!)
      .eq("is_active", true)
      .eq("is_banned", false)
      .single();

    if (storeData) {
      setStore(storeData as VendorStore);

      const { data: productsData } = await supabase
        .from("products")
        .select("id, name, slug, price, compare_at_price, images, stock_quantity")
        .eq("store_id", storeData.id)
        .eq("is_published", true)
        .eq("is_marketplace_published", true)
        .gt("stock_quantity", 0)
        .order("created_at", { ascending: false })
        .limit(48);

      if (productsData) setProducts(productsData);

      // Fetch store review stats
      const { data: reviewData } = await supabase
        .from("reviews")
        .select("rating")
        .eq("store_id", storeData.id)
        .eq("is_approved", true);

      if (reviewData && reviewData.length > 0) {
        const avg = reviewData.reduce((sum, r) => sum + r.rating, 0) / reviewData.length;
        setStats({ avgRating: Math.round(avg * 100) / 100, totalReviews: reviewData.length });
      }
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <MarketLayout>
        <div className="flex items-center justify-center py-40">
          <Loader2 size={24} className="animate-spin text-primary" />
        </div>
      </MarketLayout>
    );
  }

  if (!store) {
    return (
      <MarketLayout>
        <div className="text-center py-40">
          <p className="text-muted-foreground">Vendeur introuvable.</p>
          <Link to="/market" className="text-primary text-sm mt-2 inline-block">← Retour au Market</Link>
        </div>
      </MarketLayout>
    );
  }

  const memberSince = new Date(store.created_at).toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });

  return (
    <MarketLayout>
      <section className="py-12">
        <div className="container">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-8">
            <Link to="/market" className="hover:text-foreground transition-colors">Market</Link>
            <ChevronRight size={14} />
            <span className="text-foreground">{store.name}</span>
          </div>

          {/* Vendor header */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-border bg-card p-8 mb-12"
          >
            <div className="flex flex-col sm:flex-row items-start gap-6">
              {/* Avatar */}
              <div className="h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                {store.logo_url ? (
                  <img src={store.logo_url} alt={store.name} className="h-16 w-16 rounded-xl object-cover" />
                ) : (
                  <span className="font-heading text-2xl text-primary">{store.name.charAt(0).toUpperCase()}</span>
                )}
              </div>

              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="font-heading text-3xl text-foreground">{store.name.toUpperCase()}</h1>
                  {stats.avgRating >= 4.5 && stats.totalReviews >= 50 && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary">
                      <Award size={12} /> Top vendeur
                    </span>
                  )}
                </div>

                {/* Rating */}
                {stats.totalReviews > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star
                          key={i}
                          size={14}
                          className={i < Math.round(stats.avgRating) ? "fill-primary text-primary" : "text-muted-foreground/30"}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {stats.avgRating.toFixed(1)} ({stats.totalReviews} avis)
                    </span>
                  </div>
                )}

                {store.description && (
                  <p className="text-sm text-muted-foreground max-w-lg">{store.description}</p>
                )}

                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                  {store.city && (
                    <span className="flex items-center gap-1">
                      <MapPin size={12} /> {store.city}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Truck size={12} /> {store.delivery_delay || "2-5 jours"}
                  </span>
                  <span className="flex items-center gap-1">
                    <RotateCcw size={12} /> {store.return_policy || "Retours sous 7j"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar size={12} /> Membre depuis {memberSince}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Products */}
          <h2 className="font-heading text-2xl text-foreground mb-8">
            PRODUITS ({products.length})
          </h2>

          {products.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground">Aucun produit disponible.</p>
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
                  store_name={store.name}
                  store_slug={store.slug}
                  store_city={store.city}
                  currency={store.currency}
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
