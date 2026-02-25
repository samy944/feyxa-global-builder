import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/hooks/useStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import {
  Calculator, TrendingUp, Receipt, Download, Plus, ArrowUpCircle, ArrowDownCircle, Loader2, DollarSign, Percent, Package, Filter,
} from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth, startOfYear, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

const EXPENSE_CATEGORIES = [
  { value: "shipping", label: "Livraison" },
  { value: "advertising", label: "Publicité" },
  { value: "packaging", label: "Emballage" },
  { value: "supplies", label: "Fournitures" },
  { value: "refund", label: "Remboursement" },
  { value: "other", label: "Autre" },
];

const PERIOD_OPTIONS = [
  { value: "7d", label: "7 jours" },
  { value: "30d", label: "30 jours" },
  { value: "month", label: "Ce mois" },
  { value: "year", label: "Cette année" },
];

export default function DashboardAccounting() {
  const { store } = useStore();
  const queryClient = useQueryClient();
  const [period, setPeriod] = useState("30d");
  const [showExpenseDialog, setShowExpenseDialog] = useState(false);
  const [expenseForm, setExpenseForm] = useState({ label: "", amount: "", category: "other", notes: "", expense_date: format(new Date(), "yyyy-MM-dd") });

  const currency = store?.currency || "XOF";
  const formatPrice = (amount: number) =>
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

  // Fetch orders for revenue
  const { data: orders = [] } = useQuery({
    queryKey: ["accounting-orders", store?.id, period],
    queryFn: async () => {
      if (!store?.id) return [];
      const { data } = await supabase
        .from("orders")
        .select("id, total, subtotal, shipping_cost, discount_amount, status, payment_status, created_at, currency")
        .eq("store_id", store.id)
        .gte("created_at", dateRange.from.toISOString())
        .lte("created_at", dateRange.to.toISOString())
        .order("created_at", { ascending: true });
      return data ?? [];
    },
    enabled: !!store?.id,
  });

  // Fetch escrow records for commissions
  const { data: escrows = [] } = useQuery({
    queryKey: ["accounting-escrows", store?.id, period],
    queryFn: async () => {
      if (!store?.id) return [];
      const { data } = await supabase
        .from("escrow_records")
        .select("id, amount, commission_amount, commission_rate, status, created_at")
        .eq("store_id", store.id)
        .gte("created_at", dateRange.from.toISOString())
        .lte("created_at", dateRange.to.toISOString());
      return data ?? [];
    },
    enabled: !!store?.id,
  });

  // Fetch wallet transactions
  const { data: wallet } = useQuery({
    queryKey: ["accounting-wallet", store?.id],
    queryFn: async () => {
      if (!store?.id) return null;
      await supabase.rpc("ensure_wallet", { _store_id: store.id });
      const { data } = await supabase
        .from("wallets")
        .select("*")
        .eq("store_id", store.id)
        .maybeSingle();
      return data;
    },
    enabled: !!store?.id,
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ["accounting-transactions", wallet?.id, period],
    queryFn: async () => {
      if (!wallet?.id) return [];
      const { data } = await supabase
        .from("wallet_transactions")
        .select("*")
        .eq("wallet_id", wallet.id)
        .gte("created_at", dateRange.from.toISOString())
        .order("created_at", { ascending: false })
        .limit(200);
      return data ?? [];
    },
    enabled: !!wallet?.id,
  });

  // Fetch vendor expenses
  const { data: expenses = [] } = useQuery({
    queryKey: ["vendor-expenses", store?.id, period],
    queryFn: async () => {
      if (!store?.id) return [];
      const { data } = await supabase
        .from("vendor_expenses")
        .select("*")
        .eq("store_id", store.id)
        .gte("expense_date", format(dateRange.from, "yyyy-MM-dd"))
        .lte("expense_date", format(dateRange.to, "yyyy-MM-dd"))
        .order("expense_date", { ascending: false });
      return data ?? [];
    },
    enabled: !!store?.id,
  });

  // Fetch payouts
  const { data: payouts = [] } = useQuery({
    queryKey: ["accounting-payouts", store?.id, period],
    queryFn: async () => {
      if (!store?.id) return [];
      const { data } = await supabase
        .from("payout_requests")
        .select("*")
        .eq("store_id", store.id)
        .gte("created_at", dateRange.from.toISOString())
        .order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!store?.id,
  });

  // Add expense mutation
  const addExpense = useMutation({
    mutationFn: async () => {
      if (!store?.id) throw new Error("No store");
      const { error } = await supabase.from("vendor_expenses").insert({
        store_id: store.id,
        label: expenseForm.label,
        amount: parseFloat(expenseForm.amount),
        category: expenseForm.category,
        notes: expenseForm.notes || null,
        expense_date: expenseForm.expense_date,
        currency,
        created_by: (await supabase.auth.getUser()).data.user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Dépense ajoutée" });
      queryClient.invalidateQueries({ queryKey: ["vendor-expenses"] });
      setShowExpenseDialog(false);
      setExpenseForm({ label: "", amount: "", category: "other", notes: "", expense_date: format(new Date(), "yyyy-MM-dd") });
    },
    onError: () => toast({ title: "Erreur", variant: "destructive" }),
  });

  // Computed stats
  const stats = useMemo(() => {
    const paidOrders = orders.filter((o: any) => o.payment_status === "paid" || o.status === "delivered");
    const totalRevenue = paidOrders.reduce((s: number, o: any) => s + (o.total || 0), 0);
    const totalSubtotal = paidOrders.reduce((s: number, o: any) => s + (o.subtotal || 0), 0);
    const totalShipping = paidOrders.reduce((s: number, o: any) => s + (o.shipping_cost || 0), 0);
    const totalDiscount = paidOrders.reduce((s: number, o: any) => s + (o.discount_amount || 0), 0);
    const totalCommissions = escrows.reduce((s: number, e: any) => s + (e.commission_amount || 0), 0);
    const totalExpenses = expenses.reduce((s: number, e: any) => s + (e.amount || 0), 0);
    const netProfit = totalRevenue - totalCommissions - totalExpenses;
    const totalRefunds = transactions.filter((t: any) => t.type === "refund").reduce((s: number, t: any) => s + Math.abs(t.amount || 0), 0);
    return { totalRevenue, totalSubtotal, totalShipping, totalDiscount, totalCommissions, totalExpenses, netProfit, totalRefunds, orderCount: paidOrders.length };
  }, [orders, escrows, expenses, transactions]);

  // Revenue chart data by day
  const revenueChartData = useMemo(() => {
    const map: Record<string, number> = {};
    orders.filter((o: any) => o.payment_status === "paid" || o.status === "delivered").forEach((o: any) => {
      const day = format(parseISO(o.created_at), "dd/MM");
      map[day] = (map[day] || 0) + (o.total || 0);
    });
    return Object.entries(map).map(([date, revenue]) => ({ date, revenue }));
  }, [orders]);

  // Expense breakdown by category
  const expenseBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach((e: any) => {
      map[e.category] = (map[e.category] || 0) + (e.amount || 0);
    });
    return Object.entries(map).map(([category, amount]) => ({
      name: EXPENSE_CATEGORIES.find(c => c.value === category)?.label || category,
      value: amount,
    }));
  }, [expenses]);

  const PIE_COLORS = ["hsl(142,70%,45%)", "hsl(217,70%,55%)", "hsl(35,90%,55%)", "hsl(0,70%,55%)", "hsl(270,60%,55%)", "hsl(180,50%,45%)"];

  // Export CSV
  const exportCSV = () => {
    const rows = [["Date", "Type", "Description", "Montant", "Devise"]];
    transactions.forEach((t: any) => {
      rows.push([format(parseISO(t.created_at), "dd/MM/yyyy"), t.type, t.description || "", String(t.amount), currency]);
    });
    expenses.forEach((e: any) => {
      rows.push([e.expense_date, "expense", e.label, `-${e.amount}`, e.currency]);
    });
    const csv = rows.map(r => r.join(";")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `comptabilite-${store?.slug}-${period}.csv`;
    a.click();
  };

  if (!store) return null;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <Calculator size={22} className="text-primary" />
          <h1 className="font-heading text-2xl tracking-wide text-foreground">COMPTABILITÉ</h1>
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
            <Download size={14} className="mr-1" /> Export CSV
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign size={15} className="text-emerald-500" />
              <p className="text-xs text-muted-foreground">Revenus</p>
            </div>
            <p className="text-xl font-bold text-foreground">{formatPrice(stats.totalRevenue)}</p>
            <p className="text-[11px] text-muted-foreground mt-1">{stats.orderCount} commandes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <Percent size={15} className="text-red-500" />
              <p className="text-xs text-muted-foreground">Commissions</p>
            </div>
            <p className="text-xl font-bold text-red-500">{formatPrice(stats.totalCommissions)}</p>
            <p className="text-[11px] text-muted-foreground mt-1">Frais marketplace</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <Receipt size={15} className="text-amber-500" />
              <p className="text-xs text-muted-foreground">Dépenses</p>
            </div>
            <p className="text-xl font-bold text-amber-500">{formatPrice(stats.totalExpenses)}</p>
            <p className="text-[11px] text-muted-foreground mt-1">{expenses.length} entrées</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp size={15} className="text-primary" />
              <p className="text-xs text-muted-foreground">Bénéfice net</p>
            </div>
            <p className={`text-xl font-bold ${stats.netProfit >= 0 ? "text-emerald-500" : "text-red-500"}`}>
              {formatPrice(stats.netProfit)}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">Après commissions & dépenses</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="expenses">Dépenses</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="taxes">Taxes & Commissions</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid lg:grid-cols-2 gap-4">
            {/* Revenue Chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Revenus par jour</CardTitle>
              </CardHeader>
              <CardContent>
                {revenueChartData.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">Aucune donnée</p>
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={revenueChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                      <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} />
                      <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Expense Breakdown */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Répartition des dépenses</CardTitle>
              </CardHeader>
              <CardContent>
                {expenseBreakdown.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">Aucune dépense</p>
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={expenseBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                        {expenseBreakdown.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Summary table */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Récapitulatif financier</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                {[
                  { label: "Chiffre d'affaires brut", value: stats.totalRevenue, color: "text-foreground" },
                  { label: "Dont frais de livraison", value: stats.totalShipping, color: "text-muted-foreground" },
                  { label: "Remises accordées", value: -stats.totalDiscount, color: "text-amber-500" },
                  { label: "Commissions marketplace", value: -stats.totalCommissions, color: "text-red-500" },
                  { label: "Remboursements", value: -stats.totalRefunds, color: "text-red-500" },
                  { label: "Dépenses opérationnelles", value: -stats.totalExpenses, color: "text-amber-500" },
                ].map((row, i) => (
                  <div key={i} className="flex justify-between py-1.5 border-b border-border/40 last:border-0">
                    <span className="text-muted-foreground">{row.label}</span>
                    <span className={`font-medium ${row.color}`}>
                      {row.value >= 0 ? "+" : ""}{formatPrice(row.value)}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between py-2 font-bold text-base border-t-2 border-border">
                  <span className="text-foreground">Bénéfice net</span>
                  <span className={stats.netProfit >= 0 ? "text-emerald-500" : "text-red-500"}>
                    {formatPrice(stats.netProfit)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Expenses Tab */}
        <TabsContent value="expenses" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-foreground">Dépenses</h2>
            <Button size="sm" onClick={() => setShowExpenseDialog(true)}>
              <Plus size={14} className="mr-1" /> Ajouter
            </Button>
          </div>
          <Card>
            <CardContent className="p-0">
              {expenses.length === 0 ? (
                <p className="text-sm text-muted-foreground py-10 text-center">Aucune dépense enregistrée</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Libellé</TableHead>
                        <TableHead>Catégorie</TableHead>
                        <TableHead className="text-right">Montant</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {expenses.map((e: any) => (
                        <TableRow key={e.id}>
                          <TableCell className="text-sm whitespace-nowrap">{format(parseISO(e.expense_date), "dd MMM yyyy", { locale: fr })}</TableCell>
                          <TableCell className="font-medium">{e.label}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {EXPENSE_CATEGORIES.find(c => c.value === e.category)?.label || e.category}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono text-red-500">-{formatPrice(e.amount)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Historique des transactions</CardTitle>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <p className="text-sm text-muted-foreground py-10 text-center">Aucune transaction</p>
              ) : (
                <div className="space-y-1.5 max-h-[500px] overflow-y-auto">
                  {transactions.map((tx: any) => (
                    <div key={tx.id} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
                      <div className="flex items-center gap-3">
                        {tx.amount >= 0 ? <ArrowDownCircle size={15} className="text-emerald-500" /> : <ArrowUpCircle size={15} className="text-red-500" />}
                        <div>
                          <p className="text-sm text-foreground">{tx.description || tx.type}</p>
                          <p className="text-xs text-muted-foreground">{format(parseISO(tx.created_at), "dd MMM yyyy HH:mm", { locale: fr })}</p>
                        </div>
                      </div>
                      <span className={`text-sm font-mono font-medium ${tx.amount >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                        {tx.amount >= 0 ? "+" : ""}{formatPrice(Math.abs(tx.amount))}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Taxes & Commissions Tab */}
        <TabsContent value="taxes" className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Commissions marketplace</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-red-500">{formatPrice(stats.totalCommissions)}</p>
                <p className="text-xs text-muted-foreground mt-1">Sur {escrows.length} transactions escrow</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Taux de commission moyen</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-foreground">
                  {escrows.length > 0
                    ? `${(escrows.reduce((s: number, e: any) => s + (e.commission_rate || 0), 0) / escrows.length * 100).toFixed(1)}%`
                    : "—"}
                </p>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Détail des commissions</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {escrows.length === 0 ? (
                <p className="text-sm text-muted-foreground py-10 text-center">Aucune commission</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="text-right">Montant brut</TableHead>
                        <TableHead className="text-right">Commission</TableHead>
                        <TableHead className="text-right">Net vendeur</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {escrows.map((e: any) => (
                        <TableRow key={e.id}>
                          <TableCell className="text-sm whitespace-nowrap">{format(parseISO(e.created_at), "dd MMM yyyy", { locale: fr })}</TableCell>
                          <TableCell>
                            <Badge variant={e.status === "released" ? "default" : "secondary"} className="text-xs">
                              {e.status === "released" ? "Libéré" : e.status === "held" ? "En attente" : e.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono">{formatPrice(e.amount + e.commission_amount)}</TableCell>
                          <TableCell className="text-right font-mono text-red-500">-{formatPrice(e.commission_amount)}</TableCell>
                          <TableCell className="text-right font-mono text-emerald-500">{formatPrice(e.amount)}</TableCell>
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

      {/* Add Expense Dialog */}
      <Dialog open={showExpenseDialog} onOpenChange={setShowExpenseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter une dépense</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-muted-foreground">Libellé</label>
              <Input value={expenseForm.label} onChange={e => setExpenseForm(f => ({ ...f, label: e.target.value }))} placeholder="Ex: Frais livraison DHL" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-muted-foreground">Montant ({currency})</label>
                <Input type="number" value={expenseForm.amount} onChange={e => setExpenseForm(f => ({ ...f, amount: e.target.value }))} placeholder="5000" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Catégorie</label>
                <Select value={expenseForm.category} onValueChange={v => setExpenseForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map(c => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Date</label>
              <Input type="date" value={expenseForm.expense_date} onChange={e => setExpenseForm(f => ({ ...f, expense_date: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Notes (optionnel)</label>
              <Textarea value={expenseForm.notes} onChange={e => setExpenseForm(f => ({ ...f, notes: e.target.value }))} placeholder="Détails..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExpenseDialog(false)}>Annuler</Button>
            <Button onClick={() => addExpense.mutate()} disabled={!expenseForm.label || !expenseForm.amount || addExpense.isPending}>
              {addExpense.isPending && <Loader2 size={14} className="animate-spin mr-1" />}
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
