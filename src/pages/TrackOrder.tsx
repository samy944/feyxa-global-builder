import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MarketLayout } from "@/components/market/MarketLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import {
  Package,
  Store,
  CheckCircle2,
  Loader2,
  Search,
  PackageCheck,
  Clock,
  Truck,
  ShoppingBag,
  XCircle,
} from "lucide-react";
import DeliveryProofSection from "@/components/dashboard/DeliveryProofSection";

const statusConfig: Record<string, { label: string; icon: typeof Package; color: string }> = {
  new: { label: "Nouvelle", icon: Clock, color: "bg-blue-500/10 text-blue-500" },
  confirmed: { label: "Confirmée", icon: CheckCircle2, color: "bg-primary/10 text-primary" },
  packed: { label: "Emballée", icon: Package, color: "bg-amber-500/10 text-amber-500" },
  shipped: { label: "Expédiée", icon: Truck, color: "bg-indigo-500/10 text-indigo-500" },
  delivered: { label: "Livrée", icon: PackageCheck, color: "bg-emerald-500/10 text-emerald-500" },
  cancelled: { label: "Annulée", icon: XCircle, color: "bg-destructive/10 text-destructive" },
  refunded: { label: "Remboursée", icon: XCircle, color: "bg-muted text-muted-foreground" },
};

const steps = ["new", "confirmed", "packed", "shipped", "delivered"];

