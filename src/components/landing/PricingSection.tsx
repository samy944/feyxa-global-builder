import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
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

export function PricingSection() {
  return (
    <section id="pricing" className="py-32 bg-hero relative">
      <div className="absolute inset-0 grid-pattern opacity-20" />
      <div className="container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <p className="text-sm font-medium text-primary mb-4 tracking-widest uppercase">Tarifs</p>
          <h2 className="font-heading text-4xl sm:text-5xl text-foreground">
            SIMPLE & TRANSPARENT.
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`relative rounded-2xl border p-8 flex flex-col ${
                plan.popular
                  ? "border-primary/40 bg-card shadow-glow"
                  : "border-border bg-card/60"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-semibold text-primary-foreground">
                  Populaire
                </div>
              )}
              <div className="mb-6">
                <h3 className="font-heading text-2xl text-foreground">{plan.name.toUpperCase()}</h3>
                <p className="text-sm text-muted-foreground mt-1">{plan.desc}</p>
              </div>
              <div className="mb-8">
                <span className="text-5xl font-bold text-foreground">€{plan.price}</span>
                <span className="text-muted-foreground text-sm">/mois</span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                    <Check size={14} className="text-primary shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                variant={plan.popular ? "hero" : "hero-outline"}
                className="w-full"
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
