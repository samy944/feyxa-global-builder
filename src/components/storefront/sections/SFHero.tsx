import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Zap, ShoppingBag } from "lucide-react";
import type { SFSectionProps } from "../types";

export function SFHero({ templateId, store, theme, products }: SFSectionProps) {
  const hasProducts = products.length > 0;

  // ── MINIMAL ──
  if (templateId === "minimal") {
    return (
      <section className="py-20 sm:py-32">
        <div className="container">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="text-center max-w-xl mx-auto">
            <h1 className="text-3xl sm:text-5xl font-light leading-[1.15] tracking-tight" style={{ color: `hsl(${theme.colors.foreground})`, fontFamily: `"${theme.fonts.heading}", sans-serif` }}>
              {store.name}
            </h1>
            {store.description && (
              <p className="mt-5 text-sm sm:text-base leading-relaxed" style={{ color: `hsl(${theme.colors.mutedForeground})` }}>
                {store.description}
              </p>
            )}
            <a href="#produits" className="inline-flex items-center gap-2 mt-8 text-sm font-medium hover:opacity-70 transition-opacity group" style={{ color: `hsl(${theme.colors.foreground})` }}>
              Découvrir la collection <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </a>
          </motion.div>
        </div>
      </section>
    );
  }

  // ── TECH ──
  if (templateId === "tech") {
    return (
      <section className="relative overflow-hidden py-14 sm:py-20" style={{ background: `linear-gradient(135deg, hsl(${theme.colors.background}) 0%, hsl(${theme.colors.card}) 50%, hsl(${theme.colors.background}) 100%)` }}>
        <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 70% 30%, hsl(${theme.colors.primary} / 0.08) 0%, transparent 50%)` }} />
        <div className="container relative z-10 grid sm:grid-cols-2 gap-8 items-center">
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
            <div className="flex items-center gap-2 mb-4">
              <Zap size={14} style={{ color: `hsl(${theme.colors.primary})` }} />
              <span className="text-[10px] uppercase tracking-widest font-bold" style={{ color: `hsl(${theme.colors.primary})` }}>Nouvelle collection</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold leading-tight" style={{ fontFamily: `"${theme.fonts.heading}", monospace`, color: `hsl(${theme.colors.foreground})` }}>
              {store.name}
            </h1>
            {store.description && <p className="mt-4 text-sm leading-relaxed" style={{ color: `hsl(${theme.colors.mutedForeground})` }}>{store.description}</p>}
            <a href="#produits" className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all hover:brightness-110" style={{ backgroundColor: `hsl(${theme.colors.primary})`, color: `hsl(${theme.colors.primaryForeground})` }}>
              Explorer <ArrowRight size={14} />
            </a>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2, duration: 0.5 }} className="hidden sm:grid grid-cols-2 gap-3">
            {products.slice(0, 4).map((p, i) => {
              const img = p.images && Array.isArray(p.images) && (p.images as string[]).length > 0 ? (p.images as string[])[0] : null;
              return (
                <div key={p.id} className="aspect-square rounded-lg overflow-hidden border" style={{ borderColor: `hsl(${theme.colors.border})`, backgroundColor: `hsl(${theme.colors.muted})` }}>
                  {img ? <img src={img} alt={p.name} className="w-full h-full object-cover" loading="lazy" /> : <div className="h-full flex items-center justify-center"><ShoppingBag size={20} style={{ color: `hsl(${theme.colors.mutedForeground})` }} /></div>}
                </div>
              );
            })}
          </motion.div>
        </div>
      </section>
    );
  }

  // ── FASHION ──
  if (templateId === "fashion") {
    const heroImg = products.length > 0 && products[0].images && Array.isArray(products[0].images) && (products[0].images as string[]).length > 0 ? (products[0].images as string[])[0] : null;
    return (
      <section className="relative h-[70vh] sm:h-[85vh] overflow-hidden" style={{ backgroundColor: `hsl(${theme.colors.muted})` }}>
        {heroImg && <img src={heroImg} alt="Hero" className="absolute inset-0 w-full h-full object-cover" />}
        <div className="absolute inset-0" style={{ background: `linear-gradient(to top, hsl(${theme.colors.background}) 0%, transparent 60%)` }} />
        <div className="absolute bottom-0 left-0 right-0 p-8 sm:p-16">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <h1 className="text-4xl sm:text-6xl font-bold leading-none" style={{ fontFamily: `"${theme.fonts.heading}", serif`, color: `hsl(${theme.colors.foreground})` }}>
              {store.name}
            </h1>
            {store.description && <p className="mt-4 text-sm sm:text-base max-w-md" style={{ color: `hsl(${theme.colors.mutedForeground})` }}>{store.description}</p>}
            <a href="#produits" className="inline-flex items-center gap-2 mt-6 px-6 py-3 text-sm font-semibold uppercase tracking-wider transition-all hover:brightness-110" style={{ backgroundColor: `hsl(${theme.colors.foreground})`, color: `hsl(${theme.colors.background})` }}>
              Shop Now <ArrowRight size={14} />
            </a>
          </motion.div>
        </div>
      </section>
    );
  }

  // ── MARKETPLACE ──
  return (
    <section className="py-6 sm:py-10" style={{ backgroundColor: `hsl(${theme.colors.primary} / 0.04)` }}>
      <div className="container">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg p-6 sm:p-10 flex flex-col sm:flex-row items-center gap-6" style={{ background: `linear-gradient(135deg, hsl(${theme.colors.primary} / 0.08), hsl(${theme.colors.primary} / 0.02))`, border: `1px solid hsl(${theme.colors.primary} / 0.15)` }}>
          <div className="flex-1">
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: `hsl(${theme.colors.primary})` }}>Bienvenue sur</span>
            <h1 className="text-2xl sm:text-3xl font-bold mt-1" style={{ color: `hsl(${theme.colors.foreground})` }}>{store.name}</h1>
            {store.description && <p className="text-sm mt-2" style={{ color: `hsl(${theme.colors.mutedForeground})` }}>{store.description}</p>}
            <div className="flex gap-3 mt-4">
              <a href="#produits" className="px-5 py-2 rounded-md text-sm font-semibold" style={{ backgroundColor: `hsl(${theme.colors.primary})`, color: `hsl(${theme.colors.primaryForeground})` }}>Voir les produits</a>
              {products.some(p => p.compare_at_price && p.compare_at_price > p.price) && (
                <a href="#promos" className="px-5 py-2 rounded-md border text-sm font-medium" style={{ borderColor: `hsl(${theme.colors.primary})`, color: `hsl(${theme.colors.primary})` }}>🔥 Promos</a>
              )}
            </div>
          </div>
          <div className="text-6xl">🛒</div>
        </motion.div>
      </div>
    </section>
  );
}
