import { useState, useEffect, useMemo } from "react";
import { useStore } from "@/hooks/useStore";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Eye, ShoppingCart, CreditCard, TrendingUp, MousePointerClick, Loader2 } from "lucide-react";
import { format, subDays, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

const EVENT_LABELS: Record<string, string> = {
  page_view: "Pages vues",
  view_content: "Vues produit",
  add_to_cart: "Ajouts panier",
  initiate_checkout: "Checkouts",
  purchase: "Achats",
};

const EVENT_COLORS: Record<string, string> = {
  page_view: "hsl(var(--primary))",
  view_content: "hsl(210, 80%, 55%)",
  add_to_cart: "hsl(45, 90%, 50%)",
  initiate_checkout: "hsl(280, 70%, 55%)",
  purchase: "hsl(145, 65%, 45%)",
};

const EVENT_ICONS: Record<string, any> = {
  page_view: Eye,
  view_content: MousePointerClick,
  add_to_cart: ShoppingCart,
  initiate_checkout: CreditCard,
  purchase: TrendingUp,
};

type Period = "7" | "14" | "30";

interface TrackingEvent {
  event_type: string;
  event_date: string;
  event_count: number;
  event_value: number;
}

export default function DashboardAnalytics() {
  const { store } = useStore();
  const [period, setPeriod] = useState<Period>("7");
  const [events, setEvents] = useState<TrackingEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!store?.id) return;
    setLoading(true);

    const startDate = format(subDays(new Date(), parseInt(period)), "yyyy-MM-dd");

    supabase
      .from("tracking_events")
      .select("event_type, event_date, event_count, event_value")
      .eq("store_id", store.id)
      .gte("event_date", startDate)
      .order("event_date", { ascending: true })
      .then(({ data }) => {
        setEvents((data as TrackingEvent[]) || []);
        setLoading(false);
      });
  }, [store?.id, period]);

  // Aggregate totals per event type
  const totals = useMemo(() => {
    const map: Record<string, { count: number; value: number }> = {};
    for (const e of events) {
      if (!map[e.event_type]) map[e.event_type] = { count: 0, value: 0 };
      map[e.event_type].count += e.event_count;
      map[e.event_type].value += e.event_value;
    }
    return map;
  }, [events]);

  // Build chart data: one row per date, columns per event_type
  const chartData = useMemo(() => {
    const days = parseInt(period);
    const dateMap: Record<string, Record<string, number>> = {};

    for (let i = days; i >= 0; i--) {
      const d = format(subDays(new Date(), i), "yyyy-MM-dd");
      dateMap[d] = { page_view: 0, view_content: 0, add_to_cart: 0, initiate_checkout: 0, purchase: 0 };
    }

    for (const e of events) {
      if (dateMap[e.event_date]) {
        dateMap[e.event_date][e.event_type] = e.event_count;
      }
    }

    return Object.entries(dateMap).map(([date, counts]) => ({
      date,
      label: format(parseISO(date), "dd MMM", { locale: fr }),
      ...counts,
    }));
  }, [events, period]);

  // Conversion funnel
  const funnel = useMemo(() => {
    const pv = totals.page_view?.count || 0;
    const vc = totals.view_content?.count || 0;
    const atc = totals.add_to_cart?.count || 0;
    const ic = totals.initiate_checkout?.count || 0;
    const p = totals.purchase?.count || 0;

    return [
      { name: "Pages vues", value: pv },
      { name: "Vues produit", value: vc },
      { name: "Ajouts panier", value: atc },
      { name: "Checkouts", value: ic },
      { name: "Achats", value: p },
    ];
  }, [totals]);

  const conversionRate = useMemo(() => {
    const pv = totals.page_view?.count || 0;
    const p = totals.purchase?.count || 0;
    if (pv === 0) return "0";
    return ((p / pv) * 100).toFixed(2);
  }, [totals]);

  const eventTypes = ["page_view", "view_content", "add_to_cart", "initiate_checkout", "purchase"];

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Suivi des événements de tracking de votre boutique
          </p>
        </div>
        <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)}>
          <TabsList>
            <TabsTrigger value="7">7j</TabsTrigger>
            <TabsTrigger value="14">14j</TabsTrigger>
            <TabsTrigger value="30">30j</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-muted-foreground" size={32} />
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {eventTypes.map((type) => {
              const Icon = EVENT_ICONS[type];
              const count = totals[type]?.count || 0;
              const value = totals[type]?.value || 0;
              return (
                <Card key={type}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: EVENT_COLORS[type] + "20" }}>
                        <Icon size={16} style={{ color: EVENT_COLORS[type] }} />
                      </div>
                      <span className="text-xs text-muted-foreground">{EVENT_LABELS[type]}</span>
                    </div>
                    <p className="text-2xl font-bold text-foreground">{count.toLocaleString("fr-FR")}</p>
                    {type === "purchase" && value > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {value.toLocaleString("fr-FR")} {store?.currency || "XOF"}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Area Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Événements par jour</CardTitle>
              <CardDescription>Évolution sur les {period} derniers jours</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="label" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                    <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
                    <Tooltip
                      contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }}
                      labelStyle={{ color: "hsl(var(--foreground))" }}
                    />
                    <Legend />
                    {eventTypes.map((type) => (
                      <Area
                        key={type}
                        type="monotone"
                        dataKey={type}
                        name={EVENT_LABELS[type]}
                        stroke={EVENT_COLORS[type]}
                        fill={EVENT_COLORS[type]}
                        fillOpacity={0.1}
                        strokeWidth={2}
                      />
                    ))}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Funnel + Conversion */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Entonnoir de conversion</CardTitle>
                <CardDescription>Du trafic à l'achat</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={funnel} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis type="number" tick={{ fontSize: 12 }} />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={100} />
                      <Tooltip
                        contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }}
                      />
                      <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Taux de conversion</CardTitle>
                <CardDescription>Pages vues → Achats</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center h-64">
                <div className="text-5xl font-bold text-primary">{conversionRate}%</div>
                <p className="text-sm text-muted-foreground mt-2">
                  {totals.purchase?.count || 0} achats sur {totals.page_view?.count || 0} pages vues
                </p>
                {(totals.purchase?.value || 0) > 0 && (
                  <p className="text-lg font-semibold text-foreground mt-4">
                    Revenu: {(totals.purchase?.value || 0).toLocaleString("fr-FR")} {store?.currency || "XOF"}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
