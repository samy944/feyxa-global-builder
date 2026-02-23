import { Clock } from "lucide-react";
import SmartOpsWidget from "@/components/dashboard/SmartOpsWidget";
import ConversionAlertWidget from "@/components/dashboard/ConversionAlertWidget";
import RecentOrdersWidget from "@/components/dashboard/RecentOrdersWidget";
import TopProductsWidget from "@/components/dashboard/TopProductsWidget";
import LowStockWidget from "@/components/dashboard/LowStockWidget";
import KpiCardsWidget from "@/components/dashboard/KpiCardsWidget";

export default function DashboardOverview() {
  return (
    <div className="p-6 lg:p-8 space-y-10">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-foreground">Vue d'ensemble</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Performance de votre boutique en temps réel.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
          <Clock size={13} />
          <span>{new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}</span>
        </div>
      </div>

      {/* KPI Cards — dominant performance block */}
      <KpiCardsWidget />

      {/* Conversion Alert */}
      <ConversionAlertWidget />

      {/* Smart Ops */}
      <SmartOpsWidget />

      {/* Top Products & Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopProductsWidget />
        <RecentOrdersWidget />
      </div>

      {/* Low Stock */}
      <LowStockWidget />
    </div>
  );
}
