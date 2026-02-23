import { useEffect, useState } from "react";
import { ShoppingCart, DollarSign, Eye, TrendingUp, TrendingDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/hooks/useStore";
import { cn } from "@/lib/utils";

interface KpiData {
  ordersToday: number;
  revenueToday: number;
  revenueWeek: number;
  visitorsToday: number;
  ordersTrend: number;
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
    },
    {
      label: "CA du jour",
      value: formatCurrency(data.revenueToday),
      trend: data.revenueTrend,
      icon: DollarSign,
    },
    {
      label: "CA de la semaine",
      value: formatCurrency(data.revenueWeek),
      trend: null,
      icon: DollarSign,
    },
    {
      label: "Visiteurs aujourd'hui",
      value: data.visitorsToday.toString(),
      trend: null,
      icon: Eye,
    },
  ];

  return (
    <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-2 xl:grid-cols-4 md:gap-4 md:overflow-visible scrollbar-hide snap-x snap-mandatory">
      {kpis.map((kpi) => (
        <div
          key={kpi.label}
          className="min-w-[200px] md:min-w-0 snap-start rounded-lg border border-border bg-card p-4 md:p-5 transition-colors duration-200 shrink-0 md:shrink"
        >
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <kpi.icon size={16} className="text-muted-foreground" />
            {kpi.trend !== null && kpi.trend !== 0 && (
              <span
                className={cn(
                  "flex items-center gap-1 text-xs font-semibold",
                  kpi.trend > 0 ? "text-emerald-500" : "text-destructive"
                )}
              >
                {kpi.trend > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {Math.abs(kpi.trend).toFixed(0)}%
              </span>
            )}
          </div>
          {loading ? (
            <div className="space-y-2">
              <div className="h-8 w-24 bg-muted rounded" />
              <div className="h-3 w-28 bg-muted rounded" />
            </div>
          ) : (
            <>
              <p className="text-2xl md:text-[32px] font-bold text-foreground tracking-tight leading-none">{kpi.value}</p>
              <p className="text-[11px] md:text-xs text-muted-foreground mt-1.5 md:mt-2 font-medium">{kpi.label}</p>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
