import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/hooks/useStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, TrendingUp, AlertTriangle, Package, Loader2, Calendar } from "lucide-react";

interface InventoryItem {
  product_id: string;
  product_name: string;
  product_image: string | null;
  stock_quantity: number;
  sales_7d: number;
  sales_30d: number;
  growth_rate: number;
  forecast_next_30d: number;
  days_until_stockout: number;
  recommended_stock_level: number;
  stock_status: string;
  high_demand: boolean;
}

export default function InventoryIntelligenceWidget() {
  const { store } = useStore();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!store?.id) return;
    setLoading(true);

    (async () => {
      // Get products for this store
      const { data: products } = await supabase
        .from("products")
        .select("id, name, images, stock_quantity")
        .eq("store_id", store.id)
        .eq("is_published", true);

      if (!products?.length) { setItems([]); setLoading(false); return; }

      const pids = products.map(p => p.id);
      const { data: metrics } = await supabase
        .from("inventory_metrics")
        .select("*")
        .in("product_id", pids)
        .order("days_until_stockout", { ascending: true });

      const productMap = new Map(products.map(p => [p.id, p]));
      const merged: InventoryItem[] = (metrics || []).map((m: any) => {
        const p = productMap.get(m.product_id);
        const imgs = p?.images as string[] | null;
        return {
          product_id: m.product_id,
          product_name: p?.name || "—",
          product_image: imgs?.[0] || null,
          stock_quantity: p?.stock_quantity || 0,
          sales_7d: m.sales_7d,
          sales_30d: m.sales_30d,
          growth_rate: m.growth_rate,
          forecast_next_30d: m.forecast_next_30d,
          days_until_stockout: m.days_until_stockout,
          recommended_stock_level: m.recommended_stock_level,
          stock_status: m.stock_status,
          high_demand: m.high_demand,
        };
      });

      // Show problematic items first, then high demand, limit to 8
      const sorted = merged
        .filter(i => i.stock_status !== "healthy" || i.high_demand)
        .slice(0, 8);

      setItems(sorted.length > 0 ? sorted : merged.slice(0, 5));
      setLoading(false);
    })();
  }, [store?.id]);

  const statusConfig: Record<string, { label: string; color: string }> = {
    out_of_stock: { label: "Rupture", color: "destructive" },
    critical: { label: "Critique", color: "destructive" },
    low: { label: "Faible", color: "secondary" },
    warning: { label: "Attention", color: "secondary" },
    healthy: { label: "OK", color: "outline" },
  };

  const totalAtRisk = items.filter(i => ["out_of_stock", "critical", "low"].includes(i.stock_status)).length;
  const totalHighDemand = items.filter(i => i.high_demand).length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 size={16} className="text-primary" />
            <CardTitle className="text-base">Intelligence Stock</CardTitle>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {totalAtRisk > 0 && (
              <span className="flex items-center gap-1 text-destructive font-medium">
                <AlertTriangle size={12} /> {totalAtRisk} à risque
              </span>
            )}
            {totalHighDemand > 0 && (
              <span className="flex items-center gap-1 text-primary font-medium">
                <TrendingUp size={12} /> {totalHighDemand} forte demande
              </span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="animate-spin text-muted-foreground" size={18} />
          </div>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            Aucune donnée d'inventaire disponible.
          </p>
        ) : (
          <div className="space-y-2">
            {/* Header */}
            <div className="grid grid-cols-12 gap-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1 pb-1 border-b border-border">
              <div className="col-span-4">Produit</div>
              <div className="col-span-1 text-center">Stock</div>
              <div className="col-span-2 text-center">Ventes 7j</div>
              <div className="col-span-2 text-center">Prévision 30j</div>
              <div className="col-span-1 text-center">Jours</div>
              <div className="col-span-2 text-center">Statut</div>
            </div>

            {items.map((item) => {
              const cfg = statusConfig[item.stock_status] || statusConfig.healthy;
              return (
                <div key={item.product_id} className="grid grid-cols-12 gap-2 items-center py-2 border-b border-border/50 last:border-0 text-sm">
                  <div className="col-span-4 flex items-center gap-2 min-w-0">
                    {item.product_image ? (
                      <img src={item.product_image} alt="" className="w-7 h-7 rounded object-cover bg-muted shrink-0" />
                    ) : (
                      <div className="w-7 h-7 rounded bg-muted flex items-center justify-center shrink-0">
                        <Package size={12} className="text-muted-foreground" />
                      </div>
                    )}
                    <span className="truncate text-foreground text-xs font-medium">{item.product_name}</span>
                  </div>
                  <div className="col-span-1 text-center font-semibold text-foreground text-xs">
                    {item.stock_quantity}
                  </div>
                  <div className="col-span-2 text-center text-xs text-muted-foreground">
                    {item.sales_7d}
                    {item.growth_rate > 0 && (
                      <span className="text-primary ml-1">+{Math.round(item.growth_rate)}%</span>
                    )}
                  </div>
                  <div className="col-span-2 text-center text-xs text-muted-foreground">
                    ~{Math.round(item.forecast_next_30d)}
                  </div>
                  <div className="col-span-1 text-center">
                    <span className={`text-xs font-semibold ${item.days_until_stockout < 7 ? "text-destructive" : item.days_until_stockout < 14 ? "text-amber-500" : "text-muted-foreground"}`}>
                      {item.days_until_stockout >= 999 ? "∞" : Math.round(item.days_until_stockout)}
                    </span>
                  </div>
                  <div className="col-span-2 flex justify-center gap-1">
                    <Badge variant={cfg.color as any} className="text-[10px] px-1.5 py-0">
                      {cfg.label}
                    </Badge>
                    {item.high_demand && (
                      <Badge variant="default" className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-primary/20">
                        🔥
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Reorder suggestion */}
            {items.some(i => i.stock_status !== "healthy") && (
              <div className="mt-3 p-3 rounded-lg bg-muted/50 border border-border">
                <p className="text-xs font-medium text-foreground flex items-center gap-1.5">
                  <Calendar size={12} className="text-primary" /> Suggestions de réapprovisionnement
                </p>
                <div className="mt-2 space-y-1">
                  {items
                    .filter(i => i.recommended_stock_level > i.stock_quantity && i.stock_status !== "healthy")
                    .slice(0, 3)
                    .map(i => (
                      <p key={i.product_id} className="text-[11px] text-muted-foreground">
                        <span className="font-medium text-foreground">{i.product_name}</span>
                        {" → Commander "}
                        <span className="font-semibold text-primary">{i.recommended_stock_level - i.stock_quantity}</span>
                        {" unités (stock idéal : "}{i.recommended_stock_level}{")"}
                      </p>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
