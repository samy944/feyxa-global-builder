import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Store,
  Users,
  ShoppingCart,
  Wallet,
  MessageSquare,
  RotateCcw,
  Star,
  UserPlus,
  Shield,
  UserCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { to: "/admin", icon: LayoutDashboard, label: "Vue d'ensemble", end: true },
  { to: "/admin/stores", icon: Store, label: "Boutiques" },
  { to: "/admin/users", icon: Users, label: "Utilisateurs" },
  { to: "/admin/orders", icon: ShoppingCart, label: "Commandes" },
  { to: "/admin/payouts", icon: Wallet, label: "Retraits" },
  { to: "/admin/tickets", icon: MessageSquare, label: "Tickets" },
  { to: "/admin/returns", icon: RotateCcw, label: "Retours" },
  { to: "/admin/reviews", icon: Star, label: "Avis" },
  { to: "/admin/team", icon: UserPlus, label: "Équipe admin" },
  { to: "/admin/kyc", icon: UserCheck, label: "KYC Vendeurs" },
];

interface Props {
  onNavigate?: () => void;
}

export function AdminSidebar({ onNavigate }: Props) {
  const location = useLocation();

  return (
    <aside className="w-[260px] h-screen sticky top-0 flex flex-col border-r border-border bg-card">
      {/* Header */}
      <div className="h-14 flex items-center gap-2 px-5 border-b border-border shrink-0">
        <Shield size={20} className="text-primary" />
        <span className="font-heading text-base font-bold tracking-tight text-foreground">
          Super Admin
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
        {links.map((link) => {
          const isActive = link.end
            ? location.pathname === link.to
            : location.pathname.startsWith(link.to);
          return (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              <link.icon size={18} />
              <span>{link.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <NavLink
          to="/dashboard"
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Store size={14} />
          Retour au dashboard vendeur
        </NavLink>
      </div>
    </aside>
  );
}
