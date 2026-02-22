import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/hooks/useStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Loader2, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

interface LowStockProduct {
  id: string;
  name: string;
  stock_quantity: number;
  low_stock_threshold: number;
  image: string | null;
}

export default function LowStockWidget() {
  const { store } = useStore();
  const [products, setProducts] = useState<LowStockProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!store?.id) return;
    setLoading(true);

    supabase
      .from("products")
      .select("id, name, stock_quantity, low_stock_threshold, images")
      .eq("store_id", store.id)
      .eq("is_published", true)
      .order("stock_quantity", { ascending: true })
      .limit(50)
      .then(({ data }) => {
        const low = (data || [])
          .filter((p) => p.stock_quantity <= (p.low_stock_threshold ?? 5))
          .slice(0, 5)
          .map((p) => {
            const imgs = p.images as string[] | null;
            return {
              id: p.id,
              name: p.name,
              stock_quantity: p.stock_quantity,
              low_stock_threshold: p.low_stock_threshold ?? 5,
              image: imgs && imgs.length > 0 ? imgs[0] : null,
            };
          });
        setProducts(low);
        setLoading(false);
      });
  }, [store?.id]);

  return (
    <Card>
      <CardHeader className="pb-3 flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle size={16} className="text-destructive" />
          <CardTitle className="text-base">Stock faible</CardTitle>
        </div>
        <Link to="/dashboard/products" className="text-xs text-primary hover:underline flex items-center gap-1">
          Gérer <ArrowRight size={12} />
        </Link>
      </CardHeader>
      <CardContent className="pt-0">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="animate-spin text-muted-foreground" size={18} />
          </div>
        ) : products.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">Tous vos produits sont bien approvisionnés 👍</p>
        ) : (
          <div className="space-y-3">
            {products.map((product) => {
              const isOut = product.stock_quantity === 0;
              return (
                <div key={product.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                  {product.image ? (
                    <img src={product.image} alt="" className="w-8 h-8 rounded object-cover bg-muted" />
                  ) : (
                    <div className="w-8 h-8 rounded bg-muted flex items-center justify-center text-muted-foreground text-[10px]">—</div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{product.name}</p>
                    <p className="text-xs text-muted-foreground">Seuil : {product.low_stock_threshold}</p>
                  </div>
                  <span className={`text-sm font-semibold whitespace-nowrap ${isOut ? "text-destructive" : "text-amber-500"}`}>
                    {isOut ? "Rupture" : `${product.stock_quantity} restants`}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
