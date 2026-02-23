import { useStore } from "@/hooks/useStore";
import { useNavigate } from "react-router-dom";
import { Plus, Settings, ArrowRight, Globe } from "lucide-react";
import { motion } from "framer-motion";

export default function DashboardStores() {
  const { stores, store, switchStore } = useStore();
  const navigate = useNavigate();

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Mes boutiques</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gérez vos boutiques et basculez entre elles
          </p>
        </div>
        <button
          onClick={() => navigate("/dashboard/stores/new")}
          className="flex items-center gap-2 h-10 px-5 rounded-lg text-sm font-medium transition-all duration-200"
          style={{
            background: "hsl(var(--primary))",
            color: "hsl(var(--primary-foreground))",
          }}
        >
          <Plus size={16} />
          Nouvelle boutique
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stores.map((s, i) => {
          const isActive = s.id === store?.id;
          const initials = s.name?.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();

          return (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
              className="group relative rounded-xl border p-5 transition-all duration-200"
              style={{
                background: isActive ? "hsla(0,0%,100%,0.03)" : "hsl(var(--card))",
                borderColor: isActive
                  ? "hsl(var(--primary) / 0.3)"
                  : "hsl(var(--border))",
              }}
            >
              {/* Status dot */}
              <div className="absolute top-4 right-4">
                <div
                  className="h-2 w-2 rounded-full"
                  style={{
                    background: s.is_active
                      ? "hsl(106 75% 47%)"
                      : "hsl(var(--muted-foreground))",
                  }}
                />
              </div>

              <div className="flex items-start gap-4">
                <div
                  className="h-12 w-12 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
                  style={{
                    background: "hsl(var(--primary) / 0.1)",
                    color: "hsl(var(--primary))",
                  }}
                >
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-[15px] font-semibold text-foreground truncate">
                    {s.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Globe size={12} className="text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {s.city || "—"} · {s.currency}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {s.is_active ? "Active" : "En pause"}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 mt-5">
                <button
                  onClick={() => {
                    switchStore(s.id);
                    navigate("/dashboard");
                  }}
                  className="flex-1 flex items-center justify-center gap-2 h-9 rounded-lg text-[13px] font-medium transition-colors duration-200"
                  style={{
                    background: isActive
                      ? "hsl(var(--primary))"
                      : "hsl(var(--secondary))",
                    color: isActive
                      ? "hsl(var(--primary-foreground))"
                      : "hsl(var(--foreground))",
                  }}
                >
                  <ArrowRight size={14} />
                  {isActive ? "Boutique active" : "Entrer"}
                </button>
                <button
                  onClick={() => {
                    switchStore(s.id);
                    navigate("/dashboard/settings");
                  }}
                  className="h-9 w-9 rounded-lg flex items-center justify-center transition-colors duration-200"
                  style={{
                    background: "hsl(var(--secondary))",
                    color: "hsl(var(--muted-foreground))",
                  }}
                >
                  <Settings size={14} />
                </button>
              </div>
            </motion.div>
          );
        })}

        {/* Add store card */}
        <motion.button
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: stores.length * 0.05, duration: 0.3 }}
          onClick={() => navigate("/dashboard/stores/new")}
          className="rounded-xl border-2 border-dashed p-5 flex flex-col items-center justify-center gap-3 min-h-[180px] transition-colors duration-200"
          style={{
            borderColor: "hsl(var(--border))",
            color: "hsl(var(--muted-foreground))",
          }}
        >
          <div
            className="h-12 w-12 rounded-xl flex items-center justify-center"
            style={{ background: "hsl(var(--secondary))" }}
          >
            <Plus size={20} />
          </div>
          <span className="text-sm font-medium">Nouvelle boutique</span>
        </motion.button>
      </div>
    </div>
  );
}
