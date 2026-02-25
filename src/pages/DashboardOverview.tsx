import { Clock } from "lucide-react";
import SmartOpsWidget from "@/components/dashboard/SmartOpsWidget";
import ConversionAlertWidget from "@/components/dashboard/ConversionAlertWidget";
import RecentOrdersWidget from "@/components/dashboard/RecentOrdersWidget";
import TopProductsWidget from "@/components/dashboard/TopProductsWidget";
import LowStockWidget from "@/components/dashboard/LowStockWidget";
import KpiCardsWidget from "@/components/dashboard/KpiCardsWidget";
import InventoryIntelligenceWidget from "@/components/dashboard/InventoryIntelligenceWidget";
import { useTranslation } from "@/lib/i18n";

export default function DashboardOverview() {
  const { t, lang } = useTranslation();
  const locale = lang === "fr" ? "fr-FR" : "en-US";

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 md:space-y-10">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-foreground">{t.dashboard.overview}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t.dashboard.overviewSubtitle}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
          <Clock size={13} />
          <span>{new Date().toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long" })}</span>
        </div>
      </div>

      <KpiCardsWidget />
      <ConversionAlertWidget />
      <SmartOpsWidget />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopProductsWidget />
        <RecentOrdersWidget />
      </div>

      <LowStockWidget />
      <InventoryIntelligenceWidget />
    </div>
  );
}
