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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const navItems = [
  { icon: LayoutDashboard, label: "Vue d'ensemble", path: "/dashboard" },
  { icon: Package, label: "Produits", path: "/dashboard/products" },
  { icon: ShoppingCart, label: "Commandes", path: "/dashboard/orders" },
  { icon: Users, label: "Clients", path: "/dashboard/customers" },
  { icon: Tag, label: "Marketing", path: "/dashboard/marketing" },
  { icon: Truck, label: "Logistique", path: "/dashboard/shipping" },
  { icon: BarChart3, label: "Analytics", path: "/dashboard/analytics" },
  { icon: Brain, label: "IA Assistant", path: "/dashboard/ai" },
  { icon: Settings, label: "Paramètres", path: "/dashboard/settings" },
];

export function DashboardSidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "h-screen sticky top-0 border-r border-border bg-card flex flex-col transition-all duration-300",
        collapsed ? "w-16" : "w-60"
      )}
    >
      <div className="h-16 flex items-center justify-between px-4 border-b border-border">
        {!collapsed && (
          <Link to="/" className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xs">F</span>
            </div>
            <span className="font-bold text-sm tracking-tight text-foreground">Feyxa</span>
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        >
          <ChevronLeft size={14} className={cn("transition-transform", collapsed && "rotate-180")} />
        </button>
      </div>

      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon size={18} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-border">
        <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold shrink-0">
            MA
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate">Ma Boutique</p>
              <p className="text-xs text-muted-foreground truncate">Plan Pro</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
