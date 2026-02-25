import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/hooks/useStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, Loader2, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { fr as frLocale } from "date-fns/locale";
import { enUS } from "date-fns/locale";
import { useTranslation } from "@/lib/i18n";

interface RecentOrder {
  id: string;
  order_number: string;
  total: number;
  currency: string;
  status: string;
  created_at: string;
  customers: { first_name: string; last_name: string | null } | null;
}

export default function RecentOrdersWidget() {
  const { store } = useStore();
  const { t, lang } = useTranslation();
  const [orders, setOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!store?.id) return;
    setLoading(true);
    supabase
      .from("orders")
      .select("id, order_number, total, currency, status, created_at, customers(first_name, last_name)")
      .eq("store_id", store.id)
      .order("created_at", { ascending: false })
      .limit(5)
      .then(({ data }) => {
        setOrders((data as unknown as RecentOrder[]) || []);
        setLoading(false);
      });
  }, [store?.id]);

  const statusLabel = (s: string) => (t.orderStatusF as any)[s] || s;
  const statusClass = (s: string): string => {
    const map: Record<string, string> = {
      new: "bg-primary/10 text-primary",
      confirmed: "bg-accent/10 text-accent",
      packed: "bg-primary/10 text-primary",
      shipped: "bg-accent/10 text-accent",
      delivered: "bg-accent/10 text-accent",
      cancelled: "bg-destructive/10 text-destructive",
      refunded: "bg-muted text-muted-foreground",
    };
    return map[s] || "bg-muted text-muted-foreground";
  };

  return (
    <Card>
      <CardHeader className="pb-3 flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingCart size={16} className="text-primary" />
          <CardTitle className="text-base">{t.dashboard.recentOrders}</CardTitle>
        </div>
        <Link to="/dashboard/orders" className="text-xs text-primary hover:underline flex items-center gap-1">
          {t.dashboard.viewAll} <ArrowRight size={12} />
        </Link>
      </CardHeader>
      <CardContent className="pt-0">
        {loading ? (
          <div className="flex items-center justify-center py-8"><Loader2 className="animate-spin text-muted-foreground" size={18} /></div>
        ) : orders.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">{t.dashboard.noOrdersYet}</p>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => {
              const customerName = order.customers
                ? `${order.customers.first_name}${order.customers.last_name ? ` ${order.customers.last_name}` : ""}`
                : t.dashboard.anonymousClient;
              return (
                <div key={order.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{order.order_number}</span>
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${statusClass(order.status)}`}>
                        {statusLabel(order.status)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {customerName} · {formatDistanceToNow(new Date(order.created_at), { addSuffix: true, locale: lang === "fr" ? frLocale : enUS })}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-foreground whitespace-nowrap ml-3">
                    {order.total.toLocaleString("fr-FR")} {order.currency}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
