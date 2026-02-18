import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center bg-hero overflow-hidden">
      <div className="absolute inset-0 grid-pattern opacity-40" />

      {/* Subtle green glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full blur-[150px] bg-primary/8 animate-pulse_glow" />

      <div className="container relative z-10 pt-32 pb-24">
        <div className="max-w-3xl mx-auto text-center space-y-8">
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
            className="text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed"
          >
            Créez votre boutique en ligne en 5 minutes. Paiements Afrique & monde, 
            IA intégrée, logistique mondiale. Tout-en-un.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-wrap justify-center gap-4"
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
            className="flex items-center justify-center gap-8 pt-8"
          >
            {["Stripe", "Paystack", "Mobile Money", "Wave"].map((name) => (
              <span key={name} className="text-xs text-muted-foreground/60 font-medium tracking-widest uppercase">
                {name}
              </span>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
