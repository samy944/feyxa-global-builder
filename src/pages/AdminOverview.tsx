import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Store, Users, ShoppingCart, Wallet, Loader2, TrendingUp } from "lucide-react";

export default function AdminOverview() {
  const [stats, setStats] = useState({
    stores: 0,
    users: 0,
    orders: 0,
    pendingPayouts: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const [storesRes, ordersRes, payoutsRes] = await Promise.all([
        supabase.from("stores").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("id, total", { count: "exact" }),
        supabase
          .from("payout_requests")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending" as any),
      ]);

      const { count: userCount } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true });

      const totalRevenue = (ordersRes.data || []).reduce(
        (s: number, o: any) => s + (o.total || 0),
        0
      );

      setStats({
        stores: storesRes.count || 0,
        users: userCount || 0,
        orders: ordersRes.count || 0,
        pendingPayouts: payoutsRes.count || 0,
        totalRevenue,
      });
      setLoading(false);
    };
    fetch();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-primary" size={24} />
      </div>
    );
  }

  const cards = [
    { label: "Boutiques", value: stats.stores, icon: Store, color: "text-blue-500" },
    { label: "Utilisateurs", value: stats.users, icon: Users, color: "text-green-500" },
    { label: "Commandes", value: stats.orders, icon: ShoppingCart, color: "text-orange-500" },
    {
      label: "Retraits en attente",
      value: stats.pendingPayouts,
      icon: Wallet,
      color: "text-yellow-500",
    },
    {
      label: "Revenu total plateforme",
      value: new Intl.NumberFormat("fr-FR").format(stats.totalRevenue) + " XOF",
      icon: TrendingUp,
      color: "text-primary",
      large: true,
    },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          Tableau de bord
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Vue d'ensemble de la plateforme Feyxa
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((c) => (
          <Card key={c.label} className={c.large ? "sm:col-span-2 lg:col-span-1" : ""}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
                  <c.icon size={20} className={c.color} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{c.label}</p>
                  <p className="text-2xl font-heading font-bold">{c.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
