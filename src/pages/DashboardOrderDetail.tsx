import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft, Package, Truck, CreditCard, Loader2,
  MapPin, Phone, User, CalendarDays, Clock,
  CheckCircle2, XCircle, AlertTriangle, CircleDot,
  Copy, ExternalLink, MessageSquare, History,
  ShoppingBag, Receipt, Tag, Hash, FileDown,
} from "lucide-react";
import { generateInvoicePDF } from "@/lib/generate-invoice-pdf";
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
  coupon_code: string | null;
  currency: string;
  shipping_city: string | null;
  shipping_phone: string | null;
  shipping_quarter: string | null;
  shipping_address: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  customer_id: string | null;
  customers: { first_name: string; last_name: string | null; phone: string; email: string | null; city: string | null } | null;
  order_items: { id: string; product_name: string; quantity: number; unit_price: number; variant_name: string | null; product_id: string | null }[];
}

interface StatusHistoryRow {
  id: string;
  previous_status: string | null;
  new_status: string;
  note: string | null;
  created_at: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: any; bg: string }> = {
  new: { label: "Nouvelle", color: "text-blue-400", icon: CircleDot, bg: "bg-blue-500/20 border-blue-500/30" },
  confirmed: { label: "Confirmée", color: "text-emerald-400", icon: CheckCircle2, bg: "bg-emerald-500/20 border-emerald-500/30" },
  packed: { label: "Emballée", color: "text-amber-400", icon: Package, bg: "bg-amber-500/20 border-amber-500/30" },
  shipped: { label: "Expédiée", color: "text-violet-400", icon: Truck, bg: "bg-violet-500/20 border-violet-500/30" },
  delivered: { label: "Livrée", color: "text-green-400", icon: CheckCircle2, bg: "bg-green-500/20 border-green-500/30" },
  cancelled: { label: "Annulée", color: "text-red-400", icon: XCircle, bg: "bg-red-500/20 border-red-500/30" },
  refunded: { label: "Remboursée", color: "text-orange-400", icon: Receipt, bg: "bg-orange-500/20 border-orange-500/30" },
  dispute: { label: "Litige", color: "text-red-400", icon: AlertTriangle, bg: "bg-red-500/20 border-red-500/30" },
};

const paymentConfig: Record<string, { label: string; color: string }> = {
  pending: { label: "En attente", color: "text-muted-foreground" },
  paid: { label: "Payé", color: "text-emerald-400" },
  cod: { label: "À la livraison", color: "text-amber-400" },
  failed: { label: "Échoué", color: "text-red-400" },
  refunded: { label: "Remboursé", color: "text-orange-400" },
};

const allStatuses: OrderStatus[] = ["new", "confirmed", "packed", "shipped", "delivered", "cancelled", "refunded", "dispute"];
const statusFlow: OrderStatus[] = ["new", "confirmed", "packed", "shipped", "delivered"];

