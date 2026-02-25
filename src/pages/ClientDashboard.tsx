import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useWishlist } from "@/hooks/useWishlist";
import { motion } from "framer-motion";
import {
  Package,
  User,
  LogOut,
  ShoppingBag,
  Heart,
  LayoutDashboard,
  ChevronRight,
  Store,
  Rocket,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MarketNavbar } from "@/components/market/MarketNavbar";
import { Footer } from "@/components/landing/Footer";

const sidebarLinks = [
  { label: "Aperçu", href: "/account", icon: LayoutDashboard, exact: true },
  { label: "Mes commandes", href: "/account/orders", icon: Package },
  { label: "Mes favoris", href: "/account/wishlist", icon: Heart },
  { label: "Mon profil", href: "/account/profile", icon: User },
];

export default function ClientDashboard() {
  const { user, signOut } = useAuth();
  const { isVendor } = useUserRole();
  const { count: wishlistCount } = useWishlist();
  const location = useLocation();

  const isActive = (href: string, exact?: boolean) =>
    exact ? location.pathname === href : location.pathname.startsWith(href);

  return (
    <div className="min-h-screen bg-background">
      <MarketNavbar />

      <div className="flex pt-14 min-h-screen">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex w-64 border-r border-border bg-card min-h-[calc(100vh-3.5rem)] flex-col justify-between">
          <div>
            <div className="px-6 py-6 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User size={18} className="text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {user?.user_metadata?.full_name || "Mon compte"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
              </div>
            </div>
            <nav className="p-3 space-y-1">
              {sidebarLinks.map((link) => {
                const active = isActive(link.href, link.exact);
                return (
                  <Link
                    key={link.href}
                    to={link.href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all ${
                      active
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                    }`}
                  >
                    <link.icon size={18} />
                    <span className="flex-1">{link.label}</span>
                    {link.label === "Mes favoris" && wishlistCount > 0 && (
                      <span className="text-[10px] bg-primary text-primary-foreground rounded-full h-5 w-5 flex items-center justify-center font-bold">
                        {wishlistCount}
                      </span>
                    )}
                    {active && <ChevronRight size={14} />}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="p-4 space-y-2 border-t border-border">
            {isVendor ? (
              <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                <Link to="/dashboard">
                  <Store size={16} className="mr-2" /> Dashboard vendeur
                </Link>
              </Button>
            ) : (
              <Button variant="outline" size="sm" className="w-full justify-start text-primary border-primary/20 hover:bg-primary/5" asChild>
                <Link to="/account/become-vendor">
                  <Rocket size={16} className="mr-2" /> Devenir vendeur
                </Link>
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-muted-foreground hover:text-destructive"
              onClick={signOut}
            >
              <LogOut size={16} className="mr-2" /> Déconnexion
            </Button>
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1 pb-20 lg:pb-0">
          <div className="max-w-4xl mx-auto p-4 md:p-8">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border">
        <div className="flex justify-around py-2">
          {sidebarLinks.map((link) => {
            const active = isActive(link.href, link.exact);
            return (
              <Link
                key={link.href}
                to={link.href}
                className={`flex flex-col items-center gap-0.5 text-[10px] px-2 py-1 relative ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <link.icon size={18} />
                {link.label.replace("Mes ", "").replace("Mon ", "")}
                {link.label === "Mes favoris" && wishlistCount > 0 && (
                  <span className="absolute -top-0.5 right-0 text-[8px] bg-primary text-primary-foreground rounded-full h-3.5 w-3.5 flex items-center justify-center font-bold">
                    {wishlistCount}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="hidden lg:block">
        <Footer />
      </div>
    </div>
  );
}
