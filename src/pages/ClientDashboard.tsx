import { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { Package, User, LogOut, ShoppingBag, ChevronRight, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

const sidebarLinks = [
  { label: "Mes commandes", href: "/account", icon: Package },
  { label: "Mon profil", href: "/account/profile", icon: User },
];

export default function ClientDashboard() {
  const { user, signOut } = useAuth();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background">
      {/* Top navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-border">
        <div className="container flex h-14 items-center justify-between">
          <Link to="/market" className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xs">F</span>
            </div>
            <span className="font-heading text-lg tracking-wide text-foreground">FEYXA</span>
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/market"><ShoppingBag size={16} className="mr-1" /> Marketplace</Link>
            </Button>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut size={16} className="mr-1" /> Déconnexion
            </Button>
          </div>
        </div>
      </header>

      <div className="flex pt-14">
        {/* Sidebar */}
        <aside className="hidden md:flex w-64 border-r border-border bg-sidebar min-h-[calc(100vh-3.5rem)] flex-col p-4 gap-1">
          <div className="px-3 py-4 mb-2">
            <p className="text-sm font-medium text-foreground truncate">{user?.user_metadata?.full_name || user?.email}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
          {sidebarLinks.map((link) => {
            const isActive = location.pathname === link.href || 
              (link.href === "/account" && location.pathname === "/account");
            return (
              <Link
                key={link.href}
                to={link.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                <link.icon size={18} />
                {link.label}
              </Link>
            );
          })}
        </aside>

        {/* Mobile nav */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass border-t border-border">
          <div className="flex justify-around py-2">
            {sidebarLinks.map((link) => {
              const isActive = location.pathname === link.href;
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`flex flex-col items-center gap-0.5 text-xs px-3 py-1 ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  <link.icon size={18} />
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <main className="flex-1 p-4 md:p-8 max-w-4xl">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
