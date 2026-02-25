import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  RefreshCw, DollarSign, ShoppingCart, AlertTriangle, Shield, Truck, Activity,
  Zap, Clock, XCircle, CheckCircle2, Users, Store, Gauge, Skull
} from "lucide-react";

interface HealthMetrics {
  gmv_current_month: number;
  gmv_previous_month: number;
  active_orders: number;
  failed_events_24h: number;
  total_events_24h: number;
  escrow_held_count: number;
  escrow_held_amount: number;
  escrow_total_count: number;
  payouts_pending: number;
  payouts_pending_amount: number;
  outbound_delivered: number;
  outbound_on_time: number;
  outbound_total: number;
  orders_delivered: number;
  orders_total: number;
  dead_letter_count: number;
  active_stores: number;
  total_users: number;
  avg_event_latency_ms: number;
}

interface DeadEvent {
  id: string;
  event_type: string;
  aggregate_type: string;
  error_message: string | null;
  retry_count: number;
  created_at: string;
  store_id: string | null;
}

const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(n);
const fmtCurrency = (n: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF", maximumFractionDigits: 0 }).format(n);
const pct = (a: number, b: number) => b > 0 ? Math.round((a / b) * 100) : 0;

export default function AdminSystemHealth() {
  const [metrics, setMetrics] = useState<HealthMetrics | null>(null);
  const [deadEvents, setDeadEvents] = useState<DeadEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    const [{ data: health }, { data: dead }] = await Promise.all([
      supabase.rpc("get_system_health" as any),
      supabase
        .from("events_log")
        .select("id, event_type, aggregate_type, error_message, retry_count, created_at, store_id")
        .eq("status", "max_retries_exceeded")
        .order("created_at", { ascending: false })
        .limit(20),
    ]);
    if (health) setMetrics(health as any);
    setDeadEvents((dead as any[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  if (!metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="animate-spin text-muted-foreground" size={24} />
      </div>
    );
  }

  const failureRate = pct(metrics.failed_events_24h, metrics.total_events_24h);
  const escrowFrozenPct = pct(metrics.escrow_held_count, metrics.escrow_total_count);
  const slaCompliance = pct(metrics.outbound_on_time, metrics.outbound_delivered);
  const deliverySuccessRate = pct(metrics.orders_delivered, metrics.orders_total);
  const gmvGrowth = metrics.gmv_previous_month > 0
    ? Math.round(((metrics.gmv_current_month - metrics.gmv_previous_month) / metrics.gmv_previous_month) * 100)
    : 0;

  const kpis = [
    { label: "GMV (mois)", value: fmtCurrency(metrics.gmv_current_month), sub: `${gmvGrowth >= 0 ? "+" : ""}${gmvGrowth}% vs mois précédent`, icon: DollarSign, color: "text-green-600" },
    { label: "Commandes actives", value: fmt(metrics.active_orders), sub: `${fmt(metrics.orders_total)} total`, icon: ShoppingCart, color: "text-blue-600" },
    { label: "Workflow Failure Rate", value: `${failureRate}%`, sub: `${metrics.failed_events_24h}/${metrics.total_events_24h} (24h)`, icon: AlertTriangle, color: failureRate > 5 ? "text-red-600" : "text-green-600" },
    { label: "Escrow Frozen", value: `${escrowFrozenPct}%`, sub: fmtCurrency(metrics.escrow_held_amount), icon: Shield, color: escrowFrozenPct > 30 ? "text-amber-600" : "text-green-600" },
    { label: "Payouts Blocked", value: fmt(metrics.payouts_pending), sub: fmtCurrency(metrics.payouts_pending_amount), icon: Clock, color: metrics.payouts_pending > 10 ? "text-amber-600" : "text-muted-foreground" },
    { label: "SLA Compliance", value: `${slaCompliance}%`, sub: `${metrics.outbound_on_time}/${metrics.outbound_delivered} on time`, icon: Gauge, color: slaCompliance >= 95 ? "text-green-600" : slaCompliance >= 80 ? "text-amber-600" : "text-red-600" },
    { label: "Delivery Success", value: `${deliverySuccessRate}%`, sub: `${fmt(metrics.orders_delivered)} livrées`, icon: Truck, color: "text-green-600" },
    { label: "Latence moyenne", value: `${Math.round(metrics.avg_event_latency_ms)}ms`, sub: "Traitement événements (24h)", icon: Zap, color: metrics.avg_event_latency_ms < 2000 ? "text-green-600" : "text-amber-600" },
  ];

  const platformStats = [
    { label: "Boutiques actives", value: fmt(metrics.active_stores), icon: Store },
    { label: "Utilisateurs", value: fmt(metrics.total_users), icon: Users },
    { label: "Dead Letter Queue", value: fmt(metrics.dead_letter_count), icon: Skull, color: metrics.dead_letter_count > 0 ? "text-red-600" : "text-green-600" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">System Health</h1>
          <p className="text-muted-foreground text-sm">Vue temps réel de l'infrastructure Feyxa</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Rafraîchir
        </Button>
      </div>

      {/* Main KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <kpi.icon size={14} className={kpi.color} />
                {kpi.label}
              </div>
              <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{kpi.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Platform Stats */}
      <div className="grid grid-cols-3 gap-4">
        {platformStats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-4 pb-3 px-4 flex items-center gap-3">
              <stat.icon size={20} className={stat.color || "text-muted-foreground"} />
              <div>
                <p className={`text-lg font-bold ${stat.color || ""}`}>{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* System Status Indicators */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity size={16} /> Indicateurs système
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Event Bus", ok: failureRate < 10, detail: `${failureRate}% failure` },
              { label: "Escrow Engine", ok: escrowFrozenPct < 50, detail: `${escrowFrozenPct}% frozen` },
              { label: "Payout System", ok: metrics.payouts_pending < 20, detail: `${metrics.payouts_pending} pending` },
              { label: "Fulfillment SLA", ok: slaCompliance >= 80, detail: `${slaCompliance}% on time` },
            ].map((sys) => (
              <div key={sys.label} className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                {sys.ok ? <CheckCircle2 size={16} className="text-green-600" /> : <XCircle size={16} className="text-red-600" />}
                <div>
                  <p className="text-sm font-medium">{sys.label}</p>
                  <p className="text-xs text-muted-foreground">{sys.detail}</p>
                </div>
                <Badge variant="outline" className={`ml-auto text-xs ${sys.ok ? "text-green-600 border-green-500/30" : "text-red-600 border-red-500/30"}`}>
                  {sys.ok ? "OK" : "ALERT"}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Dead Letter Queue */}
      {deadEvents.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-red-600">
              <Skull size={16} /> Dead Letter Queue ({deadEvents.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Aggregate</TableHead>
                    <TableHead>Retries</TableHead>
                    <TableHead>Erreur</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deadEvents.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell>
                        <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">{e.event_type}</code>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{e.aggregate_type}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-red-600 border-red-500/30">{e.retry_count}</Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                        {e.error_message || "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(e.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
