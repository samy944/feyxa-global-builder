import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "@/lib/i18n";

const scrollToHash = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
  if (!href.startsWith("#")) return;
  e.preventDefault();
  const el = document.querySelector(href);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
};

export function Navbar() {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();

  const navLinks = [
    { label: t.navbar.features, href: "#features" },
    { label: t.navbar.pricing, href: "#pricing" },
    { label: t.navbar.faq, href: "#faq" },
    { label: t.navbar.marketplace, href: "/market" },
  ];

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 glass"
    >
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">F</span>
          </div>
          <span className="font-heading text-xl tracking-wide text-foreground">FEYXA</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) =>
            link.href.startsWith("#") ? (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => scrollToHash(e, link.href)}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200"
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.href}
                to={link.href}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200"
              >
                {link.label}
              </Link>
            )
          )}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/login">{t.navbar.login}</Link>
          </Button>
          <Button variant="hero" size="sm" asChild>
            <Link to="/start">{t.navbar.signup}</Link>
          </Button>
        </div>

        <button className="md:hidden text-foreground" onClick={() => setOpen(!open)}>
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="md:hidden glass border-t border-border"
        >
          <div className="container py-4 flex flex-col gap-3">
            {navLinks.map((link) =>
              link.href.startsWith("#") ? (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-sm text-muted-foreground py-2"
                  onClick={(e) => { scrollToHash(e, link.href); setOpen(false); }}
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.href}
                  to={link.href}
                  className="text-sm text-muted-foreground py-2"
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </Link>
              )
            )}
            <div className="flex flex-col gap-2 pt-3 border-t border-border">
              <Button variant="ghost" size="sm" asChild className="justify-start">
                <Link to="/login" onClick={() => setOpen(false)}>{t.navbar.login}</Link>
              </Button>
              <Button variant="hero" size="sm" asChild className="justify-start">
                <Link to="/start" onClick={() => setOpen(false)}>{t.navbar.signup}</Link>
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </motion.header>
  );
}
