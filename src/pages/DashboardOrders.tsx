import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search, Eye, ChevronDown, ChevronUp,
  Package, Truck, CreditCard, Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/hooks/useStore";
import OrderAttributionWidget from "@/components/dashboard/OrderAttributionWidget";

type OrderStatus = "new" | "confirmed" | "packed" | "shipped" | "delivered" | "cancelled" | "refunded" | "dispute";
type PaymentStatus = "pending" | "paid" | "cod" | "failed" | "refunded";

interface OrderRow {
  id: string;
  order_number: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method: string | null;
  total: number;
  currency: string;
  shipping_city: string | null;
  shipping_phone: string | null;
  created_at: string;
  customer_id: string | null;
  customers: { first_name: string; last_name: string | null; phone: string } | null;
  order_items: { id: string; product_name: string; quantity: number; unit_price: number }[];
}

const statusConfig: Record<string, { label: string; color: string }> = {
  new: { label: "Nouvelle", color: "bg-primary/10 text-primary" },
  confirmed: { label: "Confirmée", color: "bg-accent/10 text-accent" },
  packed: { label: "Emballée", color: "bg-primary/10 text-primary" },
  shipped: { label: "Expédiée", color: "bg-accent/10 text-accent" },
  delivered: { label: "Livrée", color: "bg-accent/10 text-accent" },
  cancelled: { label: "Annulée", color: "bg-destructive/10 text-destructive" },
  refunded: { label: "Remboursée", color: "bg-destructive/10 text-destructive" },
  dispute: { label: "Litige", color: "bg-destructive/10 text-destructive" },
};

const paymentConfig: Record<string, { label: string; color: string }> = {
  pending: { label: "En attente", color: "text-muted-foreground" },
  paid: { label: "Payé", color: "text-accent" },
  cod: { label: "À la livraison", color: "text-primary" },
  failed: { label: "Échoué", color: "text-destructive" },
  refunded: { label: "Remboursé", color: "text-destructive" },
};

const statusFilters: OrderStatus[] = ["new", "confirmed", "packed", "shipped", "delivered", "cancelled"];

export default function DashboardOrders() {
  const { store } = useStore();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!store?.id) return;
    setLoading(true);
    supabase
      .from("orders")
      .select("id, order_number, status, payment_status, payment_method, total, currency, shipping_city, shipping_phone, created_at, customer_id, customers(first_name, last_name, phone), order_items(id, product_name, quantity, unit_price)")
      .eq("store_id", store.id)
      .order("created_at", { ascending: false })
      .limit(200)
      .then(({ data }) => {
        setOrders((data as any) || []);
        setLoading(false);
      });
  }, [store?.id]);

  const filtered = orders.filter((o) => {
    if (filter !== "all" && o.status !== filter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const name = `${o.customers?.first_name || ""} ${o.customers?.last_name || ""}`.toLowerCase();
      if (!name.includes(q) && !o.order_number.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const formatPrice = (v: number, cur: string) =>
    cur === "XOF" ? `${v.toLocaleString("fr-FR")} FCFA` : `€${v.toFixed(2)}`;

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `Il y a ${mins}min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `Il y a ${hours}h`;
    const days = Math.floor(hours / 24);
    return days === 1 ? "Hier" : `Il y a ${days}j`;
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Commandes</h1>
          <p className="text-sm text-muted-foreground mt-1">{orders.length} commande{orders.length > 1 ? "s" : ""} au total</p>
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
              {statusConfig[s]?.label || s} ({count})
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

      {filtered.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-12">Aucune commande trouvée</p>
      )}

      {/* Orders list */}
      <div className="space-y-3">
        {filtered.map((order, i) => {
          const customerName = order.customers
            ? `${order.customers.first_name} ${order.customers.last_name || ""}`.trim()
            : "Client anonyme";
          const phone = order.customers?.phone || order.shipping_phone || "";
          const itemCount = order.order_items?.length || 0;
          const isExpanded = expandedId === order.id;

          return (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              className="rounded-xl border border-border bg-card hover:border-primary/20 transition-colors"
            >
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-medium text-foreground">#{order.order_number}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusConfig[order.status]?.color || "bg-secondary text-foreground"}`}>
                        {statusConfig[order.status]?.label || order.status}
                      </span>
                    </div>
                    <p className="text-sm text-foreground mt-1">{customerName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-foreground">{formatPrice(order.total, order.currency)}</p>
                    <p className="text-xs text-muted-foreground">{timeAgo(order.created_at)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Package size={12} /> {itemCount} article{itemCount > 1 ? "s" : ""}</span>
                  <span className="flex items-center gap-1">
                    <CreditCard size={12} />
                    <span className={paymentConfig[order.payment_status]?.color || ""}>
                      {paymentConfig[order.payment_status]?.label || order.payment_status}
                    </span>
                  </span>
                  {order.shipping_city && (
                    <span className="flex items-center gap-1"><Truck size={12} /> {order.shipping_city}</span>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                  {phone && (
                    <Button variant="outline" size="sm" className="text-xs" asChild>
                      <a
                        href={`https://wa.me/${phone.replace(/\s/g, "")}?text=Bonjour ${customerName}, votre commande %23${order.order_number} est ${(statusConfig[order.status]?.label || order.status).toLowerCase()}.`}
                        target="_blank" rel="noopener"
                      >
                        📱 WhatsApp
                      </a>
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                    onClick={() => setExpandedId(isExpanded ? null : order.id)}
                  >
                    <Eye size={12} className="mr-1" />
                    Détails
                    {isExpanded ? <ChevronUp size={12} className="ml-1" /> : <ChevronDown size={12} className="ml-1" />}
                  </Button>
                </div>
              </div>

              {/* Expanded detail with attribution */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 space-y-4 border-t border-border pt-3">
                      {/* Order items */}
                      {order.order_items && order.order_items.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-foreground mb-2">Articles</p>
                          <div className="space-y-1.5">
                            {order.order_items.map((item) => (
                              <div key={item.id} className="flex items-center justify-between text-xs">
                                <span className="text-foreground truncate flex-1">{item.product_name}</span>
                                <span className="text-muted-foreground ml-2">×{item.quantity}</span>
                                <span className="text-foreground font-medium ml-3 w-24 text-right">
                                  {formatPrice(item.unit_price * item.quantity, order.currency)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Attribution widget */}
                      <div>
                        <p className="text-xs font-medium text-foreground mb-2 flex items-center gap-1.5">
                          🎯 Attribution marketing
                        </p>
                        <div className="bg-secondary/40 rounded-lg p-3">
                          <OrderAttributionWidget orderId={order.id} />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
