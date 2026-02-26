import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Store, Users, ShoppingCart, Package, Wallet,
  MessageSquare, RotateCcw, Star, UserPlus, Shield, UserCheck,
  Settings, Mail, Palette, FileText, Calculator, Activity, HeartPulse,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface NavGroup {
  label: string;
  items: { to: string; icon: any; label: string; end?: boolean }[];
}

const navGroups: NavGroup[] = [
  {
    label: "Tableau de bord",
    items: [
      { to: "/admin", icon: LayoutDashboard, label: "Vue d'ensemble", end: true },
      { to: "/admin/health", icon: HeartPulse, label: "System Health" },
      { to: "/admin/infra", icon: Activity, label: "Infrastructure" },
    ],
  },
  {
    label: "Commerce",
    items: [
      { to: "/admin/stores", icon: Store, label: "Boutiques" },
      { to: "/admin/products", icon: Package, label: "Modération produits" },
      { to: "/admin/orders", icon: ShoppingCart, label: "Commandes" },
      { to: "/admin/reviews", icon: Star, label: "Avis" },
    ],
  },
  {
    label: "Utilisateurs",
    items: [
      { to: "/admin/users", icon: Users, label: "Utilisateurs" },
      { to: "/admin/kyc", icon: UserCheck, label: "KYC Vendeurs" },
      { to: "/admin/team", icon: UserPlus, label: "Équipe admin" },
    ],
  },
  {
    label: "Finances",
    items: [
      { to: "/admin/payouts", icon: Wallet, label: "Retraits" },
      { to: "/admin/accounting", icon: Calculator, label: "Comptabilité" },
    ],
  },
  {
    label: "Support",
    items: [
      { to: "/admin/tickets", icon: MessageSquare, label: "Tickets" },
      { to: "/admin/returns", icon: RotateCcw, label: "Retours" },
    ],
  },
  {
    label: "Configuration",
    items: [
      { to: "/admin/branding", icon: Palette, label: "Branding" },
      { to: "/admin/email", icon: Mail, label: "Email" },
      { to: "/admin/email-templates", icon: FileText, label: "Templates email" },
      { to: "/admin/risk", icon: Shield, label: "Risk & Réputation" },
      { to: "/admin/settings", icon: Settings, label: "Paramètres" },
    ],
  },
];

interface Props {
  onNavigate?: () => void;
}

export function AdminSidebar({ onNavigate }: Props) {
  const location = useLocation();

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    navGroups.forEach((g) => {
      const hasActive = g.items.some((link) =>
        link.end ? location.pathname === link.to : location.pathname.startsWith(link.to)
      );
      initial[g.label] = hasActive || g.label === "Tableau de bord";
    });
    return initial;
  });

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

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
      <nav className="flex-1 overflow-y-auto py-2 px-3">
        {navGroups.map((group) => {
          const isOpen = openGroups[group.label] ?? true;
          const hasActive = group.items.some((link) =>
            link.end ? location.pathname === link.to : location.pathname.startsWith(link.to)
          );

          return (
            <div key={group.label} className="mb-1">
              <button
                onClick={() => toggleGroup(group.label)}
                className="w-full flex items-center justify-between px-3 pt-2 pb-1 group"
              >
                <p className={cn(
                  "text-[9px] font-semibold uppercase tracking-widest transition-colors",
                  hasActive ? "text-muted-foreground" : "text-muted-foreground/60"
                )}>
                  {group.label}
                </p>
                <ChevronDown
                  size={10}
                  className={cn(
                    "text-muted-foreground/60 transition-transform duration-200",
                    !isOpen && "-rotate-90"
                  )}
                />
              </button>
              <div
                className={cn(
                  "overflow-hidden transition-all duration-200 ease-out space-y-0.5",
                  !isOpen ? "max-h-0 opacity-0" : "max-h-[500px] opacity-100"
                )}
              >
                {group.items.map((link) => {
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
              </div>
            </div>
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
