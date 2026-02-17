import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { 
  Clock, Phone, MapPin, Package, AlertTriangle, 
  TrendingUp, ChevronRight, Truck, MessageSquare
} from "lucide-react";

// Mock data for the "to do today" dashboard
const todayTasks = [
  { id: 1, type: "order", label: "3 commandes à confirmer", icon: Package, urgent: true },
  { id: 2, type: "delivery", label: "2 livraisons à préparer", icon: Truck, urgent: false },
  { id: 3, type: "stock", label: "1 produit en stock faible", icon: AlertTriangle, urgent: true },
  { id: 4, type: "message", label: "5 messages WhatsApp", icon: MessageSquare, urgent: false },
];

const recentActivity = [
  { time: "14:32", action: "Commande #FX-4821 confirmée", user: "Vous" },
  { time: "13:15", action: "Produit 'T-shirt Premium' modifié", user: "Admin" },
  { time: "12:45", action: "Nouveau client: Fatou Diallo", user: "Système" },
  { time: "11:20", action: "Stock mis à jour: Casquette Brodée", user: "Vous" },
  { time: "10:00", action: "Commande #FX-4820 payée", user: "Système" },
];

const quickStats = [
  { label: "Aujourd'hui", value: "€2,450", sub: "12 commandes" },
  { label: "Cette semaine", value: "€14,820", sub: "67 commandes" },
  { label: "Ce mois", value: "€24,580", sub: "384 commandes" },
];

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

      {/* Quick stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        {quickStats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-xl border border-border bg-card p-5"
          >
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{stat.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* To do today */}
      <div className="rounded-xl border border-border bg-card">
        <div className="p-5 border-b border-border">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <TrendingUp size={16} className="text-primary" />
            À faire aujourd'hui
          </h2>
        </div>
        <div className="divide-y divide-border">
          {todayTasks.map((task) => (
            <button
              key={task.id}
              className="w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${task.urgent ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`}>
                  <task.icon size={16} />
                </div>
                <span className="text-sm text-foreground">{task.label}</span>
                {task.urgent && <span className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded-full">Urgent</span>}
              </div>
              <ChevronRight size={16} className="text-muted-foreground" />
            </button>
          ))}
        </div>
      </div>

      {/* Activity log */}
      <div className="rounded-xl border border-border bg-card">
        <div className="p-5 border-b border-border">
          <h2 className="font-semibold text-foreground">Journal d'activité</h2>
        </div>
        <div className="divide-y divide-border">
          {recentActivity.map((a, i) => (
            <div key={i} className="flex items-center gap-4 p-4">
              <span className="text-xs text-muted-foreground font-mono w-12">{a.time}</span>
              <span className="text-sm text-foreground flex-1">{a.action}</span>
              <span className="text-xs text-muted-foreground">{a.user}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
