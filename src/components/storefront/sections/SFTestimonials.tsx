import { motion } from "framer-motion";
import { Star } from "lucide-react";
import type { SFSectionProps } from "../types";

const TESTIMONIALS = [
  { name: "Aminata K.", text: "Produits de qualité et livraison rapide. Je recommande !" },
  { name: "Jean-Paul M.", text: "Excellent service client, très professionnel." },
  { name: "Fatou D.", text: "Ma boutique préférée ! Toujours satisfaite de mes achats." },
];

export function SFTestimonials({ templateId, theme }: SFSectionProps) {
  if (templateId === "minimal") {
    return (
      <section className="container py-14">
        <h2 className="text-center text-xl font-light mb-10" style={{ color: `hsl(${theme.colors.foreground})`, fontFamily: `"${theme.fonts.heading}", sans-serif` }}>Avis clients</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-3xl mx-auto">
          {TESTIMONIALS.map((t, i) => (
            <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.1 }} className="text-center">
              <p className="text-sm italic leading-relaxed" style={{ color: `hsl(${theme.colors.foreground})` }}>"{t.text}"</p>
              <p className="text-xs mt-3 font-medium" style={{ color: `hsl(${theme.colors.mutedForeground})` }}>— {t.name}</p>
            </motion.div>
          ))}
        </div>
      </section>
    );
  }

  if (templateId === "fashion") {
    return (
      <section className="py-14" style={{ backgroundColor: `hsl(${theme.colors.muted})` }}>
        <div className="container">
          <h2 className="text-center text-sm uppercase tracking-[0.2em] mb-10" style={{ color: `hsl(${theme.colors.mutedForeground})`, fontFamily: `"${theme.fonts.heading}", serif` }}>Ce qu'ils en pensent</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="p-6 border" style={{ borderColor: `hsl(${theme.colors.border})`, backgroundColor: `hsl(${theme.colors.card})` }}>
                <div className="flex gap-0.5 mb-3">
                  {[1,2,3,4,5].map(s => <Star key={s} size={12} fill={`hsl(${theme.colors.primary})`} style={{ color: `hsl(${theme.colors.primary})` }} />)}
                </div>
                <p className="text-sm leading-relaxed" style={{ color: `hsl(${theme.colors.foreground})` }}>"{t.text}"</p>
                <p className="text-xs font-semibold mt-4 uppercase tracking-wider" style={{ color: `hsl(${theme.colors.mutedForeground})` }}>{t.name}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // tech, marketplace, default
  return (
    <section className="py-10 sm:py-14" style={{ backgroundColor: `hsl(${theme.colors.card})` }}>
      <div className="container">
        <h2 className="text-xl font-bold mb-6" style={{ fontFamily: `"${theme.fonts.heading}", sans-serif`, color: `hsl(${theme.colors.foreground})` }}>Ce que disent nos clients</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {TESTIMONIALS.map((t, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="rounded-lg border p-5" style={{ borderColor: `hsl(${theme.colors.border})`, backgroundColor: `hsl(${theme.colors.background})` }}>
              <div className="flex gap-0.5 mb-3">
                {[1,2,3,4,5].map(s => <Star key={s} size={14} fill={`hsl(${theme.colors.primary})`} style={{ color: `hsl(${theme.colors.primary})` }} />)}
              </div>
              <p className="text-sm leading-relaxed" style={{ color: `hsl(${theme.colors.foreground})` }}>"{t.text}"</p>
              <p className="text-xs font-semibold mt-3" style={{ color: `hsl(${theme.colors.mutedForeground})` }}>— {t.name}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
