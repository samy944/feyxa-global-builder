import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  Settings,
  Tag,
  Truck,
  Brain,
  ChevronLeft,
  Wallet,
  FileText,
  Zap,
  TrendingUp,
  Store,
  MessageSquare,
  RotateCcw,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { StoreSwitcher } from "./StoreSwitcher";
import { useAdmin } from "@/hooks/useAdmin";

const navItems = [
  { icon: LayoutDashboard, label: "Vue d'ensemble", path: "/dashboard" },
  { icon: Package, label: "Produits", path: "/dashboard/products" },
  { icon: ShoppingCart, label: "Commandes", path: "/dashboard/orders" },
  { icon: Users, label: "Clients", path: "/dashboard/customers" },
  { icon: Tag, label: "Marketing", path: "/dashboard/marketing" },
  { icon: Truck, label: "Logistique", path: "/dashboard/shipping" },
  { icon: BarChart3, label: "Analytics", path: "/dashboard/analytics" },
  { icon: Brain, label: "IA Assistant", path: "/dashboard/ai" },
  { icon: Wallet, label: "Portefeuille", path: "/dashboard/wallet" },
  { icon: Zap, label: "Insights", path: "/dashboard/insights" },
  { icon: TrendingUp, label: "Trends", path: "/dashboard/trends" },
  { icon: FileText, label: "Landing Pages", path: "/dashboard/landings" },
  { icon: MessageSquare, label: "Tickets", path: "/dashboard/tickets" },
  { icon: RotateCcw, label: "Retours", path: "/dashboard/returns" },
  { icon: Settings, label: "Paramètres", path: "/dashboard/settings" },
];

interface DashboardSidebarProps {
  onNavigate?: () => void;
}

export function DashboardSidebar({ onNavigate }: DashboardSidebarProps) {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const { isAdmin } = useAdmin();
  return (
    <aside
      className={cn(
        "h-screen sticky top-0 flex flex-col transition-[width] duration-200 ease-out",
        collapsed ? "w-[56px]" : "w-[220px]"
      )}
      style={{ background: "#121417", borderRight: "1px solid hsla(0,0%,100%,0.06)" }}
    >
      {/* Logo + collapse */}
      <div className="h-12 flex items-center justify-between px-3" style={{ borderBottom: "1px solid hsla(0,0%,100%,0.06)" }}>
        {!collapsed && (
          <Link to="/" className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-semibold text-[10px]">F</span>
            </div>
            <span className="font-heading text-sm tracking-tight" style={{ color: "#F8FAFC" }}>Feyxa</span>
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="h-7 w-7 rounded-md flex items-center justify-center transition-colors duration-200"
          style={{ color: "#9CA3AF" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#F8FAFC")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#9CA3AF")}
        >
          <ChevronLeft size={14} className={cn("transition-transform duration-200", collapsed && "rotate-180")} />
        </button>
      </div>

      {/* Store Switcher */}
      <div className="px-2 py-2" style={{ borderBottom: "1px solid hsla(0,0%,100%,0.06)" }}>
        <StoreSwitcher collapsed={collapsed} />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onNavigate}
              className={cn(
                "relative flex items-center gap-3 rounded-md px-3 py-2 text-[13px] font-medium transition-colors duration-200",
                collapsed && "justify-center px-0"
              )}
              style={{
                color: isActive ? "#F8FAFC" : "#9CA3AF",
                background: isActive ? "hsla(0,0%,100%,0.06)" : "transparent",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = "#F8FAFC";
                  e.currentTarget.style.background = "hsla(0,0%,100%,0.04)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = "#9CA3AF";
                  e.currentTarget.style.background = "transparent";
                }
              }}
              title={collapsed ? item.label : undefined}
            >
              {/* Active indicator — thin green bar */}
              {isActive && (
                <div
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full"
                  style={{ height: "60%", background: "hsl(106 75% 47%)" }}
                />
              )}
              <item.icon size={17} style={{ color: isActive ? "#F8FAFC" : "#6B7280", flexShrink: 0 }} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Marketplace link */}
      <div className="px-2 py-1 space-y-0.5" style={{ borderTop: "1px solid hsla(0,0%,100%,0.06)" }}>
        {isAdmin && (
          <Link
            to="/admin"
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-[13px] font-medium transition-colors duration-200",
              collapsed && "justify-center px-0"
            )}
            style={{ color: "#F59E0B" }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#FBBF24"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "#F59E0B"; }}
            title={collapsed ? "Super Admin" : undefined}
          >
            <Shield size={17} style={{ flexShrink: 0 }} />
            {!collapsed && <span>Super Admin</span>}
          </Link>
        )}
        <Link
          to="/market"
          onClick={onNavigate}
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2 text-[13px] font-medium transition-colors duration-200",
            collapsed && "justify-center px-0"
          )}
          style={{ color: "#9CA3AF" }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "#F8FAFC"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "#9CA3AF"; }}
          title={collapsed ? "Marketplace" : undefined}
        >
          <Store size={17} style={{ color: "#6B7280" }} />
          {!collapsed && <span>Marketplace</span>}
        </Link>
      </div>

      {/* Spacer */}
      <div className="py-1" />
    </aside>
  );
}
