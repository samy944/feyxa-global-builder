import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TicketChat } from "@/components/tickets/TicketChat";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import {
  Loader2, MessageSquare, AlertTriangle, ChevronRight, ArrowLeft, Shield,
} from "lucide-react";

interface AdminTicket {
  id: string;
  subject: string;
  status: string;
  priority: string;
  created_at: string;
  order_id: string | null;
  buyer_id: string;
  seller_id: string;
  store_id: string;
  stores: { name: string; slug: string } | null;
  orders: { order_number: string } | null;
}

const statusLabels: Record<string, string> = {
  open: "Ouvert",
  pending_seller: "Attente vendeur",
  pending_customer: "Attente client",
  resolved: "Résolu",
  escalated: "Escaladé",
};

const statusColors: Record<string, string> = {
  open: "bg-blue-500/10 text-blue-500",
  pending_seller: "bg-yellow-500/10 text-yellow-500",
  pending_customer: "bg-orange-500/10 text-orange-500",
  resolved: "bg-primary/10 text-primary",
  escalated: "bg-destructive/10 text-destructive",
};

export default function AdminTickets() {
  const [tickets, setTickets] = useState<AdminTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AdminTicket | null>(null);
  const [filterStatus, setFilterStatus] = useState("escalated");

  useEffect(() => { fetchTickets(); }, []);

  const fetchTickets = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("support_tickets")
      .select("id, subject, status, priority, created_at, order_id, buyer_id, seller_id, store_id, stores(name, slug), orders(order_number)")
      .order("created_at", { ascending: false })
      .limit(200);
    setTickets((data as any) || []);
    setLoading(false);
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("support_tickets").update({
      status: status as any,
      ...(status === "resolved" ? { resolved_at: new Date().toISOString() } : {}),
    }).eq("id", id);
    fetchTickets();
    if (selected?.id === id) setSelected((p) => p ? { ...p, status } : null);
  };

  const filtered = tickets.filter((t) => filterStatus === "all" || t.status === filterStatus);

  if (loading) {
    return <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  if (selected) {
    return (
      <div className="p-6 lg:p-8 space-y-4 max-w-4xl mx-auto">
        <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>
          <ArrowLeft size={14} className="mr-1" /> Retour
        </Button>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">{selected.subject}</h2>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Badge className={statusColors[selected.status]}>{statusLabels[selected.status]}</Badge>
              {selected.stores && <span className="text-xs text-muted-foreground">Boutique : {selected.stores.name}</span>}
              {selected.orders && <span className="text-xs text-muted-foreground">Commande #{selected.orders.order_number}</span>}
            </div>
          </div>
          <Select value={selected.status} onValueChange={(v) => updateStatus(selected.id, v)}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Ouvert</SelectItem>
              <SelectItem value="pending_seller">Attente vendeur</SelectItem>
              <SelectItem value="pending_customer">Attente client</SelectItem>
              <SelectItem value="resolved">Résolu</SelectItem>
              <SelectItem value="escalated">Escaladé</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="rounded-xl border border-border bg-card">
          <TicketChat ticketId={selected.id} ticketStatus={selected.status} />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Shield size={20} className="text-primary" />
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Console Tickets</h1>
          <p className="text-sm text-muted-foreground">{tickets.length} ticket{tickets.length > 1 ? "s" : ""} total</p>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {["all", "escalated", "open", "pending_seller", "pending_customer", "resolved"].map((s) => {
          const count = s === "all" ? tickets.length : tickets.filter((t) => t.status === s).length;
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
          <MessageSquare size={36} className="mx-auto text-muted-foreground/30 mb-2" />
          <p className="text-sm text-muted-foreground">Aucun ticket</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((t, i) => (
            <motion.button
              key={t.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              onClick={() => setSelected(t)}
              className="w-full text-left rounded-xl border border-border bg-card p-4 hover:border-primary/20 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {t.status === "escalated" && <AlertTriangle size={14} className="text-destructive shrink-0" />}
                    <span className="text-sm font-medium text-foreground truncate">{t.subject}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={`text-[10px] ${statusColors[t.status]}`}>{statusLabels[t.status]}</Badge>
                    {t.stores && <span className="text-[10px] text-muted-foreground">{t.stores.name}</span>}
                    {t.orders && <span className="text-[10px] text-muted-foreground">#{t.orders.order_number}</span>}
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(t.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                    </span>
                  </div>
                </div>
                <ChevronRight size={16} className="text-muted-foreground shrink-0" />
              </div>
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}
