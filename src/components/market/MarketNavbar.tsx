import { Link, useLocation, useNavigate } from "react-router-dom";
import { Search, X, Menu, User, ChevronDown, LogOut, ShoppingBag, Heart, LayoutDashboard, Package, Settings } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { LocationSelector } from "@/components/market/LocationSelector";
import { GlobalSearch } from "@/components/market/GlobalSearch";
import { useTranslation } from "@/lib/i18n";
import { AnimatePresence, motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

export function MarketNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { totalItems, setIsOpen } = useCart();
  const { user } = useAuth();
  const { isVendor } = useUserRole();
  const { t } = useTranslation();
  const accountRef = useRef<HTMLDivElement>(null);

  // Close account dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) setAccountOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const centerLinks = [
    { label: t.market.home, href: "/market" },
    { label: t.market.categories, href: "/market#categories" },
    { label: t.navbar.solutions, href: "/#features" },
  ];

  const isActive = (href: string) => location.pathname === href;

  const handleLogout = async () => {
    setAccountOpen(false);
    await supabase.auth.signOut();
    navigate("/market");
  };

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50"
      style={{
        background: "rgba(14,14,17,0.92)",
        backdropFilter: "blur(24px)",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
      }}
    >
      <div className="container flex h-16 items-center justify-between gap-4">
        {/* ─── LEFT: Logo ─── */}
        <Link to="/market" className="flex items-center gap-2.5 shrink-0">
          <div
            className="h-8 w-8 rounded-lg flex items-center justify-center"
            style={{ background: "hsl(var(--primary))" }}
          >
            <span className="font-bold text-sm" style={{ color: "#0E0E11" }}>F</span>
          </div>
          <span
            className="font-heading text-lg tracking-wide hidden sm:inline"
            style={{ color: "#FFFFFF", fontWeight: 700, letterSpacing: "0.04em" }}
          >
            FEYXA
          </span>
        </Link>

        {/* ─── CENTER: Navigation ─── */}
        <nav className="hidden lg:flex items-center gap-10">
          {centerLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className="text-[13px] uppercase tracking-widest transition-colors duration-200"
              style={{
                color: isActive(link.href) ? "#FFFFFF" : "rgba(255,255,255,0.45)",
                fontWeight: 500,
                letterSpacing: "0.08em",
              }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* ─── RIGHT: Actions ─── */}
        <div className="hidden md:flex items-center gap-2">
          {/* Expandable search */}
          <div className="relative">
            <AnimatePresence>
              {searchExpanded ? (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 280, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <GlobalSearch />
                </motion.div>
              ) : null}
            </AnimatePresence>
            <button
              onClick={() => setSearchExpanded(!searchExpanded)}
              className="p-2.5 rounded-lg transition-all duration-200"
              style={{
                color: searchExpanded ? "#FFFFFF" : "rgba(255,255,255,0.5)",
                background: searchExpanded ? "rgba(255,255,255,0.06)" : "transparent",
              }}
            >
              {searchExpanded ? <X size={16} /> : <Search size={16} />}
            </button>
          </div>

          {/* Country selector */}
          <LocationSelector />

          {/* Cart */}
          <button
            onClick={() => setIsOpen(true)}
            className="relative p-2.5 rounded-lg transition-all duration-200 hover:bg-white/5"
            style={{ color: "rgba(255,255,255,0.5)" }}
          >
            <ShoppingBag size={17} />
            {totalItems > 0 && (
              <span
                className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full text-[10px] font-bold flex items-center justify-center"
                style={{ background: "hsl(var(--primary))", color: "#0E0E11" }}
              >
                {totalItems}
              </span>
            )}
          </button>

          {/* Account dropdown */}
          <div className="relative" ref={accountRef}>
            <button
              onClick={() => setAccountOpen(!accountOpen)}
              className="flex items-center gap-1.5 p-2.5 rounded-lg transition-all duration-200 hover:bg-white/5"
              style={{ color: "rgba(255,255,255,0.5)" }}
            >
              <User size={16} />
              <ChevronDown size={12} className="opacity-60" />
            </button>

            <AnimatePresence>
              {accountOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full mt-2 right-0 w-56 z-50 overflow-hidden"
                  style={{
                    background: "#1A1A1F",
                    borderRadius: "0.75rem",
                    border: "1px solid rgba(255,255,255,0.08)",
                    boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
                  }}
                >
                  {user ? (
                    <>
                      <div
                        className="px-4 py-3 text-xs truncate"
                        style={{ color: "#6B7280", borderBottom: "1px solid rgba(255,255,255,0.05)" }}
                      >
                        {user.email}
                      </div>
                      <div className="py-1">
                        <DropdownLink icon={<User size={14} />} label={t.navbar.myAccount} to="/account" onClick={() => setAccountOpen(false)} />
                        <DropdownLink icon={<Package size={14} />} label={t.navbar.myOrders} to="/account/orders" onClick={() => setAccountOpen(false)} />
                        <DropdownLink icon={<Heart size={14} />} label={t.navbar.myWishlist} to="/account/wishlist" onClick={() => setAccountOpen(false)} />
                        <DropdownLink icon={<Settings size={14} />} label={t.navbar.settings} to="/account/profile" onClick={() => setAccountOpen(false)} />
                        {isVendor && (
                          <DropdownLink icon={<LayoutDashboard size={14} />} label={t.navbar.dashboard} to="/dashboard" onClick={() => setAccountOpen(false)} />
                        )}
                      </div>
                      <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-left transition-colors duration-150 hover:bg-white/5"
                          style={{ color: "#EF4444" }}
                        >
                          <LogOut size={14} />
                          {t.navbar.logout}
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="py-1">
                      <DropdownLink icon={<User size={14} />} label={t.navbar.login} to="/login" onClick={() => setAccountOpen(false)} />
                      <DropdownLink icon={<User size={14} />} label={t.navbar.signup} to="/signup" onClick={() => setAccountOpen(false)} />
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* CTA */}
          <Link
            to="/signup"
            className="px-5 py-2 text-xs font-semibold tracking-wide uppercase transition-all duration-200 hover:opacity-90"
            style={{
              background: "hsl(var(--primary))",
              color: "#0E0E11",
              borderRadius: "0.5rem",
              letterSpacing: "0.04em",
            }}
          >
            {t.navbar.createStore}
          </Link>
        </div>

        {/* ─── MOBILE: Minimal right actions ─── */}
        <div className="flex items-center gap-1 md:hidden">
          <button
            onClick={() => setIsOpen(true)}
            className="relative p-2"
            style={{ color: "#FFFFFF" }}
          >
            <ShoppingBag size={18} />
            {totalItems > 0 && (
              <span
                className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full text-[9px] font-bold flex items-center justify-center"
                style={{ background: "hsl(var(--primary))", color: "#0E0E11" }}
              >
                {totalItems}
              </span>
            )}
          </button>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2"
            style={{ color: "#FFFFFF" }}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* ─── MOBILE DRAWER ─── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden overflow-hidden"
            style={{
              background: "#141419",
              borderTop: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <div className="container py-5 flex flex-col gap-4">
              {/* Search */}
              <GlobalSearch />

              {/* Nav links */}
              <div className="flex flex-col gap-1">
                {centerLinks.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    className="text-sm py-2.5 px-3 rounded-lg transition-colors duration-150"
                    style={{
                      color: isActive(link.href) ? "#FFFFFF" : "rgba(255,255,255,0.5)",
                      fontWeight: isActive(link.href) ? 600 : 400,
                      background: isActive(link.href) ? "rgba(255,255,255,0.04)" : "transparent",
                    }}
                    onClick={() => setMobileOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>

              {/* Country */}
              <div className="px-3">
                <LocationSelector />
              </div>

              {/* Account links */}
              <div
                className="flex flex-col gap-1 pt-3"
                style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
              >
                {user ? (
                  <>
                    <MobileLink label={t.navbar.myAccount} to="/account" onClick={() => setMobileOpen(false)} />
                    <MobileLink label={t.navbar.myOrders} to="/account/orders" onClick={() => setMobileOpen(false)} />
                    {isVendor && (
                      <MobileLink label={t.navbar.dashboard} to="/dashboard" onClick={() => setMobileOpen(false)} />
                    )}
                    <button
                      onClick={() => { setMobileOpen(false); handleLogout(); }}
                      className="text-sm py-2.5 px-3 text-left rounded-lg"
                      style={{ color: "#EF4444" }}
                    >
                      {t.navbar.logout}
                    </button>
                  </>
                ) : (
                  <>
                    <MobileLink label={t.navbar.login} to="/login" onClick={() => setMobileOpen(false)} />
                  </>
                )}
              </div>

              {/* CTA */}
              <Link
                to="/signup"
                className="mx-3 text-center py-3 text-sm font-semibold rounded-lg transition-opacity duration-200 hover:opacity-90"
                style={{
                  background: "hsl(var(--primary))",
                  color: "#0E0E11",
                }}
                onClick={() => setMobileOpen(false)}
              >
                {t.navbar.createStore}
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

/* ─── Helper components ─── */

function DropdownLink({ icon, label, to, onClick }: { icon: React.ReactNode; label: string; to: string; onClick: () => void }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm transition-colors duration-150 hover:bg-white/5"
      style={{ color: "#d1d5db" }}
    >
      {icon}
      {label}
    </Link>
  );
}

function MobileLink({ label, to, onClick }: { label: string; to: string; onClick: () => void }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="text-sm py-2.5 px-3 rounded-lg transition-colors duration-150 hover:bg-white/5"
      style={{ color: "rgba(255,255,255,0.6)" }}
    >
      {label}
    </Link>
  );
}
