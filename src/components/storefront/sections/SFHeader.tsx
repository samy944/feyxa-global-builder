import { useState, useMemo } from "react";
import { Menu, Search, ShoppingCart, User, Heart, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import type { SFSectionProps, NavItem } from "../types";

export function SFHeader({ templateId, store, theme }: SFSectionProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { totalItems, setIsOpen } = useCart();
  const { count: wishlistCount } = useWishlist();

  const navItems: NavItem[] = useMemo(() => {
    const sn = (store.settings as any)?.storefront_nav as NavItem[] | undefined;
    return sn || [{ url: "#", label: "Accueil" }, { url: "#produits", label: "Produits" }, { url: "#contact", label: "Contact" }];
  }, [store.settings]);

  const Logo = () => store.logo_url
    ? <img src={store.logo_url} alt={store.name} className="h-8 w-8 rounded-lg object-cover" />
    : <div className="h-8 w-8 rounded-lg flex items-center justify-center font-bold text-xs" style={{ backgroundColor: `hsl(${theme.colors.primary})`, color: `hsl(${theme.colors.primaryForeground})` }}>{store.name[0]}</div>;

  const CartBadge = ({ size = 16 }: { size?: number }) => (
    <button onClick={() => setIsOpen(true)} className="relative h-9 w-9 rounded-full flex items-center justify-center transition-all hover:scale-110" style={{ backgroundColor: totalItems > 0 ? `hsl(${theme.colors.primary} / 0.1)` : "transparent" }}>
      <ShoppingCart size={size} style={{ color: `hsl(${theme.colors.foreground})` }} />
      {totalItems > 0 && (
        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full text-[9px] font-bold flex items-center justify-center" style={{ backgroundColor: `hsl(${theme.colors.primary})`, color: `hsl(${theme.colors.primaryForeground})` }}>
          {totalItems}
        </motion.span>
      )}
    </button>
  );

  const WishlistBtn = ({ size = 16 }: { size?: number }) => (
    <Link to="/account/wishlist" className="relative h-9 w-9 rounded-full flex items-center justify-center hover:scale-110 transition-all">
      <Heart size={size} style={{ color: `hsl(${theme.colors.foreground})` }} />
      {wishlistCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full text-[9px] font-bold flex items-center justify-center" style={{ backgroundColor: `hsl(347 77% 50%)`, color: "white" }}>
          {wishlistCount}
        </span>
      )}
    </Link>
  );

  // ── MINIMAL ──
  if (templateId === "minimal") {
    return (
      <header className="sticky top-0 z-50 backdrop-blur-xl border-b" style={{ backgroundColor: `hsl(${theme.colors.background} / 0.92)`, borderColor: `hsl(${theme.colors.border})` }}>
        <div className="container flex items-center justify-between h-16">
          <button className="sm:hidden" onClick={() => setMobileOpen(!mobileOpen)}><Menu size={18} style={{ color: `hsl(${theme.colors.foreground})` }} /></button>
          <div className="absolute left-1/2 -translate-x-1/2 sm:static sm:translate-x-0">
            <Link to={`/store/${store.slug}`} className="text-base font-semibold tracking-tight" style={{ color: `hsl(${theme.colors.foreground})`, fontFamily: `"${theme.fonts.heading}", sans-serif` }}>{store.name}</Link>
          </div>
          <nav className="hidden sm:flex items-center gap-8">
            {navItems.map((item, i) => <a key={i} href={item.url} className="text-xs uppercase tracking-widest hover:opacity-60 transition-opacity" style={{ color: `hsl(${theme.colors.mutedForeground})` }}>{item.label}</a>)}
          </nav>
          <div className="flex items-center gap-1">
            <WishlistBtn size={15} />
            <CartBadge size={15} />
          </div>
        </div>
        <AnimatePresence>
          {mobileOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="sm:hidden border-t overflow-hidden" style={{ borderColor: `hsl(${theme.colors.border})`, backgroundColor: `hsl(${theme.colors.background})` }}>
              <div className="p-4 space-y-3">
                {navItems.map((item, i) => <a key={i} href={item.url} className="block text-sm" onClick={() => setMobileOpen(false)} style={{ color: `hsl(${theme.colors.foreground})` }}>{item.label}</a>)}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    );
  }

  // ── TECH ──
  if (templateId === "tech") {
    return (
      <header className="sticky top-0 z-50 border-b" style={{ backgroundColor: `hsl(${theme.colors.background} / 0.88)`, backdropFilter: "blur(16px) saturate(180%)", borderColor: `hsl(${theme.colors.border})` }}>
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <button className="sm:hidden" onClick={() => setMobileOpen(!mobileOpen)}><Menu size={18} style={{ color: `hsl(${theme.colors.foreground})` }} /></button>
            <Logo />
            <Link to={`/store/${store.slug}`} className="font-bold text-sm" style={{ color: `hsl(${theme.colors.foreground})`, fontFamily: `"${theme.fonts.heading}", monospace` }}>{store.name}</Link>
          </div>
          <nav className="hidden sm:flex items-center gap-6">
            {navItems.map((item, i) => <a key={i} href={item.url} className="text-xs font-medium hover:opacity-70 transition-opacity relative group" style={{ color: `hsl(${theme.colors.foreground})` }}>
              {item.label}
              <span className="absolute -bottom-0.5 left-0 w-0 group-hover:w-full h-px transition-all duration-300" style={{ backgroundColor: `hsl(${theme.colors.primary})` }} />
            </a>)}
          </nav>
          <div className="flex items-center gap-1">
            <button className="h-9 w-9 rounded-lg flex items-center justify-center hover:opacity-70"><Search size={15} style={{ color: `hsl(${theme.colors.foreground})` }} /></button>
            <WishlistBtn size={15} />
            <Link to="/account" className="h-9 w-9 rounded-lg flex items-center justify-center hover:opacity-70"><User size={15} style={{ color: `hsl(${theme.colors.foreground})` }} /></Link>
            <CartBadge size={15} />
          </div>
        </div>
      </header>
    );
  }

  // ── FASHION ──
  if (templateId === "fashion") {
    return (
      <header className="sticky top-0 z-50" style={{ backgroundColor: `hsl(${theme.colors.background} / 0.82)`, backdropFilter: "blur(20px) saturate(200%)" }}>
        <div className="container flex items-center justify-between h-16">
          <button className="sm:hidden" onClick={() => setMobileOpen(!mobileOpen)}><Menu size={18} style={{ color: `hsl(${theme.colors.foreground})` }} /></button>
          <nav className="hidden sm:flex items-center gap-8">
            {navItems.slice(0, 2).map((item, i) => <a key={i} href={item.url} className="text-[11px] uppercase tracking-[0.18em] hover:opacity-60 transition-opacity" style={{ color: `hsl(${theme.colors.foreground})` }}>{item.label}</a>)}
          </nav>
          <Link to={`/store/${store.slug}`} className="text-lg font-bold tracking-[0.08em]" style={{ color: `hsl(${theme.colors.foreground})`, fontFamily: `"${theme.fonts.heading}", serif` }}>{store.name.toUpperCase()}</Link>
          <div className="flex items-center gap-2">
            {navItems.length > 2 && <nav className="hidden sm:flex items-center gap-8">
              {navItems.slice(2).map((item, i) => <a key={i} href={item.url} className="text-[11px] uppercase tracking-[0.18em] hover:opacity-60 transition-opacity" style={{ color: `hsl(${theme.colors.foreground})` }}>{item.label}</a>)}
            </nav>}
            <WishlistBtn size={15} />
            <CartBadge size={15} />
          </div>
        </div>
        <div className="border-b" style={{ borderColor: `hsl(${theme.colors.border} / 0.3)` }} />
      </header>
    );
  }

  // ── MARKETPLACE (default) ──
  return (
    <header className="sticky top-0 z-50 border-b shadow-sm" style={{ backgroundColor: `hsl(${theme.colors.card})`, borderColor: `hsl(${theme.colors.border})` }}>
      <div className="container flex items-center gap-4 h-14">
        <div className="flex items-center gap-2 shrink-0">
          <Logo />
          <Link to={`/store/${store.slug}`} className="font-bold text-sm hidden sm:inline" style={{ color: `hsl(${theme.colors.foreground})` }}>{store.name}</Link>
        </div>
        <div className="flex-1 max-w-lg relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: `hsl(${theme.colors.mutedForeground})` }} />
          <input placeholder="Rechercher dans la boutique..." className="w-full h-9 rounded-lg border pl-9 pr-3 text-sm focus:outline-none focus:ring-2 transition-all" style={{ backgroundColor: `hsl(${theme.colors.background})`, borderColor: `hsl(${theme.colors.border})`, color: `hsl(${theme.colors.foreground})` }} />
        </div>
        <nav className="hidden md:flex items-center gap-4">
          {navItems.map((item, i) => <a key={i} href={item.url} className="text-xs font-medium hover:underline" style={{ color: `hsl(${theme.colors.foreground})` }}>{item.label}</a>)}
        </nav>
        <div className="flex items-center gap-0.5">
          <Link to="/account" className="h-9 w-9 rounded-full flex items-center justify-center hover:opacity-70"><User size={15} style={{ color: `hsl(${theme.colors.foreground})` }} /></Link>
          <WishlistBtn size={15} />
          <CartBadge size={15} />
        </div>
      </div>
    </header>
  );
}
