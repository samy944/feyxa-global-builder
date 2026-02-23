import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, HelpCircle } from "lucide-react";

const faqs = [
  {
    q: "Combien de temps faut-il pour créer ma boutique ?",
    a: "Moins de 5 minutes. Inscrivez-vous, choisissez un nom, ajoutez vos produits et vous êtes en ligne. Aucune compétence technique requise.",
  },
  {
    q: "Quels moyens de paiement sont acceptés ?",
    a: "Feyxa supporte Mobile Money (MTN, Orange, Wave, Moov), les cartes Visa/Mastercard via CinetPay, et le paiement à la livraison (COD).",
  },
  {
    q: "Y a-t-il des frais de transaction ?",
    a: "Le plan Gratuit inclut 0 % de commission Feyxa. Seuls les frais du prestataire de paiement s'appliquent (généralement 1-3 %). Les plans payants offrent des taux négociés.",
  },
  {
    q: "Puis-je utiliser mon propre nom de domaine ?",
    a: "Oui ! Dès le plan Pro, vous pouvez connecter votre domaine personnalisé en quelques clics depuis les paramètres de votre boutique.",
  },
  {
    q: "Comment fonctionne la livraison ?",
    a: "Vous définissez vos zones de livraison et tarifs. Feyxa s'intègre avec DHL, FedEx et les transporteurs locaux pour le suivi automatique des colis.",
  },
  {
    q: "Puis-je annuler mon abonnement à tout moment ?",
    a: "Absolument. Aucun engagement, aucuns frais cachés. Vous pouvez passer au plan gratuit ou annuler à tout moment depuis votre tableau de bord.",
  },
];

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="relative py-28 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10 grid-pattern opacity-[0.08]" />
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 50% 40% at 70% 50%, hsla(var(--primary) / 0.04), transparent 70%)",
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
            <HelpCircle size={12} />
            FAQ
          </span>
          <h2 className="font-heading text-4xl sm:text-5xl lg:text-6xl leading-[1] mb-6 text-foreground">
            QUESTIONS
            <br />
            <span className="text-gradient">FRÉQUENTES.</span>
          </h2>
          <p className="text-lg leading-relaxed text-muted-foreground">
            Tout ce que vous devez savoir pour démarrer sur Feyxa.
          </p>
        </motion.div>

        {/* FAQ items */}
        <div className="max-w-2xl mx-auto space-y-3">
          {faqs.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06, duration: 0.4 }}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className={`w-full flex items-center justify-between gap-4 rounded-2xl border px-6 py-5 text-left transition-all duration-300 backdrop-blur-sm ${
                    isOpen
                      ? "border-primary/20 bg-card/80"
                      : "border-border/50 bg-card/40 hover:border-primary/10 hover:bg-card/60"
                  }`}
                >
                  <span className="text-sm font-semibold text-foreground">{faq.q}</span>
                  <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="shrink-0"
                  >
                    <ChevronDown size={18} className="text-muted-foreground" />
                  </motion.div>
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <p className="px-6 pt-3 pb-5 text-sm text-muted-foreground leading-relaxed">
                        {faq.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
