import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Zap, ShoppingBag, ArrowDown } from "lucide-react";
import type { SFSectionProps } from "../types";

export function SFHero({ templateId, store, theme, products }: SFSectionProps) {
  const hasProducts = products.length > 0;

  // ── MINIMAL ──
  if (templateId === "minimal") {
    return (
      <section className="py-24 sm:py-40 relative overflow-hidden">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `radial-gradient(circle at 1px 1px, hsl(${theme.colors.foreground}) 1px, transparent 0)`, backgroundSize: "32px 32px" }} />
        <div className="container relative">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} className="text-center max-w-2xl mx-auto">
            <motion.div initial={{ width: 0 }} animate={{ width: 48 }} transition={{ delay: 0.3, duration: 0.6 }} className="h-px mx-auto mb-8" style={{ backgroundColor: `hsl(${theme.colors.foreground})` }} />
            <h1 className="text-4xl sm:text-6xl font-light leading-[1.1] tracking-tight" style={{ color: `hsl(${theme.colors.foreground})`, fontFamily: `"${theme.fonts.heading}", sans-serif` }}>
              {store.name}
            </h1>
            {store.description && (
              <p className="mt-6 text-base sm:text-lg leading-relaxed" style={{ color: `hsl(${theme.colors.mutedForeground})` }}>
                {store.description}
              </p>
            )}
            <div className="flex items-center justify-center gap-4 mt-10">
              <a href="#produits" className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium transition-all hover:brightness-110 rounded-full" style={{ backgroundColor: `hsl(${theme.colors.foreground})`, color: `hsl(${theme.colors.background})` }}>
                Découvrir <ArrowRight size={14} />
              </a>
            </div>
          </motion.div>
          {/* Featured product previews */}
          {hasProducts && (
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.7 }} className="mt-16 grid grid-cols-3 sm:grid-cols-4 gap-3 max-w-2xl mx-auto">
              {products.slice(0, 4).map((p, i) => {
                const img = p.images && Array.isArray(p.images) && (p.images as string[]).length > 0 ? (p.images as string[])[0] : null;
                return (
                  <motion.div key={p.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 + i * 0.1 }} className="aspect-square overflow-hidden" style={{ backgroundColor: `hsl(${theme.colors.muted})` }}>
                    {img && <img src={img} alt={p.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" loading="lazy" />}
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>
      </section>
    );
  }

  // ── TECH ──
  if (templateId === "tech") {
    return (
      <section className="relative overflow-hidden py-16 sm:py-24" style={{ background: `linear-gradient(160deg, hsl(${theme.colors.background}) 0%, hsl(${theme.colors.card}) 40%, hsl(${theme.colors.background}) 100%)` }}>
        {/* Glow Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] rounded-full blur-[100px]" style={{ background: `hsl(${theme.colors.primary} / 0.08)` }} />
          <div className="absolute bottom-0 left-1/3 w-[300px] h-[300px] rounded-full blur-[80px]" style={{ background: `hsl(${theme.colors.accent} / 0.05)` }} />
        </div>
        <div className="container relative z-10 grid sm:grid-cols-2 gap-10 items-center">
          <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}>
            <div className="flex items-center gap-2 mb-5">
              <div className="h-6 px-3 rounded-full flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold" style={{ backgroundColor: `hsl(${theme.colors.primary} / 0.15)`, color: `hsl(${theme.colors.primary})` }}>
                <Zap size={10} /> Nouvelle collection
              </div>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold leading-[1.1]" style={{ fontFamily: `"${theme.fonts.heading}", monospace`, color: `hsl(${theme.colors.foreground})` }}>
              {store.name}
            </h1>
            {store.description && <p className="mt-5 text-base leading-relaxed max-w-md" style={{ color: `hsl(${theme.colors.mutedForeground})` }}>{store.description}</p>}
            <div className="flex gap-3 mt-8">
              <a href="#produits" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all hover:brightness-110 hover:shadow-lg" style={{ backgroundColor: `hsl(${theme.colors.primary})`, color: `hsl(${theme.colors.primaryForeground})`, boxShadow: `0 8px 24px hsl(${theme.colors.primary} / 0.3)` }}>
                Explorer <ArrowRight size={14} />
              </a>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.85, rotateY: 10 }} animate={{ opacity: 1, scale: 1, rotateY: 0 }} transition={{ delay: 0.2, duration: 0.6 }} className="hidden sm:grid grid-cols-2 gap-3">
            {products.slice(0, 4).map((p, i) => {
              const img = p.images && Array.isArray(p.images) && (p.images as string[]).length > 0 ? (p.images as string[])[0] : null;
              return (
                <motion.div key={p.id} whileHover={{ y: -4, scale: 1.02 }} className="aspect-square rounded-xl overflow-hidden border backdrop-blur-sm" style={{ borderColor: `hsl(${theme.colors.border})`, backgroundColor: `hsl(${theme.colors.muted})` }}>
                  {img ? <img src={img} alt={p.name} className="w-full h-full object-cover" loading="lazy" /> : <div className="h-full flex items-center justify-center"><ShoppingBag size={20} style={{ color: `hsl(${theme.colors.mutedForeground})` }} /></div>}
                </motion.div>
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
      <section className="relative h-[75vh] sm:h-[90vh] overflow-hidden" style={{ backgroundColor: `hsl(${theme.colors.muted})` }}>
        {heroImg && (
          <motion.img initial={{ scale: 1.1 }} animate={{ scale: 1 }} transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }} src={heroImg} alt="Hero" className="absolute inset-0 w-full h-full object-cover" />
        )}
        <div className="absolute inset-0" style={{ background: `linear-gradient(to top, hsl(${theme.colors.background}) 0%, hsl(${theme.colors.background} / 0.3) 40%, transparent 70%)` }} />
        <div className="absolute bottom-0 left-0 right-0 p-8 sm:p-16">
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}>
            <motion.div initial={{ width: 0 }} animate={{ width: 40 }} transition={{ delay: 0.5, duration: 0.6 }} className="h-0.5 mb-6" style={{ backgroundColor: `hsl(${theme.colors.primary})` }} />
            <h1 className="text-5xl sm:text-7xl font-bold leading-none tracking-tight" style={{ fontFamily: `"${theme.fonts.heading}", serif`, color: `hsl(${theme.colors.foreground})` }}>
              {store.name}
            </h1>
            {store.description && <p className="mt-5 text-sm sm:text-base max-w-md leading-relaxed" style={{ color: `hsl(${theme.colors.mutedForeground})` }}>{store.description}</p>}
            <a href="#produits" className="inline-flex items-center gap-3 mt-8 px-8 py-3.5 text-sm font-semibold uppercase tracking-[0.15em] transition-all hover:gap-4" style={{ backgroundColor: `hsl(${theme.colors.foreground})`, color: `hsl(${theme.colors.background})` }}>
              Shop Now <ArrowRight size={14} />
            </a>
          </motion.div>
        </div>
      </section>
    );
  }

  // ── MARKETPLACE ──
  return (
    <section className="py-6 sm:py-10" style={{ backgroundColor: `hsl(${theme.colors.primary} / 0.03)` }}>
      <div className="container">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl p-8 sm:p-12 flex flex-col sm:flex-row items-center gap-8 relative overflow-hidden" style={{ background: `linear-gradient(135deg, hsl(${theme.colors.primary} / 0.1), hsl(${theme.colors.primary} / 0.02))`, border: `1px solid hsl(${theme.colors.primary} / 0.15)` }}>
          {/* Decorative circles */}
          <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl" style={{ background: `hsl(${theme.colors.primary} / 0.1)` }} />
          <div className="flex-1 relative z-10">
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: `hsl(${theme.colors.primary})` }}>Bienvenue sur</span>
            <h1 className="text-3xl sm:text-4xl font-bold mt-2" style={{ color: `hsl(${theme.colors.foreground})`, fontFamily: `"${theme.fonts.heading}", sans-serif` }}>{store.name}</h1>
            {store.description && <p className="text-sm mt-3 max-w-lg leading-relaxed" style={{ color: `hsl(${theme.colors.mutedForeground})` }}>{store.description}</p>}
            <div className="flex gap-3 mt-6">
              <a href="#produits" className="px-6 py-2.5 rounded-xl text-sm font-semibold transition-all hover:brightness-110" style={{ backgroundColor: `hsl(${theme.colors.primary})`, color: `hsl(${theme.colors.primaryForeground})` }}>Voir les produits</a>
              {products.some(p => p.compare_at_price && p.compare_at_price > p.price) && (
                <a href="#promos" className="px-6 py-2.5 rounded-xl border text-sm font-medium hover:shadow-sm transition-all" style={{ borderColor: `hsl(${theme.colors.primary})`, color: `hsl(${theme.colors.primary})` }}>🔥 Promos</a>
              )}
            </div>
          </div>
          {/* Product preview mosaic */}
          {products.length > 0 && (
            <div className="hidden sm:grid grid-cols-2 gap-2 w-48">
              {products.slice(0, 4).map((p) => {
                const pImg = p.images && Array.isArray(p.images) && (p.images as string[]).length > 0 ? (p.images as string[])[0] : null;
                return (
                  <div key={p.id} className="aspect-square rounded-lg overflow-hidden" style={{ backgroundColor: `hsl(${theme.colors.muted})` }}>
                    {pImg && <img src={pImg} alt={p.name} className="w-full h-full object-cover" loading="lazy" />}
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
