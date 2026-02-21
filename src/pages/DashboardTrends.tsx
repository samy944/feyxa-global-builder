import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  Flame,
  Rocket,
  Star,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  Layers,
  Zap,
  ShoppingCart,
  BarChart3,
  Calendar,
  Download,
  FileText,
} from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useStore } from "@/hooks/useStore";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { exportTrendsCSV, exportTrendsPDF } from "@/lib/exportTrends";

// --- Types ---

interface TrendProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  image: string | null;
  avg_rating: number;
  review_count: number;
  store_id: string;
  category: string | null;
  sales_7d: number;
  revenue_7d: number;
  sales_period: number;
  revenue_period: number;
  growth_rate: number;
  trend_score: number;
}

interface CategoryTrend {
  name: string;
  sales_period: number;
  sales_prev: number;
  products: number;
  growth: number;
}

interface DailyPoint {
  date: string;
  sales: number;
  revenue: number;
  orders: number;
}

interface WeeklyPoint {
  week: string;
  sales: number;
  revenue: number;
  orders: number;
}

interface TrendsData {
  periodDays: number;
  top7d: TrendProduct[];
  topPeriod: TrendProduct[];
  emerging: TrendProduct[];
  trending: TrendProduct[];
  categoryTrends: CategoryTrend[];
  dailyTimeSeries: DailyPoint[];
  weeklyData: WeeklyPoint[];
}

const PERIOD_OPTIONS = [
  { value: 7, label: "7j" },
  { value: 14, label: "14j" },
  { value: 30, label: "30j" },
  { value: 90, label: "90j" },
] as const;

// --- Sub-components ---

