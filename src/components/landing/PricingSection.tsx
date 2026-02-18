import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const plans = [
  {
    name: "Starter",
    price: "0",
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
    price: "29",
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
    price: "99",
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

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};

export function PricingSection() {
  return (
    <section id="pricing" className="relative overflow-hidden" style={{ padding: "120px 0" }}>
      {/* Background */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 60%, hsla(106, 75%, 47%, 0.04), transparent 70%)",
        }}
      />
      <div className="absolute inset-0 grid-pattern opacity-15 -z-10" />

      <div className="container relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-20 max-w-2xl mx-auto"
        >
          <p
            className="text-sm font-medium mb-5 tracking-widest uppercase"
            style={{ color: "hsl(106, 75%, 47%)" }}
          >
            Tarifs
          </p>
          <h2 className="font-heading text-4xl sm:text-5xl lg:text-6xl leading-[1] mb-6 text-foreground">
            SIMPLE &
            <br />
            <span className="text-gradient">TRANSPARENT.</span>
          </h2>
          <p className="text-lg leading-relaxed" style={{ color: "hsl(0, 0%, 55%)" }}>
            Pas de frais cachés. Commencez gratuitement, évoluez quand vous êtes prêt.
          </p>
        </motion.div>

        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              custom={i}
              variants={cardVariants}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-40px" }}
              className="group relative rounded-2xl p-7 sm:p-8 flex flex-col transition-all duration-300"
              style={{
                background: plan.popular
                  ? "linear-gradient(160deg, hsl(0, 0%, 13%) 0%, hsl(0, 0%, 9%) 100%)"
                  : "hsl(0, 0%, 10%)",
                border: plan.popular
                  ? "1px solid hsla(106, 75%, 47%, 0.25)"
                  : "1px solid hsla(0, 0%, 100%, 0.08)",
              }}
              whileHover={{ y: -6 }}
            >
              {/* Hover glow */}
              <div
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-0 pointer-events-none"
                style={{
                  boxShadow: plan.popular
                    ? "0 0 60px -10px hsla(106, 75%, 47%, 0.2), 0 20px 50px -15px hsla(0, 0%, 0%, 0.4)"
                    : "0 0 40px -10px hsla(106, 75%, 47%, 0.12), 0 20px 50px -15px hsla(0, 0%, 0%, 0.3)",
                }}
              />

              {/* Popular badge */}
              {plan.popular && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 rounded-full px-4 py-1.5"
                  style={{
                    background: "linear-gradient(135deg, hsl(106, 75%, 47%), hsl(97, 65%, 35%))",
                    boxShadow: "0 4px 20px -4px hsla(106, 75%, 47%, 0.4)",
                  }}
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
                <p className="text-sm leading-relaxed" style={{ color: "hsl(0, 0%, 50%)" }}>
                  {plan.desc}
                </p>
              </div>

              {/* Price */}
              <div className="relative z-10 mb-8">
                <span className="text-5xl font-bold text-foreground">€{plan.price}</span>
                <span className="text-sm ml-1" style={{ color: "hsl(0, 0%, 45%)" }}>
                  /mois
                </span>
              </div>

              {/* Features */}
              <ul className="relative z-10 space-y-3.5 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm" style={{ color: "hsl(0, 0%, 60%)" }}>
                    <div
                      className="shrink-0 h-5 w-5 rounded-full flex items-center justify-center"
                      style={{
                        background: "hsla(106, 75%, 47%, 0.1)",
                      }}
                    >
                      <Check size={11} style={{ color: "hsl(106, 75%, 47%)" }} />
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
