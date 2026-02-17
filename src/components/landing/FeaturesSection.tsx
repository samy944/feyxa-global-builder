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
    desc: "Produits, variantes, collections intelligentes, gestion des stocks et import/export CSV.",
  },
  {
    icon: Globe,
    title: "Multi-langues & devises",
    desc: "Internationalisation FR/EN, multi-devises, taxes automatiques par pays.",
  },
  {
    icon: CreditCard,
    title: "Paiements Afrique & monde",
    desc: "Stripe, Paystack, Flutterwave, MTN Mobile Money, Orange Money, Wave.",
  },
  {
    icon: Truck,
    title: "Logistique mondiale",
    desc: "Calcul frais par poids/CBM, local + international, connecteur Chine↔Afrique.",
  },
  {
    icon: Brain,
    title: "IA intégrée",
    desc: "Génération de fiches produit, assistant vendeur, détection de fraude automatique.",
  },
  {
    icon: Shield,
    title: "Sécurité & conformité",
    desc: "RLS strict, audit logs, GDPR-ready, OWASP, PCI compliant, 2FA optionnel.",
  },
  {
    icon: BarChart3,
    title: "Analytics avancés",
    desc: "Dashboard temps réel, métriques clés, rapports personnalisés, export données.",
  },
  {
    icon: Palette,
    title: "Thèmes & personnalisation",
    desc: "Storefront customisable, thèmes premium, domaine personnalisé, branding complet.",
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
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
          <p className="text-sm font-medium text-primary mb-3 tracking-wide uppercase">Fonctionnalités</p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Tout ce dont vous avez besoin.
            <br />
            <span className="text-muted-foreground">Rien de superflu.</span>
          </h2>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
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
              <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
