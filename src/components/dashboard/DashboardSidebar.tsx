import { Link, useLocation } from "react-router-dom";
import {
  LayoutGrid, Package, ShoppingCart, Users, BarChart2, Settings, Megaphone, Truck, Cpu,
  ChevronLeft, Wallet, FileText, Lightbulb, TrendingUp, Store, MessageSquare, MessageCircle, RotateCcw, Shield, Calculator, Landmark, Warehouse, Paintbrush,
  ChevronDown, Share2, MousePointer2, Layout,
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

interface NavGroup {
  label: string;
  items: { icon: any; label: string; path: string }[];
}

export function DashboardSidebar({ onNavigate }: DashboardSidebarProps) {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const { isAdmin } = useAdmin();
  const { t } = useTranslation();
  const branding = useBranding();

  const navGroups: NavGroup[] = [
    {
      label: "Principal",
      items: [
        { icon: LayoutGrid, label: t.dashboard.overview, path: "/dashboard" },
        { icon: Package, label: t.dashboard.products, path: "/dashboard/products" },
        { icon: ShoppingCart, label: t.dashboard.orders, path: "/dashboard/orders" },
        { icon: Users, label: t.dashboard.customers, path: "/dashboard/customers" },
      ],
    },
    {
      label: "Boutique",
      items: [
        { icon: Paintbrush, label: "Vitrine", path: "/dashboard/storefront" },
        { icon: Layout, label: "Page Builder", path: "/dashboard/grid-builder" },
        { icon: FileText, label: t.dashboard.landings, path: "/dashboard/landings" },
        { icon: Megaphone, label: t.dashboard.marketing, path: "/dashboard/marketing" },
        { icon: Share2, label: "Social Commerce", path: "/dashboard/social" },
      ],
    },
    {
      label: "Opérations",
      items: [
        { icon: Truck, label: t.dashboard.shipping, path: "/dashboard/shipping" },
        { icon: Warehouse, label: "Fulfillment", path: "/dashboard/fulfillment" },
        { icon: RotateCcw, label: t.dashboard.returns, path: "/dashboard/returns" },
        { icon: MessageCircle, label: "Messages", path: "/dashboard/messages" },
        { icon: MessageSquare, label: t.dashboard.tickets, path: "/dashboard/tickets" },
      ],
    },
    {
      label: "Finances",
      items: [
        { icon: Wallet, label: t.dashboard.wallet, path: "/dashboard/wallet" },
        { icon: Landmark, label: "Feyxa Capital", path: "/dashboard/capital" },
        { icon: Calculator, label: "Comptabilité", path: "/dashboard/accounting" },
      ],
    },
    {
      label: "Intelligence",
      items: [
        { icon: BarChart2, label: t.dashboard.analytics, path: "/dashboard/analytics" },
        { icon: MousePointer2, label: "Heatmap", path: "/dashboard/heatmap" },
        { icon: Cpu, label: t.dashboard.ai, path: "/dashboard/ai" },
        { icon: Lightbulb, label: t.dashboard.insights, path: "/dashboard/insights" },
        { icon: TrendingUp, label: t.dashboard.trends, path: "/dashboard/trends" },
      ],
    },
  ];

  // Track which groups are open
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    navGroups.forEach((g) => {
      // Open groups that contain the active route
      const hasActive = g.items.some((item) => location.pathname === item.path);
      initial[g.label] = hasActive || g.label === "Principal";
    });
    return initial;
  });

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

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

      <nav className="flex-1 px-2 py-2 overflow-y-auto">
        {navGroups.map((group) => {
          const isOpen = openGroups[group.label] ?? true;
          const hasActive = group.items.some((item) => location.pathname === item.path);

          return (
            <div key={group.label} className="mb-1">
              {!collapsed ? (
                <button
                  onClick={() => toggleGroup(group.label)}
                  className="w-full flex items-center justify-between px-3 pt-2 pb-1 group"
                >
                  <p
                    className="text-[9px] font-semibold uppercase tracking-widest transition-colors"
                    style={{ color: hasActive ? "#9CA3AF" : "#4B5563" }}
                  >
                    {group.label}
                  </p>
                  <ChevronDown
                    size={10}
                    className={cn(
                      "transition-transform duration-200",
                      !isOpen && "-rotate-90"
                    )}
                    style={{ color: "#4B5563" }}
                  />
                </button>
              ) : (
                <div className="h-2" />
              )}
              <div
                className={cn(
                  "overflow-hidden transition-all duration-200 ease-out space-y-0.5",
                  !collapsed && !isOpen ? "max-h-0 opacity-0" : "max-h-[500px] opacity-100"
                )}
              >
                {group.items.map((item) => {
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
              </div>
            </div>
          );
        })}
      </nav>

      <div className="px-2 py-1 space-y-0.5" style={{ borderTop: "1px solid hsla(0,0%,100%,0.06)" }}>
        <Link to="/dashboard/settings" onClick={onNavigate}
          className={cn("flex items-center gap-3 rounded-md px-3 py-2 text-[13px] font-medium transition-colors duration-200", collapsed && "justify-center px-0")}
          style={{ color: location.pathname === "/dashboard/settings" ? "#F8FAFC" : "#9CA3AF", background: location.pathname === "/dashboard/settings" ? "hsla(0,0%,100%,0.06)" : "transparent" }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "#F8FAFC"; }}
          onMouseLeave={(e) => { if (location.pathname !== "/dashboard/settings") e.currentTarget.style.color = "#9CA3AF"; }}
          title={collapsed ? t.dashboard.settings : undefined}
        >
          <Settings size={17} style={{ color: "#6B7280", flexShrink: 0 }} />
          {!collapsed && <span>{t.dashboard.settings}</span>}
        </Link>
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
