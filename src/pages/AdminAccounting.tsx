import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  Calculator, TrendingUp, Download, DollarSign, Percent, Store, ShoppingCart, Loader2, Users,
} from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth, startOfYear, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

const PERIOD_OPTIONS = [
  { value: "7d", label: "7 jours" },
  { value: "30d", label: "30 jours" },
  { value: "month", label: "Ce mois" },
  { value: "year", label: "Cette année" },
];

export default function AdminAccounting() {
  const [period, setPeriod] = useState("30d");

  const formatPrice = (amount: number, currency = "XOF") =>
    currency === "XOF"
      ? `${Math.round(amount).toLocaleString("fr-FR")} FCFA`
      : `€${amount.toFixed(2)}`;

  const dateRange = useMemo(() => {
    const now = new Date();
    if (period === "7d") return { from: subDays(now, 7), to: now };
    if (period === "30d") return { from: subDays(now, 30), to: now };
    if (period === "month") return { from: startOfMonth(now), to: endOfMonth(now) };
    return { from: startOfYear(now), to: now };
  }, [period]);

  // Global orders
  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ["admin-accounting-orders", period],
    queryFn: async () => {
      const { data } = await supabase
        .from("orders")
        .select("id, total, subtotal, shipping_cost, discount_amount, status, payment_status, created_at, store_id, currency")
        .gte("created_at", dateRange.from.toISOString())
        .lte("created_at", dateRange.to.toISOString())
        .order("created_at", { ascending: true });
      return data ?? [];
    },
  });

  // All escrow records
  const { data: escrows = [] } = useQuery({
    queryKey: ["admin-accounting-escrows", period],
    queryFn: async () => {
      const { data } = await supabase
        .from("escrow_records")
        .select("id, amount, commission_amount, commission_rate, status, store_id, created_at")
        .gte("created_at", dateRange.from.toISOString())
        .lte("created_at", dateRange.to.toISOString());
      return data ?? [];
    },
  });

  // All payouts
  const { data: payouts = [] } = useQuery({
    queryKey: ["admin-accounting-payouts", period],
    queryFn: async () => {
      const { data } = await supabase
        .from("payout_requests")
        .select("*, stores!inner(name, slug, currency)")
        .gte("created_at", dateRange.from.toISOString())
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  // Stores for vendor breakdown
  const { data: stores = [] } = useQuery({
    queryKey: ["admin-accounting-stores"],
    queryFn: async () => {
      const { data } = await supabase
        .from("stores")
        .select("id, name, slug, currency, is_active")
        .eq("is_active", true)
        .order("name");
      return data ?? [];
    },
  });

  // Stats
  const stats = useMemo(() => {
    const paidOrders = orders.filter((o: any) => o.payment_status === "paid" || o.status === "delivered");
    const totalGMV = paidOrders.reduce((s: number, o: any) => s + (o.total || 0), 0);
    const totalCommissions = escrows.reduce((s: number, e: any) => s + (e.commission_amount || 0), 0);
    const totalPaidOut = payouts.filter((p: any) => p.status === "paid").reduce((s: number, p: any) => s + (p.amount || 0), 0);
    const pendingPayouts = payouts.filter((p: any) => p.status === "pending").reduce((s: number, p: any) => s + (p.amount || 0), 0);
    return { totalGMV, totalCommissions, totalPaidOut, pendingPayouts, orderCount: paidOrders.length };
  }, [orders, escrows, payouts]);

  // Revenue chart
  const revenueChartData = useMemo(() => {
    const map: Record<string, { gmv: number; commissions: number }> = {};
    orders.filter((o: any) => o.payment_status === "paid" || o.status === "delivered").forEach((o: any) => {
      const day = format(parseISO(o.created_at), "dd/MM");
      if (!map[day]) map[day] = { gmv: 0, commissions: 0 };
      map[day].gmv += o.total || 0;
    });
    escrows.forEach((e: any) => {
      const day = format(parseISO(e.created_at), "dd/MM");
      if (!map[day]) map[day] = { gmv: 0, commissions: 0 };
      map[day].commissions += e.commission_amount || 0;
    });
    return Object.entries(map).map(([date, v]) => ({ date, ...v }));
  }, [orders, escrows]);

  // Top vendors by revenue
  const vendorBreakdown = useMemo(() => {
    const map: Record<string, { name: string; revenue: number; commissions: number; orders: number }> = {};
    const paidOrders = orders.filter((o: any) => o.payment_status === "paid" || o.status === "delivered");
    paidOrders.forEach((o: any) => {
      if (!map[o.store_id]) {
        const s = stores.find((s: any) => s.id === o.store_id);
        map[o.store_id] = { name: s?.name || "Inconnu", revenue: 0, commissions: 0, orders: 0 };
      }
      map[o.store_id].revenue += o.total || 0;
      map[o.store_id].orders += 1;
    });
    escrows.forEach((e: any) => {
      if (map[e.store_id]) map[e.store_id].commissions += e.commission_amount || 0;
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, 15);
  }, [orders, escrows, stores]);

  // Export
  const exportCSV = () => {
    const rows = [["Boutique", "Revenus", "Commissions", "Nb Commandes"]];
    vendorBreakdown.forEach(v => {
      rows.push([v.name, String(v.revenue), String(v.commissions), String(v.orders)]);
    });
    const csv = rows.map(r => r.join(";")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `admin-comptabilite-${period}.csv`;
    a.click();
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <Calculator size={22} className="text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Comptabilité Marketplace</h1>
            <p className="text-sm text-muted-foreground">Vision globale des finances de la plateforme</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERIOD_OPTIONS.map(p => (
                <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download size={14} className="mr-1" /> Export
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <ShoppingCart size={15} className="text-primary" />
              <p className="text-xs text-muted-foreground">GMV (Volume total)</p>
            </div>
            <p className="text-xl font-bold text-foreground">{formatPrice(stats.totalGMV)}</p>
            <p className="text-[11px] text-muted-foreground mt-1">{stats.orderCount} commandes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <Percent size={15} className="text-emerald-500" />
              <p className="text-xs text-muted-foreground">Commissions perçues</p>
            </div>
            <p className="text-xl font-bold text-emerald-500">{formatPrice(stats.totalCommissions)}</p>
            <p className="text-[11px] text-muted-foreground mt-1">Revenus marketplace</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign size={15} className="text-blue-500" />
              <p className="text-xs text-muted-foreground">Payé aux vendeurs</p>
            </div>
            <p className="text-xl font-bold text-blue-500">{formatPrice(stats.totalPaidOut)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp size={15} className="text-amber-500" />
              <p className="text-xs text-muted-foreground">Retraits en attente</p>
            </div>
            <p className="text-xl font-bold text-amber-500">{formatPrice(stats.pendingPayouts)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="vendors">Par vendeur</TabsTrigger>
          <TabsTrigger value="payouts">Paiements vendeurs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">GMV & Commissions par jour</CardTitle>
            </CardHeader>
            <CardContent>
              {revenueChartData.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">Aucune donnée</p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={revenueChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} />
                    <Bar dataKey="gmv" name="GMV" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="commissions" name="Commissions" fill="hsl(142,70%,45%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Vendor breakdown */}
        <TabsContent value="vendors" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Users size={16} /> Performance par vendeur
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {vendorBreakdown.length === 0 ? (
                <p className="text-sm text-muted-foreground py-10 text-center">Aucune donnée</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>#</TableHead>
                        <TableHead>Boutique</TableHead>
                        <TableHead className="text-right">Revenus</TableHead>
                        <TableHead className="text-right">Commissions</TableHead>
                        <TableHead className="text-right">Commandes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vendorBreakdown.map((v, i) => (
                        <TableRow key={i}>
                          <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                          <TableCell className="font-medium">{v.name}</TableCell>
                          <TableCell className="text-right font-mono">{formatPrice(v.revenue)}</TableCell>
                          <TableCell className="text-right font-mono text-emerald-500">{formatPrice(v.commissions)}</TableCell>
                          <TableCell className="text-right">{v.orders}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payouts */}
        <TabsContent value="payouts" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Historique des paiements vendeurs</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {payouts.length === 0 ? (
                <p className="text-sm text-muted-foreground py-10 text-center">Aucun paiement</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Boutique</TableHead>
                        <TableHead className="text-right">Montant</TableHead>
                        <TableHead>Méthode</TableHead>
                        <TableHead>Statut</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payouts.map((p: any) => (
                        <TableRow key={p.id}>
                          <TableCell className="text-sm whitespace-nowrap">{format(parseISO(p.created_at), "dd MMM yyyy", { locale: fr })}</TableCell>
                          <TableCell className="font-medium">{(p.stores as any)?.name || "—"}</TableCell>
                          <TableCell className="text-right font-mono">{formatPrice(p.amount, (p.stores as any)?.currency)}</TableCell>
                          <TableCell className="text-sm capitalize">{p.payment_method?.replace("_", " ") || "—"}</TableCell>
                          <TableCell>
                            <Badge variant={p.status === "paid" ? "default" : p.status === "rejected" ? "destructive" : "secondary"} className="text-xs">
                              {p.status === "pending" ? "En attente" : p.status === "approved" ? "Approuvé" : p.status === "paid" ? "Payé" : "Rejeté"}
                            </Badge>
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
    </div>
  );
}
