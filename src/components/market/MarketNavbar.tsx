import { Link, useLocation } from "react-router-dom";
import { ShoppingBag, Menu, X, Heart, User } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useWishlist } from "@/hooks/useWishlist";
import { GlobalSearch } from "@/components/market/GlobalSearch";

const navLinks = [
  { label: "Accueil", href: "/market" },
  { label: "Catégories", href: "/market#categories" },
  { label: "Suivre ma commande", href: "/track" },
];

export function MarketNavbar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { totalItems, setIsOpen } = useCart();
  const { user } = useAuth();
  const { isVendor } = useUserRole();
  const { count: wishlistCount } = useWishlist();

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50"
      style={{
        background: "rgba(14,14,17,0.88)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <div className="container flex h-14 items-center justify-between">
        <Link to="/market" className="flex items-center gap-2.5">
          <div
            className="h-7 w-7 rounded-md flex items-center justify-center"
            style={{ background: "hsl(var(--primary))" }}
          >
            <span className="font-bold text-xs" style={{ color: "#0E0E11" }}>F</span>
          </div>
          <span
            className="text-base tracking-wide"
            style={{ color: "#FFFFFF", fontWeight: 600 }}
          >
            FEYXA
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-7">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className="text-sm transition-opacity duration-200 hover:opacity-70"
              style={{
                color: location.pathname === link.href ? "#FFFFFF" : "#9CA3AF",
                fontWeight: 500,
              }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:block flex-1 max-w-md mx-4">
          <GlobalSearch />
        </div>

        <div className="hidden md:flex items-center gap-1.5">
          {user && (
            <Link
              to="/account/wishlist"
              className="relative p-2 transition-opacity duration-200 hover:opacity-70"
              style={{ color: "#9CA3AF" }}
            >
              <Heart size={18} />
              {wishlistCount > 0 && (
                <span
                  className="absolute -top-0 -right-0 h-4 w-4 rounded-full text-[10px] font-bold flex items-center justify-center"
                  style={{ background: "#ec4899", color: "#FFF" }}
                >
                  {wishlistCount}
                </span>
              )}
            </Link>
          )}
          <button
            onClick={() => setIsOpen(true)}
            className="relative p-2 transition-opacity duration-200 hover:opacity-70"
            style={{ color: "#9CA3AF" }}
          >
            <ShoppingBag size={18} />
            {totalItems > 0 && (
              <span
                className="absolute -top-0 -right-0 h-4 w-4 rounded-full text-[10px] font-bold flex items-center justify-center"
                style={{ background: "hsl(var(--primary))", color: "#0E0E11" }}
              >
                {totalItems}
              </span>
            )}
          </button>
          {user ? (
            <>
              <Link
                to="/account"
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm transition-opacity duration-200 hover:opacity-70"
                style={{ color: "#9CA3AF", fontWeight: 500 }}
              >
                <User size={15} /> Mon compte
              </Link>
              {isVendor && (
                <Link
                  to="/dashboard"
                  className="px-4 py-1.5 text-sm transition-opacity duration-200 hover:opacity-90"
                  style={{
                    background: "hsl(var(--primary))",
                    color: "#0E0E11",
                    borderRadius: "0.5rem",
                    fontWeight: 600,
                  }}
                >
                  Dashboard
                </Link>
              )}
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="px-3 py-1.5 text-sm transition-opacity duration-200 hover:opacity-70"
                style={{ color: "#9CA3AF", fontWeight: 500 }}
              >
                Connexion
              </Link>
              <Link
                to="/signup"
                className="px-4 py-1.5 text-sm transition-opacity duration-200 hover:opacity-90"
                style={{
                  background: "hsl(var(--primary))",
                  color: "#0E0E11",
                  borderRadius: "0.5rem",
                  fontWeight: 600,
                }}
              >
                Créer un compte
              </Link>
            </>
          )}
        </div>

        {/* Mobile */}
        <div className="flex items-center gap-2 md:hidden">
          {user && (
            <Link to="/account/wishlist" className="relative p-1" style={{ color: "#FFFFFF" }}>
              <Heart size={18} />
              {wishlistCount > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full text-[9px] font-bold flex items-center justify-center"
                  style={{ background: "#ec4899", color: "#FFF" }}
                >
                  {wishlistCount}
                </span>
              )}
            </Link>
          )}
          <button onClick={() => setIsOpen(true)} className="relative p-1" style={{ color: "#FFFFFF" }}>
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
          <button onClick={() => setOpen(!open)} style={{ color: "#FFFFFF" }}>
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div
          className="md:hidden"
          style={{
            background: "#141419",
            borderTop: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <div className="container py-4 flex flex-col gap-3">
            <GlobalSearch />
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="text-sm py-2"
                style={{ color: "#9CA3AF" }}
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            {user ? (
              <>
                <Link
                  to="/account"
                  className="text-sm py-2"
                  style={{ color: "#9CA3AF" }}
                  onClick={() => setOpen(false)}
                >
                  Mon compte
                </Link>
                {isVendor && (
                  <Link
                    to="/dashboard"
                    className="text-sm py-2"
                    style={{ color: "#FFFFFF", fontWeight: 600 }}
                    onClick={() => setOpen(false)}
                  >
                    Dashboard
                  </Link>
                )}
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm py-2"
                  style={{ color: "#9CA3AF" }}
                  onClick={() => setOpen(false)}
                >
                  Connexion
                </Link>
                <Link
                  to="/signup"
                  className="text-sm py-2"
                  style={{ color: "#FFFFFF", fontWeight: 600 }}
                  onClick={() => setOpen(false)}
                >
                  Créer un compte
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
