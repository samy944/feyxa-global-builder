import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/hooks/useStore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Package,
  ShoppingCart,
  DollarSign,
  Star,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Lightbulb,
  BarChart3,
  Target,
  Brain,
} from "lucide-react";
import { motion } from "framer-motion";

interface InsightsData {
  topProduct: { name: string; revenue: number; orders: number } | null;
  lowStockProducts: { name: string; stock: number; threshold: number }[];
  avgMargin: number;
  conversionRate: number;
  pendingOrders: number;
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  avgRating: number;
  currency: string;
}

interface AiReco {
  title: string;
  description: string;
  type: "price" | "stock" | "performance" | "general";
  priority: "high" | "medium" | "low";
}

const priorityColors: Record<string, string> = {
  high: "bg-destructive/10 text-destructive border-destructive/20",
  medium: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  low: "bg-primary/10 text-primary border-primary/20",
};

const typeIcons: Record<string, typeof TrendingUp> = {
  price: DollarSign,
  stock: Package,
  performance: TrendingUp,
  general: Lightbulb,
};

function fmt(n: number, currency: string) {
  return new Intl.NumberFormat("fr-FR").format(Math.round(n)) + " " + currency;
}

export default function DashboardInsights() {
  const { store, loading: storeLoading } = useStore();
  const [data, setData] = useState<InsightsData | null>(null);
  const [recos, setRecos] = useState<AiReco[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (!store) return;
    fetchInsights();
  }, [store]);

  async function fetchInsights() {
    if (!store) return;
    setLoading(true);

    const [ordersRes, productsRes] = await Promise.all([
      supabase
        .from("orders")
        .select("id, total, status, subtotal, shipping_cost, discount_amount, created_at")
        .eq("store_id", store.id),
      supabase
        .from("products")
        .select("id, name, price, cost_price, stock_quantity, low_stock_threshold, is_published, avg_rating, review_count")
        .eq("store_id", store.id),
    ]);

    const orders = ordersRes.data || [];
    const products = productsRes.data || [];

    // Top product by revenue (via order_items)
    const { data: orderItems } = await supabase
      .from("order_items")
      .select("product_id, product_name, quantity, total")
      .in("order_id", orders.map((o) => o.id));

    const productRevenue: Record<string, { name: string; revenue: number; orders: number }> = {};
    (orderItems || []).forEach((item) => {
      const pid = item.product_id || item.product_name;
      if (!productRevenue[pid]) productRevenue[pid] = { name: item.product_name, revenue: 0, orders: 0 };
      productRevenue[pid].revenue += Number(item.total);
      productRevenue[pid].orders += item.quantity;
    });

    const topProduct = Object.values(productRevenue).sort((a, b) => b.revenue - a.revenue)[0] || null;

    // Low stock
    const lowStockProducts = products
      .filter((p) => p.is_published && p.stock_quantity <= (p.low_stock_threshold || 5))
      .map((p) => ({ name: p.name, stock: p.stock_quantity, threshold: p.low_stock_threshold || 5 }))
      .slice(0, 5);

    // Average margin
    const withCost = products.filter((p) => p.cost_price && p.cost_price > 0);
    const avgMargin =
      withCost.length > 0
        ? withCost.reduce((s, p) => s + ((p.price - (p.cost_price || 0)) / p.price) * 100, 0) / withCost.length
        : 0;

    // Conversion rate (delivered / total)
    const delivered = orders.filter((o) => o.status === "delivered").length;
    const conversionRate = orders.length > 0 ? (delivered / orders.length) * 100 : 0;

    const pendingOrders = orders.filter((o) => ["new", "confirmed", "packed"].includes(o.status)).length;
    const totalRevenue = orders.reduce((s, o) => s + Number(o.total), 0);
    const avgRating =
      products.filter((p) => (p.review_count || 0) > 0).reduce((s, p) => s + (p.avg_rating || 0), 0) /
        (products.filter((p) => (p.review_count || 0) > 0).length || 1);

    const insights: InsightsData = {
      topProduct,
      lowStockProducts,
      avgMargin,
      conversionRate,
      pendingOrders,
      totalRevenue,
      totalOrders: orders.length,
      totalProducts: products.length,
      avgRating,
      currency: store.currency || "XOF",
    };

    setData(insights);
    setLoading(false);

    // Fetch AI recommendations
    fetchAiRecos(insights, products);
  }

  async function fetchAiRecos(insights: InsightsData, products: any[]) {
    setAiLoading(true);
    try {
      const { data: fnData, error } = await supabase.functions.invoke("insights-reco", {
        body: { insights, products: products.slice(0, 20) },
      });

      if (!error && fnData?.recommendations) {
        setRecos(fnData.recommendations);
      }
    } catch {
      // silently fail
    } finally {
      setAiLoading(false);
    }
  }

  if (storeLoading || loading) {
    return (
      <div className="p-6 lg:p-8 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (!data) return null;

  const kpis = [
    {
      label: "Revenu total",
      value: fmt(data.totalRevenue, data.currency),
      icon: DollarSign,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Commandes",
      value: data.totalOrders.toString(),
      sub: `${data.pendingOrders} en attente`,
      icon: ShoppingCart,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Marge moyenne",
      value: `${data.avgMargin.toFixed(1)}%`,
      icon: Target,
      color: data.avgMargin > 30 ? "text-emerald-500" : "text-amber-500",
      bg: data.avgMargin > 30 ? "bg-emerald-500/10" : "bg-amber-500/10",
    },
    {
      label: "Taux livraison",
      value: `${data.conversionRate.toFixed(1)}%`,
      icon: BarChart3,
      color: data.conversionRate > 50 ? "text-emerald-500" : "text-amber-500",
      bg: data.conversionRate > 50 ? "bg-emerald-500/10" : "bg-amber-500/10",
    },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
            <Zap size={20} className="text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Feyxa Insights</h1>
            <p className="text-sm text-muted-foreground">Intelligence analytique de votre boutique</p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <Card className="relative overflow-hidden border-border/50">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{kpi.label}</p>
                    <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
                    {kpi.sub && <p className="text-xs text-muted-foreground">{kpi.sub}</p>}
                  </div>
                  <div className={`h-10 w-10 rounded-lg ${kpi.bg} flex items-center justify-center`}>
                    <kpi.icon size={18} className={kpi.color} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Product */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="h-full border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Star size={16} className="text-amber-500" />
                Produit star
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.topProduct ? (
                <div className="space-y-3">
                  <p className="font-semibold text-foreground text-lg">{data.topProduct.name}</p>
                  <div className="flex items-center gap-4">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Revenu</p>
                      <p className="font-bold text-emerald-500">{fmt(data.topProduct.revenue, data.currency)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Vendus</p>
                      <p className="font-bold text-foreground">{data.topProduct.orders}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Aucune vente enregistrée</p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Low Stock */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="h-full border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle size={16} className="text-amber-500" />
                Stock faible
                {data.lowStockProducts.length > 0 && (
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {data.lowStockProducts.length}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.lowStockProducts.length > 0 ? (
                <div className="space-y-3">
                  {data.lowStockProducts.map((p, i) => (
                    <div key={i} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-foreground font-medium truncate max-w-[180px]">{p.name}</span>
                        <span className={`font-bold ${p.stock <= 2 ? "text-destructive" : "text-amber-500"}`}>
                          {p.stock} restants
                        </span>
                      </div>
                      <Progress value={(p.stock / p.threshold) * 100} className="h-1.5" />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Tous les stocks sont en ordre ✅</p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Performance Overview */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card className="h-full border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 size={16} className="text-primary" />
                Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Produits actifs</span>
                <span className="font-bold text-foreground">{data.totalProducts}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Note moyenne</span>
                <div className="flex items-center gap-1">
                  <Star size={14} className="text-amber-500 fill-amber-500" />
                  <span className="font-bold text-foreground">{data.avgRating > 0 ? data.avgRating.toFixed(1) : "—"}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Taux livraison</span>
                <div className="flex items-center gap-1">
                  {data.conversionRate > 50 ? (
                    <ArrowUpRight size={14} className="text-emerald-500" />
                  ) : (
                    <ArrowDownRight size={14} className="text-destructive" />
                  )}
                  <span className="font-bold text-foreground">{data.conversionRate.toFixed(1)}%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Commandes en attente</span>
                <Badge variant={data.pendingOrders > 5 ? "destructive" : "secondary"}>{data.pendingOrders}</Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* AI Recommendations */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
        <Card className="border-border/50 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <Brain size={18} className="text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">Recommandations IA</CardTitle>
                <CardDescription>Analyse intelligente basée sur vos données</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {aiLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 rounded-lg" />
                ))}
              </div>
            ) : recos.length > 0 ? (
              <div className="space-y-3">
                {recos.map((r, i) => {
                  const Icon = typeIcons[r.type] || Lightbulb;
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className={`flex items-start gap-3 p-4 rounded-lg border ${priorityColors[r.priority]}`}
                    >
                      <div className="mt-0.5">
                        <Icon size={18} />
                      </div>
                      <div className="space-y-1 min-w-0">
                        <p className="font-semibold text-sm">{r.title}</p>
                        <p className="text-xs opacity-80">{r.description}</p>
                      </div>
                      <Badge variant="outline" className="shrink-0 text-[10px] uppercase">
                        {r.priority}
                      </Badge>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Ajoutez des produits et recevez des commandes pour obtenir des recommandations personnalisées.
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
