import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Sparkles, Package, Truck, AlertTriangle, TrendingUp,
  Phone, Star, RefreshCw, Zap, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const iconMap: Record<string, React.ElementType> = {
  package: Package,
  truck: Truck,
  alert: AlertTriangle,
  "trending-up": TrendingUp,
  phone: Phone,
  star: Star,
};

const priorityStyles: Record<string, string> = {
  high: "border-destructive/30 bg-destructive/5",
  medium: "border-primary/30 bg-primary/5",
  low: "border-border bg-secondary/30",
};

const priorityBadge: Record<string, { label: string; className: string }> = {
  high: { label: "Urgent", className: "bg-destructive/10 text-destructive" },
  medium: { label: "Important", className: "bg-primary/10 text-primary" },
  low: { label: "À planifier", className: "bg-muted text-muted-foreground" },
};

interface SmartOpsData {
  metrics: {
    todayRevenue: number;
    todayOrders: number;
    weekRevenue: number;
    weekOrders: number;
    newOrders: number;
    toShip: number;
    lowStockCount: number;
    lowStockItems: string[];
    codPending: number;
    currency: string;
    storeName: string;
  };
  ai: {
    summary: string;
    actions: Array<{
      title: string;
      description: string;
      priority: string;
      icon: string;
    }>;
  } | null;
}

export default function SmartOpsWidget() {
  const { session } = useAuth();
  const [data, setData] = useState<SmartOpsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSmartOps = async () => {
    if (!session) return;
    setLoading(true);
    setError(null);

    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke("smart-ops", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (fnError) throw fnError;
      if (fnData?.error) throw new Error(fnData.error);
      setData(fnData);
    } catch (e: any) {
      console.error("Smart Ops error:", e);
      setError(e.message || "Erreur lors du chargement");
      toast.error("Impossible de charger Smart Ops");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSmartOps();
  }, [session]);

  if (!session) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 overflow-hidden"
    >
      {/* Header */}
      <div className="p-5 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Sparkles size={18} className="text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              Feyxa Smart Ops
              <span className="text-[10px] font-medium bg-primary/10 text-primary px-1.5 py-0.5 rounded-full uppercase tracking-wider">IA</span>
            </h2>
            <p className="text-xs text-muted-foreground">Résumé intelligent de votre journée</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchSmartOps}
          disabled={loading}
          className="text-muted-foreground"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </Button>
      </div>

      {/* Content */}
      <div className="p-5">
        <AnimatePresence mode="wait">
          {loading && !data && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-8 gap-3"
            >
              <div className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <p className="text-sm text-muted-foreground">L'IA analyse votre boutique...</p>
            </motion.div>
          )}

          {error && !data && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-6"
            >
              <p className="text-sm text-muted-foreground">{error}</p>
              <Button variant="outline" size="sm" onClick={fetchSmartOps} className="mt-3">
                Réessayer
              </Button>
            </motion.div>
          )}

          {data && (
            <motion.div
              key="data"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-5"
            >
              {/* Metrics row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <MetricCard label="Revenu du jour" value={`${data.metrics.todayRevenue.toLocaleString()} ${data.metrics.currency}`} />
                <MetricCard label="Commandes" value={String(data.metrics.todayOrders)} />
                <MetricCard label="À expédier" value={String(data.metrics.toShip)} highlight={data.metrics.toShip > 0} />
                <MetricCard label="Stock faible" value={String(data.metrics.lowStockCount)} highlight={data.metrics.lowStockCount > 0} />
              </div>

              {/* AI summary */}
              {data.ai && (
                <>
                  <div className="rounded-lg bg-secondary/50 p-4">
                    <div className="flex items-start gap-2">
                      <Zap size={14} className="text-primary mt-0.5 shrink-0" />
                      <p className="text-sm text-foreground leading-relaxed">{data.ai.summary}</p>
                    </div>
                  </div>

                  {/* Priority actions */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Actions prioritaires
                    </h3>
                    {data.ai.actions.map((action, i) => {
                      const Icon = iconMap[action.icon] || Star;
                      const badge = priorityBadge[action.priority] || priorityBadge.low;
                      return (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className={`rounded-lg border p-4 ${priorityStyles[action.priority] || priorityStyles.low}`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="h-8 w-8 rounded-lg bg-card flex items-center justify-center shrink-0 mt-0.5">
                              <Icon size={14} className="text-foreground" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium text-foreground">{action.title}</span>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${badge.className}`}>
                                  {badge.label}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground leading-relaxed">{action.description}</p>
                            </div>
                            <ChevronRight size={14} className="text-muted-foreground shrink-0 mt-1" />
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function MetricCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-lg p-3 ${highlight ? "bg-destructive/5 border border-destructive/20" : "bg-secondary/50"}`}>
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className={`text-lg font-bold mt-0.5 ${highlight ? "text-destructive" : "text-foreground"}`}>{value}</p>
    </div>
  );
}
