import { motion } from "framer-motion";
import { Package } from "lucide-react";
import type { SFSectionProps } from "../types";
import { useMemo } from "react";

export function SFCategories({ templateId, store, theme, products }: SFSectionProps) {
  const categories = useMemo(() => {
    return [...new Set(products.filter(p => p.category).map(p => p.category!))].slice(0, 8);
  }, [products]);

  if (categories.length === 0) return null;

  // ── MINIMAL ──
  if (templateId === "minimal") {
    return (
      <section className="container py-10 sm:py-14">
        <h2 className="text-center text-xl font-light mb-8" style={{ color: `hsl(${theme.colors.foreground})`, fontFamily: `"${theme.fonts.heading}", sans-serif` }}>Catégories</h2>
        <div className="flex flex-wrap justify-center gap-3">
          {categories.map((cat, i) => (
            <motion.span key={cat} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }} className="px-5 py-2 text-xs uppercase tracking-wider cursor-pointer border hover:opacity-70 transition-opacity" style={{ borderColor: `hsl(${theme.colors.border})`, color: `hsl(${theme.colors.foreground})` }}>
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
      <section className="container py-10 sm:py-14">
        <h2 className="text-xl font-bold mb-6" style={{ fontFamily: `"${theme.fonts.heading}", monospace`, color: `hsl(${theme.colors.foreground})` }}>Catégories</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {categories.map((cat, i) => (
            <motion.div key={cat} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="rounded-lg border p-4 text-center cursor-pointer transition-all hover:border-[hsl(var(--sf-primary))] hover:shadow-lg" style={{ backgroundColor: `hsl(${theme.colors.card})`, borderColor: `hsl(${theme.colors.border})` }}>
              <div className="h-10 w-10 mx-auto rounded-lg flex items-center justify-center mb-2" style={{ backgroundColor: `hsl(${theme.colors.primary} / 0.1)` }}>
                <Package size={18} style={{ color: `hsl(${theme.colors.primary})` }} />
              </div>
              <p className="text-xs font-medium" style={{ color: `hsl(${theme.colors.cardForeground})` }}>{cat}</p>
            </motion.div>
          ))}
        </div>
      </section>
    );
  }

  // ── FASHION ──
  if (templateId === "fashion") {
    return (
      <section className="container py-10 sm:py-14">
        <h2 className="text-center text-sm uppercase tracking-[0.2em] font-medium mb-8" style={{ color: `hsl(${theme.colors.mutedForeground})`, fontFamily: `"${theme.fonts.heading}", serif` }}>Univers</h2>
        <div className="flex flex-wrap justify-center gap-4">
          {categories.map((cat, i) => (
            <motion.span key={cat} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.06 }} className="text-xs uppercase tracking-[0.15em] cursor-pointer hover:opacity-60 transition-opacity pb-1 border-b" style={{ color: `hsl(${theme.colors.foreground})`, borderColor: `hsl(${theme.colors.foreground})` }}>
              {cat}
            </motion.span>
          ))}
        </div>
      </section>
    );
  }

  // ── MARKETPLACE ──
  return (
    <section className="container py-6 sm:py-10">
      <h2 className="text-lg font-bold mb-4" style={{ color: `hsl(${theme.colors.foreground})` }}>Catégories populaires</h2>
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map((cat, i) => (
          <motion.div key={cat} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="shrink-0 rounded-md border px-4 py-3 cursor-pointer hover:shadow-sm transition-shadow flex items-center gap-2" style={{ backgroundColor: `hsl(${theme.colors.card})`, borderColor: `hsl(${theme.colors.border})` }}>
            <Package size={14} style={{ color: `hsl(${theme.colors.primary})` }} />
            <span className="text-xs font-medium whitespace-nowrap" style={{ color: `hsl(${theme.colors.cardForeground})` }}>{cat}</span>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