export default function TrackOrder() {
  const { orderNumber } = useParams();
  const [searchInput, setSearchInput] = useState(orderNumber ?? "");
  const [phoneInput, setPhoneInput] = useState("");
  const [searchParams, setSearchParams] = useState<{ orderNumber: string; phone: string } | null>(null);

  const activeSearch = searchParams;

  const { data, isLoading } = useQuery({
    queryKey: ["track-order", activeSearch?.orderNumber, activeSearch?.phone],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("track-order", {
        body: {
          order_number: activeSearch!.orderNumber,
          phone: activeSearch!.phone,
        },
      });
      if (error) throw error;
      return data as { order: any; escrow: any } | null;
    },
    enabled: !!activeSearch,
    retry: false,
  });

  const order = data?.order;
  const escrow = data?.escrow;

  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const handleConfirmReceipt = async () => {
    if (!order) return;
    setConfirming(true);
    try {
      const { error } = await supabase.functions.invoke("confirm-receipt", {
        body: { order_id: order.id },
      });
      if (error) throw error;
      setConfirmed(true);
      toast({ title: "Réception confirmée !", description: "Les fonds ont été libérés au vendeur." });
    } catch {
      toast({ title: "Erreur", description: "Impossible de confirmer la réception.", variant: "destructive" });
    } finally {
      setConfirming(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim() && phoneInput.trim()) {
      setSearchParams({ orderNumber: searchInput.trim(), phone: phoneInput.trim() });
    }
  };

  const formatPrice = (p: number, cur = "XOF") =>
    cur === "XOF" ? `${Math.round(p).toLocaleString("fr-FR")} FCFA` : `€${p.toFixed(2)}`;

  const currentStepIndex = order ? steps.indexOf(order.status) : -1;
  const showConfirmBtn =
    escrow?.status === "held" && !confirmed && order?.status !== "delivered" && order?.status !== "cancelled";

  // ── Search form ──
  if (!activeSearch) {
    return (
      <MarketLayout>
        <section className="py-20">
          <div className="container max-w-md text-center space-y-8">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Search size={28} className="text-primary" />
            </div>
            <h1 className="font-heading text-3xl tracking-wide">SUIVI DE COMMANDE</h1>
            <p className="text-muted-foreground text-sm">
              Entrez votre numéro de commande et téléphone pour suivre votre colis.
            </p>
            <form onSubmit={handleSearch} className="space-y-3 text-left">
              <div className="space-y-1.5">
                <label className="text-sm text-muted-foreground">Numéro de commande</label>
                <Input
                  placeholder="FX-XXXXX-XXX"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm text-muted-foreground">Téléphone</label>
                <Input
                  placeholder="+229 97 00 00 00"
                  type="tel"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                />
              </div>
              <Button type="submit" variant="hero" className="w-full" disabled={!searchInput.trim() || !phoneInput.trim()}>
                <Search size={16} /> Rechercher
              </Button>
            </form>
          </div>
        </section>
      </MarketLayout>
    );
  }

  // ── Loading ──
  if (isLoading) {
    return (
      <MarketLayout>
        <section className="py-20">
          <div className="container max-w-md text-center">
            <Loader2 size={32} className="animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground mt-4">Recherche en cours…</p>
          </div>
        </section>
      </MarketLayout>
    );
  }

  // ── Not found ──
  if (!order) {
    return (
      <MarketLayout>
        <section className="py-20">
          <div className="container max-w-md text-center space-y-6">
            <ShoppingBag size={48} className="mx-auto text-muted-foreground/30" />
            <h1 className="font-heading text-2xl tracking-wide">COMMANDE INTROUVABLE</h1>
            <p className="text-muted-foreground text-sm">
              Vérifiez votre numéro de commande et numéro de téléphone.
            </p>
            <Button variant="outline" onClick={() => setSearchParams(null)}>
              Réessayer
            </Button>
          </div>
        </section>
      </MarketLayout>
    );
  }

  // ── Order details ──
  const storeData = order.stores as any;
  const status = statusConfig[order.status] || statusConfig.new;
  const StatusIcon = status.icon;

  return (
    <MarketLayout>
      <section className="py-12">
        <div className="container max-w-2xl">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            {/* Header */}
            <div className="text-center space-y-2">
              <h1 className="font-heading text-3xl tracking-wide">SUIVI DE COMMANDE</h1>
              <p className="text-sm font-mono text-muted-foreground">{order.order_number}</p>
            </div>

            {/* Status badge */}
            <div className="flex justify-center">
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${status.color}`}>
                <StatusIcon size={16} />
                {status.label}
              </div>
            </div>

            {/* Progress steps */}
            {order.status !== "cancelled" && order.status !== "refunded" && (
              <div className="flex items-center justify-between px-4">
                {steps.map((step, i) => {
                  const done = i <= currentStepIndex;
                  const cfg = statusConfig[step];
                  const Icon = cfg.icon;
                  return (
                    <div key={step} className="flex flex-col items-center gap-1 flex-1">
                      <div
                        className={`h-8 w-8 rounded-full flex items-center justify-center transition-colors ${
                          done ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                        }`}
                      >
                        <Icon size={14} />
                      </div>
                      <span className="text-[10px] text-muted-foreground text-center">{cfg.label}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Store & items */}
            <div className="bg-card border border-border rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium uppercase tracking-wider">
                <Store size={12} />
                {storeData?.name}
              </div>

              {order.order_items?.map((item: any) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {item.product_name} × {item.quantity}
                  </span>
                  <span className="font-medium text-foreground">
                    {formatPrice(item.total, order.currency)}
                  </span>
                </div>
              ))}

              <div className="flex justify-between text-sm font-semibold border-t border-border/50 pt-3">
                <span>Total</span>
                <span>{formatPrice(order.total, order.currency)}</span>
              </div>
            </div>

            {/* Shipping info */}
            <div className="bg-card border border-border rounded-xl p-5 space-y-2">
              <h3 className="text-sm font-medium text-foreground">Livraison</h3>
              <p className="text-sm text-muted-foreground">📞 {order.shipping_phone}</p>
              <p className="text-sm text-muted-foreground">
                📍 {order.shipping_city}
                {order.shipping_quarter ? `, ${order.shipping_quarter}` : ""}
              </p>
              {order.shipping_address && (
                <p className="text-sm text-muted-foreground">🏠 {order.shipping_address}</p>
              )}
              {order.notes && (
                <p className="text-sm text-muted-foreground">📝 {order.notes}</p>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                Commandé le{" "}
                {new Date(order.created_at).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>

            {/* Delivery proof (read-only for buyer) */}
            {order.status === "delivered" && (
              <DeliveryProofSection
                orderId={order.id}
                storeId={order.store_id}
                orderStatus={order.status}
                readOnly
              />
            )}

            {/* Confirm receipt */}
            {showConfirmBtn && (
              <div className="bg-card border border-border rounded-xl p-5 space-y-3 text-center">
                <p className="text-sm text-muted-foreground">
                  Vous avez reçu votre commande ? Confirmez pour libérer le paiement au vendeur.
                </p>
                <Button onClick={handleConfirmReceipt} disabled={confirming} className="w-full">
                  {confirming ? <Loader2 size={16} className="animate-spin" /> : <PackageCheck size={16} />}
                  Confirmer la réception
                </Button>
                {escrow?.release_at && (
                  <p className="text-xs text-muted-foreground">
                    Libération automatique le{" "}
                    {new Date(escrow.release_at).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                    })}
                  </p>
                )}
              </div>
            )}

            {(confirmed || escrow?.status === "released" || order.status === "delivered") && (
              <div className="flex items-center justify-center gap-2 text-sm text-primary">
                <CheckCircle2 size={16} /> Réception confirmée — fonds libérés
              </div>
            )}

            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => setSearchParams(null)}>
                Nouvelle recherche
              </Button>
              <Button variant="outline" asChild>
                <Link to="/market">Retour au Market</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </MarketLayout>
  );
}
