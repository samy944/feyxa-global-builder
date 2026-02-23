import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/hooks/useStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3, Eye, ShoppingCart, CreditCard, Users, TrendingUp,
  Link2, Copy, ExternalLink, ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, FunnelChart, Funnel, LabelList,
} from "recharts";

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "#94a3b8",
];

const SOURCE_LABELS: Record<string, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  whatsapp: "WhatsApp",
  tiktok: "TikTok",
  google: "Google",
  direct: "Direct",
  referral: "Referral",
};

export default function DashboardMarketing() {
  const { store } = useStore();
  const [period, setPeriod] = useState("30");
  const [sessions, setSessions] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [trackingLinks, setTrackingLinks] = useState<any[]>([]);
  const [attributions, setAttributions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const since = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - parseInt(period));
    return d.toISOString();
  }, [period]);

  useEffect(() => {
    if (!store?.id) return;
    setLoading(true);

    Promise.all([
      supabase
        .from("tracking_sessions")
        .select("*")
        .eq("store_id", store.id)
        .gte("first_seen_at", since)
        .order("last_seen_at", { ascending: false })
        .limit(1000),
      supabase
        .from("analytics_events")
        .select("*")
        .eq("store_id", store.id)
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(1000),
      supabase
        .from("tracking_links")
        .select("*, products(name)")
        .eq("store_id", store.id)
        .order("click_count", { ascending: false })
        .limit(50),
      supabase
        .from("order_attributions")
        .select("*, orders(total, currency, order_number)")
        .eq("store_id", store.id)
        .gte("created_at", since)
        .limit(500),
    ]).then(([sessRes, evtRes, linksRes, attrRes]) => {
      setSessions(sessRes.data || []);
      setEvents(evtRes.data || []);
      setTrackingLinks(linksRes.data || []);
      setAttributions(attrRes.data || []);
      setLoading(false);
    });
  }, [store?.id, since]);

  // KPIs
  const totalVisitors = sessions.length;
  const totalPageViews = events.filter((e) => e.event_type === "page_view").length;
  const totalAddToCart = events.filter((e) => e.event_type === "add_to_cart").length;
  const totalCheckouts = events.filter((e) => e.event_type === "initiate_checkout").length;
  const totalPurchases = events.filter((e) => e.event_type === "purchase").length;
  const totalRevenue = attributions.reduce((s, a) => s + (a.orders?.total || 0), 0);
  const conversionRate = totalVisitors > 0 ? ((totalPurchases / totalVisitors) * 100).toFixed(1) : "0";
  const aov = totalPurchases > 0 ? Math.round(totalRevenue / totalPurchases) : 0;

  // Sources breakdown
  const sourceMap = new Map<string, { visitors: number; purchases: number; revenue: number }>();
  sessions.forEach((s) => {
    const src = s.last_source || s.first_source || "direct";
    const entry = sourceMap.get(src) || { visitors: 0, purchases: 0, revenue: 0 };
    entry.visitors++;
    sourceMap.set(src, entry);
  });
  attributions.forEach((a) => {
    const src = a.last_source || "direct";
    const entry = sourceMap.get(src) || { visitors: 0, purchases: 0, revenue: 0 };
    entry.purchases++;
    entry.revenue += a.orders?.total || 0;
    sourceMap.set(src, entry);
  });
  const sourceData = Array.from(sourceMap.entries())
    .map(([source, data]) => ({ source: SOURCE_LABELS[source] || source, ...data }))
    .sort((a, b) => b.visitors - a.visitors);

  // Funnel data
  const funnelData = [
    { name: "Visiteurs", value: totalVisitors, fill: COLORS[0] },
    { name: "Vues produit", value: events.filter((e) => e.event_type === "view_content").length, fill: COLORS[1] },
    { name: "Ajouts panier", value: totalAddToCart, fill: COLORS[2] },
    { name: "Checkouts", value: totalCheckouts, fill: COLORS[3] },
    { name: "Achats", value: totalPurchases, fill: COLORS[4] },
  ];

  // Top campaigns
  const campaignMap = new Map<string, { clicks: number; purchases: number; revenue: number }>();
  trackingLinks.forEach((l) => {
    const key = l.campaign || "(sans campagne)";
    const entry = campaignMap.get(key) || { clicks: 0, purchases: 0, revenue: 0 };
    entry.clicks += l.click_count;
    campaignMap.set(key, entry);
  });
  attributions.forEach((a) => {
    if (!a.last_campaign) return;
    const entry = campaignMap.get(a.last_campaign) || { clicks: 0, purchases: 0, revenue: 0 };
    entry.purchases++;
    entry.revenue += a.orders?.total || 0;
    campaignMap.set(a.last_campaign, entry);
  });
  const campaignData = Array.from(campaignMap.entries())
    .map(([campaign, data]) => ({ campaign, ...data }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 10);

  const formatPrice = (v: number) =>
    store?.currency === "XOF" ? `${v.toLocaleString("fr-FR")} FCFA` : `€${v.toFixed(2)}`;

  const handleCopyLink = (shortCode: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/r/${shortCode}`);
    toast.success("Lien copié !");
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8">
          <BarChart3 className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Marketing Intelligence</h1>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-secondary/50 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Marketing Intelligence</h1>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">7 jours</SelectItem>
            <SelectItem value="14">14 jours</SelectItem>
            <SelectItem value="30">30 jours</SelectItem>
            <SelectItem value="90">90 jours</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Visiteurs", value: totalVisitors.toLocaleString(), icon: Users, color: "text-blue-500" },
          { label: "Taux conversion", value: `${conversionRate}%`, icon: TrendingUp, color: "text-emerald-500" },
          { label: "Ventes", value: formatPrice(totalRevenue), icon: CreditCard, color: "text-primary" },
          { label: "Panier moyen", value: formatPrice(aov), icon: ShoppingCart, color: "text-amber-500" },
        ].map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                <span className="text-xs text-muted-foreground">{kpi.label}</span>
              </div>
              <p className="text-xl font-bold text-foreground">{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Sources de trafic (Pie) */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Sources de trafic</CardTitle>
          </CardHeader>
          <CardContent>
            {sourceData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Aucune donnée</p>
            ) : (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="50%" height={200}>
                  <PieChart>
                    <Pie
                      data={sourceData}
                      dataKey="visitors"
                      nameKey="source"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      innerRadius={40}
                    >
                      {sourceData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 flex-1">
                  {sourceData.slice(0, 6).map((s, i) => (
                    <div key={s.source} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="text-foreground">{s.source}</span>
                      </div>
                      <span className="text-muted-foreground">{s.visitors}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Funnel */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Entonnoir de conversion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {funnelData.map((step, i) => {
                const maxVal = funnelData[0].value || 1;
                const pct = maxVal > 0 ? (step.value / maxVal) * 100 : 0;
                return (
                  <div key={step.name} className="flex items-center gap-3">
                    <span className="text-[11px] text-muted-foreground w-24 shrink-0">{step.name}</span>
                    <div className="flex-1 h-7 bg-secondary rounded-md overflow-hidden relative">
                      <div
                        className="h-full rounded-md transition-all"
                        style={{ width: `${Math.max(pct, 2)}%`, backgroundColor: step.fill }}
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] font-medium text-foreground">
                        {step.value.toLocaleString()}
                      </span>
                    </div>
                    {i > 0 && funnelData[i - 1].value > 0 && (
                      <span className="text-[10px] text-muted-foreground w-12 text-right">
                        {((step.value / funnelData[i - 1].value) * 100).toFixed(0)}%
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Campaigns */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Top campagnes</CardTitle>
        </CardHeader>
        <CardContent>
          {campaignData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Créez des liens trackés pour voir les performances de vos campagnes</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={campaignData} layout="vertical" margin={{ left: 100 }}>
                <XAxis type="number" />
                <YAxis dataKey="campaign" type="category" tick={{ fontSize: 11 }} width={100} />
                <Tooltip />
                <Bar dataKey="clicks" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Clics" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Top Tracking Links */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Link2 className="w-4 h-4" /> Liens trackés
          </CardTitle>
        </CardHeader>
        <CardContent>
          {trackingLinks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Allez sur la page Produits pour créer des liens trackés
            </p>
          ) : (
            <div className="space-y-2">
              {trackingLinks.map((link) => (
                <div key={link.id} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-secondary/30 transition-colors">
                  <Badge variant="secondary" className="text-[10px] shrink-0 uppercase">
                    {link.source}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{link.products?.name || "Produit"}</p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {link.campaign && <span className="mr-2">🎯 {link.campaign}</span>}
                      <span className="font-mono">/r/{link.short_code}</span>
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-foreground">{link.click_count}</p>
                    <p className="text-[10px] text-muted-foreground">clics</p>
                  </div>
                  <Button size="icon" variant="ghost" className="w-7 h-7 shrink-0" onClick={() => handleCopyLink(link.short_code)}>
                    <Copy className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
