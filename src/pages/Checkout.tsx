import { useState, useEffect, useRef } from "react";
import { useCart, CartItem } from "@/hooks/useCart";
import { supabase } from "@/integrations/supabase/client";
import { MarketLayout } from "@/components/market/MarketLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Store, ShoppingBag, Loader2, CheckCircle2, ArrowLeft, PackageCheck, CreditCard, Wallet, Banknote, CalendarClock } from "lucide-react";
import { Link } from "react-router-dom";
import { z } from "zod";
import { trackInitiateCheckout, trackPurchase } from "@/lib/tracking";
import { createOrderAttribution } from "@/lib/marketing-session";
import DeliverySection, { DeliveryData } from "@/components/checkout/DeliverySection";
import ExpressCheckout from "@/components/checkout/ExpressCheckout";

const customerSchema = z.object({
  firstName: z.string().trim().min(1, "Prénom requis").max(100),
  lastName: z.string().trim().max(100).optional(),
  email: z.string().trim().email("Email invalide").max(255).optional().or(z.literal("")),
  phone: z.string().trim().min(8, "Numéro de téléphone invalide").max(20),
});

type CustomerForm = z.infer<typeof customerSchema>;

interface CompletedOrder {
  orderNumber: string;
  orderId: string;
  trackingToken: string;
  storeName: string;
  storeSlug: string;
  items: CartItem[];
  subtotal: number;
  shippingCost: number;
  total: number;
  currency: string;
}

