import { useState } from "react";
import { useCart } from "@/hooks/useCart";
import { supabase } from "@/integrations/supabase/client";
import { MarketLayout } from "@/components/market/MarketLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Store, ShoppingBag, Loader2, CheckCircle2, ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";

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

export default function Checkout() {
  const { items, itemsByStore, totalPrice, clearStore } = useCart();
  const navigate = useNavigate();
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
  const [completedOrders, setCompletedOrders] = useState<string[]>([]);

  const mainCurrency = items[0]?.currency ?? "XOF";
  const formatPrice = (p: number) =>
    mainCurrency === "XOF" ? `${p.toLocaleString("fr-FR")} FCFA` : `€${p.toFixed(2)}`;

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
    const newOrderNumbers: string[] = [];

    try {
      // Split orders by store
      for (const [storeId, storeItems] of Object.entries(itemsByStore)) {
        const orderNumber = generateOrderNumber();
        const subtotal = storeItems.reduce((s, i) => s + i.price * i.quantity, 0);

        // Create order
        const { data: order, error: orderError } = await supabase
          .from("orders")
          .insert({
            store_id: storeId,
            order_number: orderNumber,
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
          })
          .select("id")
          .single();

        if (orderError) throw orderError;

        // Create customer record
        await supabase.from("customers").insert({
          store_id: storeId,
          first_name: result.data.firstName,
          last_name: result.data.lastName || null,
          phone: result.data.phone,
          city: result.data.city,
          quarter: result.data.quarter || null,
          address: result.data.address || null,
        });

        // Create order items
        const orderItems = storeItems.map((item) => ({
          order_id: order.id,
          product_id: item.productId,
          product_name: item.name,
          quantity: item.quantity,
          unit_price: item.price,
          total: item.price * item.quantity,
        }));

        const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
        if (itemsError) throw itemsError;

        newOrderNumbers.push(orderNumber);
        clearStore(storeId);
      }

      setCompletedOrders(newOrderNumbers);

      // WhatsApp redirect if selected
      if (paymentMethod === "whatsapp") {
        const msg = encodeURIComponent(
          `Bonjour ! Je viens de passer commande sur Feyxa Market.\n\nCommande(s): ${newOrderNumbers.join(", ")}\nNom: ${result.data.firstName} ${result.data.lastName || ""}\nTéléphone: ${result.data.phone}\nVille: ${result.data.city}\n\nMerci de confirmer ma commande.`
        );
        window.open(`https://wa.me/?text=${msg}`, "_blank");
      }

      toast({
        title: "Commande confirmée !",
        description: `${newOrderNumbers.length} commande(s) créée(s) avec succès.`,
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

  // Success state
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
              <div className="bg-secondary rounded-xl p-4 space-y-1">
                {completedOrders.map((num) => (
                  <p key={num} className="text-sm font-mono font-medium text-foreground">{num}</p>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                Vous recevrez une confirmation par téléphone.
              </p>
              <Button variant="hero" asChild>
                <Link to="/market">CONTINUER MES ACHATS</Link>
              </Button>
            </motion.div>
          </div>
        </section>
      </MarketLayout>
    );
  }

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
                  <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${paymentMethod === "mobile_money" ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}>
                    <RadioGroupItem value="mobile_money" id="mobile_money" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Mobile Money</p>
                      <p className="text-xs text-muted-foreground">MTN MoMo, Orange Money, Wave</p>
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
