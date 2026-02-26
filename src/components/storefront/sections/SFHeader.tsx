import { useState, useMemo } from "react";
import { Menu, Search, ShoppingCart, User, Heart, X } from "lucide-react";
import { motion } from "framer-motion";
import type { SFSectionProps, NavItem } from "../types";

export function SFHeader({ templateId, store, theme }: SFSectionProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navItems: NavItem[] = useMemo(() => {
    const sn = (store.settings as any)?.storefront_nav as NavItem[] | undefined;
    return sn || [{ url: "#", label: "Accueil" }, { url: "#produits", label: "Produits" }, { url: "#contact", label: "Contact" }];
  }, [store.settings]);

  const Logo = () => store.logo_url
    ? <img src={store.logo_url} alt={store.name} className="h-8 w-8 rounded object-cover" />
    : <div className="h-8 w-8 rounded flex items-center justify-center font-bold text-xs" style={{ backgroundColor: `hsl(${theme.colors.primary})`, color: `hsl(${theme.colors.primaryForeground})` }}>{store.name[0]}</div>;

  // ── MINIMAL ──
  if (templateId === "minimal") {
    return (
      <header className="sticky top-0 z-50 backdrop-blur-md border-b" style={{ backgroundColor: `hsl(${theme.colors.background} / 0.95)`, borderColor: `hsl(${theme.colors.border})` }}>
        <div className="container flex items-center justify-between h-16">
          <button className="sm:hidden" onClick={() => setMobileOpen(!mobileOpen)}><Menu size={18} style={{ color: `hsl(${theme.colors.foreground})` }} /></button>
          <div className="absolute left-1/2 -translate-x-1/2 sm:static sm:translate-x-0">
            <span className="text-base font-semibold tracking-tight" style={{ color: `hsl(${theme.colors.foreground})`, fontFamily: `"${theme.fonts.heading}", sans-serif` }}>{store.name}</span>
          </div>
          <nav className="hidden sm:flex items-center gap-8">
            {navItems.map((item, i) => <a key={i} href={item.url} className="text-xs uppercase tracking-widest hover:opacity-60 transition-opacity" style={{ color: `hsl(${theme.colors.mutedForeground})` }}>{item.label}</a>)}
          </nav>
          <div className="flex items-center gap-2">
            <button className="h-8 w-8 rounded-full flex items-center justify-center hover:opacity-60"><ShoppingCart size={16} style={{ color: `hsl(${theme.colors.foreground})` }} /></button>
          </div>
        </div>
        {mobileOpen && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} className="sm:hidden border-t overflow-hidden" style={{ borderColor: `hsl(${theme.colors.border})`, backgroundColor: `hsl(${theme.colors.background})` }}>
            <div className="p-4 space-y-3">
              {navItems.map((item, i) => <a key={i} href={item.url} className="block text-sm" onClick={() => setMobileOpen(false)} style={{ color: `hsl(${theme.colors.foreground})` }}>{item.label}</a>)}
            </div>
          </motion.div>
        )}
      </header>
    );
  }

  // ── TECH ──
  if (templateId === "tech") {
    return (
      <header className="sticky top-0 z-50 border-b" style={{ backgroundColor: `hsl(${theme.colors.background} / 0.92)`, backdropFilter: "blur(12px) saturate(180%)", borderColor: `hsl(${theme.colors.border})` }}>
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <button className="sm:hidden" onClick={() => setMobileOpen(!mobileOpen)}><Menu size={18} style={{ color: `hsl(${theme.colors.foreground})` }} /></button>
            <Logo />
            <span className="font-bold text-sm" style={{ color: `hsl(${theme.colors.foreground})`, fontFamily: `"${theme.fonts.heading}", monospace` }}>{store.name}</span>
          </div>
          <nav className="hidden sm:flex items-center gap-6">
            {navItems.map((item, i) => <a key={i} href={item.url} className="text-xs font-medium hover:opacity-70 transition-opacity relative group" style={{ color: `hsl(${theme.colors.foreground})` }}>
              {item.label}
              <span className="absolute -bottom-0.5 left-0 w-0 group-hover:w-full h-px transition-all" style={{ backgroundColor: `hsl(${theme.colors.primary})` }} />
            </a>)}
          </nav>
          <div className="flex items-center gap-1">
            {[Search, User, ShoppingCart].map((Icon, i) => (
              <button key={i} className="h-8 w-8 rounded-lg flex items-center justify-center hover:opacity-70" style={{ backgroundColor: i === 2 ? `hsl(${theme.colors.primary} / 0.1)` : "transparent" }}>
                <Icon size={16} style={{ color: `hsl(${theme.colors.foreground})` }} />
              </button>
            ))}
          </div>
        </div>
      </header>
    );
  }

  // ── FASHION ──
  if (templateId === "fashion") {
    return (
      <header className="sticky top-0 z-50" style={{ backgroundColor: `hsl(${theme.colors.background} / 0.85)`, backdropFilter: "blur(16px)" }}>
        <div className="container flex items-center justify-between h-16">
          <button className="sm:hidden" onClick={() => setMobileOpen(!mobileOpen)}><Menu size={18} style={{ color: `hsl(${theme.colors.foreground})` }} /></button>
          <nav className="hidden sm:flex items-center gap-8">
            {navItems.slice(0, 2).map((item, i) => <a key={i} href={item.url} className="text-[11px] uppercase tracking-[0.15em] hover:opacity-60 transition-opacity" style={{ color: `hsl(${theme.colors.foreground})` }}>{item.label}</a>)}
          </nav>
          <span className="text-lg font-bold tracking-wide" style={{ color: `hsl(${theme.colors.foreground})`, fontFamily: `"${theme.fonts.heading}", serif` }}>{store.name.toUpperCase()}</span>
          <div className="flex items-center gap-3">
            {navItems.length > 2 && <nav className="hidden sm:flex items-center gap-8">
              {navItems.slice(2).map((item, i) => <a key={i} href={item.url} className="text-[11px] uppercase tracking-[0.15em] hover:opacity-60 transition-opacity" style={{ color: `hsl(${theme.colors.foreground})` }}>{item.label}</a>)}
            </nav>}
            <button className="h-8 w-8 flex items-center justify-center"><Heart size={16} style={{ color: `hsl(${theme.colors.foreground})` }} /></button>
            <button className="h-8 w-8 flex items-center justify-center"><ShoppingCart size={16} style={{ color: `hsl(${theme.colors.foreground})` }} /></button>
          </div>
        </div>
        <div className="border-b" style={{ borderColor: `hsl(${theme.colors.border} / 0.5)` }} />
      </header>
    );
  }

  // ── MARKETPLACE ──
  return (
    <header className="sticky top-0 z-50 border-b shadow-sm" style={{ backgroundColor: `hsl(${theme.colors.card})`, borderColor: `hsl(${theme.colors.border})` }}>
      <div className="container flex items-center gap-4 h-14">
        <div className="flex items-center gap-2 shrink-0">
          <Logo />
          <span className="font-bold text-sm hidden sm:inline" style={{ color: `hsl(${theme.colors.foreground})` }}>{store.name}</span>
        </div>
        <div className="flex-1 max-w-lg relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: `hsl(${theme.colors.mutedForeground})` }} />
          <input placeholder="Rechercher dans la boutique..." className="w-full h-9 rounded-md border pl-9 pr-3 text-sm focus:outline-none focus:ring-2" style={{ backgroundColor: `hsl(${theme.colors.background})`, borderColor: `hsl(${theme.colors.border})`, color: `hsl(${theme.colors.foreground})` }} />
        </div>
        <nav className="hidden md:flex items-center gap-4">
          {navItems.map((item, i) => <a key={i} href={item.url} className="text-xs font-medium hover:underline" style={{ color: `hsl(${theme.colors.foreground})` }}>{item.label}</a>)}
        </nav>
        <div className="flex items-center gap-1">
          <button className="h-8 w-8 rounded flex items-center justify-center hover:opacity-70"><User size={16} style={{ color: `hsl(${theme.colors.foreground})` }} /></button>
          <button className="h-8 w-8 rounded flex items-center justify-center hover:opacity-70 relative"><ShoppingCart size={16} style={{ color: `hsl(${theme.colors.foreground})` }} /></button>
        </div>
      </div>
    </header>
  );
}
