import { motion } from "framer-motion";

const messages = [
  "🚀 Feyxa — La plateforme e-commerce #1 en Afrique",
  "⚡ Lancez votre boutique en 5 minutes, sans code",
  "🌍 +2,400 vendeurs actifs dans 18 pays",
  "💳 Mobile Money, Stripe, Cash à la livraison intégrés",
  "✨ IA intégrée : fiches produit, landing pages, SEO automatique",
];

export function MarqueeBar() {
  const content = messages.join("     •     ");
  const doubled = `${content}     •     ${content}`;

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] w-full overflow-hidden bg-primary py-2">
      <motion.div
        className="flex whitespace-nowrap"
        animate={{ x: [0, "-50%"] }}
        transition={{ duration: 30, ease: "linear", repeat: Infinity }}
      >
        <span className="text-xs font-medium tracking-wide text-primary-foreground">
          {doubled}
        </span>
      </motion.div>
    </div>
  );
}
