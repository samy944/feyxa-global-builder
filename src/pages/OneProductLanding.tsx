import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSeoHead } from "@/hooks/useSeoHead";
import { motion } from "framer-motion";
import { useCart } from "@/hooks/useCart";
import {
  ShoppingBag, Star, Shield, Truck, RotateCcw, ChevronDown,
  CheckCircle2, Zap, Users, Award, Clock, ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";

interface StoreData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  currency: string;
  theme: any;
}

interface ProductData {
  id: string;
  name: string;
  slug: string;
  price: number;
  compare_at_price: number | null;
  description: string | null;
  images: any;
  stock_quantity: number;
  tags: string[] | null;
  avg_rating: number | null;
  review_count: number | null;
}

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

export default function OneProductLanding() {
  const { slug } = useParams<{ slug: string }>();
  const [store, setStore] = useState<StoreData | null>(null);
  const [product, setProduct] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const { addItem } = useCart();

  useSeoHead({
    title: product ? `${product.name} — ${store?.name || "Feyxa"}` : "Boutique Feyxa",
    description: product?.description?.slice(0, 155) || "",
    type: "product",
    price: product?.price,
    currency: store?.currency || "XOF",
    availability: product && product.stock_quantity > 0 ? "InStock" : "OutOfStock",
    brand: store?.name,
  });

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const { data: storeData } = await supabase
        .from("stores")
        .select("*")
        .eq("slug", slug)
        .eq("is_active", true)
        .single();

      if (!storeData) { setLoading(false); return; }
      setStore(storeData as StoreData);

      const { data: prods } = await supabase
        .from("products")
        .select("*")
        .eq("store_id", storeData.id)
        .eq("is_published", true)
        .order("created_at", { ascending: true })
        .limit(1);

      if (prods && prods.length > 0) setProduct(prods[0] as ProductData);
      setLoading(false);
    })();
  }, [slug]);

  const formatPrice = (price: number) => {
    if (!store) return price.toString();
    return new Intl.NumberFormat("fr-FR", {
      style: "currency", currency: store.currency, maximumFractionDigits: 0,
    }).format(price);
  };

  const images: string[] = product?.images && Array.isArray(product.images)
    ? (product.images as string[])
    : [];

  const discount = product?.compare_at_price && product.compare_at_price > product.price
    ? Math.round((1 - product.price / product.compare_at_price) * 100)
    : null;

  const handleAddToCart = () => {
    if (!product || !store) return;
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: images[0] || null,
      storeId: store.id,
      storeName: store.name,
      storeSlug: store.slug,
      slug: product.slug,
      maxStock: product.stock_quantity,
      currency: store.currency,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  if (!store || !product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-center">
        <div>
          <ShoppingBag size={48} className="mx-auto text-muted-foreground mb-4" />
          <h1 className="text-xl font-bold text-foreground">Page introuvable</h1>
          <p className="text-muted-foreground mt-2">Ce produit n'est plus disponible.</p>
          <Button variant="hero" className="mt-6" asChild>
            <Link to="/">Retour à Feyxa</Link>
          </Button>
        </div>
      </div>
    );
  }

  const primaryColor = store.theme?.primary || "hsl(106, 75%, 47%)";

  const benefits = [
    { icon: Zap, title: "Résultats rapides", desc: "Voyez la différence dès les premiers jours d'utilisation." },
    { icon: Award, title: "Qualité premium", desc: "Matériaux et fabrication aux standards internationaux." },
    { icon: Truck, title: "Livraison rapide", desc: "Recevez votre commande en 48-72h partout au pays." },
    { icon: Shield, title: "Paiement sécurisé", desc: "Vos données sont protégées à chaque étape." },
    { icon: RotateCcw, title: "Satisfait ou remboursé", desc: "Retour gratuit sous 14 jours, sans condition." },
    { icon: Clock, title: "Support 24/7", desc: "Notre équipe répond à toutes vos questions rapidement." },
  ];

  const faqs = [
    { q: "Comment passer commande ?", a: "Cliquez sur le bouton \"Commander maintenant\", remplissez vos informations de livraison et confirmez. C'est simple et rapide !" },
    { q: "Quels sont les délais de livraison ?", a: "La livraison prend généralement 48 à 72 heures selon votre localisation. Vous recevrez un numéro de suivi." },
    { q: "Puis-je retourner le produit ?", a: "Oui ! Vous avez 14 jours pour retourner le produit s'il ne vous convient pas. Le retour est gratuit." },
    { q: "Quels moyens de paiement acceptez-vous ?", a: "Nous acceptons le paiement à la livraison (COD), Mobile Money et les virements bancaires." },
    { q: "Le produit est-il garanti ?", a: "Oui, tous nos produits sont couverts par une garantie satisfaction. Contactez-nous en cas de problème." },
  ];

  const socialProofs = [
    { name: "Aminata D.", rating: 5, text: "Excellente qualité ! Je recommande à 100%." },
    { name: "Moussa K.", rating: 5, text: "Livraison rapide et produit conforme. Très satisfait." },
    { name: "Fatou S.", rating: 4, text: "Bon rapport qualité-prix, je suis contente de mon achat." },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* ── Minimal Header ── */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-lg">
        <div className="container flex h-14 items-center justify-between">
          <Link to={`/store/${store.slug}`} className="flex items-center gap-2">
            <div
              className="h-8 w-8 rounded-lg flex items-center justify-center text-primary-foreground font-bold text-sm"
              style={{ backgroundColor: primaryColor }}
            >
              {store.name[0]}
            </div>
            <span className="font-semibold text-foreground text-sm">{store.name}</span>
          </Link>
          <Button size="sm" variant="hero" onClick={handleAddToCart}>
            Commander
          </Button>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-hero">
        <div className="absolute inset-0 grid-pattern opacity-40" />
        <div className="container relative py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            {/* Product Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7 }}
              className="order-1 md:order-2"
            >
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-secondary/20 border border-border/30">
                {images.length > 0 ? (
                  <img
                    src={images[selectedImage]}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ShoppingBag size={64} className="text-muted-foreground/40" />
                  </div>
                )}
                {discount && (
                  <div className="absolute top-4 left-4 bg-destructive text-destructive-foreground text-xs font-bold px-3 py-1.5 rounded-full">
                    -{discount}%
                  </div>
                )}
              </div>
              {images.length > 1 && (
                <div className="flex gap-2 mt-3 justify-center">
                  {images.slice(0, 4).map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImage(i)}
                      className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                        selectedImage === i ? "border-primary" : "border-border/40"
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Text */}
            <motion.div
              className="order-2 md:order-1 text-primary-foreground"
              initial="hidden" animate="visible"
            >
              <motion.p variants={fadeUp} custom={0} className="text-primary font-semibold text-sm uppercase tracking-widest mb-3">
                {store.name}
              </motion.p>
              <motion.h1 variants={fadeUp} custom={1} className="font-heading text-3xl md:text-5xl lg:text-6xl leading-tight mb-4">
                {product.name}
              </motion.h1>
              {product.description && (
                <motion.p variants={fadeUp} custom={2} className="text-muted-foreground text-base md:text-lg max-w-lg mb-6 leading-relaxed">
                  {product.description.slice(0, 200)}
                </motion.p>
              )}
              <motion.div variants={fadeUp} custom={3} className="flex items-baseline gap-3 mb-8">
                <span className="text-3xl md:text-4xl font-bold text-primary-foreground">{formatPrice(product.price)}</span>
                {product.compare_at_price && product.compare_at_price > product.price && (
                  <span className="text-lg text-muted-foreground line-through">{formatPrice(product.compare_at_price)}</span>
                )}
              </motion.div>
              <motion.div variants={fadeUp} custom={4} className="flex flex-col sm:flex-row gap-3">
                <Button size="lg" variant="hero" className="text-base px-10 py-6" onClick={handleAddToCart}>
                  Commander maintenant <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </motion.div>
              <motion.div variants={fadeUp} custom={5} className="flex items-center gap-6 mt-6 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Truck size={14} /> Livraison rapide</span>
                <span className="flex items-center gap-1"><Shield size={14} /> Paiement sécurisé</span>
                <span className="flex items-center gap-1"><RotateCcw size={14} /> Retour 14j</span>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── BENEFITS ── */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5 }}
          >
            <h2 className="font-heading text-2xl md:text-4xl text-foreground mb-3">
              Pourquoi choisir ce produit ?
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Des avantages qui font la différence au quotidien.
            </p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((b, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
                className="rounded-xl border border-border bg-card p-6 shadow-card hover:shadow-elevated transition-shadow"
              >
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <b.icon size={20} className="text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">{b.title}</h3>
                <p className="text-sm text-muted-foreground">{b.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF ── */}
      <section className="py-16 md:py-24 bg-secondary/30">
        <div className="container">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5 }}
          >
            <h2 className="font-heading text-2xl md:text-4xl text-foreground mb-3">
              Ils l'ont adopté
            </h2>
            <div className="flex items-center justify-center gap-2">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} size={18} className="text-primary fill-primary" />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                {product.review_count || 0} avis vérifiés
              </span>
            </div>
          </motion.div>

          <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {socialProofs.map((review, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="rounded-xl border border-border bg-card p-6 shadow-card"
              >
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: review.rating }).map((_, j) => (
                    <Star key={j} size={14} className="text-primary fill-primary" />
                  ))}
                </div>
                <p className="text-sm text-foreground mb-3">"{review.text}"</p>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                    {review.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{review.name}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <CheckCircle2 size={10} className="text-primary" /> Achat vérifié
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            className="flex items-center justify-center gap-4 mt-10"
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
            viewport={{ once: true }} transition={{ delay: 0.3 }}
          >
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users size={16} className="text-primary" />
              <span><strong className="text-foreground">500+</strong> clients satisfaits</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── GARANTIE ── */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container max-w-3xl">
          <motion.div
            className="rounded-2xl border border-primary/20 bg-primary/5 p-8 md:p-12 text-center"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Shield size={32} className="text-primary" />
            </div>
            <h2 className="font-heading text-2xl md:text-3xl text-foreground mb-4">
              Garantie satisfaction 100%
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto mb-6 leading-relaxed">
              Si pour une raison quelconque vous n'êtes pas entièrement satisfait de votre achat,
              retournez-le dans les <strong className="text-foreground">14 jours</strong> et nous vous
              remboursons intégralement. Sans question, sans complication.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><RotateCcw size={14} className="text-primary" /> Retour gratuit</span>
              <span className="flex items-center gap-1.5"><Shield size={14} className="text-primary" /> Remboursement intégral</span>
              <span className="flex items-center gap-1.5"><Clock size={14} className="text-primary" /> Sous 48h</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-16 md:py-24 bg-secondary/30">
        <div className="container max-w-2xl">
          <motion.div
            className="text-center mb-10"
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5 }}
          >
            <h2 className="font-heading text-2xl md:text-4xl text-foreground mb-3">
              Questions fréquentes
            </h2>
            <p className="text-muted-foreground">
              Tout ce que vous devez savoir avant d'acheter.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <Accordion type="single" collapsible className="space-y-3">
              {faqs.map((faq, i) => (
                <AccordionItem
                  key={i}
                  value={`faq-${i}`}
                  className="rounded-xl border border-border bg-card px-6 shadow-card"
                >
                  <AccordionTrigger className="text-left text-sm font-medium text-foreground hover:no-underline">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border bg-card py-6">
        <div className="container text-center">
          <p className="text-xs text-muted-foreground">
            Boutique propulsée par{" "}
            <Link to="/" className="text-primary hover:underline">Feyxa</Link>
          </p>
        </div>
      </footer>

      {/* ── CTA STICKY ── */}
      <div className="fixed bottom-0 inset-x-0 z-50 border-t border-border bg-card/95 backdrop-blur-lg p-3 md:p-4">
        <div className="container flex items-center justify-between gap-4">
          <div className="flex items-baseline gap-2 min-w-0">
            <span className="text-lg font-bold text-foreground truncate">{formatPrice(product.price)}</span>
            {product.compare_at_price && product.compare_at_price > product.price && (
              <span className="text-sm text-muted-foreground line-through hidden sm:inline">{formatPrice(product.compare_at_price)}</span>
            )}
          </div>
          <Button variant="hero" size="lg" className="shrink-0 px-8" onClick={handleAddToCart}>
            <ShoppingBag className="mr-2 h-4 w-4" /> Commander
          </Button>
        </div>
      </div>

      {/* Spacer for sticky CTA */}
      <div className="h-20" />
    </div>
  );
}