export default function DashboardOrderDetail() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { store } = useStore();
  const [order, setOrder] = useState<OrderRow | null>(null);
  const [history, setHistory] = useState<StatusHistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [internalNote, setInternalNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  useEffect(() => {
    if (!store?.id || !orderId) return;

    const fetchOrder = async () => {
      setLoading(true);
      const [orderRes, historyRes] = await Promise.all([
        supabase
          .from("orders")
          .select("id, order_number, status, payment_status, payment_method, total, subtotal, shipping_cost, discount_amount, coupon_code, currency, shipping_city, shipping_phone, shipping_quarter, shipping_address, notes, created_at, updated_at, customer_id, customers(first_name, last_name, phone, email, city), order_items(id, product_name, quantity, unit_price, variant_name, product_id)")
          .eq("id", orderId)
          .eq("store_id", store.id)
          .single(),
        supabase
          .from("order_status_history")
          .select("id, previous_status, new_status, note, created_at")
          .eq("order_id", orderId)
          .order("created_at", { ascending: true }),
      ]);

      if (orderRes.data) setOrder(orderRes.data as any);
      if (historyRes.data) setHistory(historyRes.data);
      setLoading(false);
    };

    fetchOrder();
  }, [store?.id, orderId]);

  const handleStatusChange = async (newStatus: OrderStatus) => {
    if (!order) return;
    setUpdatingStatus(true);
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", order.id);

    if (error) {
      toast.error("Erreur lors de la mise à jour");
    } else {
      setOrder((prev) => prev ? { ...prev, status: newStatus } : null);
      // Refresh history
      const { data } = await supabase
        .from("order_status_history")
        .select("id, previous_status, new_status, note, created_at")
        .eq("order_id", order.id)
        .order("created_at", { ascending: true });
      if (data) setHistory(data);
      toast.success(`Statut → ${statusConfig[newStatus]?.label || newStatus}`);
    }
    setUpdatingStatus(false);
  };

  const handlePaymentStatusChange = async (newStatus: PaymentStatus) => {
    if (!order) return;
    setUpdatingStatus(true);
    const { error } = await supabase
      .from("orders")
      .update({ payment_status: newStatus })
      .eq("id", order.id);

    if (error) {
      toast.error("Erreur lors de la mise à jour du paiement");
    } else {
      setOrder((prev) => prev ? { ...prev, payment_status: newStatus } : null);
      const { data } = await supabase
        .from("order_status_history")
        .select("id, previous_status, new_status, note, created_at")
        .eq("order_id", order.id)
        .order("created_at", { ascending: true });
      if (data) setHistory(data);
      toast.success("Paiement mis à jour");
    }
    setUpdatingStatus(false);
  };

  const handleAddNote = async () => {
    if (!order || !internalNote.trim()) return;
    setSavingNote(true);
    const { error } = await supabase
      .from("order_status_history")
      .insert({
        order_id: order.id,
        store_id: store!.id,
        previous_status: null,
        new_status: order.status,
        note: internalNote.trim(),
      });

    if (error) {
      toast.error("Erreur lors de l'ajout de la note");
    } else {
      const { data } = await supabase
        .from("order_status_history")
        .select("id, previous_status, new_status, note, created_at")
        .eq("order_id", order.id)
        .order("created_at", { ascending: true });
      if (data) setHistory(data);
      setInternalNote("");
      toast.success("Note ajoutée");
    }
    setSavingNote(false);
  };

  const formatPrice = (v: number, cur: string) =>
    cur === "XOF" ? `${v.toLocaleString("fr-FR")} FCFA` : `€${v.toFixed(2)}`;

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  const formatTimeAgo = (d: string) => {
    const diff = Date.now() - new Date(d).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `il y a ${mins}min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `il y a ${hours}h`;
    const days = Math.floor(hours / 24);
    return days === 1 ? "hier" : `il y a ${days}j`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copié !");
  };

  // Progress bar
  const currentStepIndex = useMemo(() => {
    if (!order) return 0;
    const idx = statusFlow.indexOf(order.status);
    return idx >= 0 ? idx : -1;
  }, [order]);

  const progressPercent = useMemo(() => {
    if (currentStepIndex < 0) return 0;
    return (currentStepIndex / (statusFlow.length - 1)) * 100;
  }, [currentStepIndex]);

  if (loading) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-6 lg:p-8 text-center">
        <p className="text-muted-foreground">Commande introuvable</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/dashboard/orders")}>
          <ArrowLeft size={14} className="mr-2" /> Retour aux commandes
        </Button>
      </div>
    );
  }

  const customerName = order.customers
    ? `${order.customers.first_name} ${order.customers.last_name || ""}`.trim()
    : "Client anonyme";
  const phone = order.customers?.phone || order.shipping_phone || "";
  const itemCount = order.order_items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  const isCancelled = ["cancelled", "refunded", "dispute"].includes(order.status);

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <button
          onClick={() => navigate("/dashboard/orders")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft size={14} /> Retour aux commandes
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground tracking-tight">
                Commande #{order.order_number}
              </h1>
              <button onClick={() => copyToClipboard(order.order_number)} className="text-muted-foreground hover:text-foreground">
                <Copy size={14} />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Passée le {formatDate(order.created_at)} · {formatTimeAgo(order.created_at)}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-full border ${statusConfig[order.status]?.bg || "bg-secondary border-border"} ${statusConfig[order.status]?.color || "text-foreground"}`}>
              {(() => { const Icon = statusConfig[order.status]?.icon || CircleDot; return <Icon size={14} />; })()}
              {statusConfig[order.status]?.label || order.status}
            </span>
            <span className={`text-sm font-medium ${paymentConfig[order.payment_status]?.color || "text-muted-foreground"}`}>
              💳 {paymentConfig[order.payment_status]?.label || order.payment_status}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Progress tracker - only for standard flow */}
      {!isCancelled && currentStepIndex >= 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border border-border bg-card p-6"
        >
          <div className="relative">
            {/* Progress bar background */}
            <div className="absolute top-4 left-0 right-0 h-1 bg-secondary rounded-full" />
            <div
              className="absolute top-4 left-0 h-1 bg-primary rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />

            {/* Steps */}
            <div className="relative flex justify-between">
              {statusFlow.map((s, i) => {
                const cfg = statusConfig[s];
                const Icon = cfg.icon;
                const isActive = i <= currentStepIndex;
                const isCurrent = i === currentStepIndex;

                return (
                  <div key={s} className="flex flex-col items-center">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                      isCurrent
                        ? "bg-primary border-primary text-primary-foreground scale-110 shadow-lg shadow-primary/30"
                        : isActive
                        ? "bg-primary/20 border-primary text-primary"
                        : "bg-secondary border-border text-muted-foreground"
                    }`}>
                      <Icon size={16} />
                    </div>
                    <span className={`text-[10px] sm:text-xs mt-2 font-medium ${
                      isCurrent ? "text-primary" : isActive ? "text-foreground" : "text-muted-foreground"
                    }`}>
                      {cfg.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Main info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order items */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-xl border border-border bg-card"
          >
            <div className="p-4 border-b border-border flex items-center gap-2">
              <ShoppingBag size={16} className="text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Articles ({itemCount})</h2>
            </div>
            <div className="divide-y divide-border">
              {order.order_items.map((item) => (
                <div key={item.id} className="p-4 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{item.product_name}</p>
                    {item.variant_name && (
                      <p className="text-xs text-muted-foreground mt-0.5">Variante: {item.variant_name}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatPrice(item.unit_price, order.currency)} × {item.quantity}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-foreground whitespace-nowrap">
                    {formatPrice(item.unit_price * item.quantity, order.currency)}
                  </p>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="bg-secondary/30 p-4 space-y-2 border-t border-border">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Sous-total</span>
                <span>{formatPrice(order.subtotal, order.currency)}</span>
              </div>
              {order.shipping_cost > 0 && (
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><Truck size={12} /> Livraison</span>
                  <span>{formatPrice(order.shipping_cost, order.currency)}</span>
                </div>
              )}
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-sm text-primary">
                  <span className="flex items-center gap-1"><Tag size={12} /> Réduction {order.coupon_code && `(${order.coupon_code})`}</span>
                  <span>-{formatPrice(order.discount_amount, order.currency)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-foreground pt-2 border-t border-border">
                <span>Total</span>
                <span>{formatPrice(order.total, order.currency)}</span>
              </div>
            </div>
          </motion.div>

          {/* Timeline / History */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-xl border border-border bg-card"
          >
            <div className="p-4 border-b border-border flex items-center gap-2">
              <History size={16} className="text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Historique & Timeline</h2>
            </div>
            <div className="p-4">
              {/* Creation event */}
              <div className="relative pl-8 pb-6">
                <div className="absolute left-3 top-1 w-0.5 h-full bg-border" />
                <div className="absolute left-1.5 top-1 w-3 h-3 rounded-full bg-primary border-2 border-card" />
                <div>
                  <p className="text-sm font-medium text-foreground">Commande créée</p>
                  <p className="text-xs text-muted-foreground">{formatDate(order.created_at)}</p>
                </div>
              </div>

              {history.map((event, i) => {
                const isPayment = event.new_status.startsWith("payment:");
                const statusKey = isPayment ? event.new_status.replace("payment:", "") : event.new_status;
                const prevStatusKey = isPayment && event.previous_status ? event.previous_status.replace("payment:", "") : event.previous_status;
                const cfg = isPayment ? paymentConfig[statusKey] : statusConfig[statusKey];
                const isLast = i === history.length - 1;

                return (
                  <div key={event.id} className="relative pl-8 pb-6">
                    {!isLast && <div className="absolute left-3 top-1 w-0.5 h-full bg-border" />}
                    <div className={`absolute left-1.5 top-1 w-3 h-3 rounded-full border-2 border-card ${
                      isLast ? "bg-primary" : "bg-muted-foreground/40"
                    }`} />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {isPayment ? "Paiement" : "Statut"}{" "}
                        {prevStatusKey && (
                          <>
                            <span className="text-muted-foreground">
                              {isPayment
                                ? paymentConfig[prevStatusKey]?.label || prevStatusKey
                                : statusConfig[prevStatusKey]?.label || prevStatusKey}
                            </span>
                            {" → "}
                          </>
                        )}
                        <span className={(cfg as any)?.color || "text-foreground"}>
                          {isPayment
                            ? paymentConfig[statusKey]?.label || statusKey
                            : statusConfig[statusKey]?.label || statusKey}
                        </span>
                      </p>
                      {event.note && event.note !== "Changement automatique" && event.note !== "Changement paiement" && (
                        <p className="text-xs text-muted-foreground mt-0.5 italic">"{event.note}"</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-0.5">{formatDate(event.created_at)}</p>
                    </div>
                  </div>
                );
              })}

              {/* Add note */}
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs font-medium text-foreground mb-2 flex items-center gap-1.5">
                  <MessageSquare size={12} /> Ajouter une note interne
                </p>
                <div className="flex gap-2">
                  <Textarea
                    value={internalNote}
                    onChange={(e) => setInternalNote(e.target.value)}
                    placeholder="Ex: Client contacté par WhatsApp, livraison reportée..."
                    className="text-sm min-h-[60px] bg-secondary/30"
                    rows={2}
                  />
                </div>
                <Button
                  size="sm"
                  className="mt-2"
                  onClick={handleAddNote}
                  disabled={savingNote || !internalNote.trim()}
                >
                  {savingNote ? <Loader2 size={12} className="animate-spin mr-1" /> : null}
                  Ajouter la note
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Attribution */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="rounded-xl border border-border bg-card p-4"
          >
            <p className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              🎯 Attribution marketing
            </p>
            <OrderAttributionWidget orderId={order.id} />
          </motion.div>
        </div>

        {/* Right column - Sidebar */}
        <div className="space-y-6">
          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-xl border border-border bg-card p-4 space-y-4"
          >
            <h3 className="text-sm font-semibold text-foreground">Actions</h3>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Statut de la commande
              </label>
              <Select
                value={order.status}
                onValueChange={(val) => handleStatusChange(val as OrderStatus)}
                disabled={updatingStatus}
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
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Statut du paiement
              </label>
              <Select
                value={order.payment_status}
                onValueChange={(val) => handlePaymentStatusChange(val as PaymentStatus)}
                disabled={updatingStatus}
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

            {/* Quick actions */}
            {phone && (
              <Button variant="outline" size="sm" className="w-full text-xs" asChild>
                <a
                  href={`https://wa.me/${phone.replace(/\s/g, "")}?text=Bonjour ${customerName}, votre commande %23${order.order_number} est ${(statusConfig[order.status]?.label || order.status).toLowerCase()}.`}
                  target="_blank"
                  rel="noopener"
                >
                  📱 Contacter via WhatsApp
                </a>
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs"
              onClick={() => copyToClipboard(`${window.location.origin}/track/${order.order_number}`)}
            >
              <ExternalLink size={12} className="mr-1" /> Copier le lien de suivi
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs"
              onClick={() => generateInvoicePDF(order, { name: store?.name || "Boutique", city: store?.city, currency: order.currency })}
            >
              <FileDown size={12} className="mr-1" /> Télécharger la facture PDF
            </Button>
          </motion.div>

          {/* Customer card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-xl border border-border bg-card p-4 space-y-3"
          >
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <User size={14} className="text-primary" /> Client
            </h3>
            <p className="text-sm font-medium text-foreground">{customerName}</p>
            {phone && (
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Phone size={10} /> {phone}
              </p>
            )}
            {order.customers?.email && (
              <p className="text-xs text-muted-foreground">✉️ {order.customers.email}</p>
            )}
            {order.customers?.city && (
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <MapPin size={10} /> {order.customers.city}
              </p>
            )}
          </motion.div>

          {/* Shipping card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="rounded-xl border border-border bg-card p-4 space-y-3"
          >
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Truck size={14} className="text-primary" /> Livraison
            </h3>
            <p className="text-sm text-foreground">
              {[order.shipping_address, order.shipping_quarter, order.shipping_city]
                .filter(Boolean)
                .join(", ") || "Adresse non renseignée"}
            </p>
            {order.shipping_phone && (
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Phone size={10} /> {order.shipping_phone}
              </p>
            )}
            {order.payment_method && (
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <CreditCard size={10} /> {order.payment_method === "cod" ? "Paiement à la livraison" : order.payment_method}
              </p>
            )}
          </motion.div>

          {/* Notes */}
          {order.notes && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="rounded-xl border border-border bg-card p-4 space-y-2"
            >
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <MessageSquare size={14} className="text-primary" /> Notes du client
              </h3>
              <p className="text-sm text-muted-foreground">{order.notes}</p>
            </motion.div>
          )}

          {/* Order meta */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-xl border border-border bg-card p-4 space-y-2"
          >
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Hash size={14} className="text-primary" /> Détails
            </h3>
            <div className="space-y-1.5 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>ID Commande</span>
                <span className="font-mono text-foreground">{order.id.slice(0, 8)}…</span>
              </div>
              <div className="flex justify-between">
                <span>Créée le</span>
                <span className="text-foreground">{formatDate(order.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span>Dernière MAJ</span>
                <span className="text-foreground">{formatDate(order.updated_at)}</span>
              </div>
              <div className="flex justify-between">
                <span>Devise</span>
                <span className="text-foreground">{order.currency}</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
