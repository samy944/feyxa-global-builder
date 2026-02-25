import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/hooks/useStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Loader2, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "@/lib/i18n";

interface TopProduct {
  product_id: string;
  product_name: string;
  total_qty: number;
  total_revenue: number;
  image: string | null;
}

export default function TopProductsWidget() {
  const { store } = useStore();
  const { t } = useTranslation();
  const [products, setProducts] = useState<TopProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!store?.id) return;
    setLoading(true);

    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();

    const fetch = async () => {
      // Get recent orders for this store
      const { data: orders } = await supabase
        .from("orders")
        .select("id")
        .eq("store_id", store.id)
        .gte("created_at", sevenDaysAgo)
        .in("status", ["new", "confirmed", "packed", "shipped", "delivered"]);

      if (!orders || orders.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }

      const orderIds = orders.map((o) => o.id);

      const { data: items } = await supabase
        .from("order_items")
        .select("product_id, product_name, quantity, total")
        .in("order_id", orderIds);

      if (!items || items.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }

      // Aggregate by product
      const map: Record<string, { name: string; qty: number; revenue: number }> = {};
      items.forEach((item) => {
        const pid = item.product_id || item.product_name;
        if (!map[pid]) map[pid] = { name: item.product_name, qty: 0, revenue: 0 };
        map[pid].qty += item.quantity;
        map[pid].revenue += Number(item.total);
      });

      const sorted = Object.entries(map)
        .map(([id, v]) => ({ product_id: id, product_name: v.name, total_qty: v.qty, total_revenue: v.revenue }))
        .sort((a, b) => b.total_qty - a.total_qty)
        .slice(0, 5);

      // Fetch images for products that have valid UUIDs
      const validIds = sorted
        .map((p) => p.product_id)
        .filter((id) => /^[0-9a-f-]{36}$/i.test(id));

      let imageMap: Record<string, string | null> = {};
      if (validIds.length > 0) {
        const { data: prods } = await supabase
          .from("products")
          .select("id, images")
          .in("id", validIds);

        (prods || []).forEach((p) => {
          const imgs = p.images as string[] | null;
          imageMap[p.id] = imgs && imgs.length > 0 ? imgs[0] : null;
        });
      }

      setProducts(sorted.map((p) => ({ ...p, image: imageMap[p.product_id] || null })));
      setLoading(false);
    };

    fetch();
  }, [store?.id]);

  return (
    <Card>
      <CardHeader className="pb-3 flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy size={16} className="text-primary" />
          <CardTitle className="text-base">{t.dashboard.topProductsDays}</CardTitle>
        </div>
        <Link to="/dashboard/products" className="text-xs text-primary hover:underline flex items-center gap-1">
          {t.dashboard.viewAll} <ArrowRight size={12} />
        </Link>
      </CardHeader>
      <CardContent className="pt-0">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="animate-spin text-muted-foreground" size={18} />
          </div>
        ) : products.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">{t.dashboard.noSalesThisWeek}</p>
        ) : (
          <div className="space-y-3">
            {products.map((product, i) => (
              <div key={product.product_id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                <span className="text-xs font-bold text-muted-foreground w-5 text-center">#{i + 1}</span>
                {product.image ? (
                  <img src={product.image} alt="" className="w-8 h-8 rounded object-cover bg-muted" />
                ) : (
                  <div className="w-8 h-8 rounded bg-muted flex items-center justify-center text-muted-foreground text-[10px]">—</div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{product.product_name}</p>
                  <p className="text-xs text-muted-foreground">{product.total_qty} {t.common.sold}</p>
                </div>
                <span className="text-sm font-semibold text-foreground whitespace-nowrap">
                  {product.total_revenue.toLocaleString("fr-FR")} {store?.currency || "XOF"}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
