import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import type { SFSectionProps } from "../types";

const TESTIMONIALS = [
  { name: "Aminata K.", text: "Produits de qualité exceptionnelle et livraison ultra rapide. Je recommande les yeux fermés !", rating: 5, avatar: "AK" },
  { name: "Jean-Paul M.", text: "Service client au top, très professionnel. Les produits correspondent parfaitement à la description.", rating: 5, avatar: "JP" },
  { name: "Fatou D.", text: "Ma boutique préférée ! Toujours satisfaite de mes achats. La qualité est constante.", rating: 5, avatar: "FD" },
];

export function SFTestimonials({ templateId, theme }: SFSectionProps) {
  const Stars = ({ count = 5 }: { count?: number }) => (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} size={12} fill={`hsl(${theme.colors.primary})`} style={{ color: `hsl(${theme.colors.primary})` }} />
      ))}
    </div>
  );

  const Avatar = ({ initials }: { initials: string }) => (
    <div className="h-10 w-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ backgroundColor: `hsl(${theme.colors.primary} / 0.15)`, color: `hsl(${theme.colors.primary})` }}>
      {initials}
    </div>
  );

  if (templateId === "minimal") {
    return (
      <section className="container py-16 sm:py-20">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-light" style={{ color: `hsl(${theme.colors.foreground})`, fontFamily: `"${theme.fonts.heading}", sans-serif` }}>Ce que disent nos clients</h2>
          <div className="h-px w-12 mx-auto mt-4" style={{ backgroundColor: `hsl(${theme.colors.foreground})` }} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 max-w-4xl mx-auto">
          {TESTIMONIALS.map((t, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="text-center">
              <Quote size={20} className="mx-auto mb-4 opacity-20" style={{ color: `hsl(${theme.colors.foreground})` }} />
              <p className="text-sm italic leading-relaxed" style={{ color: `hsl(${theme.colors.foreground})` }}>"{t.text}"</p>
              <div className="flex items-center justify-center gap-2 mt-4">
                <Avatar initials={t.avatar} />
                <p className="text-xs font-medium" style={{ color: `hsl(${theme.colors.mutedForeground})` }}>{t.name}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    );
  }

  if (templateId === "fashion") {
    return (
      <section className="py-16 sm:py-20" style={{ backgroundColor: `hsl(${theme.colors.muted})` }}>
        <div className="container">
          <h2 className="text-center text-sm uppercase tracking-[0.25em] mb-12" style={{ color: `hsl(${theme.colors.mutedForeground})`, fontFamily: `"${theme.fonts.heading}", serif` }}>Avis vérifiés</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="p-8 border relative" style={{ borderColor: `hsl(${theme.colors.border})`, backgroundColor: `hsl(${theme.colors.card})` }}>
                <Stars />
                <p className="text-sm leading-relaxed mt-4" style={{ color: `hsl(${theme.colors.foreground})` }}>"{t.text}"</p>
                <div className="flex items-center gap-3 mt-6">
                  <Avatar initials={t.avatar} />
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: `hsl(${theme.colors.mutedForeground})` }}>{t.name}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // tech, marketplace, default
  return (
    <section className="py-12 sm:py-16" style={{ backgroundColor: `hsl(${theme.colors.card})` }}>
      <div className="container">
        <h2 className="text-xl sm:text-2xl font-bold mb-8" style={{ fontFamily: `"${theme.fonts.heading}", sans-serif`, color: `hsl(${theme.colors.foreground})` }}>Ce que disent nos clients</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {TESTIMONIALS.map((t, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="rounded-xl border p-6" style={{ borderColor: `hsl(${theme.colors.border})`, backgroundColor: `hsl(${theme.colors.background})` }}>
              <Stars />
              <p className="text-sm leading-relaxed mt-4" style={{ color: `hsl(${theme.colors.foreground})` }}>"{t.text}"</p>
              <div className="flex items-center gap-3 mt-5 pt-4 border-t" style={{ borderColor: `hsl(${theme.colors.border})` }}>
                <Avatar initials={t.avatar} />
                <p className="text-xs font-semibold" style={{ color: `hsl(${theme.colors.mutedForeground})` }}>{t.name}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
