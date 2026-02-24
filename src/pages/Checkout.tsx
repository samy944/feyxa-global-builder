import { useState, useEffect } from "react";
import { useCart, CartItem } from "@/hooks/useCart";
import { supabase } from "@/integrations/supabase/client";
import { MarketLayout } from "@/components/market/MarketLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Store, ShoppingBag, Loader2, CheckCircle2, ArrowLeft, MessageCircle, PackageCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { z } from "zod";
import { trackInitiateCheckout, trackPurchase } from "@/lib/tracking";
import { createOrderAttribution } from "@/lib/marketing-session";

const shippingSchema = z.object({
  firstName: z.string().trim().min(1, "Prénom requis").max(100),
  lastName: z.string().trim().max(100).optional(),
  phone: z.string().trim().min(8, "Numéro de téléphone invalide").max(20),
  city: z.string().trim().min(1, "Ville requise").max(100),
  quarter: z.string().trim().max(100).optional(),
  address: z.string().trim().max(500).optional(),
  notes: z.string().trim().max(500).optional(),
});

type ShippingForm = z.infer<typeof shippingSchema>;

interface CompletedOrder {
  orderNumber: string;
  orderId: string;
  storeName: string;
  storeSlug: string;
  items: CartItem[];
  subtotal: number;
  currency: string;
}

