import { motion } from "framer-motion";
import { Package, Sparkles } from "lucide-react";
import type { SFSectionProps } from "../types";
import { useMemo } from "react";

export function SFCategories({ templateId, store, theme, products }: SFSectionProps) {
  const categories = useMemo(() => {
    return [...new Set(products.filter(p => p.category).map(p => p.category!))].slice(0, 8);
  }, [products]);

  if (categories.length === 0) return null;

  const CATEGORY_EMOJIS: Record<string, string> = {
    "Électronique": "⚡", "Mode": "👗", "Maison": "🏠", "Beauté": "✨",
    "Sport": "🏋️", "Alimentation": "🍎", "Auto": "🚗", "Bébé": "👶",
    "Jouets": "🎮", "Livres": "📚", "Bijoux": "💎", "Chaussures": "👟",
  };

  const getEmoji = (cat: string) => {
    for (const [key, emoji] of Object.entries(CATEGORY_EMOJIS)) {
      if (cat.toLowerCase().includes(key.toLowerCase())) return emoji;
    }
    return "📦";
  };

  // ── MINIMAL ──
  if (templateId === "minimal") {
    return (
      <section className="container py-12 sm:py-16">
        <div className="text-center mb-10">
          <h2 className="text-xl font-light" style={{ color: `hsl(${theme.colors.foreground})`, fontFamily: `"${theme.fonts.heading}", sans-serif` }}>Nos univers</h2>
          <div className="h-px w-12 mx-auto mt-4" style={{ backgroundColor: `hsl(${theme.colors.foreground})` }} />
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          {categories.map((cat, i) => (
            <motion.span key={cat} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="px-6 py-2.5 text-xs uppercase tracking-wider cursor-pointer border hover:shadow-sm transition-all" style={{ borderColor: `hsl(${theme.colors.border})`, color: `hsl(${theme.colors.foreground})` }}>
              {cat}
            </motion.span>
          ))}
        </div>
      </section>
    );
  }

  // ── TECH ──
  if (templateId === "tech") {
    return (
      <section className="container py-12 sm:py-16">
        <h2 className="text-xl font-bold mb-8" style={{ fontFamily: `"${theme.fonts.heading}", monospace`, color: `hsl(${theme.colors.foreground})` }}>Explorer par catégorie</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {categories.map((cat, i) => (
            <motion.div key={cat} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} whileHover={{ y: -2 }} className="rounded-xl border p-5 text-center cursor-pointer transition-all hover:shadow-lg" style={{ backgroundColor: `hsl(${theme.colors.card})`, borderColor: `hsl(${theme.colors.border})` }}>
              <div className="text-2xl mb-3">{getEmoji(cat)}</div>
              <p className="text-xs font-semibold" style={{ color: `hsl(${theme.colors.cardForeground})` }}>{cat}</p>
              <p className="text-[10px] mt-1" style={{ color: `hsl(${theme.colors.mutedForeground})` }}>{products.filter(p => p.category === cat).length} produits</p>
            </motion.div>
          ))}
        </div>
      </section>
    );
  }

  // ── FASHION ──
  if (templateId === "fashion") {
    return (
      <section className="container py-12 sm:py-16">
        <h2 className="text-center text-sm uppercase tracking-[0.25em] font-medium mb-10" style={{ color: `hsl(${theme.colors.mutedForeground})`, fontFamily: `"${theme.fonts.heading}", serif` }}>Collections</h2>
        <div className="flex flex-wrap justify-center gap-6">
          {categories.map((cat, i) => (
            <motion.span key={cat} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.06 }} className="text-xs uppercase tracking-[0.18em] cursor-pointer hover:opacity-60 transition-opacity pb-1.5 border-b-2" style={{ color: `hsl(${theme.colors.foreground})`, borderColor: `hsl(${theme.colors.foreground})` }}>
              {cat}
            </motion.span>
          ))}
        </div>
      </section>
    );
  }

  // ── MARKETPLACE ──
  return (
    <section className="container py-8 sm:py-12">
      <h2 className="text-lg font-bold mb-5" style={{ color: `hsl(${theme.colors.foreground})` }}>Catégories populaires</h2>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map((cat, i) => (
          <motion.div key={cat} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} whileHover={{ y: -2 }} className="shrink-0 rounded-xl border px-5 py-4 cursor-pointer hover:shadow-md transition-all flex items-center gap-3" style={{ backgroundColor: `hsl(${theme.colors.card})`, borderColor: `hsl(${theme.colors.border})` }}>
            <span className="text-xl">{getEmoji(cat)}</span>
            <div>
              <span className="text-xs font-semibold whitespace-nowrap" style={{ color: `hsl(${theme.colors.cardForeground})` }}>{cat}</span>
              <p className="text-[10px]" style={{ color: `hsl(${theme.colors.mutedForeground})` }}>{products.filter(p => p.category === cat).length} articles</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
