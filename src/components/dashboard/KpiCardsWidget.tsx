import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ShoppingCart, DollarSign, Eye, TrendingUp, TrendingDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/hooks/useStore";
import { cn } from "@/lib/utils";

interface KpiData {
  ordersToday: number;
  revenueToday: number;
  revenueWeek: number;
  visitorsToday: number;
  ordersTrend: number; // percentage change vs yesterday
  revenueTrend: number;
}

export default function KpiCardsWidget() {
  const { store } = useStore();
  const [data, setData] = useState<KpiData>({
    ordersToday: 0,
    revenueToday: 0,
    revenueWeek: 0,
    visitorsToday: 0,
    ordersTrend: 0,
    revenueTrend: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!store?.id) return;

    const fetchKpis = async () => {
      const today = new Date().toISOString().slice(0, 10);
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);

      const [ordersToday, ordersYesterday, ordersWeek, visitors] = await Promise.all([
        supabase
          .from("orders")
          .select("total")
          .eq("store_id", store.id)
          .gte("created_at", `${today}T00:00:00`)
          .lt("created_at", `${today}T23:59:59`),
        supabase
          .from("orders")
          .select("total")
          .eq("store_id", store.id)
          .gte("created_at", `${yesterday}T00:00:00`)
          .lt("created_at", `${yesterday}T23:59:59`),
        supabase
          .from("orders")
          .select("total")
          .eq("store_id", store.id)
          .gte("created_at", `${weekAgo}T00:00:00`),
        supabase
          .from("tracking_events")
          .select("event_count")
          .eq("store_id", store.id)
          .eq("event_type", "page_view")
          .eq("event_date", today)
          .maybeSingle(),
      ]);

      const todayRevenue = ordersToday.data?.reduce((s, o) => s + (o.total || 0), 0) ?? 0;
      const yesterdayRevenue = ordersYesterday.data?.reduce((s, o) => s + (o.total || 0), 0) ?? 0;
      const weekRevenue = ordersWeek.data?.reduce((s, o) => s + (o.total || 0), 0) ?? 0;
      const todayCount = ordersToday.data?.length ?? 0;
      const yesterdayCount = ordersYesterday.data?.length ?? 0;

      setData({
        ordersToday: todayCount,
        revenueToday: todayRevenue,
        revenueWeek: weekRevenue,
        visitorsToday: visitors.data?.event_count ?? 0,
        ordersTrend: yesterdayCount > 0 ? ((todayCount - yesterdayCount) / yesterdayCount) * 100 : 0,
        revenueTrend: yesterdayRevenue > 0 ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100 : 0,
      });
      setLoading(false);
    };

    fetchKpis();
  }, [store?.id]);

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: store?.currency || "XOF", maximumFractionDigits: 0 }).format(v);

  const kpis = [
    {
      label: "Commandes aujourd'hui",
      value: data.ordersToday.toString(),
      trend: data.ordersTrend,
      icon: ShoppingCart,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "CA du jour",
      value: formatCurrency(data.revenueToday),
      trend: data.revenueTrend,
      icon: DollarSign,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      label: "CA de la semaine",
      value: formatCurrency(data.revenueWeek),
      trend: null,
      icon: DollarSign,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      label: "Visiteurs aujourd'hui",
      value: data.visitorsToday.toString(),
      trend: null,
      icon: Eye,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {kpis.map((kpi) => (
        <Card key={kpi.label} className="relative overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", kpi.bg)}>
                <kpi.icon size={20} className={kpi.color} />
              </div>
              {kpi.trend !== null && kpi.trend !== 0 && (
                <span
                  className={cn(
                    "flex items-center gap-1 text-xs font-medium rounded-full px-2 py-0.5",
                    kpi.trend > 0
                      ? "text-emerald-600 bg-emerald-500/10"
                      : "text-destructive bg-destructive/10"
                  )}
                >
                  {kpi.trend > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {Math.abs(kpi.trend).toFixed(0)}%
                </span>
              )}
            </div>
            {loading ? (
              <div className="space-y-2">
                <div className="h-7 w-24 bg-muted animate-pulse rounded" />
                <div className="h-4 w-32 bg-muted animate-pulse rounded" />
              </div>
            ) : (
              <>
                <p className="text-2xl font-bold text-foreground tracking-tight">{kpi.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{kpi.label}</p>
              </>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
