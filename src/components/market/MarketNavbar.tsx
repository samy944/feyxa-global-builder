import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { ShoppingBag, Menu, X, Search } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
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
  const { role } = useUserRole();

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="fixed top-0 left-0 right-0 z-50 glass"
    >
      <div className="container flex h-14 items-center justify-between">
        <Link to="/market" className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-xs">F</span>
          </div>
          <span className="font-heading text-lg tracking-wide text-foreground">
            FEYXA MARKET
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={`text-sm font-medium transition-colors duration-200 ${
                location.pathname === link.href
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:block flex-1 max-w-md mx-4">
          <GlobalSearch />
        </div>

        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={() => setIsOpen(true)}
            className="relative text-foreground hover:text-primary transition-colors p-1"
          >
            <ShoppingBag size={20} />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </button>
          {user ? (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/account">Mon compte</Link>
              </Button>
              {role === "vendor" && (
                <Button variant="hero" size="sm" asChild>
                  <Link to="/dashboard">Dashboard</Link>
                </Button>
              )}
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/login">Connexion</Link>
              </Button>
              <Button variant="hero" size="sm" asChild>
                <Link to="/signup">Créer un compte</Link>
              </Button>
            </>
          )}
        </div>

        <div className="flex items-center gap-3 md:hidden">
          <button
            onClick={() => setIsOpen(true)}
            className="relative text-foreground p-1"
          >
            <ShoppingBag size={20} />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </button>
          <button className="text-foreground" onClick={() => setOpen(!open)}>
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="md:hidden glass border-t border-border"
        >
          <div className="container py-4 flex flex-col gap-3">
            <GlobalSearch />
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="text-sm text-muted-foreground py-2"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            {user ? (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/account" onClick={() => setOpen(false)}>Mon compte</Link>
                </Button>
                {role === "vendor" && (
                  <Button variant="hero" size="sm" asChild>
                    <Link to="/dashboard" onClick={() => setOpen(false)}>Dashboard</Link>
                  </Button>
                )}
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/login" onClick={() => setOpen(false)}>Connexion</Link>
                </Button>
                <Button variant="hero" size="sm" asChild>
                  <Link to="/signup" onClick={() => setOpen(false)}>Créer un compte</Link>
                </Button>
              </>
            )}
          </div>
        </motion.div>
      )}
    </motion.header>
  );
}
