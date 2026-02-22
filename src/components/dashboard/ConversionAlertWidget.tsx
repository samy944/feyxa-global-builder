import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/hooks/useStore";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingDown, TrendingUp, Eye, ShoppingCart, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { format, subDays } from "date-fns";

export default function ConversionAlertWidget() {
  const { store } = useStore();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{ pageViews: number; purchases: number; rate: number; threshold: number | null } | null>(null);

  useEffect(() => {
    if (!store?.id) return;
    setLoading(true);

    const startDate = format(subDays(new Date(), 7), "yyyy-MM-dd");
    supabase
      .from("tracking_events")
      .select("event_type, event_count")
      .eq("store_id", store.id)
      .gte("event_date", startDate)
      .then(({ data: events }) => {
        let pageViews = 0;
        let purchases = 0;
        for (const e of events || []) {
          if (e.event_type === "page_view") pageViews += e.event_count;
          if (e.event_type === "purchase") purchases += e.event_count;
        }
        const rate = pageViews > 0 ? (purchases / pageViews) * 100 : 0;
        const settings = (store.settings as Record<string, any>) || {};
        setData({ pageViews, purchases, rate, threshold: settings.conversion_threshold ?? null });
        setLoading(false);
      });
  }, [store?.id]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-5 flex items-center justify-center h-28">
          <Loader2 className="animate-spin text-muted-foreground" size={18} />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.pageViews === 0) {
    return (
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-2">
            <Eye size={16} className="text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Conversion (7j)</span>
          </div>
          <p className="text-sm text-muted-foreground">Pas encore de données de trafic cette semaine.</p>
        </CardContent>
      </Card>
    );
  }

  const isBelow = data.threshold != null && data.rate < data.threshold;
  const Icon = isBelow ? TrendingDown : TrendingUp;

  return (
    <Card className={isBelow ? "border-destructive/40 bg-destructive/5" : ""}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${isBelow ? "bg-destructive/10" : "bg-primary/10"}`}>
              <Icon size={16} className={isBelow ? "text-destructive" : "text-primary"} />
            </div>
            <span className="text-sm font-medium text-foreground">Taux de conversion (7j)</span>
          </div>
          <Link to="/dashboard/analytics" className="text-xs text-primary hover:underline">
            Voir détails →
          </Link>
        </div>

        <div className="flex items-end gap-4">
          <div>
            <p className={`text-3xl font-bold ${isBelow ? "text-destructive" : "text-foreground"}`}>
              {data.rate.toFixed(2)}%
            </p>
            {data.threshold != null && (
              <p className="text-xs text-muted-foreground mt-1">
                Seuil : {data.threshold}%
                {isBelow && <span className="text-destructive font-medium ml-1">⚠ En dessous</span>}
              </p>
            )}
          </div>
          <div className="flex gap-4 ml-auto text-center">
            <div>
              <p className="text-lg font-semibold text-foreground">{data.pageViews.toLocaleString("fr-FR")}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1"><Eye size={10} /> Visites</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-foreground">{data.purchases.toLocaleString("fr-FR")}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1"><ShoppingCart size={10} /> Achats</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