export default function Checkout() {
  const { items, itemsByStore, totalPrice, clearStore } = useCart();
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCurrentUser(data.user ? { id: data.user.id } : null));
  }, []);

  const [form, setForm] = useState<CustomerForm>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof CustomerForm, string>>>({});
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [submitting, setSubmitting] = useState(false);
  const [completedOrders, setCompletedOrders] = useState<CompletedOrder[]>([]);
  const [confirmedOrders, setConfirmedOrders] = useState<Set<string>>(new Set());
  const [confirmingOrder, setConfirmingOrder] = useState<string | null>(null);

  // Delivery data from DeliverySection
  const [delivery, setDelivery] = useState<DeliveryData>({
    countryId: "",
    countryName: "",
    cityId: "",
    cityName: "",
    quarter: "",
    address: "",
    notes: "",
    latitude: null,
    longitude: null,
    shippingMode: "standard",
    shippingFee: 0,
    deliveryMethod: "home",
  });

  const mainCurrency = items[0]?.currency ?? "XOF";
  const formatPrice = (p: number, cur?: string) => {
    const c = cur || mainCurrency;
    return c === "XOF" ? `${p.toLocaleString("fr-FR")} FCFA` : `€${p.toFixed(2)}`;
  };

  const totalWeight = 0;
  const grandTotal = totalPrice + delivery.shippingFee;
  const abandonedCartIdsRef = useRef<string[]>([]);

  // ── Capture abandoned cart when page loads with items ──
  useEffect(() => {
    if (items.length === 0) return;
    const timeout = setTimeout(async () => {
      try {
        const storeEntries = Object.entries(itemsByStore);
        const ids: string[] = [];
        for (const [storeId, storeItems] of storeEntries) {
          const cartTotal = storeItems.reduce((s, i) => s + i.price * i.quantity, 0);
          const { data } = await supabase
            .from("abandoned_carts")
            .insert({
              store_id: storeId,
              customer_email: form.email?.trim() || null,
              customer_phone: form.phone?.trim() || null,
              customer_name: `${form.firstName} ${form.lastName || ""}`.trim() || null,
              cart_items: storeItems.map(i => ({ productId: i.productId, name: i.name, price: i.price, quantity: i.quantity, image: i.image })),
              cart_total: cartTotal,
              currency: storeItems[0]?.currency || "XOF",
              status: "abandoned",
            } as any)
            .select("id")
            .single();
          if (data?.id) ids.push(data.id);
        }
        abandonedCartIdsRef.current = ids;
      } catch (err) {
        console.error("Abandoned cart capture error:", err);
      }
    }, 2000); // Wait 2s before capturing to avoid instant bounces
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update abandoned cart with customer info when form changes
  useEffect(() => {
    if (abandonedCartIdsRef.current.length === 0) return;
    const timeout = setTimeout(async () => {
      const email = form.email?.trim() || null;
      const phone = form.phone?.trim() || null;
      const name = `${form.firstName} ${form.lastName || ""}`.trim() || null;
      if (!email && !phone) return;
      for (const id of abandonedCartIdsRef.current) {
        await supabase
          .from("abandoned_carts")
          .update({ customer_email: email, customer_phone: phone, customer_name: name } as any)
          .eq("id", id);
      }
    }, 1500);
    return () => clearTimeout(timeout);
  }, [form.email, form.phone, form.firstName, form.lastName]);

  const updateField = (field: keyof CustomerForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const generateOrderNumber = () => {
    const prefix = "FX";
    const ts = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `${prefix}-${ts}-${rand}`;
  };

  const generateTrackingToken = () => {
    const arr = new Uint8Array(32);
    crypto.getRandomValues(arr);
    return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
  };

  const handleConfirmReceipt = async (order: CompletedOrder) => {
    setConfirmingOrder(order.orderId);
    try {
      const { error } = await supabase.functions.invoke("confirm-receipt", {
        body: { order_id: order.orderId },
      });
      if (error) throw error;
      setConfirmedOrders((prev) => new Set([...prev, order.orderId]));
      toast({ title: "Réception confirmée !", description: "Les fonds ont été libérés au vendeur." });
    } catch {
      toast({ title: "Erreur", description: "Impossible de confirmer la réception.", variant: "destructive" });
    } finally {
      setConfirmingOrder(null);
    }
  };

  const handleSubmit = async () => {
    const result = customerSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: typeof errors = {};
      result.error.errors.forEach((e) => {
        const field = e.path[0] as keyof CustomerForm;
        fieldErrors[field] = e.message;
      });
      setErrors(fieldErrors);
      return;
    }

    if (delivery.deliveryMethod === "home" && !delivery.cityName) {
      toast({ title: "Ville requise", description: "Veuillez sélectionner une ville de livraison.", variant: "destructive" });
      return;
    }
    if (delivery.deliveryMethod === "relay" && !delivery.relayPointId) {
      toast({ title: "Point relais requis", description: "Veuillez sélectionner un point relais.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    const completed: CompletedOrder[] = [];

    trackInitiateCheckout(grandTotal, mainCurrency, items.reduce((s, i) => s + i.quantity, 0));

    try {
      const storeEntries = Object.entries(itemsByStore);
      const feePerStore = storeEntries.length > 1 ? Math.round(delivery.shippingFee / storeEntries.length) : delivery.shippingFee;

      for (const [storeId, storeItems] of storeEntries) {
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

        const { data: customerId, error: custErr } = await supabase.rpc("upsert_checkout_customer", {
          _store_id: storeId,
          _first_name: result.data.firstName,
          _last_name: result.data.lastName || null,
          _phone: result.data.phone,
          _city: delivery.cityName,
          _quarter: delivery.quarter || null,
          _address: delivery.address || null,
          _user_id: currentUser?.id || null,
        });
        if (custErr) throw custErr;

        const orderNumber = generateOrderNumber();
        const orderId = crypto.randomUUID();
        const trackingToken = generateTrackingToken();
        const subtotal = storeItems.reduce((s, i) => s + i.price * i.quantity, 0);
        const storeShipping = feePerStore;
        const orderTotal = subtotal + storeShipping;
        const customerEmail = result.data.email?.trim() || null;

        const { error: orderError } = await supabase
          .from("orders")
          .insert({
            id: orderId,
            store_id: storeId,
            order_number: orderNumber,
            customer_id: customerId,
            subtotal,
            shipping_cost: storeShipping,
            total: orderTotal,
            currency: storeItems[0].currency,
            shipping_phone: result.data.phone,
            shipping_city: delivery.cityName,
            shipping_quarter: delivery.quarter || null,
            shipping_address: delivery.address || null,
            notes: delivery.notes || null,
            payment_method: paymentMethod,
            payment_status: paymentMethod === "cod" ? "cod" : "pending",
            status: "new",
            tracking_token: trackingToken,
            customer_email: customerEmail,
            shipping_mode: delivery.shippingMode,
          } as any);

        if (orderError) throw orderError;

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

        completed.push({
          orderNumber,
          orderId,
          trackingToken,
          storeName: storeItems[0].storeName,
          storeSlug: storeItems[0].storeSlug,
          items: storeItems,
          subtotal,
          shippingCost: storeShipping,
          total: orderTotal,
          currency: storeItems[0].currency,
        });

        supabase.functions.invoke("process-event", {
          body: {
            event_type: "order.created",
            aggregate_id: orderId,
            store_id: storeId,
            payload: {
              order_number: orderNumber,
              tracking_token: trackingToken,
              total: orderTotal,
              currency: storeItems[0].currency,
              customer_email: customerEmail,
              customer_name: `${result.data.firstName} ${result.data.lastName || ""}`.trim(),
              store_name: storeItems[0].storeName,
              payment_method: paymentMethod,
              items: storeItems.map((i) => ({
                product_id: i.productId,
                name: i.name,
                quantity: i.quantity,
                price: i.price,
              })),
            },
          },
        }).catch((err) => console.error("Event bus error:", err));

        createOrderAttribution(orderId, storeId).catch(() => {});
        clearStore(storeId);
      }

      // Online payment redirect
      if (paymentMethod === "stripe" || paymentMethod === "fedapay") {
        const totalAmount = completed.reduce((s, o) => s + o.total, 0);
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
          if (checkoutData?.url) window.open(checkoutData.url, "_blank");
        } catch (payErr: any) {
          console.error("Payment redirect error:", payErr);
          toast({
            title: "Commande créée",
            description: "Le paiement en ligne n'a pas pu être initié.",
            variant: "destructive",
          });
        }
      }

      // Mark abandoned carts as completed
      if (abandonedCartIdsRef.current.length > 0) {
        for (const id of abandonedCartIdsRef.current) {
          await supabase
            .from("abandoned_carts")
            .update({ status: "completed" } as any)
            .eq("id", id);
        }
        abandonedCartIdsRef.current = [];
      }

      setCompletedOrders(completed);

      completed.forEach((order) => {
        trackPurchase({
          orderId: order.orderId,
          orderNumber: order.orderNumber,
          value: order.total,
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
                    {order.shippingCost > 0 && (
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>🚚 Livraison</span>
                        <span>{formatPrice(order.shippingCost, order.currency)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-semibold border-t border-border/50 pt-2">
                      <span>Total</span>
                      <span>{formatPrice(order.total, order.currency)}</span>
                    </div>
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

              {form.email && form.email.trim() && (
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-center space-y-1">
                  <p className="text-sm font-medium text-foreground">📧 Email de confirmation envoyé</p>
                  <p className="text-xs text-muted-foreground">
                    Un lien de suivi sécurisé a été envoyé à <strong>{form.email}</strong>
                  </p>
                </div>
              )}
              <p className="text-sm text-muted-foreground">
                {form.email && form.email.trim()
                  ? "Suivez vos commandes via le lien dans votre email ou sur la page"
                  : "Suivez vos commandes à tout moment sur la page"}{" "}
                <Link to="/track" className="text-primary underline underline-offset-2">Suivi de commande</Link>.
              </p>
              <div className="flex gap-3 justify-center flex-wrap">
                {completedOrders.map((order) => (
                  <Button key={order.orderId} variant="outline" size="sm" asChild>
                    <Link to={`/track?token=${order.trackingToken}`}>Suivre {order.orderNumber}</Link>
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

  const installmentAmount = Math.ceil(grandTotal / 3);

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
              {/* Customer info */}
              <div className="space-y-4">
                <h2 className="font-heading text-lg tracking-wide text-foreground">INFORMATIONS CLIENT</h2>
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
                  <Label htmlFor="email">Email <span className="text-xs text-muted-foreground">(pour le suivi)</span></Label>
                  <Input id="email" type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} placeholder="koffi@example.com" />
                  {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone">Téléphone *</Label>
                  <Input id="phone" type="tel" value={form.phone} onChange={(e) => updateField("phone", e.target.value)} placeholder="+229 97 00 00 00" />
                  {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
                </div>
              </div>

              {/* Delivery Section */}
              <DeliverySection
                storeIds={Object.keys(itemsByStore)}
                userId={currentUser?.id || null}
                onDeliveryChange={setDelivery}
                totalWeight={totalWeight}
              />

              {/* Payment */}
              <div className="space-y-4">
                <h2 className="font-heading text-lg tracking-wide text-foreground">PAIEMENT</h2>

                {/* Express Checkout */}
                <ExpressCheckout />

                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-2">
                  <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${paymentMethod === "cod" ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}>
                    <RadioGroupItem value="cod" id="cod" />
                    <Banknote size={18} className="text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Paiement à la livraison</p>
                      <p className="text-xs text-muted-foreground">Payez en espèces à la réception</p>
                    </div>
                  </label>
                  <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${paymentMethod === "stripe" ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}>
                    <RadioGroupItem value="stripe" id="stripe" />
                    <CreditCard size={18} className="text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Carte bancaire (Stripe)</p>
                      <p className="text-xs text-muted-foreground">Visa, Mastercard, paiement sécurisé</p>
                    </div>
                  </label>
                  <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${paymentMethod === "fedapay" ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}>
                    <RadioGroupItem value="fedapay" id="fedapay" />
                    <Wallet size={18} className="text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Mobile Money (FedaPay)</p>
                      <p className="text-xs text-muted-foreground">MTN MoMo, Moov Money, paiement local</p>
                    </div>
                  </label>
                  <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${paymentMethod === "mobile_money" ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}>
                    <RadioGroupItem value="mobile_money" id="mobile_money" />
                    <Wallet size={18} className="text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Mobile Money (manuel)</p>
                      <p className="text-xs text-muted-foreground">Transfert direct, confirmation par le vendeur</p>
                    </div>
                  </label>
                  <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${paymentMethod === "paypal" ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}>
                    <RadioGroupItem value="paypal" id="paypal" />
                    <Wallet size={18} className="text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground">PayPal</p>
                      <p className="text-xs text-muted-foreground">Paiement sécurisé via votre compte PayPal</p>
                    </div>
                  </label>
                  <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${paymentMethod === "installment" ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}>
                    <RadioGroupItem value="installment" id="installment" />
                    <CalendarClock size={18} className="text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Paiement en 3x sans frais</p>
                      <p className="text-xs text-muted-foreground">
                        3 × {formatPrice(installmentAmount)} — via Alma/Klarna
                      </p>
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
                  </div>
                ))}

                <div className="border-t border-border pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Sous-total</span>
                    <span className="font-medium text-foreground">{formatPrice(totalPrice)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1">
                      {delivery.deliveryMethod === "collect" ? "🏬 Retrait" : "🚚 Livraison"}{" "}
                      {delivery.shippingMode === "express" && delivery.deliveryMethod !== "collect" && (
                        <span className="text-xs text-primary">(Express)</span>
                      )}
                      {delivery.deliveryMethod === "relay" && (
                        <span className="text-xs text-primary">(Relais)</span>
                      )}
                    </span>
                    <span className="font-medium text-foreground">
                      {delivery.deliveryMethod === "collect"
                        ? "Gratuit"
                        : delivery.shippingFee > 0
                        ? formatPrice(delivery.shippingFee)
                        : delivery.cityName
                        ? "Gratuit"
                        : "—"}
                    </span>
                  </div>
                </div>

                <div className="border-t border-border pt-4 flex justify-between">
                  <span className="font-heading text-foreground tracking-wide">TOTAL</span>
                  <span className="text-xl font-bold text-foreground">{formatPrice(grandTotal)}</span>
                </div>

                {paymentMethod === "installment" && (
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-center">
                    <p className="text-xs font-medium text-foreground">
                      ou 3 × {formatPrice(installmentAmount)} sans frais
                    </p>
                  </div>
                )}

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
