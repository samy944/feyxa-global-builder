import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/hooks/useStore";
import { TicketChat } from "@/components/tickets/TicketChat";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2, MessageSquare, AlertTriangle, ChevronRight, ArrowLeft,
} from "lucide-react";

interface Ticket {
  id: string;
  subject: string;
  status: string;
  priority: string;
  created_at: string;
  order_id: string | null;
  buyer_id: string;
  orders: { order_number: string } | null;
}

const statusLabels: Record<string, string> = {
  open: "Ouvert",
  pending_seller: "En attente vendeur",
  pending_customer: "En attente client",
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

const priorityColors: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-secondary text-foreground",
  high: "bg-orange-500/10 text-orange-500",
  urgent: "bg-destructive/10 text-destructive",
};

export default function DashboardTickets() {
  const { store } = useStore();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    if (!store?.id) return;
    fetchTickets();
  }, [store?.id]);

  const fetchTickets = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("support_tickets")
      .select("id, subject, status, priority, created_at, order_id, buyer_id, orders(order_number)")
      .eq("store_id", store!.id)
      .order("created_at", { ascending: false });
    setTickets((data as any) || []);
    setLoading(false);
  };

  const updateTicketStatus = async (ticketId: string, newStatus: string) => {
    await supabase.from("support_tickets").update({
      status: newStatus as any,
      ...(newStatus === "resolved" ? { resolved_at: new Date().toISOString() } : {}),
    }).eq("id", ticketId);
    fetchTickets();
    if (selectedTicket?.id === ticketId) {
      setSelectedTicket((prev) => prev ? { ...prev, status: newStatus } : null);
    }
  };

  const filtered = tickets.filter((t) => filterStatus === "all" || t.status === filterStatus);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  // Detail view
  if (selectedTicket) {
    return (
      <div className="p-6 lg:p-8 space-y-4">
        <Button variant="ghost" size="sm" onClick={() => setSelectedTicket(null)}>
          <ArrowLeft size={14} className="mr-1" /> Retour
        </Button>

        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">{selectedTicket.subject}</h2>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={statusColors[selectedTicket.status]}>{statusLabels[selectedTicket.status]}</Badge>
              <Badge variant="outline" className={priorityColors[selectedTicket.priority]}>{selectedTicket.priority}</Badge>
              {selectedTicket.orders && (
                <span className="text-xs text-muted-foreground">Commande #{selectedTicket.orders.order_number}</span>
              )}
            </div>
          </div>
          <Select value={selectedTicket.status} onValueChange={(v) => updateTicketStatus(selectedTicket.id, v)}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Ouvert</SelectItem>
              <SelectItem value="pending_seller">En attente vendeur</SelectItem>
              <SelectItem value="pending_customer">En attente client</SelectItem>
              <SelectItem value="resolved">Résolu</SelectItem>
              <SelectItem value="escalated">Escaladé</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-xl border border-border bg-card">
          <TicketChat ticketId={selectedTicket.id} ticketStatus={selectedTicket.status} />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Tickets Support</h1>
          <p className="text-sm text-muted-foreground mt-1">{tickets.length} ticket{tickets.length > 1 ? "s" : ""}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {["all", "open", "pending_seller", "pending_customer", "escalated", "resolved"].map((s) => {
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
        <div className="text-center py-16 space-y-2">
          <MessageSquare size={36} className="mx-auto text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">Aucun ticket</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((ticket, i) => (
            <motion.button
              key={ticket.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              onClick={() => setSelectedTicket(ticket)}
              className="w-full text-left rounded-xl border border-border bg-card p-4 hover:border-primary/20 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {ticket.status === "escalated" && <AlertTriangle size={14} className="text-destructive shrink-0" />}
                    <span className="text-sm font-medium text-foreground truncate">{ticket.subject}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`text-[10px] ${statusColors[ticket.status]}`}>{statusLabels[ticket.status]}</Badge>
                    <Badge variant="outline" className={`text-[10px] ${priorityColors[ticket.priority]}`}>{ticket.priority}</Badge>
                    {ticket.orders && (
                      <span className="text-[10px] text-muted-foreground">#{ticket.orders.order_number}</span>
                    )}
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(ticket.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
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
