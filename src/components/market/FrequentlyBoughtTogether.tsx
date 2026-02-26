import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/hooks/useCart";
import { motion } from "framer-motion";
import { ShoppingCart, Plus, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

interface BundleProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  compare_at_price: number | null;
  images: any;
  store_id: string;
  stores: { name: string; slug: string; currency: string };
}

interface Props {
  productId: string;
  storeId: string;
  categoryId: string | null;
  currentPrice: number;
  currentName: string;
  currentImage: string | null;
  currentSlug: string;
  currency: string;
}

const BUNDLE_DISCOUNT_PERCENT = 5;

export function FrequentlyBoughtTogether({
  productId, storeId, categoryId, currentPrice, currentName, currentImage, currentSlug, currency,
}: Props) {
  const [products, setProducts] = useState<BundleProduct[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [added, setAdded] = useState(false);
  const { addItem } = useCart();

  useEffect(() => {
    fetchCompanions();
  }, [productId, storeId, categoryId]);

  const fetchCompanions = async () => {
    const results: BundleProduct[] = [];
    const seenIds = new Set<string>([productId]);

    // Same category first
    if (categoryId) {
      const { data } = await supabase
        .from("products")
        .select("id, name, slug, price, compare_at_price, images, store_id, stores!inner(name, slug, currency)")
        .eq("is_published", true)
        .eq("is_marketplace_published", true)
        .eq("marketplace_category_id", categoryId)
        .neq("id", productId)
        .gt("stock_quantity", 0)
        .eq("stores.is_active", true)
        .eq("stores.is_banned", false)
        .order("avg_rating", { ascending: false, nullsFirst: false })
        .limit(3);
      (data as unknown as BundleProduct[] || []).forEach((p) => {
        if (!seenIds.has(p.id) && results.length < 3) {
          seenIds.add(p.id);
          results.push(p);
        }
      });
    }

    // Fill from same store
    if (results.length < 2) {
      const { data } = await supabase
        .from("products")
        .select("id, name, slug, price, compare_at_price, images, store_id, stores!inner(name, slug, currency)")
        .eq("is_published", true)
        .eq("is_marketplace_published", true)
        .eq("store_id", storeId)
        .neq("id", productId)
        .gt("stock_quantity", 0)
        .eq("stores.is_active", true)
        .eq("stores.is_banned", false)
        .limit(3 - results.length);
      (data as unknown as BundleProduct[] || []).forEach((p) => {
        if (!seenIds.has(p.id) && results.length < 3) {
          seenIds.add(p.id);
          results.push(p);
        }
      });
    }

    setProducts(results.slice(0, 3));
    setSelected(new Set(results.slice(0, 3).map((p) => p.id)));
  };

  const formatPrice = (p: number) => {
    if (currency === "XOF") return `${p.toLocaleString("fr-FR")} FCFA`;
    return `€${p.toFixed(2)}`;
  };

  const toggleProduct = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setAdded(false);
  };

  if (products.length === 0) return null;

  const selectedProducts = products.filter((p) => selected.has(p.id));
  const totalOriginal = currentPrice + selectedProducts.reduce((sum, p) => sum + p.price, 0);
  const totalDiscounted = Math.round(totalOriginal * (1 - BUNDLE_DISCOUNT_PERCENT / 100));
  const savings = totalOriginal - totalDiscounted;

  const handleAddBundle = () => {
    // Add current product
    addItem({
      productId,
      name: currentName,
      price: currentPrice,
      currency,
      image: currentImage,
      storeId,
      storeName: "",
      storeSlug: "",
      slug: currentSlug,
      maxStock: 99,
    }, 1);

    // Add selected companion products
    selectedProducts.forEach((p) => {
      const img = Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : null;
      addItem({
        productId: p.id,
        name: p.name,
        price: p.price,
        currency: p.stores.currency,
        image: img,
        storeId: p.store_id,
        storeName: p.stores.name,
        storeSlug: p.stores.slug,
        slug: p.slug,
        maxStock: 99,
      }, 1);
    });

    setAdded(true);
    setTimeout(() => setAdded(false), 3000);
  };

  const allItems = [
    { id: productId, name: currentName, price: currentPrice, image: currentImage, slug: currentSlug, isCurrent: true },
    ...products.map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      image: Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : null,
      slug: p.slug,
      isCurrent: false,
    })),
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="py-10 border-t border-border"
    >
      <div className="container max-w-7xl">
        <div className="flex items-center gap-2 mb-6">
          <Sparkles size={20} className="text-primary" />
          <h2 className="font-heading text-xl text-foreground">
            Fréquemment achetés ensemble
          </h2>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
          <div className="flex flex-col lg:flex-row gap-6 lg:items-center">
            {/* Product thumbnails with + signs */}
            <div className="flex items-center gap-3 flex-wrap flex-1">
              {allItems.map((item, i) => (
                <div key={item.id} className="flex items-center gap-3">
                  {i > 0 && (
                    <Plus size={18} className="text-muted-foreground shrink-0" />
                  )}
                  <button
                    onClick={() => !item.isCurrent && toggleProduct(item.id)}
                    className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl border-2 overflow-hidden transition-all shrink-0 ${
                      item.isCurrent || selected.has(item.id)
                        ? "border-primary ring-2 ring-primary/20"
                        : "border-border opacity-50 grayscale"
                    }`}
                  >
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-secondary flex items-center justify-center text-muted-foreground text-xs">
                        Produit
                      </div>
                    )}
                    {!item.isCurrent && (
                      <div className={`absolute top-1 right-1 h-5 w-5 rounded-full flex items-center justify-center text-[10px] ${
                        selected.has(item.id)
                          ? "bg-primary text-primary-foreground"
                          : "bg-background border border-border"
                      }`}>
                        {selected.has(item.id) && <Check size={10} />}
                      </div>
                    )}
                    {item.isCurrent && (
                      <div className="absolute bottom-0 inset-x-0 bg-primary/90 text-primary-foreground text-[9px] text-center py-0.5 font-medium">
                        Ce produit
                      </div>
                    )}
                  </button>
                </div>
              ))}
            </div>

            {/* Pricing & CTA */}
            <div className="lg:border-l lg:border-border lg:pl-6 space-y-3 shrink-0 lg:min-w-[220px]">
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  Prix du lot ({1 + selectedProducts.length} article{selectedProducts.length > 0 ? "s" : ""})
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-foreground">
                    {formatPrice(totalDiscounted)}
                  </span>
                  <span className="text-sm text-muted-foreground line-through">
                    {formatPrice(totalOriginal)}
                  </span>
                </div>
                {savings > 0 && (
                  <Badge variant="destructive" className="mt-1 text-xs">
                    Économisez {formatPrice(savings)} (-{BUNDLE_DISCOUNT_PERCENT}%)
                  </Badge>
                )}
              </div>

              <Button
                variant="hero"
                className="w-full font-heading h-12"
                onClick={handleAddBundle}
                disabled={selectedProducts.length === 0}
              >
                {added ? (
                  <motion.span
                    key="added"
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="flex items-center gap-2"
                  >
                    <Check size={16} /> Lot ajouté ✓
                  </motion.span>
                ) : (
                  <span className="flex items-center gap-2">
                    <ShoppingCart size={16} /> Ajouter le lot
                  </span>
                )}
              </Button>
            </div>
          </div>

          {/* Product names below */}
          <div className="mt-4 pt-4 border-t border-border/50 grid sm:grid-cols-3 gap-2">
            {allItems.slice(0, 3).map((item) => (
              <Link
                key={item.id}
                to={`/market/product/${item.slug}`}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors line-clamp-1"
              >
                {item.name} — <span className="font-medium text-foreground">{formatPrice(item.price)}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </motion.section>
  );
}
