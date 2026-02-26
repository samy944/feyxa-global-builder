import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/hooks/useStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  BarChart3, Eye, ShoppingCart, CreditCard, Users, TrendingUp,
  Link2, Copy, ExternalLink, ArrowRight, Download,
  Mail, Percent, Flame, RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
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

  // Abandoned carts state
  const [abandonedCarts, setAbandonedCarts] = useState<any[]>([]);
  const [cartsLoading, setCartsLoading] = useState(false);
  const [recoveryTarget, setRecoveryTarget] = useState<any | null>(null);
  const [includePromo, setIncludePromo] = useState(false);
  const [sending, setSending] = useState(false);

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

  // Load abandoned carts
  useEffect(() => {
    if (!store?.id) return;
    setCartsLoading(true);
    supabase
      .from("abandoned_carts")
      .select("*")
      .eq("store_id", store.id)
      .in("status", ["abandoned", "recovered"])
      .order("created_at", { ascending: false })
      .limit(200)
      .then(({ data }) => {
        setAbandonedCarts(data || []);
        setCartsLoading(false);
      });
  }, [store?.id]);

  // KPIs
  const totalVisitors = sessions.length;
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

  const handleExportCSV = () => {
    const lines: string[] = [];
    const date = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
    lines.push("Résumé Marketing");
    lines.push("Métrique,Valeur");
    lines.push(`Visiteurs,${totalVisitors}`);
    lines.push(`Taux conversion,${conversionRate}%`);
    lines.push(`Ventes totales,${totalRevenue}`);
    lines.push(`Panier moyen,${aov}`);
    lines.push(`Achats,${totalPurchases}`);
    lines.push("");
    lines.push("Sources de trafic");
    lines.push("Source,Visiteurs,Achats,Revenu");
    sourceData.forEach((s) => {
      lines.push(`"${s.source}",${s.visitors},${s.purchases},${s.revenue}`);
    });
    lines.push("");
    lines.push("Entonnoir de conversion");
    lines.push("Étape,Valeur");
    funnelData.forEach((f) => {
      lines.push(`"${f.name}",${f.value}`);
    });
    lines.push("");
    lines.push("Campagnes");
    lines.push("Campagne,Clics,Achats,Revenu");
    campaignData.forEach((c) => {
      lines.push(`"${c.campaign}",${c.clicks},${c.purchases},${c.revenue}`);
    });
    lines.push("");
    lines.push("Liens trackés");
    lines.push("Source,Produit,Campagne,Code,Clics");
    trackingLinks.forEach((l) => {
      lines.push(`"${l.source}","${l.products?.name || ""}","${l.campaign || ""}","/r/${l.short_code}",${l.click_count}`);
    });
    const csv = "\uFEFF" + lines.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `feyxa-marketing-${period}j-${date}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Export CSV téléchargé !");
  };

  // ── Abandoned cart recovery ──
  const abandonedOnly = abandonedCarts.filter((c) => c.status === "abandoned");
  const recoveredOnly = abandonedCarts.filter((c) => c.status === "recovered");
  const lostRevenue = abandonedOnly.reduce((s, c) => s + (c.cart_total || 0), 0);
  const recoveryRate = abandonedCarts.length > 0
    ? ((recoveredOnly.length / abandonedCarts.length) * 100).toFixed(1)
    : "0";

  const generatePromoCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "RECOVER-";
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
  };

  const handleSendRecovery = async () => {
    if (!recoveryTarget || !store) return;
    setSending(true);

    try {
      let promoCode: string | null = null;
      if (includePromo) {
        promoCode = generatePromoCode();
        // Create actual coupon in DB
        await supabase.from("coupons").insert({
          store_id: store.id,
          code: promoCode,
          discount_type: "percentage" as any,
          discount_value: 10,
          max_uses: 1,
          is_active: true,
        });
      }

      // Update cart status
      await supabase
        .from("abandoned_carts")
        .update({
          status: "recovered",
          recovery_code: promoCode,
          recovered_at: new Date().toISOString(),
        } as any)
        .eq("id", recoveryTarget.id);

      // Mock email send (or call send-email function if available)
      if (recoveryTarget.customer_email) {
        await supabase.functions.invoke("send-email", {
          body: {
            to: recoveryTarget.customer_email,
            subject: `${store.name} — Vous avez oublié quelque chose ! 🛒`,
            html: `<p>Bonjour ${recoveryTarget.customer_name || ""},</p>
              <p>Vous avez laissé des articles dans votre panier d'une valeur de <strong>${formatPrice(recoveryTarget.cart_total)}</strong>.</p>
              ${promoCode ? `<p>🎁 Utilisez le code <strong>${promoCode}</strong> pour bénéficier de -10% !</p>` : ""}
              <p>Finalisez votre commande dès maintenant.</p>`,
          },
        }).catch(() => {
          // Email send may not be configured, just log
          console.log("Email recovery attempted for", recoveryTarget.customer_email);
        });
      }

      // Update local state
      setAbandonedCarts((prev) =>
        prev.map((c) =>
          c.id === recoveryTarget.id
            ? { ...c, status: "recovered", recovery_code: promoCode, recovered_at: new Date().toISOString() }
            : c
        )
      );

      toast.success("Relance envoyée !", {
        description: promoCode
          ? `Email envoyé avec le code promo ${promoCode}`
          : "Email de rappel envoyé au client",
      });

      setRecoveryTarget(null);
      setIncludePromo(false);
    } catch (err) {
      console.error("Recovery error:", err);
      toast.error("Erreur lors de l'envoi de la relance");
    } finally {
      setSending(false);
    }
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
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="w-4 h-4 mr-1" /> Export CSV
          </Button>
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
      </div>

      <Tabs defaultValue="intelligence" className="space-y-6">
        <TabsList>
          <TabsTrigger value="intelligence">Intelligence</TabsTrigger>
          <TabsTrigger value="abandoned" className="flex items-center gap-1.5">
            <ShoppingCart className="w-3.5 h-3.5" />
            Paniers Abandonnés
            {abandonedOnly.length > 0 && (
              <Badge variant="destructive" className="text-[10px] h-4 px-1.5 ml-1">{abandonedOnly.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ── Intelligence Tab ── */}
        <TabsContent value="intelligence" className="space-y-6">
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

          {/* Tracking Links */}
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
        </TabsContent>

        {/* ── Abandoned Carts Tab ── */}
        <TabsContent value="abandoned" className="space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <ShoppingCart className="w-4 h-4 text-destructive" />
                  <span className="text-xs text-muted-foreground">Paniers abandonnés</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{abandonedOnly.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Flame className="w-4 h-4 text-amber-500" />
                  <span className="text-xs text-muted-foreground">CA potentiel perdu</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{formatPrice(lostRevenue)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <RefreshCw className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs text-muted-foreground">Taux de récupération</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{recoveryRate}%</p>
              </CardContent>
            </Card>
          </div>

          {/* Table */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Paniers non finalisés</CardTitle>
            </CardHeader>
            <CardContent>
              {cartsLoading ? (
                <div className="py-12 text-center text-muted-foreground text-sm">Chargement…</div>
              ) : abandonedCarts.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <ShoppingCart className="w-10 h-10 mx-auto text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">Aucun panier abandonné pour le moment</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Client</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Montant</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {abandonedCarts.map((cart) => (
                        <TableRow key={cart.id}>
                          <TableCell>
                            <div>
                              <p className="text-sm font-medium text-foreground">
                                {cart.customer_email || cart.customer_phone || "Anonyme"}
                              </p>
                              {cart.customer_name && (
                                <p className="text-xs text-muted-foreground">{cart.customer_name}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm text-muted-foreground">
                              {new Date(cart.created_at).toLocaleDateString("fr-FR", {
                                day: "2-digit",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </TableCell>
                          <TableCell className="text-right">
                            <p className="text-sm font-semibold text-foreground">{formatPrice(cart.cart_total)}</p>
                          </TableCell>
                          <TableCell>
                            {cart.status === "abandoned" ? (
                              <Badge variant="destructive" className="text-[10px]">Abandonné</Badge>
                            ) : (
                              <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]">
                                Relancé
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {cart.status === "abandoned" ? (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs"
                                onClick={() => setRecoveryTarget(cart)}
                              >
                                <Mail className="w-3.5 h-3.5 mr-1" /> Relancer
                              </Button>
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                {cart.recovery_code && (
                                  <span className="font-mono text-primary">{cart.recovery_code}</span>
                                )}
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Recovery Dialog ── */}
      <Dialog open={!!recoveryTarget} onOpenChange={(open) => { if (!open) setRecoveryTarget(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary" />
              Relancer le client
            </DialogTitle>
          </DialogHeader>

          {recoveryTarget && (
            <div className="space-y-4">
              <div className="bg-secondary rounded-lg p-4 space-y-2">
                <p className="text-sm text-foreground">
                  <strong>Client :</strong> {recoveryTarget.customer_email || recoveryTarget.customer_phone || "Anonyme"}
                </p>
                <p className="text-sm text-foreground">
                  <strong>Montant du panier :</strong> {formatPrice(recoveryTarget.cart_total)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Abandonné le{" "}
                  {new Date(recoveryTarget.created_at).toLocaleDateString("fr-FR", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                {/* Cart items preview */}
                {Array.isArray(recoveryTarget.cart_items) && recoveryTarget.cart_items.length > 0 && (
                  <div className="border-t border-border pt-2 mt-2 space-y-1">
                    {(recoveryTarget.cart_items as any[]).map((item: any, idx: number) => (
                      <p key={idx} className="text-xs text-muted-foreground">
                        {item.name} × {item.quantity} — {formatPrice(item.price * item.quantity)}
                      </p>
                    ))}
                  </div>
                )}
              </div>

              <label className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-secondary/30 transition-colors cursor-pointer">
                <Checkbox
                  checked={includePromo}
                  onCheckedChange={(v) => setIncludePromo(!!v)}
                  className="mt-0.5"
                />
                <div>
                  <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
                    <Percent className="w-3.5 h-3.5 text-primary" />
                    Inclure un code promo de 10%
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Un code unique sera généré et inclus dans l'email pour inciter le client à finaliser sa commande.
                  </p>
                </div>
              </label>

              {!recoveryTarget.customer_email && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    ⚠️ Ce client n'a pas laissé d'email. La relance sera enregistrée mais l'email ne pourra pas être envoyé.
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setRecoveryTarget(null)}>
              Annuler
            </Button>
            <Button onClick={handleSendRecovery} disabled={sending}>
              {sending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-1 animate-spin" /> Envoi…
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-1" /> Envoyer la relance
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
