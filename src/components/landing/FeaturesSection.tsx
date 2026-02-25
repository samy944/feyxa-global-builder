import { motion } from "framer-motion";
import {
  Zap,
  BarChart3,
  Palette,
  Megaphone,
  ShieldCheck,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Feature {
  icon: LucideIcon;
  title: string;
  desc: string;
  stat: string;
  statLabel: string;
  span?: string;
}

const features: Feature[] = [
  {
    icon: Zap,
    title: "Lancez en 5 min",
    desc: "Créez votre boutique, importez vos produits et commencez à vendre. Zéro code, zéro prise de tête.",
    stat: "5 min",
    statLabel: "pour lancer",
    span: "md:col-span-2",
  },
  {
    icon: BarChart3,
    title: "Suivez chaque vente",
    desc: "Tableaux de bord en temps réel, attribution marketing et alertes de conversion automatiques.",
    stat: "100%",
    statLabel: "de visibilité",
  },
  {
    icon: Palette,
    title: "Pages qui convertissent",
    desc: "Landing pages drag & drop avec 25+ blocs, test A/B et designer IA intégré.",
    stat: "3×",
    statLabel: "plus de conversions",
  },
  {
    icon: Megaphone,
    title: "Marketing autopilot",
    desc: "Liens trackés, pixels intégrés et attribution multi-canal pour scaler vos campagnes.",
    stat: "∞",
    statLabel: "de reach",
    span: "md:col-span-2",
  },
  {
    icon: ShieldCheck,
    title: "Paiements sécurisés",
    desc: "Escrow, Mobile Money, Stripe et cash à la livraison. Protégez acheteurs et vendeurs.",
    stat: "0%",
    statLabel: "de fraude",
  },
  {
    icon: Sparkles,
    title: "IA qui bosse pour vous",
    desc: "Descriptions produits, optimisation SEO, recommandations intelligentes. L'IA fait le travail.",
    stat: "10×",
    statLabel: "plus rapide",
  },
];

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
};

export function FeaturesSection() {
  return (
    <section id="features" className="relative overflow-hidden py-28 lg:py-36">
      <div className="absolute inset-0 -z-10">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] rounded-full opacity-[0.03]"
          style={{
            background: "radial-gradient(circle, hsl(var(--primary)), transparent 70%)",
          }}
        />
      </div>

      <div className="container max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-sm font-medium mb-8">
            <Sparkles size={14} />
            Plateforme tout-en-un
          </div>
          <h2 className="font-heading text-4xl sm:text-5xl lg:text-6xl leading-[1.05] mb-6 text-foreground tracking-tight">
            Vendez plus.{" "}
            <span className="text-gradient">Gérez moins.</span>
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto">
            Chaque outil dont vous avez besoin pour transformer votre idée en business rentable — intégré, automatisé, prêt.
          </p>
        </motion.div>

        {/* Bento grid — asymmetric DBC-style */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5"
        >
          {features.map((f) => (
            <motion.div
              key={f.title}
              variants={itemVariants}
              className={`group relative rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-7 transition-all duration-300 hover:border-primary/30 hover:bg-card/80 ${f.span || ""}`}
            >
              {/* Hover glow */}
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={{
                background: "radial-gradient(circle at 50% 0%, hsla(var(--primary) / 0.06), transparent 60%)",
              }} />

              <div className="relative z-10 flex flex-col h-full">
                {/* Top row: icon + stat */}
                <div className="flex items-start justify-between mb-5">
                  <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary transition-transform duration-300 group-hover:scale-110 group-hover:shadow-glow">
                    <f.icon size={22} strokeWidth={1.8} />
                  </div>
                  <div className="text-right flex items-center gap-2">
                    <div>
                      <span className="block text-3xl font-heading font-bold text-foreground leading-none">
                        {f.stat}
                      </span>
                      <span className="text-[11px] text-muted-foreground uppercase tracking-wider">
                        {f.statLabel}
                      </span>
                    </div>
                    <ArrowUpRight size={16} className="text-muted-foreground/30 group-hover:text-primary transition-colors" />
                  </div>
                </div>

                {/* Content */}
                <h3 className="font-semibold text-lg text-foreground mb-2">
                  {f.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {f.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
