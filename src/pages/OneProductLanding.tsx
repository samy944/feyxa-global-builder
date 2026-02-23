import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSeoHead } from "@/hooks/useSeoHead";
import { motion } from "framer-motion";
import { useCart } from "@/hooks/useCart";
import { initStoreTracking, trackPageView, trackViewContent, trackAddToCart } from "@/lib/tracking";
import {
  ShoppingBag, Star, Shield, Truck, RotateCcw, ChevronDown,
  CheckCircle2, Zap, Users, Award, Clock, ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { getThemeById, type StorefrontTheme } from "@/lib/storefront-themes";

interface StoreData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  currency: string;
  theme: any;
  settings: any;
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

      if (prods && prods.length > 0) {
        const p = prods[0] as ProductData;
        setProduct(p);
        // Init tracking & fire events
        initStoreTracking(storeData.id, storeData.currency).then(() => {
          trackPageView();
          trackViewContent({
            id: p.id,
            name: p.name,
            price: p.price,
            currency: storeData.currency,
          });
        });
      }
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

  // Resolve storefront theme
  const sfTheme: StorefrontTheme = useMemo(() => {
    const themeObj = store?.theme as Record<string, any> | null;
    const themeId = themeObj?.storefront_theme_id || "classic";
    return getThemeById(themeId);
  }, [store?.theme]);

  // Load theme fonts
  useEffect(() => {
    if (!sfTheme) return;
    const fonts = [sfTheme.fonts.heading, sfTheme.fonts.body].filter(
      (f, i, arr) => arr.indexOf(f) === i
    );
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?${fonts.map((f) => `family=${f.replace(/ /g, "+")}:wght@400;500;600;700`).join("&")}&display=swap`;
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, [sfTheme]);

  const t = sfTheme; // short alias

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
    trackAddToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      currency: store.currency,
      quantity: 1,
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

  const primaryColor = `hsl(${t.colors.primary})`;
  const primaryFg = `hsl(${t.colors.primaryForeground})`;
  const bgColor = `hsl(${t.colors.background})`;
  const fgColor = `hsl(${t.colors.foreground})`;
  const cardBg = `hsl(${t.colors.card})`;
  const cardFg = `hsl(${t.colors.cardForeground})`;
  const borderColor = `hsl(${t.colors.border})`;
  const mutedFg = `hsl(${t.colors.mutedForeground})`;
  const mutedBg = `hsl(${t.colors.muted})`;

  // Read custom config from store settings, fallback to defaults
  const lc = store.settings?.landing_config || {};

  const benefitsTitle = lc.benefits_title || "Pourquoi choisir ce produit ?";
  const benefitsSubtitle = lc.benefits_subtitle || "Des avantages qui font la différence au quotidien.";

  const defaultBenefits = [
    { title: "Résultats rapides", desc: "Voyez la différence dès les premiers jours d'utilisation." },
    { title: "Qualité premium", desc: "Matériaux et fabrication aux standards internationaux." },
    { title: "Livraison rapide", desc: "Recevez votre commande en 48-72h partout au pays." },
    { title: "Paiement sécurisé", desc: "Vos données sont protégées à chaque étape." },
    { title: "Satisfait ou remboursé", desc: "Retour gratuit sous 14 jours, sans condition." },
    { title: "Support 24/7", desc: "Notre équipe répond à toutes vos questions rapidement." },
  ];
  const benefits: { title: string; desc: string }[] = lc.benefits?.length > 0 ? lc.benefits : defaultBenefits;

  const benefitIcons = [Zap, Award, Truck, Shield, RotateCcw, Clock, Star, CheckCircle2];

  const testimonialsTitle = lc.testimonials_title || "Ils l'ont adopté";
  const socialProofCount = lc.social_proof_count || "500+";

  const defaultTestimonials = [
    { name: "Aminata D.", rating: 5, text: "Excellente qualité ! Je recommande à 100%." },
    { name: "Moussa K.", rating: 5, text: "Livraison rapide et produit conforme. Très satisfait." },
    { name: "Fatou S.", rating: 4, text: "Bon rapport qualité-prix, je suis contente de mon achat." },
  ];
  const socialProofs: { name: string; rating: number; text: string }[] = lc.testimonials?.length > 0 ? lc.testimonials : defaultTestimonials;

  const guaranteeTitle = lc.guarantee_title || "Garantie satisfaction 100%";
  const guaranteeText = lc.guarantee_text || "Si pour une raison quelconque vous n'êtes pas entièrement satisfait de votre achat, retournez-le dans les 14 jours et nous vous remboursons intégralement. Sans question, sans complication.";

  const faqTitle = lc.faq_title || "Questions fréquentes";
  const faqSubtitle = lc.faq_subtitle || "Tout ce que vous devez savoir avant d'acheter.";

  const defaultFaqs = [
    { q: "Comment passer commande ?", a: "Cliquez sur le bouton \"Commander maintenant\", remplissez vos informations de livraison et confirmez." },
    { q: "Quels sont les délais de livraison ?", a: "La livraison prend généralement 48 à 72 heures selon votre localisation." },
    { q: "Puis-je retourner le produit ?", a: "Oui ! Vous avez 14 jours pour retourner le produit. Le retour est gratuit." },
    { q: "Quels moyens de paiement acceptez-vous ?", a: "Paiement à la livraison (COD), Mobile Money et virements bancaires." },
    { q: "Le produit est-il garanti ?", a: "Oui, tous nos produits sont couverts par une garantie satisfaction." },
  ];
  const faqs: { q: string; a: string }[] = lc.faqs?.length > 0 ? lc.faqs : defaultFaqs;

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: bgColor,
        color: fgColor,
        fontFamily: `"${t.fonts.body}", system-ui, sans-serif`,
      }}
    >
      {/* ── Minimal Header ── */}
      <header
        className="sticky top-0 z-50 border-b backdrop-blur-lg"
        style={{ backgroundColor: `hsl(${t.colors.card} / 0.85)`, borderColor }}
      >
        <div className="container flex h-14 items-center justify-between">
          <Link to={`/store/${store.slug}`} className="flex items-center gap-2">
            <div
              className={`h-8 w-8 ${t.style.borderRadius} flex items-center justify-center font-bold text-sm`}
              style={{ backgroundColor: primaryColor, color: primaryFg }}
            >
              {store.name[0]}
            </div>
            <span className="font-semibold text-sm" style={{ color: fgColor, fontFamily: `"${t.fonts.heading}", sans-serif` }}>
              {store.name}
            </span>
          </Link>
          <button
            className={`px-4 py-2 text-sm font-medium ${t.style.borderRadius}`}
            style={{ backgroundColor: primaryColor, color: primaryFg }}
            onClick={handleAddToCart}
          >
            Commander
          </button>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden" style={{ background: `linear-gradient(160deg, hsl(${t.colors.foreground}) 0%, hsl(${t.colors.foreground} / 0.9) 100%)` }}>
        <div className="absolute inset-0 grid-pattern opacity-20" />
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
              <motion.p variants={fadeUp} custom={0} className="font-semibold text-sm uppercase tracking-widest mb-3" style={{ color: primaryColor }}>
                {store.name}
              </motion.p>
              <motion.h1 variants={fadeUp} custom={1} className="text-3xl md:text-5xl lg:text-6xl leading-tight mb-4 font-bold" style={{ color: bgColor, fontFamily: `"${t.fonts.heading}", sans-serif` }}>
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
                <button
                  className={`text-base px-10 py-4 font-semibold ${t.style.borderRadius} flex items-center gap-2`}
                  style={{ backgroundColor: primaryColor, color: primaryFg }}
                  onClick={handleAddToCart}
                >
                  Commander maintenant <ArrowRight className="h-5 w-5" />
                </button>
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
      <section className="py-16 md:py-24" style={{ backgroundColor: bgColor }}>
        <div className="container">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5 }}
          >
            <h2 className="text-2xl md:text-4xl font-bold mb-3" style={{ color: fgColor, fontFamily: `"${t.fonts.heading}", sans-serif` }}>
              {benefitsTitle}
            </h2>
            <p style={{ color: mutedFg }} className="max-w-md mx-auto">
              {benefitsSubtitle}
            </p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((b, i) => {
              const Icon = benefitIcons[i % benefitIcons.length];
              return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
                className={`${t.style.borderRadius} border p-6 transition-shadow`}
                style={{ backgroundColor: cardBg, borderColor, boxShadow: t.style.cardShadow }}
              >
                <div className={`h-10 w-10 ${t.style.borderRadius} flex items-center justify-center mb-4`} style={{ backgroundColor: `hsl(${t.colors.primary} / 0.1)` }}>
                  <Icon size={20} style={{ color: primaryColor }} />
                </div>
                <h3 className="font-semibold mb-1" style={{ color: cardFg }}>{b.title}</h3>
                <p className="text-sm" style={{ color: mutedFg }}>{b.desc}</p>
              </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF ── */}
      <section className="py-16 md:py-24" style={{ backgroundColor: mutedBg }}>
        <div className="container">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5 }}
          >
            <h2 className="text-2xl md:text-4xl font-bold mb-3" style={{ color: fgColor, fontFamily: `"${t.fonts.heading}", sans-serif` }}>
              {testimonialsTitle}
            </h2>
            <div className="flex items-center justify-center gap-2">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} size={18} style={{ color: primaryColor, fill: primaryColor }} />
                ))}
              </div>
              <span className="text-sm" style={{ color: mutedFg }}>
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
                className={`${t.style.borderRadius} border p-6`}
                style={{ backgroundColor: cardBg, borderColor, boxShadow: t.style.cardShadow }}
              >
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: review.rating }).map((_, j) => (
                    <Star key={j} size={14} style={{ color: primaryColor, fill: primaryColor }} />
                  ))}
                </div>
                <p className="text-sm mb-3" style={{ color: cardFg }}>"{review.text}"</p>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs" style={{ backgroundColor: `hsl(${t.colors.primary} / 0.1)`, color: primaryColor }}>
                    {review.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: cardFg }}>{review.name}</p>
                    <p className="text-xs flex items-center gap-1" style={{ color: mutedFg }}>
                      <CheckCircle2 size={10} style={{ color: primaryColor }} /> Achat vérifié
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
            <div className="flex items-center gap-2 text-sm" style={{ color: mutedFg }}>
              <Users size={16} style={{ color: primaryColor }} />
              <span><strong style={{ color: fgColor }}>{socialProofCount}</strong> clients satisfaits</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── GARANTIE ── */}
      <section className="py-16 md:py-24" style={{ backgroundColor: bgColor }}>
        <div className="container max-w-3xl">
          <motion.div
            className={`${t.style.borderRadius} border p-8 md:p-12 text-center`}
            style={{ borderColor: `hsl(${t.colors.primary} / 0.2)`, backgroundColor: `hsl(${t.colors.primary} / 0.05)` }}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: `hsl(${t.colors.primary} / 0.1)` }}>
              <Shield size={32} style={{ color: primaryColor }} />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold mb-4" style={{ color: fgColor, fontFamily: `"${t.fonts.heading}", sans-serif` }}>
              {guaranteeTitle}
            </h2>
            <p className="max-w-lg mx-auto mb-6 leading-relaxed" style={{ color: mutedFg }}>
              {guaranteeText}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm" style={{ color: mutedFg }}>
              <span className="flex items-center gap-1.5"><RotateCcw size={14} style={{ color: primaryColor }} /> Retour gratuit</span>
              <span className="flex items-center gap-1.5"><Shield size={14} style={{ color: primaryColor }} /> Remboursement intégral</span>
              <span className="flex items-center gap-1.5"><Clock size={14} style={{ color: primaryColor }} /> Sous 48h</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-16 md:py-24" style={{ backgroundColor: mutedBg }}>
        <div className="container max-w-2xl">
          <motion.div
            className="text-center mb-10"
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5 }}
          >
            <h2 className="text-2xl md:text-4xl font-bold mb-3" style={{ color: fgColor, fontFamily: `"${t.fonts.heading}", sans-serif` }}>
              {faqTitle}
            </h2>
            <p style={{ color: mutedFg }}>
              {faqSubtitle}
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
                  className={`${t.style.borderRadius} border px-6`}
                  style={{ backgroundColor: cardBg, borderColor, boxShadow: t.style.cardShadow }}
                >
                  <AccordionTrigger className="text-left text-sm font-medium hover:no-underline" style={{ color: cardFg }}>
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm" style={{ color: mutedFg }}>
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t py-6" style={{ backgroundColor: cardBg, borderColor }}>
        <div className="container text-center">
          <p className="text-xs" style={{ color: mutedFg }}>
            Boutique propulsée par{" "}
            <Link to="/" className="hover:underline" style={{ color: primaryColor }}>Feyxa</Link>
          </p>
        </div>
      </footer>

      {/* ── CTA STICKY ── */}
      <div className="fixed bottom-0 inset-x-0 z-50 border-t backdrop-blur-lg p-3 md:p-4" style={{ backgroundColor: `hsl(${t.colors.card} / 0.95)`, borderColor }}>
        <div className="container flex items-center justify-between gap-4">
          <div className="flex items-baseline gap-2 min-w-0">
            <span className="text-lg font-bold truncate" style={{ color: fgColor }}>{formatPrice(product.price)}</span>
            {product.compare_at_price && product.compare_at_price > product.price && (
              <span className="text-sm line-through hidden sm:inline" style={{ color: mutedFg }}>{formatPrice(product.compare_at_price)}</span>
            )}
          </div>
          <button
            className={`shrink-0 px-8 py-3 font-medium ${t.style.borderRadius} flex items-center gap-2`}
            style={{ backgroundColor: primaryColor, color: primaryFg }}
            onClick={handleAddToCart}
          >
            <ShoppingBag className="h-4 w-4" /> Commander
          </button>
        </div>
      </div>

      {/* Spacer for sticky CTA */}
      <div className="h-20" />
    </div>
  );
}
