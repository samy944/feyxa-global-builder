import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { Loader2, RotateCcw, ArrowLeft, Shield, AlertTriangle } from "lucide-react";

interface ReturnRow {
  id: string;
  reason: string;
  description: string | null;
  status: string;
  created_at: string;
  order_id: string;
  buyer_id: string;
  seller_id: string;
  store_id: string;
  admin_notes: string | null;
  orders: { order_number: string } | null;
  stores: { name: string } | null;
}

const statusLabels: Record<string, string> = {
  requested: "Demandé",
  reviewing: "En examen",
  approved: "Approuvé",
  rejected: "Rejeté",
  received: "Reçu",
  refunded: "Remboursé",
};

const statusColors: Record<string, string> = {
  requested: "bg-blue-500/10 text-blue-500",
  reviewing: "bg-yellow-500/10 text-yellow-500",
  approved: "bg-primary/10 text-primary",
  rejected: "bg-destructive/10 text-destructive",
  received: "bg-orange-500/10 text-orange-500",
  refunded: "bg-primary/10 text-primary",
};

const reasonLabels: Record<string, string> = {
  defective: "Défectueux",
  wrong_item: "Mauvais article",
  not_as_described: "Non conforme",
  damaged: "Endommagé",
  changed_mind: "Changement d'avis",
  other: "Autre",
};

export default function AdminReturns() {
  const [returns, setReturns] = useState<ReturnRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("requested");

  useEffect(() => { fetchReturns(); }, []);

  const fetchReturns = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("return_requests" as any)
      .select("id, reason, description, status, created_at, order_id, buyer_id, seller_id, store_id, admin_notes, orders(order_number), stores(name)")
      .order("created_at", { ascending: false })
      .limit(200);
    setReturns((data as any) || []);
    setLoading(false);
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("return_requests" as any).update({ status } as any).eq("id", id);

    // If refunded, update order status
    if (status === "refunded") {
      const ret = returns.find((r) => r.id === id);
      if (ret) {
        await supabase.from("orders").update({ status: "refunded" as any }).eq("id", ret.order_id);
      }
    }
    fetchReturns();
  };

  const filtered = returns.filter((r) => filterStatus === "all" || r.status === filterStatus);

  if (loading) {
    return <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Shield size={20} className="text-primary" />
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Retours & Litiges</h1>
          <p className="text-sm text-muted-foreground">{returns.length} demande{returns.length > 1 ? "s" : ""}</p>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {["all", "requested", "reviewing", "approved", "rejected", "received", "refunded"].map((s) => {
          const count = s === "all" ? returns.length : returns.filter((r) => r.status === s).length;
          return (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${filterStatus === s ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
            >
              {s === "all" ? "Tous" : statusLabels[s]} ({count})
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <RotateCcw size={36} className="mx-auto text-muted-foreground/30 mb-2" />
          <p className="text-sm text-muted-foreground">Aucun retour</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r, i) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              className="rounded-xl border border-border bg-card p-4 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {r.status === "requested" && <AlertTriangle size={14} className="text-yellow-500 shrink-0" />}
                    <span className="text-sm font-medium text-foreground">
                      {reasonLabels[r.reason] || r.reason}
                    </span>
                    <Badge className={`text-[10px] ${statusColors[r.status]}`}>
                      {statusLabels[r.status]}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap text-[10px] text-muted-foreground">
                    {r.stores && <span>{(r.stores as any).name}</span>}
                    {r.orders && <span>#{(r.orders as any).order_number}</span>}
                    <span>{new Date(r.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</span>
                  </div>
                  {r.description && (
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{r.description}</p>
                  )}
                </div>
                <Select value={r.status} onValueChange={(v) => updateStatus(r.id, v)}>
                  <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="requested">Demandé</SelectItem>
                    <SelectItem value="reviewing">En examen</SelectItem>
                    <SelectItem value="approved">Approuvé</SelectItem>
                    <SelectItem value="rejected">Rejeté</SelectItem>
                    <SelectItem value="received">Reçu</SelectItem>
                    <SelectItem value="refunded">Remboursé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
