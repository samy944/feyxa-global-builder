import { useState, useEffect } from "react";
import { useSeoHead } from "@/hooks/useSeoHead";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { ShoppingBag, Search, MapPin, Phone, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { initStoreTracking, trackPageView } from "@/lib/tracking";

interface StoreData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  currency: string;
  theme: any;
}

interface ProductData {
  id: string;
  name: string;
  slug: string;
  price: number;
  compare_at_price: number | null;
  images: any;
  stock_quantity: number;
}

export default function StorefrontHome() {
  const { slug } = useParams<{ slug: string }>();
  const [store, setStore] = useState<StoreData | null>(null);
  const [products, setProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useSeoHead({
    title: store ? `${store.name} — Boutique Feyxa` : "Boutique Feyxa",
    description: store?.description?.slice(0, 155) || `Visitez la boutique ${store?.name || ""} sur Feyxa.`,
    image: store?.logo_url || undefined,
    url: typeof window !== "undefined" ? window.location.href : "",
  });

  useEffect(() => {
    if (!slug) return;
    loadStore();
  }, [slug]);

  const loadStore = async () => {
    const { data: storeData } = await supabase
      .from("stores")
      .select("*")
      .eq("slug", slug!)
      .eq("is_active", true)
      .single();

    if (storeData) {
      setStore(storeData as StoreData);
      // Init tracking pixels for this store
      initStoreTracking(storeData.id).then(() => trackPageView());
      const { data: prods } = await supabase
        .from("products")
        .select("*")
        .eq("store_id", storeData.id)
        .eq("is_published", true)
        .order("created_at", { ascending: false });
      setProducts((prods as ProductData[]) || []);
    }
    setLoading(false);
  };

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const formatPrice = (price: number) => {
    if (!store) return price.toString();
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: store.currency,
      maximumFractionDigits: 0,
    }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-center">
        <div>
          <ShoppingBag size={48} className="mx-auto text-muted-foreground mb-4" />
          <h1 className="text-xl font-bold text-foreground">Boutique introuvable</h1>
          <p className="text-muted-foreground mt-2">Cette boutique n'existe pas ou n'est plus active.</p>
          <Button variant="hero" className="mt-6" asChild>
            <Link to="/">Retour à Feyxa</Link>
          </Button>
        </div>
      </div>
    );
  }

  const primaryColor = store.theme?.primary || "#3b82f6";

  return (
    <div className="min-h-screen bg-background">
      {/* Store header */}
      <header className="border-b border-border bg-card">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center text-primary-foreground font-bold" style={{ backgroundColor: primaryColor }}>
              {store.name[0]}
            </div>
            <div>
              <h1 className="font-bold text-foreground">{store.name}</h1>
              {store.description && <p className="text-xs text-muted-foreground">{store.description}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <ShoppingCart size={18} />
            </Button>
          </div>
        </div>
      </header>

      <div className="container py-8">
        {/* Search */}
        <div className="relative max-w-md mx-auto mb-8">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un produit..."
            className="w-full h-10 rounded-lg border border-border bg-card pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Products grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <Package size={40} className="mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Aucun produit trouvé</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="group rounded-xl border border-border bg-card overflow-hidden hover:shadow-card transition-shadow"
              >
                <div className="aspect-square bg-secondary flex items-center justify-center">
                  {product.images && Array.isArray(product.images) && (product.images as string[]).length > 0 ? (
                    <img src={(product.images as string[])[0]} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <ShoppingBag size={24} className="text-muted-foreground" />
                  )}
                </div>
                <div className="p-3">
                  <h3 className="text-sm font-medium text-foreground line-clamp-2">{product.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm font-bold text-foreground">{formatPrice(product.price)}</span>
                    {product.compare_at_price && product.compare_at_price > product.price && (
                      <span className="text-xs text-muted-foreground line-through">{formatPrice(product.compare_at_price)}</span>
                    )}
                  </div>
                  {product.stock_quantity <= 0 && (
                    <span className="text-xs text-destructive mt-1 inline-block">Rupture de stock</span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-6 mt-12">
        <div className="container text-center">
          <p className="text-xs text-muted-foreground">
            Boutique propulsée par{" "}
            <Link to="/" className="text-primary hover:underline">Feyxa</Link>
          </p>
        </div>
      </footer>
    </div>
  );
}

function Package({ size, className }: { size: number; className: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m7.5 4.27 9 5.15" /><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" />
    </svg>
  );
}