function PeriodSelector({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
      <Calendar size={14} className="text-muted-foreground ml-2 mr-1" />
      {PERIOD_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            value === opt.value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function TrendBadge({ score, growth }: { score?: number; growth?: number }) {
  if (growth !== undefined && growth > 100)
    return (
      <Badge className="bg-destructive/10 text-destructive border-destructive/20 gap-1">
        <Rocket size={12} /> Explosif
      </Badge>
    );
  if (growth !== undefined && growth > 50)
    return (
      <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 gap-1">
        <Flame size={12} /> En feu
      </Badge>
    );
  if (score !== undefined && score > 0.5)
    return (
      <Badge className="bg-primary/10 text-primary border-primary/20 gap-1">
        <TrendingUp size={12} /> Tendance
      </Badge>
    );
  return null;
}

function ProductRow({
  product,
  rank,
  showGrowth,
  isOwn,
  periodLabel,
}: {
  product: TrendProduct;
  rank: number;
  showGrowth?: boolean;
  isOwn: boolean;
  periodLabel: string;
}) {
  const { toast } = useToast();

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: rank * 0.04 }}
      className="flex items-center gap-3 p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors"
    >
      <span className="text-xs font-bold text-muted-foreground w-6 text-center">#{rank}</span>

      <div className="h-10 w-10 rounded-lg bg-muted overflow-hidden shrink-0">
        {product.image ? (
          <img src={product.image as string} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <Package size={16} className="text-muted-foreground" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{product.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          {product.category && (
            <span className="text-[10px] text-muted-foreground">{product.category}</span>
          )}
          {product.avg_rating > 0 && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
              <Star size={10} className="text-amber-500 fill-amber-500" />
              {product.avg_rating.toFixed(1)}
            </span>
          )}
        </div>
      </div>

      <div className="text-right shrink-0 space-y-0.5">
        <p className="text-sm font-bold text-foreground">{product.sales_period} ventes</p>
        {showGrowth && (
          <div className="flex items-center justify-end gap-0.5">
            {product.growth_rate >= 0 ? (
              <ArrowUpRight size={12} className="text-emerald-500" />
            ) : (
              <ArrowDownRight size={12} className="text-destructive" />
            )}
            <span
              className={`text-xs font-medium ${
                product.growth_rate >= 0 ? "text-emerald-500" : "text-destructive"
              }`}
            >
              {product.growth_rate > 0 ? "+" : ""}
              {product.growth_rate}%
            </span>
          </div>
        )}
      </div>

      <TrendBadge score={product.trend_score} growth={showGrowth ? product.growth_rate : undefined} />

      {!isOwn && (
        <Button
          size="sm"
          variant="ghost"
          className="shrink-0 text-xs h-7 px-2"
          onClick={() =>
            toast({
              title: "Inspiration notée !",
              description: `Consultez "${product.name}" sur le marketplace pour vous inspirer.`,
            })
          }
        >
          <ShoppingCart size={14} />
        </Button>
      )}
    </motion.div>
  );
}

// --- Main Component ---

export default function DashboardTrends() {
  const { store, loading: storeLoading } = useStore();
  const [data, setData] = useState<TrendsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [periodDays, setPeriodDays] = useState(30);

  useEffect(() => {
    if (!store) return;
    fetchTrends();
  }, [store, periodDays]);

  async function fetchTrends() {
    setLoading(true);
    setError(null);
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke(
        `marketplace-trends?days=${periodDays}`
      );
      if (fnError) throw fnError;
      setData(fnData);
    } catch (e: any) {
      setError(e.message || "Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  }

  const periodLabel = PERIOD_OPTIONS.find((o) => o.value === periodDays)?.label || `${periodDays}j`;

  if (storeLoading || loading) {
    return (
      <div className="p-6 lg:p-8 space-y-6">
        <Skeleton className="h-8 w-52" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 lg:p-8">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-destructive">{error}</p>
            <Button variant="outline" className="mt-4" onClick={fetchTrends}>
              Réessayer
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  const summaryCards = [
    {
      label: "Produits tendance",
      value: data.trending.length,
      icon: Flame,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
    {
      label: "Produits émergents",
      value: data.emerging.length,
      icon: Rocket,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Catégories actives",
      value: data.categoryTrends.filter((c) => c.sales_period > 0).length,
      icon: Layers,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
            <TrendingUp size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Feyxa Trends</h1>
            <p className="text-sm text-muted-foreground">
              Tendances du marketplace — {periodLabel}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <PeriodSelector value={periodDays} onChange={setPeriodDays} />
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1.5 text-xs"
              onClick={() => data && exportTrendsCSV(data)}
            >
              <Download size={14} />
              CSV
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1.5 text-xs"
              onClick={() => data && exportTrendsPDF(data)}
            >
              <FileText size={14} />
              PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {summaryCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <Card className="border-border/50">
              <CardContent className="p-5 flex items-center gap-4">
                <div className={`h-10 w-10 rounded-lg ${card.bg} flex items-center justify-center`}>
                  <card.icon size={18} className={card.color} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{card.value}</p>
                  <p className="text-xs text-muted-foreground">{card.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp size={16} className="text-primary" />
                Ventes quotidiennes — {periodLabel}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.dailyTimeSeries && data.dailyTimeSeries.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={data.dailyTimeSeries}>
                    <defs>
                      <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="ordersGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(142 76% 36%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(142 76% 36%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                      tickFormatter={(v) => {
                        const d = new Date(v);
                        return `${d.getDate()}/${d.getMonth() + 1}`;
                      }}
                      interval="preserveStartEnd"
                    />
                    <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                      labelFormatter={(v) => new Date(v).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Area
                      type="monotone"
                      dataKey="sales"
                      name="Ventes (unités)"
                      stroke="hsl(var(--primary))"
                      fill="url(#salesGrad)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="orders"
                      name="Commandes"
                      stroke="hsl(142 76% 36%)"
                      fill="url(#ordersGrad)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-12">Aucune donnée disponible</p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 size={16} className="text-emerald-500" />
                Évolution hebdomadaire
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.weeklyData && data.weeklyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={data.weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="week" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                      formatter={(value: number, name: string) => [
                        name === "Revenu" ? `${new Intl.NumberFormat("fr-FR").format(value)} XOF` : value,
                        name,
                      ]}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="sales" name="Ventes" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="orders" name="Commandes" fill="hsl(142 76% 36%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-12">Aucune donnée disponible</p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="trending" className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="trending" className="gap-1.5">
            <Flame size={14} /> Tendances
          </TabsTrigger>
          <TabsTrigger value="top7d" className="gap-1.5">
            <Zap size={14} /> Top 7j
          </TabsTrigger>
          <TabsTrigger value="topPeriod" className="gap-1.5">
            <TrendingUp size={14} /> Top {periodLabel}
          </TabsTrigger>
          <TabsTrigger value="emerging" className="gap-1.5">
            <Rocket size={14} /> Émergents
          </TabsTrigger>
          <TabsTrigger value="categories" className="gap-1.5">
            <Layers size={14} /> Catégories
          </TabsTrigger>
        </TabsList>

        <TabsContent value="trending">
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Flame size={16} className="text-amber-500" />
                Produits en tendance — {periodLabel}
                <span className="text-xs font-normal text-muted-foreground ml-1">
                  score = ventes×0.5 + croissance×0.3 + conversion×0.2
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.trending.length > 0 ? (
                data.trending.map((p, i) => (
                  <ProductRow key={p.id} product={p} rank={i + 1} showGrowth isOwn={p.store_id === store?.id} periodLabel={periodLabel} />
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Pas encore assez de données pour afficher les tendances.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="top7d">
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Zap size={16} className="text-primary" /> Top produits — 7 derniers jours
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.top7d.length > 0 ? (
                data.top7d.map((p, i) => (
                  <ProductRow key={p.id} product={p} rank={i + 1} isOwn={p.store_id === store?.id} periodLabel="7j" />
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">Aucune vente cette semaine.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="topPeriod">
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp size={16} className="text-emerald-500" /> Top produits — {periodLabel}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.topPeriod.length > 0 ? (
                data.topPeriod.map((p, i) => (
                  <ProductRow key={p.id} product={p} rank={i + 1} isOwn={p.store_id === store?.id} periodLabel={periodLabel} />
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">Aucune vente sur cette période.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="emerging">
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Rocket size={16} className="text-primary" /> Produits émergents
                <span className="text-xs font-normal text-muted-foreground ml-1">croissance rapide — {periodLabel}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.emerging.length > 0 ? (
                data.emerging.map((p, i) => (
                  <ProductRow key={p.id} product={p} rank={i + 1} showGrowth isOwn={p.store_id === store?.id} periodLabel={periodLabel} />
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Pas encore de produits émergents détectés.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories">
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Layers size={16} className="text-emerald-500" /> Catégories en croissance — {periodLabel}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.categoryTrends.length > 0 ? (
                <div className="space-y-2">
                  {data.categoryTrends.map((cat, i) => (
                    <motion.div
                      key={cat.name}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center gap-3 p-3 rounded-lg border border-border/50"
                    >
                      <span className="text-xs font-bold text-muted-foreground w-6 text-center">#{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{cat.name}</p>
                        <p className="text-[10px] text-muted-foreground">{cat.products} produits</p>
                      </div>
                      <div className="text-right space-y-0.5">
                        <p className="text-sm font-bold text-foreground">{cat.sales_period} ventes</p>
                        <div className="flex items-center justify-end gap-0.5">
                          {cat.growth >= 0 ? (
                            <ArrowUpRight size={12} className="text-emerald-500" />
                          ) : (
                            <ArrowDownRight size={12} className="text-destructive" />
                          )}
                          <span className={`text-xs font-medium ${cat.growth >= 0 ? "text-emerald-500" : "text-destructive"}`}>
                            {cat.growth > 0 ? "+" : ""}{cat.growth}%
                          </span>
                        </div>
                      </div>
                      {cat.growth > 50 && (
                        <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 gap-1">
                          <Flame size={12} /> Hot
                        </Badge>
                      )}
                    </motion.div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">Aucune donnée de catégorie.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
