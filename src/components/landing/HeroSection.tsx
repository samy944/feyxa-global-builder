import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Star, Shield, Truck, CreditCard } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

export function HeroSection() {
  const { t, lang } = useTranslation();

  const trustItems = [
    { icon: Star, label: "4.9/5", sub: "2,400+ avis" },
    { icon: Shield, label: "Sécurisé", sub: "SSL & Escrow" },
    { icon: Truck, label: "18 pays", sub: "Livraison intégrée" },
    { icon: CreditCard, label: "Mobile Money", sub: "& Carte bancaire" },
  ];

  return (
    <section className="relative min-h-[100vh] flex flex-col overflow-hidden">
      {/* Immersive full-width hero background */}
      <div className="absolute inset-0 bg-hero" />
      
      {/* Floating gradient orbs */}
      <div className="absolute top-20 left-[10%] w-[500px] h-[500px] rounded-full blur-[150px] opacity-[0.08]" style={{ background: "hsl(var(--primary))" }} />
      <div className="absolute bottom-10 right-[5%] w-[400px] h-[400px] rounded-full blur-[130px] opacity-[0.06]" style={{ background: "hsl(var(--accent))" }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] rounded-full blur-[200px] opacity-[0.04]" style={{ background: "hsl(var(--primary))" }} />

      {/* Main content */}
      <div className="relative z-10 flex-1 flex items-center pt-32 pb-8">
        <div className="container max-w-7xl">
          <div className="flex flex-col items-center text-center">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="mb-8"
            >
              <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-primary/20 bg-primary/5 backdrop-blur-sm">
                <div className="flex -space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={12} className="fill-primary text-primary" />
                  ))}
                </div>
                <span className="text-sm font-medium text-primary">
                  {lang === "fr" ? "Noté 4.9/5 par +2,400 vendeurs" : "Rated 4.9/5 by 2,400+ sellers"}
                </span>
              </div>
            </motion.div>

            {/* Main headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="font-heading text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-[6.5rem] leading-[0.9] tracking-tight text-foreground mb-6"
            >
              {lang === "fr" ? (
                <>
                  Votre boutique.
                  <br />
                  <span className="text-gradient">Votre empire.</span>
                </>
              ) : (
                <>
                  Your store.
                  <br />
                  <span className="text-gradient">Your empire.</span>
                </>
              )}
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.6 }}
              className="text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed mb-10"
            >
              {t.hero.subtitle}
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.5 }}
              className="flex flex-col sm:flex-row items-center gap-4 mb-16"
            >
              <Button variant="hero" size="lg" className="text-base px-8 h-14 rounded-2xl shadow-glow" asChild>
                <Link to="/start">
                  {t.hero.cta}
                  <ArrowRight size={18} className="ml-2" />
                </Link>
              </Button>
              <Button variant="hero-outline" size="lg" className="text-base px-8 h-14 rounded-2xl" asChild>
                <a href="#features" onClick={(e) => { e.preventDefault(); document.querySelector("#features")?.scrollIntoView({ behavior: "smooth" }); }}>
                  {t.hero.ctaSecondary}
                </a>
              </Button>
            </motion.div>

            {/* Device Showcase — Full width multi-device */}
            <motion.div
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 1, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full max-w-5xl mx-auto"
            >
              {/* Glow beneath */}
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-primary/5 to-transparent rounded-3xl blur-3xl" />

              {/* Desktop mockup — main */}
              <div
                className="relative mx-auto rounded-2xl overflow-hidden shadow-elevated"
                style={{
                  border: "3px solid hsl(0 0% 20%)",
                  background: "hsl(0 0% 8%)",
                }}
              >
                <img
                  src="/mockups/screen-dashboard.webp"
                  alt="Feyxa Dashboard"
                  className="w-full h-auto"
                  loading="eager"
                />
              </div>

              {/* Phone mockup — floating left */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8, duration: 0.7 }}
                className="absolute -bottom-6 -left-4 sm:left-4 lg:-left-8 w-[120px] sm:w-[140px] lg:w-[170px]"
              >
                <div
                  className="rounded-[1.5rem] overflow-hidden shadow-elevated"
                  style={{
                    border: "3px solid hsl(0 0% 22%)",
                    background: "hsl(0 0% 8%)",
                  }}
                >
                  <img
                    src="/mockups/phone-marketplace.webp"
                    alt="Marketplace mobile"
                    className="w-full h-auto"
                    loading="eager"
                  />
                </div>
              </motion.div>

              {/* Tablet mockup — floating right */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.9, duration: 0.7 }}
                className="absolute -bottom-4 -right-2 sm:right-2 lg:-right-6 w-[140px] sm:w-[170px] lg:w-[210px]"
              >
                <div
                  className="rounded-[1.2rem] overflow-hidden shadow-elevated"
                  style={{
                    border: "3px solid hsl(0 0% 22%)",
                    background: "hsl(0 0% 8%)",
                  }}
                >
                  <img
                    src="/mockups/tablet-checkout.webp"
                    alt="Checkout tablet"
                    className="w-full h-auto"
                    loading="eager"
                  />
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Trust bar — DBC-style sticky trust */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1, duration: 0.5 }}
        className="relative z-10 mt-auto"
      >
        <div className="container max-w-4xl py-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {trustItems.map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.2 + i * 0.1, duration: 0.4 }}
                className="flex items-center gap-3 rounded-xl border border-border/50 bg-card/30 backdrop-blur-sm px-4 py-3"
              >
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <item.icon size={18} className="text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground leading-none mb-0.5">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.sub}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
}
