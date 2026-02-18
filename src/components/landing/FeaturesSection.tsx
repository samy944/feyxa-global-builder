import { motion } from "framer-motion";
import {
  ShoppingCart,
  CreditCard,
  Globe,
  Truck,
  Brain,
  Shield,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Feature {
  icon: LucideIcon;
  title: string;
  desc: string;
}

const features: Feature[] = [
  {
    icon: ShoppingCart,
    title: "Catalogue intelligent",
    desc: "Produits, variantes et stocks centralisés.",
  },
  {
    icon: CreditCard,
    title: "Paiements intégrés",
    desc: "Mobile Money, Stripe, Paystack. Encaissez partout.",
  },
  {
    icon: Globe,
    title: "Multi-langues & devises",
    desc: "Vendez en FR, EN et multi-devises.",
  },
  {
    icon: Truck,
    title: "Logistique intégrée",
    desc: "Livraison locale et internationale simplifiée.",
  },
  {
    icon: Brain,
    title: "IA intégrée",
    desc: "Descriptions auto, analyse ventes, détection fraude.",
  },
  {
    icon: Shield,
    title: "Sécurité & conformité",
    desc: "RLS, audit logs, PCI-ready, 2FA.",
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.45, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};

export function FeaturesSection() {
  return (
    <section id="features" className="relative overflow-hidden" style={{ padding: "120px 0" }}>
      {/* Background: subtle radial green glow */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 40%, hsla(106, 75%, 47%, 0.04), transparent 70%)",
        }}
      />

      <div className="container">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-20 max-w-2xl mx-auto"
        >
          <h2
            className="font-heading text-4xl sm:text-5xl lg:text-6xl leading-[1] mb-6 text-foreground"
          >
            TOUT POUR VENDRE.
            <br />
            <span className="text-gradient">RIEN À CONFIGURER.</span>
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Paiement, logistique, IA et conformité. Tout est intégré, prêt à l'emploi.
          </p>
        </motion.div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              custom={i}
              variants={cardVariants}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-40px" }}
              className="group relative rounded-2xl p-7 sm:p-8 transition-all duration-300"
              style={{
                background: "hsl(0, 0%, 10%)",
                border: "1px solid hsla(0, 0%, 100%, 0.08)",
              }}
              whileHover={{ y: -6 }}
            >
              {/* Hover glow overlay */}
              <div
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-0 pointer-events-none"
                style={{
                  boxShadow: "0 0 40px -10px hsla(106, 75%, 47%, 0.15), 0 20px 50px -15px hsla(0, 0%, 0%, 0.3)",
                }}
              />

              {/* Icon */}
              <div
                className="relative z-10 mb-5 inline-flex h-12 w-12 items-center justify-center rounded-full transition-transform duration-300 group-hover:scale-105"
                style={{
                  background: "hsla(106, 75%, 47%, 0.1)",
                  boxShadow: "0 0 20px -4px hsla(106, 75%, 47%, 0.15)",
                }}
              >
                <f.icon size={22} style={{ color: "hsl(106, 75%, 47%)" }} />
              </div>

              {/* Title */}
              <h3
                className="relative z-10 font-semibold text-lg mb-2 text-foreground"
              >
                {f.title}
              </h3>

              {/* Description */}
              <p
                className="relative z-10 text-sm leading-relaxed"
                style={{ color: "hsl(0, 0%, 55%)", lineHeight: 1.7 }}
              >
                {f.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
