import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

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
    <section className="relative py-28 overflow-hidden">
      <div className="absolute inset-0 grid-pattern opacity-15" />
      <div className="container relative z-10">
        <div className="text-center mb-16 space-y-4">
          <span className="inline-block text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            FAQ
          </span>
          <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            Questions fréquentes
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Tout ce que vous devez savoir pour démarrer sur Feyxa.
          </p>
        </div>

        <div className="max-w-2xl mx-auto space-y-3">
          {faqs.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05, duration: 0.4 }}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="w-full flex items-center justify-between gap-4 rounded-xl border border-border bg-card/60 px-6 py-5 text-left transition-colors hover:bg-card"
                >
                  <span className="text-sm font-semibold text-foreground">{faq.q}</span>
                  <ChevronDown
                    size={18}
                    className={`shrink-0 text-muted-foreground transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                  />
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
                      <p className="px-6 pt-2 pb-5 text-sm text-muted-foreground leading-relaxed">
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
