import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import heroLifestyle from "@/assets/hero-lifestyle.jpg";

export function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center bg-background overflow-hidden">
      <div className="container relative z-10 py-24 lg:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
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
              className="font-heading text-5xl sm:text-6xl lg:text-7xl leading-[0.95] text-foreground"
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

          {/* Right — Lifestyle Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="flex justify-center lg:justify-end"
          >
            <div className="relative w-full max-w-md lg:max-w-lg">
              <img
                src={heroLifestyle}
                alt="Entrepreneure moderne utilisant Feyxa sur son laptop"
                className="w-full h-auto rounded-2xl shadow-elevated object-cover"
                loading="eager"
              />
              {/* Subtle green accent glow behind image */}
              <div className="absolute -inset-4 -z-10 rounded-3xl bg-primary/5 blur-2xl" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
