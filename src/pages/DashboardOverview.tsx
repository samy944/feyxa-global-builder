import { motion } from "framer-motion";
import {
  TrendingUp,
  ShoppingCart,
  Users,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Package,
} from "lucide-react";

const stats = [
  {
    label: "Revenus",
    value: "€24,580",
    change: "+23.5%",
    positive: true,
    icon: DollarSign,
  },
  {
    label: "Commandes",
    value: "384",
    change: "+12.2%",
    positive: true,
    icon: ShoppingCart,
  },
  {
    label: "Clients",
    value: "1,429",
    change: "+8.1%",
    positive: true,
    icon: Users,
  },
  {
    label: "Taux de conversion",
    value: "3.24%",
    change: "-0.4%",
    positive: false,
    icon: TrendingUp,
  },
];

const recentOrders = [
  { id: "#FX-4821", customer: "Marie Dupont", total: "€129.00", status: "Livrée", date: "Il y a 2h" },
  { id: "#FX-4820", customer: "Jean Kouassi", total: "€84.50", status: "En cours", date: "Il y a 3h" },
  { id: "#FX-4819", customer: "Fatou Diallo", total: "€245.00", status: "Payée", date: "Il y a 5h" },
  { id: "#FX-4818", customer: "Paul Mbeki", total: "€67.90", status: "Livrée", date: "Il y a 8h" },
  { id: "#FX-4817", customer: "Sarah Chen", total: "€312.00", status: "En cours", date: "Il y a 12h" },
];

const statusColor: Record<string, string> = {
  "Livrée": "text-accent",
  "En cours": "text-primary",
  "Payée": "text-foreground",
};

export default function DashboardOverview() {
  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Vue d'ensemble</h1>
        <p className="text-sm text-muted-foreground mt-1">Bienvenue, voici vos métriques du jour.</p>
      </div>

      {/* Stats grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-xl border border-border bg-card p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">{stat.label}</span>
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <stat.icon size={16} />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            <div className="flex items-center gap-1 mt-1">
              {stat.positive ? (
                <ArrowUpRight size={12} className="text-accent" />
              ) : (
                <ArrowDownRight size={12} className="text-destructive" />
              )}
              <span className={`text-xs font-medium ${stat.positive ? "text-accent" : "text-destructive"}`}>
                {stat.change}
              </span>
              <span className="text-xs text-muted-foreground">vs mois dernier</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recent orders */}
      <div className="rounded-xl border border-border bg-card">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package size={16} className="text-muted-foreground" />
            <h2 className="font-semibold text-foreground">Commandes récentes</h2>
          </div>
          <a href="/dashboard/orders" className="text-xs text-primary hover:underline">
            Voir tout
          </a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted-foreground text-xs border-b border-border">
                <th className="text-left font-medium p-4">Commande</th>
                <th className="text-left font-medium p-4">Client</th>
                <th className="text-left font-medium p-4">Total</th>
                <th className="text-left font-medium p-4">Statut</th>
                <th className="text-right font-medium p-4">Date</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.id} className="border-b border-border last:border-0 hover:bg-secondary/50 transition-colors">
                  <td className="p-4 font-mono text-foreground">{order.id}</td>
                  <td className="p-4 text-foreground">{order.customer}</td>
                  <td className="p-4 font-medium text-foreground">{order.total}</td>
                  <td className="p-4">
                    <span className={`text-xs font-medium ${statusColor[order.status] || "text-muted-foreground"}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="p-4 text-right text-muted-foreground">{order.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
