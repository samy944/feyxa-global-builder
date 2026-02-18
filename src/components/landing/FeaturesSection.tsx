import { motion } from "framer-motion";
import {
  ShoppingCart,
  Globe,
  CreditCard,
  Truck,
  Brain,
  Shield,
  BarChart3,
  Palette,
} from "lucide-react";

const features = [
  {
    icon: ShoppingCart,
    title: "Catalogue puissant",
    desc: "Produits, variantes, collections, gestion des stocks et import/export CSV.",
  },
  {
    icon: Globe,
    title: "Multi-langues & devises",
    desc: "FR/EN, multi-devises, taxes automatiques par pays.",
  },
  {
    icon: CreditCard,
    title: "Paiements Afrique & monde",
    desc: "Stripe, Paystack, MTN Mobile Money, Orange Money, Wave.",
  },
  {
    icon: Truck,
    title: "Logistique mondiale",
    desc: "Calcul frais par poids, local + international, Chine↔Afrique.",
  },
  {
    icon: Brain,
    title: "IA intégrée",
    desc: "Fiches produit auto, assistant vendeur, détection de fraude.",
  },
  {
    icon: Shield,
    title: "Sécurité & conformité",
    desc: "RLS, audit logs, GDPR-ready, PCI compliant, 2FA.",
  },
  {
    icon: BarChart3,
    title: "Analytics avancés",
    desc: "Dashboard temps réel, métriques clés, rapports personnalisés.",
  },
  {
    icon: Palette,
    title: "Personnalisation",
    desc: "Thèmes premium, domaine personnalisé, branding complet.",
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

export function FeaturesSection() {
  return (
    <section id="features" className="py-32 bg-background relative">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <p className="text-sm font-medium text-primary mb-4 tracking-widest uppercase">
            Fonctionnalités
          </p>
          <h2 className="font-heading text-4xl sm:text-5xl text-foreground">
            TOUT CE QU'IL VOUS FAUT.
          </h2>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5"
        >
          {features.map((f) => (
            <motion.div
              key={f.title}
              variants={item}
              className="group relative rounded-xl border border-border bg-card p-6 hover:border-primary/30 transition-all duration-300 hover:shadow-glow"
            >
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <f.icon size={20} />
              </div>
              <h3 className="font-semibold text-foreground mb-2 text-sm">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
