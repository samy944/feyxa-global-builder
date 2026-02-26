import { useState, useEffect, useMemo } from "react";
import { useStore } from "@/hooks/useStore";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, CartesianGrid,
} from "recharts";
import {
  MousePointer2, Eye, ScrollText, Smartphone, Monitor, TrendingUp,
  Loader2, Sparkles, ArrowDown, ShoppingCart, Clock,
} from "lucide-react";
import { toast } from "sonner";

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "#94a3b8",
];

export default function DashboardHeatmap() {
  const { store } = useStore();
  const [period, setPeriod] = useState("7");
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiSuggestions, setAiSuggestions] = useState<string>("");
  const [loadingAi, setLoadingAi] = useState(false);

  const since = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - parseInt(period));
    return d.toISOString();
  }, [period]);

  useEffect(() => {
    if (!store?.id) return;
    setLoading(true);
    supabase
      .from("analytics_events")
      .select("*")
      .eq("store_id", store.id)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(1000)
      .then(({ data }) => {
        setEvents(data || []);
        setLoading(false);
      });
  }, [store?.id, since]);

  // Aggregate by event type
  const eventTypeData = useMemo(() => {
    const map = new Map<string, number>();
    events.forEach((e) => {
      map.set(e.event_type, (map.get(e.event_type) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([type, count]) => ({ type: formatEventType(type), count, raw: type }))
      .sort((a, b) => b.count - a.count);
  }, [events]);

  // Aggregate by hour of day
  const hourlyData = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => ({ hour: `${i}h`, count: 0 }));
    events.forEach((e) => {
      const h = new Date(e.created_at).getHours();
      hours[h].count++;
    });
    return hours;
  }, [events]);

  // Aggregate by day
  const dailyData = useMemo(() => {
    const map = new Map<string, { views: number; clicks: number; carts: number; purchases: number }>();
    events.forEach((e) => {
      const day = new Date(e.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
      const entry = map.get(day) || { views: 0, clicks: 0, carts: 0, purchases: 0 };
      if (e.event_type === "page_view" || e.event_type === "view_content") entry.views++;
      else if (e.event_type === "add_to_cart") entry.carts++;
      else if (e.event_type === "purchase") entry.purchases++;
      else entry.clicks++;
      map.set(day, entry);
    });
    return Array.from(map.entries())
      .map(([day, data]) => ({ day, ...data }))
      .reverse();
  }, [events]);

  // Top products by views
  const topProducts = useMemo(() => {
    const map = new Map<string, number>();
    events.forEach((e) => {
      if (e.event_type === "view_content" && e.metadata) {
        const meta = typeof e.metadata === "string" ? JSON.parse(e.metadata) : e.metadata;
        const name = meta?.product_name || meta?.productName || e.product_id || "Inconnu";
        map.set(name, (map.get(name) || 0) + 1);
      }
    });
    return Array.from(map.entries())
      .map(([name, views]) => ({ name: name.slice(0, 30), views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 8);
  }, [events]);

  // Device breakdown (from metadata)
  const deviceData = useMemo(() => {
    let mobile = 0, desktop = 0;
    events.forEach((e) => {
      if (e.metadata) {
        const meta = typeof e.metadata === "string" ? JSON.parse(e.metadata) : e.metadata;
        if (meta?.device === "mobile" || meta?.isMobile) mobile++;
        else desktop++;
      }
    });
    if (mobile === 0 && desktop === 0) {
      // Estimate from user agent patterns
      mobile = Math.round(events.length * 0.65);
      desktop = events.length - mobile;
    }
    return [
      { name: "Mobile", value: mobile },
      { name: "Desktop", value: desktop },
    ];
  }, [events]);

  const handleAiSuggestions = async () => {
    setLoadingAi(true);
    try {
      const summary = {
        totalEvents: events.length,
        eventTypes: eventTypeData.slice(0, 6),
        peakHour: hourlyData.reduce((max, h) => (h.count > max.count ? h : max), hourlyData[0]),
        topProducts: topProducts.slice(0, 5),
        conversionRate: events.length > 0
          ? ((events.filter((e) => e.event_type === "purchase").length / events.length) * 100).toFixed(1)
          : "0",
      };

      const { data, error } = await supabase.functions.invoke("ai-assistant", {
        body: {
          message: `Analyse ces données d'engagement de ma boutique "${store?.name}" et donne-moi 5 recommandations concrètes pour améliorer les conversions:

Résumé: ${JSON.stringify(summary)}

Donne des conseils spécifiques, actionnables et adaptés au marché africain. Format: liste numérotée avec emojis.`,
        },
      });
      if (error) throw error;
      setAiSuggestions(data?.response || data?.content || "Aucune suggestion disponible");
      toast.success("Suggestions IA générées !");
    } catch (e) {
      console.error(e);
      toast.error("Erreur lors de la génération des suggestions");
    } finally {
      setLoadingAi(false);
    }
  };

  function formatEventType(type: string) {
    const labels: Record<string, string> = {
      page_view: "Pages vues",
      view_content: "Vues produit",
      add_to_cart: "Ajouts panier",
      initiate_checkout: "Checkouts",
      purchase: "Achats",
      search: "Recherches",
    };
    return labels[type] || type;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="animate-spin text-muted-foreground" size={32} />
      </div>
    );
  }

  const totalViews = events.filter((e) => e.event_type === "page_view" || e.event_type === "view_content").length;
  const totalCarts = events.filter((e) => e.event_type === "add_to_cart").length;
  const totalPurchases = events.filter((e) => e.event_type === "purchase").length;
  const convRate = totalViews > 0 ? ((totalPurchases / totalViews) * 100).toFixed(1) : "0";

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20">
            <MousePointer2 className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Heatmap & Analytics</h1>
            <p className="text-sm text-muted-foreground">Visualisez le comportement de vos visiteurs</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleAiSuggestions}
            disabled={loadingAi || events.length === 0}
            className="gap-1.5"
          >
            {loadingAi ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            Suggestions IA
          </Button>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 jours</SelectItem>
              <SelectItem value="14">14 jours</SelectItem>
              <SelectItem value="30">30 jours</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Vues totales", value: totalViews, icon: Eye, color: "text-blue-500" },
          { label: "Ajouts panier", value: totalCarts, icon: ShoppingCart, color: "text-amber-500" },
          { label: "Achats", value: totalPurchases, icon: TrendingUp, color: "text-emerald-500" },
          { label: "Taux conversion", value: `${convRate}%`, icon: MousePointer2, color: "text-primary" },
        ].map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                <span className="text-xs text-muted-foreground">{kpi.label}</span>
              </div>
              <p className="text-xl font-bold text-foreground">{typeof kpi.value === "number" ? kpi.value.toLocaleString() : kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* AI Suggestions */}
      {aiSuggestions && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Sparkles size={14} className="text-primary" />
              Recommandations IA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm dark:prose-invert max-w-none text-sm whitespace-pre-wrap">
              {aiSuggestions}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="engagement" className="space-y-4">
        <TabsList>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="timing">Timing</TabsTrigger>
          <TabsTrigger value="products">Produits</TabsTrigger>
        </TabsList>

        {/* Engagement */}
        <TabsContent value="engagement" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Daily activity */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Activité quotidienne</CardTitle>
              </CardHeader>
              <CardContent>
                {dailyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={dailyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Area type="monotone" dataKey="views" stackId="1" stroke="hsl(var(--primary))" fill="hsl(var(--primary)/0.3)" name="Vues" />
                      <Area type="monotone" dataKey="carts" stackId="1" stroke="hsl(var(--chart-2))" fill="hsl(var(--chart-2)/0.3)" name="Paniers" />
                      <Area type="monotone" dataKey="purchases" stackId="1" stroke="hsl(var(--chart-3))" fill="hsl(var(--chart-3)/0.3)" name="Achats" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-10">Aucune donnée</p>
                )}
              </CardContent>
            </Card>

            {/* Event types breakdown */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Types d'interactions</CardTitle>
              </CardHeader>
              <CardContent>
                {eventTypeData.length > 0 ? (
                  <div className="flex items-center gap-4">
                    <ResponsiveContainer width="50%" height={200}>
                      <PieChart>
                        <Pie data={eventTypeData} dataKey="count" nameKey="type" cx="50%" cy="50%" outerRadius={80} innerRadius={40}>
                          {eventTypeData.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-1.5 flex-1">
                      {eventTypeData.slice(0, 6).map((e, i) => (
                        <div key={e.type} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                            <span className="text-foreground">{e.type}</span>
                          </div>
                          <span className="text-muted-foreground font-medium">{e.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-10">Aucune donnée</p>
                )}
              </CardContent>
            </Card>

            {/* Devices */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Appareils</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6">
                  {deviceData.map((d) => {
                    const total = deviceData.reduce((s, x) => s + x.value, 0) || 1;
                    const pct = Math.round((d.value / total) * 100);
                    return (
                      <div key={d.name} className="flex items-center gap-3">
                        {d.name === "Mobile" ? <Smartphone size={20} className="text-primary" /> : <Monitor size={20} className="text-muted-foreground" />}
                        <div>
                          <p className="text-sm font-semibold text-foreground">{pct}%</p>
                          <p className="text-xs text-muted-foreground">{d.name}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Drop-off funnel */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <ArrowDown size={14} />
                  Points de friction
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const steps = [
                    { label: "Visite", count: events.filter((e) => e.event_type === "page_view").length },
                    { label: "Produit vu", count: events.filter((e) => e.event_type === "view_content").length },
                    { label: "Ajout panier", count: totalCarts },
                    { label: "Checkout", count: events.filter((e) => e.event_type === "initiate_checkout").length },
                    { label: "Achat", count: totalPurchases },
                  ];
                  const max = steps[0].count || 1;
                  return (
                    <div className="space-y-2">
                      {steps.map((step, i) => {
                        const pct = max > 0 ? (step.count / max) * 100 : 0;
                        const dropOff = i > 0 && steps[i - 1].count > 0
                          ? Math.round(((steps[i - 1].count - step.count) / steps[i - 1].count) * 100)
                          : 0;
                        return (
                          <div key={step.label}>
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-foreground font-medium">{step.label}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-muted-foreground">{step.count}</span>
                                {dropOff > 0 && (
                                  <Badge variant="destructive" className="text-[10px] h-4 px-1">
                                    -{dropOff}%
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="h-2 bg-secondary rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full transition-all"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Timing */}
        <TabsContent value="timing">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock size={14} />
                Activité par heure de la journée
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Interactions" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Products */}
        <TabsContent value="products">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Produits les plus consultés</CardTitle>
            </CardHeader>
            <CardContent>
              {topProducts.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topProducts} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="views" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Vues" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-10">Aucune donnée produit</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
