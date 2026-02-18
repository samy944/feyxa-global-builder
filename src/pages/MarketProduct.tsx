import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MarketLayout } from "@/components/market/MarketLayout";
import { motion } from "framer-motion";
import { Loader2, ChevronRight, Store, MapPin, Truck, RotateCcw, Shield, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";

interface ProductDetail {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  compare_at_price: number | null;
  images: any;
  stock_quantity: number;
  tags: string[] | null;
  store_id: string;
  stores: {
    name: string;
    slug: string;
    city: string | null;
    currency: string;
    delivery_delay: string | null;
    return_policy: string | null;
    logo_url: string | null;
  };
}

export default function MarketProduct() {
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const { addItem } = useCart();
  useEffect(() => {
    if (!slug) return;
    fetchProduct();
  }, [slug]);

  const fetchProduct = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("products")
      .select("id, name, slug, description, price, compare_at_price, images, stock_quantity, tags, store_id, stores!inner(name, slug, city, currency, delivery_delay, return_policy, logo_url)")
      .eq("slug", slug!)
      .eq("is_published", true)
      .eq("is_marketplace_published", true)
      .eq("stores.is_active", true)
      .eq("stores.is_banned", false)
      .single();

    if (data) {
      setProduct(data as unknown as ProductDetail);
      document.title = `${data.name} — Feyxa Market`;
    }
    setLoading(false);
  };

  const formatPrice = (p: number) => {
    if (!product) return "";
    if (product.stores.currency === "XOF") return `${p.toLocaleString("fr-FR")} FCFA`;
    return `€${p.toFixed(2)}`;
  };

  const images: string[] = Array.isArray(product?.images) ? product.images : [];

  if (loading) {
    return (
      <MarketLayout>
        <div className="flex items-center justify-center py-40">
          <Loader2 size={24} className="animate-spin text-primary" />
        </div>
      </MarketLayout>
    );
  }

  if (!product) {
    return (
      <MarketLayout>
        <div className="text-center py-40">
          <p className="text-muted-foreground">Produit introuvable.</p>
          <Link to="/market" className="text-primary text-sm mt-2 inline-block">← Retour au Market</Link>
        </div>
      </MarketLayout>
    );
  }

  return (
    <MarketLayout>
      <section className="py-12">
        <div className="container">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-8">
            <Link to="/market" className="hover:text-foreground transition-colors">Market</Link>
            <ChevronRight size={14} />
            <span className="text-foreground line-clamp-1">{product.name}</span>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Images */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
              <div className="aspect-square rounded-xl border border-border bg-secondary overflow-hidden">
                {images.length > 0 ? (
                  <img
                    src={images[selectedImage]}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                    <Store size={60} />
                  </div>
                )}
              </div>
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto">
                  {images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImage(i)}
                      className={`h-16 w-16 rounded-lg border overflow-hidden shrink-0 transition-all ${
                        i === selectedImage ? "border-primary ring-1 ring-primary" : "border-border"
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Details */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              <div>
                <h1 className="font-heading text-3xl sm:text-4xl text-foreground leading-tight">
                  {product.name.toUpperCase()}
                </h1>

                <Link
                  to={`/market/vendor/${product.stores.slug}`}
                  className="inline-flex items-center gap-1.5 mt-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Store size={13} />
                  {product.stores.name}
                  {product.stores.city && (
                    <>
                      <span className="text-border">·</span>
                      <MapPin size={11} />
                      {product.stores.city}
                    </>
                  )}
                </Link>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-foreground">{formatPrice(product.price)}</span>
                {product.compare_at_price && product.compare_at_price > product.price && (
                  <span className="text-lg text-muted-foreground line-through">
                    {formatPrice(product.compare_at_price)}
                  </span>
                )}
              </div>

              {/* Stock */}
              <div className="text-sm">
                {product.stock_quantity > 10 ? (
                  <span className="text-primary font-medium">En stock</span>
                ) : (
                  <span className="text-destructive font-medium">
                    Plus que {product.stock_quantity} en stock
                  </span>
                )}
              </div>

              {/* Description */}
              {product.description && (
                <div className="prose prose-sm text-muted-foreground max-w-none">
                  <p className="leading-relaxed">{product.description}</p>
                </div>
              )}

              {/* Tags */}
              {product.tags && product.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag) => (
                    <span key={tag} className="text-xs bg-secondary text-muted-foreground px-2.5 py-1 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* CTA - placeholder for checkout Phase 2 */}
              <div className="pt-4 space-y-3">
                <Button
                  variant="hero"
                  size="lg"
                  className="w-full font-heading text-lg tracking-wide"
                  disabled={product.stock_quantity <= 0}
                  onClick={() =>
                    addItem({
                      productId: product.id,
                      name: product.name,
                      price: product.price,
                      currency: product.stores.currency,
                      image: images[0] ?? null,
                      storeId: (product as any).store_id ?? "",
                      storeName: product.stores.name,
                      storeSlug: product.stores.slug,
                      slug: product.slug,
                      maxStock: product.stock_quantity,
                    })
                  }
                >
                  <ShoppingBag size={18} />
                  AJOUTER AU PANIER
                </Button>
              </div>

              {/* Vendor policies */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-border">
                <div className="flex items-start gap-2.5">
                  <Truck size={16} className="text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-foreground">Livraison</p>
                    <p className="text-xs text-muted-foreground">{product.stores.delivery_delay || "2-5 jours"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <RotateCcw size={16} className="text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-foreground">Retours</p>
                    <p className="text-xs text-muted-foreground">{product.stores.return_policy || "Retours sous 7j"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <Shield size={16} className="text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-foreground">Paiement</p>
                    <p className="text-xs text-muted-foreground">100% sécurisé</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </MarketLayout>
  );
}