export default function Checkout() {
  const { items, itemsByStore, totalPrice, clearStore } = useCart();
  const [form, setForm] = useState<ShippingForm>({
    firstName: "",
    lastName: "",
    phone: "",
    city: "",
    quarter: "",
    address: "",
    notes: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ShippingForm, string>>>({});
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [submitting, setSubmitting] = useState(false);
  const [completedOrders, setCompletedOrders] = useState<CompletedOrder[]>([]);
  const [confirmedOrders, setConfirmedOrders] = useState<Set<string>>(new Set());
  const [confirmingOrder, setConfirmingOrder] = useState<string | null>(null);

  const mainCurrency = items[0]?.currency ?? "XOF";
  const formatPrice = (p: number, cur?: string) => {
    const c = cur || mainCurrency;
    return c === "XOF" ? `${p.toLocaleString("fr-FR")} FCFA` : `€${p.toFixed(2)}`;
  };

  const updateField = (field: keyof ShippingForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const generateOrderNumber = () => {
    const prefix = "FX";
    const ts = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `${prefix}-${ts}-${rand}`;
  };

  const buildWhatsAppMessage = (order: CompletedOrder, data: ShippingForm) => {
    const itemLines = order.items
      .map((i) => `• ${i.name} × ${i.quantity} — ${formatPrice(i.price * i.quantity, order.currency)}`)
      .join("\n");

    return [
      `🛒 Nouvelle commande Feyxa Market`,
      `━━━━━━━━━━━━━━━━━━━━━━`,
      `📦 Commande: ${order.orderNumber}`,
      ``,
      `👤 Client: ${data.firstName} ${data.lastName || ""}`.trim(),
      `📞 Tél: ${data.phone}`,
      `📍 ${data.city}${data.quarter ? `, ${data.quarter}` : ""}`,
      data.address ? `🏠 ${data.address}` : "",
      ``,
      `📋 Articles:`,
      itemLines,
      ``,
      `💰 Total: ${formatPrice(order.subtotal, order.currency)}`,
      `💳 Paiement: ${paymentMethod === "cod" ? "À la livraison" : paymentMethod === "stripe" ? "Carte bancaire" : paymentMethod === "fedapay" ? "Mobile Money (FedaPay)" : paymentMethod === "mobile_money" ? "Mobile Money" : "WhatsApp"}`,
      data.notes ? `\n📝 Notes: ${data.notes}` : "",
      ``,
      `Merci de confirmer cette commande ! 🙏`,
    ]
      .filter(Boolean)
      .join("\n");
  };

  const handleConfirmReceipt = async (order: CompletedOrder) => {
    setConfirmingOrder(order.orderId);
    try {
      const { data, error } = await supabase.functions.invoke("confirm-receipt", {
        body: { order_id: order.orderId },
      });
      if (error) throw error;
      setConfirmedOrders((prev) => new Set([...prev, order.orderId]));
      toast({ title: "Réception confirmée !", description: "Les fonds ont été libérés au vendeur." });
    } catch (err: any) {
      toast({ title: "Erreur", description: "Impossible de confirmer la réception.", variant: "destructive" });
    } finally {
      setConfirmingOrder(null);
    }
  };

  const handleSubmit = async () => {
    const result = shippingSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: typeof errors = {};
      result.error.errors.forEach((e) => {
        const field = e.path[0] as keyof ShippingForm;
        fieldErrors[field] = e.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    const completed: CompletedOrder[] = [];

    // Fire InitiateCheckout event
    trackInitiateCheckout(totalPrice, mainCurrency, items.reduce((s, i) => s + i.quantity, 0));

    try {
      for (const [storeId, storeItems] of Object.entries(itemsByStore)) {
        // 1. Decrement stock atomically
        for (const item of storeItems) {
          const { data: stockOk, error: stockErr } = await supabase.rpc("decrement_stock", {
            _product_id: item.productId,
            _quantity: item.quantity,
          });
          if (stockErr) throw stockErr;
          if (!stockOk) {
            toast({
              title: "Stock insuffisant",
              description: `"${item.name}" n'a plus assez de stock disponible.`,
              variant: "destructive",
            });
            setSubmitting(false);
            return;
          }
        }

        // 2. Upsert customer
        const { data: customerId, error: custErr } = await supabase.rpc("upsert_checkout_customer", {
          _store_id: storeId,
          _first_name: result.data.firstName,
          _last_name: result.data.lastName || null,
          _phone: result.data.phone,
          _city: result.data.city,
          _quarter: result.data.quarter || null,
          _address: result.data.address || null,
        });
        if (custErr) throw custErr;

        // 3. Create order with client-generated UUID
        const orderNumber = generateOrderNumber();
        const orderId = crypto.randomUUID();
        const subtotal = storeItems.reduce((s, i) => s + i.price * i.quantity, 0);

        const { error: orderError } = await supabase
          .from("orders")
          .insert({
            id: orderId,
            store_id: storeId,
            order_number: orderNumber,
            customer_id: customerId,
            subtotal,
            total: subtotal,
            currency: storeItems[0].currency,
            shipping_phone: result.data.phone,
            shipping_city: result.data.city,
            shipping_quarter: result.data.quarter || null,
            shipping_address: result.data.address || null,
            notes: result.data.notes || null,
            payment_method: paymentMethod,
            payment_status: paymentMethod === "cod" ? "cod" : "pending",
            status: "new",
          });

        if (orderError) throw orderError;

        // 4. Create order items
        const orderItems = storeItems.map((item) => ({
          order_id: orderId,
          product_id: item.productId,
          product_name: item.name,
          quantity: item.quantity,
          unit_price: item.price,
          total: item.price * item.quantity,
        }));

        const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
        if (itemsError) throw itemsError;

        // 5. Create escrow record (holds funds until delivery confirmed)
        if (paymentMethod !== "cod") {
          await supabase.rpc("create_escrow_for_order", { _order_id: orderId });
        }

        completed.push({
          orderNumber,
          orderId,
          storeName: storeItems[0].storeName,
          storeSlug: storeItems[0].storeSlug,
          items: storeItems,
          subtotal,
          currency: storeItems[0].currency,
        });

        // Create order attribution from marketing session
        createOrderAttribution(orderId, storeId).catch(() => {});

        clearStore(storeId);
      }

      // If online payment (Stripe or FedaPay), redirect to payment page
      if (paymentMethod === "stripe" || paymentMethod === "fedapay") {
        const totalAmount = completed.reduce((s, o) => s + o.subtotal, 0);
        const orderIds = completed.map((o) => o.orderId);
        try {
          const { data: checkoutData, error: checkoutError } = await supabase.functions.invoke(
            "create-checkout-session",
            {
              body: {
                provider: paymentMethod,
                order_ids: orderIds,
                amount: totalAmount,
                currency: mainCurrency,
                customer_email: `${form.phone}@feyxa.local`,
                customer_name: `${form.firstName} ${form.lastName || ""}`.trim(),
              },
            }
          );
          if (checkoutError) throw checkoutError;
          if (checkoutData?.url) {
            window.open(checkoutData.url, "_blank");
          }
        } catch (payErr: any) {
          console.error("Payment redirect error:", payErr);
          toast({
            title: "Commande créée",
            description: "La commande est créée mais le paiement en ligne n'a pas pu être initié. Contactez le vendeur.",
            variant: "destructive",
          });
        }
      }

      setCompletedOrders(completed);

      // Fire Purchase event for each completed order
      completed.forEach((order) => {
        trackPurchase({
          orderId: order.orderId,
          orderNumber: order.orderNumber,
          value: order.subtotal,
          currency: order.currency,
          items: order.items.map((i) => ({
            id: i.productId,
            name: i.name,
            price: i.price,
            quantity: i.quantity,
          })),
        });
      });

      toast({
        title: "Commande confirmée !",
        description: `${completed.length} commande(s) créée(s) avec succès.`,
      });
    } catch (err: any) {
      console.error("Checkout error:", err);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la commande. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Success state ──
  if (completedOrders.length > 0) {
    return (
      <MarketLayout>
        <section className="py-20">
          <div className="container max-w-lg">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-6"
            >
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <CheckCircle2 size={40} className="text-primary" />
              </div>
              <h1 className="font-heading text-3xl tracking-wide">COMMANDE CONFIRMÉE</h1>
              <p className="text-muted-foreground">
                {completedOrders.length > 1
                  ? `Vos ${completedOrders.length} commandes ont été envoyées aux vendeurs.`
                  : "Votre commande a été envoyée au vendeur."}
              </p>

              {/* Order cards per vendor */}
              <div className="space-y-4 text-left">
                {completedOrders.map((order) => (
                  <div key={order.orderNumber} className="bg-secondary rounded-xl p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium uppercase tracking-wider">
                        <Store size={12} />
                        {order.storeName}
                      </div>
                      <span className="text-xs font-mono font-medium text-foreground">{order.orderNumber}</span>
                    </div>
                    {order.items.map((item) => (
                      <div key={item.productId} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{item.name} × {item.quantity}</span>
                        <span className="font-medium text-foreground">{formatPrice(item.price * item.quantity, order.currency)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-sm font-semibold border-t border-border/50 pt-2">
                      <span>Total</span>
                      <span>{formatPrice(order.subtotal, order.currency)}</span>
                    </div>
                    {/* WhatsApp button per vendor */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-1"
                      onClick={() => {
                        const msg = encodeURIComponent(buildWhatsAppMessage(order, form));
                        window.open(`https://wa.me/?text=${msg}`, "_blank");
                      }}
                    >
                      <MessageCircle size={14} />
                      Envoyer au vendeur via WhatsApp
                    </Button>
                    {/* Confirm receipt button */}
                    {confirmedOrders.has(order.orderId) ? (
                      <div className="flex items-center gap-2 text-xs text-primary mt-1 justify-center">
                        <CheckCircle2 size={14} /> Réception confirmée
                      </div>
                    ) : (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="w-full mt-1"
                        disabled={confirmingOrder === order.orderId}
                        onClick={() => handleConfirmReceipt(order)}
                      >
                        {confirmingOrder === order.orderId ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <PackageCheck size={14} />
                        )}
                        Confirmer la réception
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              <p className="text-sm text-muted-foreground">
                Vous recevrez une confirmation par téléphone.
              </p>
              <p className="text-xs text-muted-foreground">
                Suivez vos commandes à tout moment sur la page{" "}
                <Link to="/track" className="text-primary underline underline-offset-2">Suivi de commande</Link>.
              </p>
              <div className="flex gap-3 justify-center flex-wrap">
                {completedOrders.map((order) => (
                  <Button key={order.orderId} variant="outline" size="sm" asChild>
                    <Link to={`/track/${order.orderNumber}`}>Suivre {order.orderNumber}</Link>
                  </Button>
                ))}
              </div>
              <Button variant="hero" asChild>
                <Link to="/market">CONTINUER MES ACHATS</Link>
              </Button>
            </motion.div>
          </div>
        </section>
      </MarketLayout>
    );
  }

  // ── Empty cart ──
  if (items.length === 0) {
    return (
      <MarketLayout>
        <section className="py-20">
          <div className="container max-w-lg text-center space-y-6">
            <ShoppingBag size={48} className="mx-auto text-muted-foreground/30" />
            <h1 className="font-heading text-2xl tracking-wide">PANIER VIDE</h1>
            <p className="text-muted-foreground text-sm">Ajoutez des produits depuis le marketplace.</p>
            <Button variant="hero" asChild>
              <Link to="/market">EXPLORER LE MARKET</Link>
            </Button>
          </div>
        </section>
      </MarketLayout>
    );
  }

  // ── Checkout form ──
  return (
    <MarketLayout>
      <section className="py-12">
        <div className="container max-w-4xl">
          <Link to="/market" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
            <ArrowLeft size={14} /> Retour au Market
          </Link>

          <h1 className="font-heading text-3xl sm:text-4xl tracking-wide mb-10">CHECKOUT</h1>

          <div className="grid lg:grid-cols-5 gap-10">
            {/* Form */}
            <div className="lg:col-span-3 space-y-8">
              <div className="space-y-4">
                <h2 className="font-heading text-lg tracking-wide text-foreground">LIVRAISON</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="firstName">Prénom *</Label>
                    <Input id="firstName" value={form.firstName} onChange={(e) => updateField("firstName", e.target.value)} placeholder="Koffi" />
                    {errors.firstName && <p className="text-xs text-destructive">{errors.firstName}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="lastName">Nom</Label>
                    <Input id="lastName" value={form.lastName} onChange={(e) => updateField("lastName", e.target.value)} placeholder="Agbossou" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone">Téléphone *</Label>
                  <Input id="phone" type="tel" value={form.phone} onChange={(e) => updateField("phone", e.target.value)} placeholder="+229 97 00 00 00" />
                  {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="city">Ville *</Label>
                    <Input id="city" value={form.city} onChange={(e) => updateField("city", e.target.value)} placeholder="Cotonou" />
                    {errors.city && <p className="text-xs text-destructive">{errors.city}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="quarter">Quartier</Label>
                    <Input id="quarter" value={form.quarter} onChange={(e) => updateField("quarter", e.target.value)} placeholder="Ganhi" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="address">Adresse / Repère</Label>
                  <Input id="address" value={form.address} onChange={(e) => updateField("address", e.target.value)} placeholder="Près du marché Dantokpa…" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea id="notes" value={form.notes} onChange={(e) => updateField("notes", e.target.value)} placeholder="Instructions spéciales…" rows={2} />
                </div>
              </div>

              {/* Payment */}
              <div className="space-y-4">
                <h2 className="font-heading text-lg tracking-wide text-foreground">PAIEMENT</h2>
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-2">
                  <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${paymentMethod === "cod" ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}>
                    <RadioGroupItem value="cod" id="cod" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Paiement à la livraison</p>
                      <p className="text-xs text-muted-foreground">Payez en espèces à la réception</p>
                    </div>
                  </label>
                  <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${paymentMethod === "stripe" ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}>
                    <RadioGroupItem value="stripe" id="stripe" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Carte bancaire (Stripe)</p>
                      <p className="text-xs text-muted-foreground">Visa, Mastercard, paiement sécurisé</p>
                    </div>
                  </label>
                  <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${paymentMethod === "fedapay" ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}>
                    <RadioGroupItem value="fedapay" id="fedapay" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Mobile Money (FedaPay)</p>
                      <p className="text-xs text-muted-foreground">MTN MoMo, Moov Money, paiement local</p>
                    </div>
                  </label>
                  <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${paymentMethod === "mobile_money" ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}>
                    <RadioGroupItem value="mobile_money" id="mobile_money" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Mobile Money (manuel)</p>
                      <p className="text-xs text-muted-foreground">Transfert direct, confirmation par le vendeur</p>
                    </div>
                  </label>
                  <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${paymentMethod === "whatsapp" ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}>
                    <RadioGroupItem value="whatsapp" id="whatsapp" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Confirmer via WhatsApp</p>
                      <p className="text-xs text-muted-foreground">Envoyez votre commande au vendeur par WhatsApp</p>
                    </div>
                  </label>
                </RadioGroup>
              </div>
            </div>

            {/* Order summary */}
            <div className="lg:col-span-2">
              <div className="bg-card border border-border rounded-xl p-6 space-y-6 sticky top-20">
                <h2 className="font-heading text-lg tracking-wide text-foreground">RÉSUMÉ</h2>

                {Object.entries(itemsByStore).map(([storeId, storeItems]) => (
                  <div key={storeId} className="space-y-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium uppercase tracking-wider">
                      <Store size={12} />
                      {storeItems[0].storeName}
                    </div>
                    {storeItems.map((item) => (
                      <div key={item.productId} className="flex justify-between text-sm">
                        <span className="text-muted-foreground line-clamp-1 flex-1 mr-2">
                          {item.name} × {item.quantity}
                        </span>
                        <span className="font-medium text-foreground shrink-0">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                    <div className="flex justify-between text-sm border-t border-border/50 pt-2">
                      <span className="text-muted-foreground">Sous-total</span>
                      <span className="font-semibold text-foreground">
                        {formatPrice(storeItems.reduce((s, i) => s + i.price * i.quantity, 0))}
                      </span>
                    </div>
                  </div>
                ))}

                <div className="border-t border-border pt-4 flex justify-between">
                  <span className="font-heading text-foreground tracking-wide">TOTAL</span>
                  <span className="text-xl font-bold text-foreground">{formatPrice(totalPrice)}</span>
                </div>

                {Object.keys(itemsByStore).length > 1 && (
                  <p className="text-xs text-muted-foreground bg-secondary rounded-lg p-3">
                    Votre panier contient des produits de {Object.keys(itemsByStore).length} vendeurs différents.
                    Chaque vendeur recevra une commande séparée.
                  </p>
                )}

                <Button
                  variant="hero"
                  size="lg"
                  className="w-full font-heading tracking-wide"
                  onClick={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? (
                    <><Loader2 size={16} className="animate-spin" /> TRAITEMENT…</>
                  ) : (
                    "CONFIRMER LA COMMANDE"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </MarketLayout>
  );
}
