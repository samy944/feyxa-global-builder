import { useState } from "react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Sparkles, Zap } from "lucide-react";
import { Link } from "react-router-dom";

const plans = [
  {
    name: "Starter",
    monthly: 0,
    yearly: 0,
    desc: "Pour tester et lancer votre première boutique.",
    features: [
      "1 boutique",
      "50 produits",
      "Paiements Stripe",
      "Thème standard",
      "Support email",
    ],
    cta: "Commencer gratuitement",
    popular: false,
  },
  {
    name: "Pro",
    monthly: 29,
    yearly: 24,
    desc: "Pour les vendeurs qui veulent scaler.",
    features: [
      "3 boutiques",
      "Produits illimités",
      "Tous les paiements",
      "Domaine personnalisé",
      "IA : fiches produit",
      "Analytics avancés",
      "Support prioritaire",
    ],
    cta: "Essai gratuit 14 jours",
    popular: true,
  },
  {
    name: "Enterprise",
    monthly: 99,
    yearly: 79,
    desc: "Pour les entreprises avec des besoins avancés.",
    features: [
      "Boutiques illimitées",
      "Tout du plan Pro",
      "API complète",
      "Multi-staff & rôles",
      "Logistique Chine↔Afrique",
      "SLA & support dédié",
      "Audit logs complets",
    ],
    cta: "Contacter les ventes",
    popular: false,
  },
];

export function PricingSection() {
  const [annual, setAnnual] = useState(false);

  return (
    <section id="pricing" className="relative py-28 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10 grid-pattern opacity-[0.08]" />
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 50% 50% at 50% 30%, hsla(var(--primary) / 0.06), transparent 70%)",
        }}
      />

      <div className="container relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-16 max-w-2xl mx-auto"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary mb-6">
            <Zap size={12} className="fill-primary" />
            Tarifs
          </span>
          <h2 className="font-heading text-4xl sm:text-5xl lg:text-6xl leading-[1] mb-6 text-foreground">
            SIMPLE &
            <br />
            <span className="text-gradient">TRANSPARENT.</span>
          </h2>
          <p className="text-lg leading-relaxed text-muted-foreground">
            Pas de frais cachés. Commencez gratuitement, évoluez quand vous êtes prêt.
          </p>
        </motion.div>

        {/* Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="flex items-center justify-center gap-4 mb-16"
        >
          <span className={`text-sm font-medium transition-colors duration-200 ${annual ? "text-muted-foreground" : "text-foreground"}`}>
            Mensuel
          </span>
          <button
            onClick={() => setAnnual(!annual)}
            className="relative h-8 w-14 rounded-full transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            style={{
              background: annual ? "hsl(var(--primary))" : "hsl(var(--muted))",
            }}
            aria-label="Basculer entre mensuel et annuel"
          >
            <motion.div
              className="absolute top-1 left-1 h-6 w-6 rounded-full bg-foreground"
              animate={{ x: annual ? 24 : 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          </button>
          <span className={`text-sm font-medium transition-colors duration-200 ${annual ? "text-foreground" : "text-muted-foreground"}`}>
            Annuel
          </span>
          {annual && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8, x: -8 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              className="text-xs font-semibold rounded-full px-3 py-1 border border-primary/20 bg-primary/10 text-primary"
            >
              -20%
            </motion.span>
          )}
        </motion.div>

        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-5 lg:gap-6 max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.12, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -6 }}
              className={`group relative rounded-2xl p-7 sm:p-8 flex flex-col transition-all duration-300 border backdrop-blur-sm ${
                plan.popular
                  ? "border-primary/30 bg-card/80"
                  : "border-border/50 bg-card/50 hover:border-primary/15"
              }`}
            >
              {/* Hover glow */}
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none shadow-glow" />

              {/* Popular badge */}
              {plan.popular && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4, duration: 0.4 }}
                  className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 rounded-full px-4 py-1.5 bg-primary shadow-glow"
                >
                  <Sparkles size={12} className="text-primary-foreground" />
                  <span className="text-xs font-semibold text-primary-foreground tracking-wide">
                    POPULAIRE
                  </span>
                </motion.div>
              )}

              {/* Plan name */}
              <div className="relative z-10 mb-6">
                <h3 className="font-heading text-2xl text-foreground mb-1.5">
                  {plan.name.toUpperCase()}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {plan.desc}
                </p>
              </div>

              {/* Price */}
              <div className="relative z-10 mb-8">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={annual ? "yearly" : "monthly"}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                    className="text-5xl font-bold text-foreground inline-block"
                  >
                    €{annual ? plan.yearly : plan.monthly}
                  </motion.span>
                </AnimatePresence>
                <span className="text-sm ml-1 text-muted-foreground">/mois</span>
                {annual && plan.monthly > 0 && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="block text-xs mt-1 text-muted-foreground"
                  >
                    <span className="line-through">€{plan.monthly}</span>{" "}facturé annuellement
                  </motion.span>
                )}
              </div>

              {/* Features */}
              <ul className="relative z-10 space-y-3.5 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm text-muted-foreground">
                    <div className="shrink-0 h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center">
                      <Check size={11} className="text-primary" />
                    </div>
                    {f}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Button
                variant={plan.popular ? "hero" : "hero-outline"}
                className="relative z-10 w-full"
                asChild
              >
                <Link to="/signup">{plan.cta}</Link>
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
