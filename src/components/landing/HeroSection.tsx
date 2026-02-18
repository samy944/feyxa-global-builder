import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import heroLifestyle from "@/assets/hero-lifestyle.jpg";

export function HeroSection() {
  return (
    <section
      className="relative min-h-[90vh] flex items-center overflow-hidden"
      style={{ background: "hsl(28, 100%, 96%)" }}
    >
      <div className="container relative z-10 py-24 lg:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left — Text */}
          <div className="space-y-8 text-center lg:text-left">
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-sm font-medium tracking-widest uppercase"
              style={{ color: "hsl(106, 75%, 47%)" }}
            >
              E-commerce nouvelle génération
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="font-heading text-5xl sm:text-6xl lg:text-7xl leading-[0.95]"
              style={{ color: "hsl(0, 0%, 11%)" }}
            >
              VENDEZ
              <br />
              <span className="text-gradient">PARTOUT.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-lg max-w-lg mx-auto lg:mx-0 leading-relaxed"
              style={{ color: "hsl(0, 0%, 45%)" }}
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
                <Link to="#features" style={{ color: "hsl(0, 0%, 11%)", borderColor: "hsl(0, 0%, 11%, 0.2)" }}>
                  Découvrir
                </Link>
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="flex items-center justify-center lg:justify-start gap-8 pt-4"
            >
              {["Stripe", "Paystack", "Mobile Money", "Wave"].map((name) => (
                <span
                  key={name}
                  className="text-xs font-medium tracking-widest uppercase"
                  style={{ color: "hsl(0, 0%, 45%, 0.6)" }}
                >
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
                className="w-full h-auto rounded-2xl object-cover"
                style={{ boxShadow: "0 20px 60px -15px hsla(0, 0%, 0%, 0.12)" }}
                loading="eager"
              />
              {/* Subtle green accent glow behind image */}
              <div
                className="absolute -inset-4 -z-10 rounded-3xl blur-2xl"
                style={{ background: "hsla(106, 75%, 47%, 0.06)" }}
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
