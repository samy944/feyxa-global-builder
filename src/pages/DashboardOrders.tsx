import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search, Eye, ChevronDown, ChevronUp,
  Package, Truck, CreditCard, Loader2,
  MapPin, Phone, User, CalendarDays, ExternalLink,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/hooks/useStore";
import OrderAttributionWidget from "@/components/dashboard/OrderAttributionWidget";
import { toast } from "sonner";

type OrderStatus = "new" | "confirmed" | "packed" | "shipped" | "delivered" | "cancelled" | "refunded" | "dispute";
type PaymentStatus = "pending" | "paid" | "cod" | "failed" | "refunded";

interface OrderRow {
  id: string;
  order_number: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method: string | null;
  total: number;
  subtotal: number;
  shipping_cost: number;
  discount_amount: number;
  currency: string;
  shipping_city: string | null;
  shipping_phone: string | null;
  shipping_quarter: string | null;
  shipping_address: string | null;
  notes: string | null;
  created_at: string;
  customer_id: string | null;
  customers: { first_name: string; last_name: string | null; phone: string; email: string | null } | null;
  order_items: { id: string; product_name: string; quantity: number; unit_price: number; variant_name: string | null }[];
}

const statusConfig: Record<string, { label: string; color: string }> = {
  new: { label: "Nouvelle", color: "bg-blue-500/10 text-blue-500" },
  confirmed: { label: "Confirmée", color: "bg-primary/10 text-primary" },
  packed: { label: "Emballée", color: "bg-amber-500/10 text-amber-500" },
  shipped: { label: "Expédiée", color: "bg-violet-500/10 text-violet-500" },
  delivered: { label: "Livrée", color: "bg-accent/10 text-accent" },
  cancelled: { label: "Annulée", color: "bg-destructive/10 text-destructive" },
  refunded: { label: "Remboursée", color: "bg-destructive/10 text-destructive" },
  dispute: { label: "Litige", color: "bg-destructive/10 text-destructive" },
};

const paymentConfig: Record<string, { label: string; color: string }> = {
  pending: { label: "En attente", color: "text-muted-foreground" },
  paid: { label: "Payé", color: "text-primary" },
  cod: { label: "À la livraison", color: "text-amber-500" },
  failed: { label: "Échoué", color: "text-destructive" },
  refunded: { label: "Remboursé", color: "text-destructive" },
};

const allStatuses: OrderStatus[] = ["new", "confirmed", "packed", "shipped", "delivered", "cancelled", "refunded", "dispute"];
const statusFilters: OrderStatus[] = ["new", "confirmed", "packed", "shipped", "delivered", "cancelled"];

