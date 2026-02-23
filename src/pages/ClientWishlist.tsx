import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useWishlist } from "@/hooks/useWishlist";
import { useCart } from "@/hooks/useCart";
import { motion } from "framer-motion";
import { Heart, Loader2, ShoppingBag, Trash2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface WishlistProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  compare_at_price: number | null;
  images: any;
  stock_quantity: number;
  avg_rating: number | null;
  review_count: number | null;
  stores: { name: string; slug: string; id: string };
}

export default function ClientWishlist() {
  const { user } = useAuth();
  const { wishlistIds, toggle } = useWishlist();
  const { addItem } = useCart();
  const [products, setProducts] = useState<WishlistProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || wishlistIds.size === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    supabase
      .from("products")
      .select("id, name, slug, price, compare_at_price, images, stock_quantity, avg_rating, review_count, stores!inner(id, name, slug)")
      .in("id", Array.from(wishlistIds))
      .eq("is_published", true)
      .then(({ data }) => {
        if (data) setProducts(data as unknown as WishlistProduct[]);
        setLoading(false);
      });
  }, [user, wishlistIds]);

  const getImage = (images: any) => {
    if (Array.isArray(images) && images.length > 0) return images[0];
    return "/placeholder.svg";
  };

  const formatPrice = (p: number) => `${p.toLocaleString("fr-FR")} FCFA`;

  return (
    <>
      <h1 className="font-heading text-2xl text-foreground mb-6">Mes favoris</h1>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 size={24} className="animate-spin text-primary" />
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 space-y-3">
          <Heart size={40} className="mx-auto text-muted-foreground/30" />
          <p className="text-muted-foreground">Aucun favori pour le moment.</p>
          <Link to="/market" className="text-primary text-sm hover:underline">
            Découvrir le Market →
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {products.map((product, i) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="group rounded-xl border border-border bg-card overflow-hidden hover:shadow-card transition-shadow"
            >
              <Link to={`/market/product/${product.slug}`} className="block">
                <div className="aspect-[4/3] bg-secondary overflow-hidden">
                  <img
                    src={getImage(product.images)}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              </Link>
              <div className="p-4 space-y-2">
                <p className="text-xs text-muted-foreground">{product.stores.name}</p>
                <Link to={`/market/product/${product.slug}`}>
                  <h3 className="text-sm font-semibold text-foreground line-clamp-1 hover:text-primary transition-colors">
                    {product.name}
                  </h3>
                </Link>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-foreground">{formatPrice(product.price)}</span>
                  {product.compare_at_price && product.compare_at_price > product.price && (
                    <span className="text-xs text-muted-foreground line-through">
                      {formatPrice(product.compare_at_price)}
                    </span>
                  )}
                </div>
                {product.avg_rating && product.avg_rating > 0 && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Star size={12} className="fill-yellow-400 text-yellow-400" />
                    {product.avg_rating.toFixed(1)}
                    <span>({product.review_count})</span>
                  </div>
                )}
                <div className="flex items-center gap-2 pt-1">
                  <Button
                    variant="hero"
                    size="sm"
                    className="flex-1"
                    disabled={product.stock_quantity <= 0}
                    onClick={() =>
                      addItem({
                        productId: product.id,
                        name: product.name,
                        price: product.price,
                        currency: "XOF",
                        image: getImage(product.images),
                        storeId: product.stores.id,
                        storeName: product.stores.name,
                        storeSlug: product.stores.slug,
                        slug: product.slug,
                        maxStock: product.stock_quantity,
                      })
                    }
                  >
                    <ShoppingBag size={14} className="mr-1" />
                    {product.stock_quantity <= 0 ? "Rupture" : "Ajouter"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggle(product.id)}
                    className="text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </>
  );
}
