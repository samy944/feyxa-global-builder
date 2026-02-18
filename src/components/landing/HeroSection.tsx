import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { PhoneShowcase } from "./PhoneShowcase";

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center bg-hero overflow-hidden">
      <div className="absolute inset-0 grid-pattern opacity-40" />

      {/* Subtle green glow */}
      <div className="absolute top-1/3 left-1/4 w-[600px] h-[300px] rounded-full blur-[150px] bg-primary/8 animate-pulse_glow" />

      <div className="container relative z-10 pt-32 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20 items-center">
          {/* Left — Text */}
          <div className="space-y-8 text-center lg:text-left">
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-sm font-medium tracking-widest uppercase text-primary"
            >
              E-commerce nouvelle génération
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="font-heading text-5xl sm:text-6xl lg:text-8xl leading-[0.95] text-foreground"
            >
              VENDEZ
              <br />
              <span className="text-gradient">PARTOUT.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-lg text-muted-foreground max-w-lg mx-auto lg:mx-0 leading-relaxed"
            >
              Créez votre boutique en ligne en 5 minutes. Paiements Afrique & monde,
              IA intégrée, logistique mondiale. Tout-en-un.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-wrap justify-center lg:justify-start gap-4"
            >
              <Button variant="hero" size="lg" asChild>
                <Link to="/signup">
                  Commencer gratuitement
                  <ArrowRight size={16} />
                </Link>
              </Button>
              <Button variant="hero-outline" size="lg" asChild>
                <Link to="#features">Découvrir</Link>
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="flex items-center justify-center lg:justify-start gap-8 pt-4"
            >
              {["Stripe", "Paystack", "Mobile Money", "Wave"].map((name) => (
                <span key={name} className="text-xs text-muted-foreground/60 font-medium tracking-widest uppercase">
                  {name}
                </span>
              ))}
            </motion.div>
          </div>

          {/* Right — Phone Mockup */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="flex justify-center lg:justify-end"
          >
            <PhoneShowcase />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