export default function DashboardOrders() {
  const { store } = useStore();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (!store?.id) return;
    setLoading(true);
    supabase
      .from("orders")
      .select("id, order_number, status, payment_status, payment_method, total, subtotal, shipping_cost, discount_amount, currency, shipping_city, shipping_phone, shipping_quarter, shipping_address, notes, created_at, customer_id, customers(first_name, last_name, phone, email), order_items(id, product_name, quantity, unit_price, variant_name)")
      .eq("store_id", store.id)
      .order("created_at", { ascending: false })
      .limit(200)
      .then(({ data }) => {
        setOrders((data as any) || []);
        setLoading(false);
      });
  }, [store?.id]);

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    setUpdatingId(orderId);
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderId);

    if (error) {
      toast.error("Erreur lors de la mise à jour du statut");
    } else {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
      toast.success(`Statut changé en "${statusConfig[newStatus]?.label || newStatus}"`);
    }
    setUpdatingId(null);
  };

  const handlePaymentStatusChange = async (orderId: string, newStatus: PaymentStatus) => {
    setUpdatingId(orderId);
    const { error } = await supabase
      .from("orders")
      .update({ payment_status: newStatus })
      .eq("id", orderId);

    if (error) {
      toast.error("Erreur lors de la mise à jour du paiement");
    } else {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, payment_status: newStatus } : o))
      );
      toast.success(`Paiement mis à jour`);
    }
    setUpdatingId(null);
  };

  const filtered = orders.filter((o) => {
    if (filter !== "all" && o.status !== filter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const name = `${o.customers?.first_name || ""} ${o.customers?.last_name || ""}`.toLowerCase();
      if (!name.includes(q) && !o.order_number.toLowerCase().includes(q) && !(o.shipping_phone || "").includes(q)) return false;
    }
    return true;
  });

  const formatPrice = (v: number, cur: string) =>
    cur === "XOF" ? `${v.toLocaleString("fr-FR")} FCFA` : `€${v.toFixed(2)}`;

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
    });

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
          placeholder="Rechercher par nom, n° commande, téléphone..."
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
          const itemCount = order.order_items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
          const isExpanded = expandedId === order.id;
          const isUpdating = updatingId === order.id;

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
                    <div className="flex items-center gap-2 flex-wrap">
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
                <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
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

                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border flex-wrap">
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
                    Aperçu
                    {isExpanded ? <ChevronUp size={12} className="ml-1" /> : <ChevronDown size={12} className="ml-1" />}
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    className="text-xs"
                    onClick={() => navigate(`/dashboard/orders/${order.id}`)}
                  >
                    <ExternalLink size={12} className="mr-1" />
                    Détails complets
                  </Button>
                </div>
              </div>

              {/* Expanded detail */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 space-y-5 border-t border-border pt-4">
                      {/* Status change */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-medium text-foreground mb-1.5 block">
                            Statut de la commande
                          </label>
                          <Select
                            value={order.status}
                            onValueChange={(val) => handleStatusChange(order.id, val as OrderStatus)}
                            disabled={isUpdating}
                          >
                            <SelectTrigger className="h-9 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {allStatuses.map((s) => (
                                <SelectItem key={s} value={s}>
                                  {statusConfig[s]?.label || s}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-foreground mb-1.5 block">
                            Statut du paiement
                          </label>
                          <Select
                            value={order.payment_status}
                            onValueChange={(val) => handlePaymentStatusChange(order.id, val as PaymentStatus)}
                            disabled={isUpdating}
                          >
                            <SelectTrigger className="h-9 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {(["pending", "paid", "cod", "failed", "refunded"] as PaymentStatus[]).map((s) => (
                                <SelectItem key={s} value={s}>
                                  {paymentConfig[s]?.label || s}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Customer & shipping info */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="rounded-lg bg-secondary/40 p-3 space-y-2">
                          <p className="text-xs font-medium text-foreground flex items-center gap-1.5">
                            <User size={12} /> Client
                          </p>
                          <p className="text-sm text-foreground">{customerName}</p>
                          {phone && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Phone size={10} /> {phone}
                            </p>
                          )}
                          {order.customers?.email && (
                            <p className="text-xs text-muted-foreground">
                              ✉️ {order.customers.email}
                            </p>
                          )}
                        </div>
                        <div className="rounded-lg bg-secondary/40 p-3 space-y-2">
                          <p className="text-xs font-medium text-foreground flex items-center gap-1.5">
                            <MapPin size={12} /> Livraison
                          </p>
                          <p className="text-sm text-foreground">
                            {[order.shipping_address, order.shipping_quarter, order.shipping_city]
                              .filter(Boolean)
                              .join(", ") || "Non renseignée"}
                          </p>
                          {order.shipping_phone && order.shipping_phone !== phone && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Phone size={10} /> {order.shipping_phone}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <CalendarDays size={10} /> {formatDate(order.created_at)}
                          </p>
                        </div>
                      </div>

                      {/* Order items */}
                      {order.order_items && order.order_items.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-foreground mb-2">Articles</p>
                          <div className="rounded-lg border border-border overflow-hidden">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="bg-secondary/50">
                                  <th className="text-left p-2.5 font-medium text-foreground">Produit</th>
                                  <th className="text-center p-2.5 font-medium text-foreground w-16">Qté</th>
                                  <th className="text-right p-2.5 font-medium text-foreground w-28">Prix unit.</th>
                                  <th className="text-right p-2.5 font-medium text-foreground w-28">Total</th>
                                </tr>
                              </thead>
                              <tbody>
                                {order.order_items.map((item) => (
                                  <tr key={item.id} className="border-t border-border">
                                    <td className="p-2.5 text-foreground">
                                      {item.product_name}
                                      {item.variant_name && (
                                        <span className="text-muted-foreground ml-1">({item.variant_name})</span>
                                      )}
                                    </td>
                                    <td className="p-2.5 text-center text-muted-foreground">{item.quantity}</td>
                                    <td className="p-2.5 text-right text-muted-foreground">
                                      {formatPrice(item.unit_price, order.currency)}
                                    </td>
                                    <td className="p-2.5 text-right font-medium text-foreground">
                                      {formatPrice(item.unit_price * item.quantity, order.currency)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            {/* Totals */}
                            <div className="bg-secondary/30 p-2.5 space-y-1 border-t border-border">
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Sous-total</span>
                                <span>{formatPrice(order.subtotal, order.currency)}</span>
                              </div>
                              {order.shipping_cost > 0 && (
                                <div className="flex justify-between text-xs text-muted-foreground">
                                  <span>Livraison</span>
                                  <span>{formatPrice(order.shipping_cost, order.currency)}</span>
                                </div>
                              )}
                              {order.discount_amount > 0 && (
                                <div className="flex justify-between text-xs text-primary">
                                  <span>Réduction</span>
                                  <span>-{formatPrice(order.discount_amount, order.currency)}</span>
                                </div>
                              )}
                              <div className="flex justify-between text-sm font-bold text-foreground pt-1 border-t border-border">
                                <span>Total</span>
                                <span>{formatPrice(order.total, order.currency)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Notes */}
                      {order.notes && (
                        <div className="rounded-lg bg-secondary/30 p-3">
                          <p className="text-xs font-medium text-foreground mb-1">Notes client</p>
                          <p className="text-xs text-muted-foreground">{order.notes}</p>
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
