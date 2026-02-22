import { Clock } from "lucide-react";
import SmartOpsWidget from "@/components/dashboard/SmartOpsWidget";
import ConversionAlertWidget from "@/components/dashboard/ConversionAlertWidget";

export default function DashboardOverview() {
  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Bonjour 👋</h1>
          <p className="text-sm text-muted-foreground mt-1">Voici ce qui se passe dans votre boutique aujourd'hui.</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock size={14} />
          <span>{new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}</span>
        </div>
      </div>

      {/* Conversion Alert Widget */}
      <ConversionAlertWidget />

      {/* Smart Ops - AI-powered morning summary */}
      <SmartOpsWidget />
    </div>
  );
}
