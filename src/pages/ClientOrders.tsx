import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ReviewForm } from "@/components/market/ReviewForm";
import { CreateTicketDialog } from "@/components/tickets/CreateTicketDialog";
import { ReturnRequestDialog } from "@/components/returns/ReturnRequestDialog";
import { motion } from "framer-motion";
import { Loader2, Star, Package, MessageSquare, RotateCcw } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface OrderItem {
  id: string;
  product_name: string;
  product_id: string | null;
  quantity: number;
  unit_price: number;
  total: number;
}

interface MyOrder {
  id: string;
  order_number: string;
  status: string;
  total: number;
  currency: string;
  created_at: string;
  stores: { name: string; slug: string; id: string; owner_id: string };
  order_items: OrderItem[];
}

interface ExistingReview {
  product_id: string;
  order_id: string;
}

const statusLabels: Record<string, string> = {
  new: "Nouvelle", confirmed: "Confirmée", packed: "Emballée",
  shipped: "Expédiée", delivered: "Livrée", cancelled: "Annulée",
  refunded: "Remboursée", dispute: "Litige",
};

const statusColors: Record<string, string> = {
  new: "bg-blue-500/10 text-blue-400", confirmed: "bg-yellow-500/10 text-yellow-400",
  packed: "bg-orange-500/10 text-orange-400", shipped: "bg-purple-500/10 text-purple-400",
  delivered: "bg-primary/10 text-primary", cancelled: "bg-destructive/10 text-destructive",
  refunded: "bg-muted text-muted-foreground", dispute: "bg-destructive/10 text-destructive",
};

export default function ClientOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<MyOrder[]>([]);
  const [existingReviews, setExistingReviews] = useState<ExistingReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewTarget, setReviewTarget] = useState<{ productId: string; productName: string; storeId: string; orderId: string } | null>(null);
  const [ticketTarget, setTicketTarget] = useState<{ storeId: string; sellerId: string; orderId: string } | null>(null);
  const [returnTarget, setReturnTarget] = useState<{ storeId: string; sellerId: string; orderId: string } | null>(null);

  useEffect(() => { if (user) fetchOrders(); }, [user]);

  const fetchOrders = async () => {
    setLoading(true);
    const { data: customers } = await supabase.from("customers").select("id").eq("user_id", user!.id);
    if (!customers?.length) { setLoading(false); return; }
    const customerIds = customers.map(c => c.id);

    const { data: ordersData } = await supabase
      .from("orders")
      .select("id, order_number, status, total, currency, created_at, stores!inner(id, name, slug, owner_id), order_items(id, product_name, product_id, quantity, unit_price, total)")
      .in("customer_id", customerIds)
      .order("created_at", { ascending: false })
      .limit(50);

    if (ordersData) setOrders(ordersData as unknown as MyOrder[]);

    const { data: reviews } = await supabase.from("reviews").select("product_id, order_id").eq("buyer_id", user!.id);
    if (reviews) setExistingReviews(reviews);
    setLoading(false);
  };

  const hasReviewed = (productId: string, orderId: string) =>
    existingReviews.some(r => r.product_id === productId && r.order_id === orderId);

  const formatPrice = (p: number, currency: string) =>
    currency === "XOF" ? `${p.toLocaleString("fr-FR")} FCFA` : `€${p.toFixed(2)}`;

  return (
    <>
      <h1 className="font-heading text-2xl text-foreground mb-6">Mes commandes</h1>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 size={24} className="animate-spin text-primary" />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 space-y-3">
          <Package size={40} className="mx-auto text-muted-foreground/30" />
          <p className="text-muted-foreground">Aucune commande trouvée.</p>
          <Link to="/market" className="text-primary text-sm">Découvrir le Market →</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order, i) => (
            <motion.div key={order.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-foreground">#{order.order_number}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[order.status] || ""}`}>
                      {statusLabels[order.status] || order.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(order.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })} · {order.stores.name}
                  </p>
                </div>
                <span className="font-bold text-foreground">{formatPrice(order.total, order.currency)}</span>
              </div>
              <div className="divide-y divide-border">
                {order.order_items.map(item => (
                  <div key={item.id} className="flex items-center justify-between px-5 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">{item.product_name}</p>
                      <p className="text-xs text-muted-foreground">{item.quantity} × {formatPrice(item.unit_price, order.currency)}</p>
                    </div>
                    {order.status === "delivered" && item.product_id && !hasReviewed(item.product_id, order.id) && (
                      <Button variant="outline" size="sm" onClick={() => setReviewTarget({ productId: item.product_id!, productName: item.product_name, storeId: order.stores.id, orderId: order.id })} className="ml-3 shrink-0">
                        <Star size={14} className="mr-1" /> Avis
                      </Button>
                    )}
                    {item.product_id && hasReviewed(item.product_id, order.id) && (
                      <Badge variant="secondary" className="ml-3 shrink-0 text-xs">Avis laissé ✓</Badge>
                    )}
                  </div>
                ))}
              </div>
              <div className="px-5 py-3 border-t border-border flex items-center gap-2 flex-wrap">
                <Button variant="outline" size="sm" onClick={() => setTicketTarget({ storeId: order.stores.id, sellerId: order.stores.owner_id, orderId: order.id })}>
                  <MessageSquare size={14} className="mr-1" /> Ticket
                </Button>
                {["delivered", "shipped"].includes(order.status) && (
                  <Button variant="outline" size="sm" onClick={() => setReturnTarget({ storeId: order.stores.id, sellerId: order.stores.owner_id, orderId: order.id })}>
                    <RotateCcw size={14} className="mr-1" /> Retour
                  </Button>
                )}
                <Link to={`/track/${order.order_number}`}>
                  <Button variant="ghost" size="sm" className="text-xs">Suivre</Button>
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {reviewTarget && <ReviewForm open={!!reviewTarget} onOpenChange={o => !o && setReviewTarget(null)} productId={reviewTarget.productId} productName={reviewTarget.productName} storeId={reviewTarget.storeId} orderId={reviewTarget.orderId} onSuccess={fetchOrders} />}
      {ticketTarget && <CreateTicketDialog open={!!ticketTarget} onOpenChange={o => !o && setTicketTarget(null)} storeId={ticketTarget.storeId} sellerId={ticketTarget.sellerId} orderId={ticketTarget.orderId} />}
      {returnTarget && <ReturnRequestDialog open={!!returnTarget} onOpenChange={o => !o && setReturnTarget(null)} orderId={returnTarget.orderId} storeId={returnTarget.storeId} sellerId={returnTarget.sellerId} onCreated={fetchOrders} />}
    </>
  );
}
