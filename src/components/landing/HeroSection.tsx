import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Zap } from "lucide-react";
import { DeviceShowcase } from "./DeviceShowcase";
import { useTranslation } from "@/lib/i18n";

export function HeroSection() {
  const { t, lang } = useTranslation();

  const stats = lang === "fr"
    ? [{ value: "2K+", label: "Vendeurs actifs" }, { value: "50K+", label: "Commandes/mois" }, { value: "15+", label: "Pays couverts" }]
    : [{ value: "2K+", label: "Active sellers" }, { value: "50K+", label: "Orders/month" }, { value: "15+", label: "Countries covered" }];

  const badge = lang === "fr" ? "La plateforme e-commerce #1 en Afrique" : "Africa's #1 e-commerce platform";

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-hero">
      <div className="absolute inset-0 grid-pattern opacity-20" />
      <div className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full blur-[180px] opacity-[0.07]" style={{ background: "hsl(var(--primary))" }} />
      <div className="absolute -bottom-40 -right-20 w-[500px] h-[400px] rounded-full blur-[160px] opacity-[0.05]" style={{ background: "hsl(var(--primary))" }} />

      <div className="container relative z-10 pt-28 pb-16 lg:pt-32 lg:pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-20 items-center">
          <div className="space-y-8 text-center lg:text-left">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.5 }} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-sm font-medium">
              <Zap size={14} />
              {badge}
            </motion.div>

            <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.6, ease: [0.22, 1, 0.36, 1] }} className="font-heading text-5xl sm:text-6xl lg:text-7xl xl:text-[5.5rem] leading-[0.95] text-foreground">
              {lang === "fr" ? (<>CRÉEZ.<br />VENDEZ.<br /><span className="text-gradient">SCALEZ.</span></>) : (<>CREATE.<br />SELL.<br /><span className="text-gradient">SCALE.</span></>)}
            </motion.h1>

            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="text-lg sm:text-xl text-muted-foreground max-w-lg mx-auto lg:mx-0 leading-relaxed">
              {t.hero.subtitle}
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="flex flex-wrap justify-center lg:justify-start gap-4">
              <Button variant="hero" size="lg" asChild>
                <Link to="/signup">
                  {t.hero.cta}
                  <ArrowRight size={16} />
                </Link>
              </Button>
              <Button variant="hero-outline" size="lg" asChild>
                <a href="#features" onClick={(e) => { e.preventDefault(); document.querySelector("#features")?.scrollIntoView({ behavior: "smooth" }); }}>
                  {t.hero.ctaSecondary}
                </a>
              </Button>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.65 }} className="flex items-center justify-center lg:justify-start gap-8 pt-4">
              {stats.map((s) => (
                <div key={s.label} className="flex flex-col items-center lg:items-start">
                  <span className="text-2xl font-heading font-bold text-foreground">{s.value}</span>
                  <span className="text-xs text-muted-foreground tracking-wider uppercase">{s.label}</span>
                </div>
              ))}
            </motion.div>
          </div>

          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.9, ease: [0.22, 1, 0.36, 1] }} className="flex justify-center">
            <DeviceShowcase />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
