import { Link, useLocation } from "react-router-dom";
import {
  LayoutGrid, Package, ShoppingCart, Users, BarChart2, Settings, Megaphone, Truck, Cpu,
  ChevronLeft, Wallet, FileText, Lightbulb, TrendingUp, Store, MessageSquare, MessageCircle, RotateCcw, Shield, Calculator, Landmark, Warehouse, Paintbrush,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { StoreSwitcher } from "./StoreSwitcher";
import { useAdmin } from "@/hooks/useAdmin";
import { useTranslation } from "@/lib/i18n";
import { useBranding } from "@/hooks/useBranding";

interface DashboardSidebarProps {
  onNavigate?: () => void;
}

export function DashboardSidebar({ onNavigate }: DashboardSidebarProps) {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const { isAdmin } = useAdmin();
  const { t } = useTranslation();
  const branding = useBranding();

  const navItems = [
    { icon: LayoutGrid, label: t.dashboard.overview, path: "/dashboard" },
    { icon: Package, label: t.dashboard.products, path: "/dashboard/products" },
    { icon: Paintbrush, label: "Vitrine", path: "/dashboard/storefront" },
    { icon: ShoppingCart, label: t.dashboard.orders, path: "/dashboard/orders" },
    { icon: Users, label: t.dashboard.customers, path: "/dashboard/customers" },
    { icon: Megaphone, label: t.dashboard.marketing, path: "/dashboard/marketing" },
    { icon: Truck, label: t.dashboard.shipping, path: "/dashboard/shipping" },
    { icon: BarChart2, label: t.dashboard.analytics, path: "/dashboard/analytics" },
    { icon: Cpu, label: t.dashboard.ai, path: "/dashboard/ai" },
    { icon: Wallet, label: t.dashboard.wallet, path: "/dashboard/wallet" },
    { icon: Landmark, label: "Feyxa Capital", path: "/dashboard/capital" },
    { icon: Warehouse, label: "Fulfillment", path: "/dashboard/fulfillment" },
    { icon: Calculator, label: "Comptabilité", path: "/dashboard/accounting" },
    { icon: Lightbulb, label: t.dashboard.insights, path: "/dashboard/insights" },
    { icon: TrendingUp, label: t.dashboard.trends, path: "/dashboard/trends" },
    { icon: FileText, label: t.dashboard.landings, path: "/dashboard/landings" },
    { icon: MessageCircle, label: "Messages", path: "/dashboard/messages" },
    { icon: MessageSquare, label: t.dashboard.tickets, path: "/dashboard/tickets" },
    { icon: RotateCcw, label: t.dashboard.returns, path: "/dashboard/returns" },
    { icon: Settings, label: t.dashboard.settings, path: "/dashboard/settings" },
  ];

  return (
    <aside
      className={cn(
        "h-screen sticky top-0 flex flex-col transition-[width] duration-200 ease-out",
        collapsed ? "w-[56px]" : "w-[220px]"
      )}
      style={{ background: "#121417", borderRight: "1px solid hsla(0,0%,100%,0.06)" }}
    >
      <div className="h-12 flex items-center justify-between px-3" style={{ borderBottom: "1px solid hsla(0,0%,100%,0.06)" }}>
        {!collapsed && (
          <Link to="/" className="flex items-center gap-2">
            {branding.logo_url ? (
              <img src={branding.logo_url} alt={branding.platform_name} className="h-6 w-6 rounded-md object-contain" />
            ) : (
              <div className="h-6 w-6 rounded-md bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-semibold text-[10px]">{branding.platform_name.charAt(0)}</span>
              </div>
            )}
            <span className="font-heading text-sm tracking-tight" style={{ color: "#F8FAFC" }}>{branding.platform_name}</span>
          </Link>
        )}
        <button onClick={() => setCollapsed(!collapsed)} className="h-7 w-7 rounded-md flex items-center justify-center transition-colors duration-200" style={{ color: "#9CA3AF" }} onMouseEnter={(e) => (e.currentTarget.style.color = "#F8FAFC")} onMouseLeave={(e) => (e.currentTarget.style.color = "#9CA3AF")}>
          <ChevronLeft size={14} className={cn("transition-transform duration-200", collapsed && "rotate-180")} />
        </button>
      </div>

      <div className="px-2 py-2" style={{ borderBottom: "1px solid hsla(0,0%,100%,0.06)" }}>
        <StoreSwitcher collapsed={collapsed} />
      </div>

      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link key={item.path} to={item.path} onClick={onNavigate}
              className={cn("relative flex items-center gap-3 rounded-md px-3 py-2 text-[13px] font-medium transition-colors duration-200", collapsed && "justify-center px-0")}
              style={{ color: isActive ? "#F8FAFC" : "#9CA3AF", background: isActive ? "hsla(0,0%,100%,0.06)" : "transparent" }}
              onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.color = "#F8FAFC"; e.currentTarget.style.background = "hsla(0,0%,100%,0.04)"; } }}
              onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.color = "#9CA3AF"; e.currentTarget.style.background = "transparent"; } }}
              title={collapsed ? item.label : undefined}
            >
              {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full" style={{ height: "60%", background: "hsl(106 75% 47%)" }} />}
              <item.icon size={17} style={{ color: isActive ? "#F8FAFC" : "#6B7280", flexShrink: 0 }} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="px-2 py-1 space-y-0.5" style={{ borderTop: "1px solid hsla(0,0%,100%,0.06)" }}>
        {isAdmin && (
          <Link to="/admin" onClick={onNavigate} className={cn("flex items-center gap-3 rounded-md px-3 py-2 text-[13px] font-medium transition-colors duration-200", collapsed && "justify-center px-0")} style={{ color: "#F59E0B" }} onMouseEnter={(e) => { e.currentTarget.style.color = "#FBBF24"; }} onMouseLeave={(e) => { e.currentTarget.style.color = "#F59E0B"; }} title={collapsed ? "Super Admin" : undefined}>
            <Shield size={17} style={{ flexShrink: 0 }} />
            {!collapsed && <span>Super Admin</span>}
          </Link>
        )}
        <Link to="/market" onClick={onNavigate} className={cn("flex items-center gap-3 rounded-md px-3 py-2 text-[13px] font-medium transition-colors duration-200", collapsed && "justify-center px-0")} style={{ color: "#9CA3AF" }} onMouseEnter={(e) => { e.currentTarget.style.color = "#F8FAFC"; }} onMouseLeave={(e) => { e.currentTarget.style.color = "#9CA3AF"; }} title={collapsed ? t.navbar.marketplace : undefined}>
          <Store size={17} style={{ color: "#6B7280" }} />
          {!collapsed && <span>{t.navbar.marketplace}</span>}
        </Link>
      </div>

      <div className="py-1" />
    </aside>
  );
}
