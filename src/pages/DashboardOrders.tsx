import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Search, Filter, Eye, MoreHorizontal, ChevronDown,
  Package, Truck, CreditCard, Clock
} from "lucide-react";

type OrderStatus = "new" | "confirmed" | "packed" | "shipped" | "delivered" | "cancelled";
type PaymentStatus = "pending" | "paid" | "cod" | "failed";

interface Order {
  id: string;
  number: string;
  customer: string;
  phone: string;
  total: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: string;
  items: number;
  date: string;
  city: string;
}

const orders: Order[] = [
  { id: "1", number: "FX-4821", customer: "Marie Dupont", phone: "+229 97 00 00 01", total: "15,000 XOF", status: "new", paymentStatus: "cod", paymentMethod: "Paiement à la livraison", items: 3, date: "Il y a 2h", city: "Cotonou" },
  { id: "2", number: "FX-4820", customer: "Jean Kouassi", phone: "+229 97 00 00 02", total: "8,500 XOF", status: "confirmed", paymentStatus: "paid", paymentMethod: "Mobile Money", items: 1, date: "Il y a 3h", city: "Abomey-Calavi" },
  { id: "3", number: "FX-4819", customer: "Fatou Diallo", phone: "+229 97 00 00 03", total: "24,500 XOF", status: "packed", paymentStatus: "paid", paymentMethod: "Mobile Money", items: 5, date: "Il y a 5h", city: "Porto-Novo" },
  { id: "4", number: "FX-4818", customer: "Paul Mbeki", phone: "+229 97 00 00 04", total: "6,790 XOF", status: "shipped", paymentStatus: "cod", paymentMethod: "Paiement à la livraison", items: 2, date: "Il y a 8h", city: "Cotonou" },
  { id: "5", number: "FX-4817", customer: "Sarah Chen", phone: "+229 97 00 00 05", total: "31,200 XOF", status: "delivered", paymentStatus: "paid", paymentMethod: "WhatsApp", items: 4, date: "Hier", city: "Parakou" },
  { id: "6", number: "FX-4816", customer: "Amos Dossou", phone: "+229 97 00 00 06", total: "4,500 XOF", status: "cancelled", paymentStatus: "failed", paymentMethod: "Mobile Money", items: 1, date: "Hier", city: "Cotonou" },
];

const statusConfig: Record<OrderStatus, { label: string; color: string }> = {
  new: { label: "Nouvelle", color: "bg-primary/10 text-primary" },
  confirmed: { label: "Confirmée", color: "bg-accent/10 text-accent" },
  packed: { label: "Emballée", color: "bg-primary/10 text-primary" },
  shipped: { label: "Expédiée", color: "bg-accent/10 text-accent" },
  delivered: { label: "Livrée", color: "bg-accent/10 text-accent" },
  cancelled: { label: "Annulée", color: "bg-destructive/10 text-destructive" },
};

const paymentConfig: Record<PaymentStatus, { label: string; color: string }> = {
  pending: { label: "En attente", color: "text-muted-foreground" },
  paid: { label: "Payé", color: "text-accent" },
  cod: { label: "À la livraison", color: "text-primary" },
  failed: { label: "Échoué", color: "text-destructive" },
};

const statusFilters: OrderStatus[] = ["new", "confirmed", "packed", "shipped", "delivered", "cancelled"];

export default function DashboardOrders() {
  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = orders.filter((o) => {
    if (filter !== "all" && o.status !== filter) return false;
    if (searchQuery && !o.customer.toLowerCase().includes(searchQuery.toLowerCase()) && !o.number.includes(searchQuery)) return false;
    return true;
  });

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Commandes</h1>
          <p className="text-sm text-muted-foreground mt-1">{orders.length} commandes au total</p>
        </div>
      </div>

      {/* Status filters */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setFilter("all")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${filter === "all" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
        >
          Toutes ({orders.length})
        </button>
        {statusFilters.map((s) => {
          const count = orders.filter((o) => o.status === s).length;
          return (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${filter === s ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
            >
              {statusConfig[s].label} ({count})
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Rechercher une commande..."
          className="w-full h-9 rounded-lg border border-border bg-card pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Orders list (mobile-friendly cards) */}
      <div className="space-y-3">
        {filtered.map((order, i) => (
          <motion.div
            key={order.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className="rounded-xl border border-border bg-card p-4 hover:border-primary/20 transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-medium text-foreground">#{order.number}</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusConfig[order.status].color}`}>
                    {statusConfig[order.status].label}
                  </span>
                </div>
                <p className="text-sm text-foreground mt-1">{order.customer}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-foreground">{order.total}</p>
                <p className="text-xs text-muted-foreground">{order.date}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Package size={12} /> {order.items} article{order.items > 1 ? "s" : ""}</span>
              <span className="flex items-center gap-1"><CreditCard size={12} /> <span className={paymentConfig[order.paymentStatus].color}>{paymentConfig[order.paymentStatus].label}</span></span>
              <span className="flex items-center gap-1"><Truck size={12} /> {order.city}</span>
            </div>

            {/* WhatsApp quick action */}
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
              <Button variant="outline" size="sm" className="text-xs" asChild>
                <a href={`https://wa.me/${order.phone.replace(/\s/g, "")}?text=Bonjour ${order.customer}, votre commande %23${order.number} est ${statusConfig[order.status].label.toLowerCase()}.`} target="_blank" rel="noopener">
                  📱 WhatsApp
                </a>
              </Button>
              <Button variant="ghost" size="sm" className="text-xs">
                <Eye size={12} /> Détails
              </Button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
