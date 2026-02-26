import { motion } from "framer-motion";
import { Truck, Shield, Clock, Package, RefreshCw, Headphones } from "lucide-react";
import type { SFSectionProps } from "../types";

const BADGES = [
  { icon: <Truck size={18} />, label: "Livraison rapide", desc: "Partout au pays" },
  { icon: <Shield size={18} />, label: "Paiement sécurisé", desc: "100% protégé" },
  { icon: <RefreshCw size={18} />, label: "Retours faciles", desc: "Satisfait ou remboursé" },
  { icon: <Headphones size={18} />, label: "Support réactif", desc: "Réponse sous 24h" },
];

export function SFTrust({ templateId, theme }: SFSectionProps) {
  if (templateId === "minimal") {
    return (
      <section className="container py-10">
        <div className="flex flex-wrap justify-center gap-12">
          {BADGES.map((b, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="flex items-center gap-3">
              <span style={{ color: `hsl(${theme.colors.foreground})` }}>{b.icon}</span>
              <div>
                <p className="text-xs font-medium" style={{ color: `hsl(${theme.colors.foreground})` }}>{b.label}</p>
                <p className="text-[10px]" style={{ color: `hsl(${theme.colors.mutedForeground})` }}>{b.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    );
  }

  if (templateId === "tech") {
    return (
      <section className="border-y" style={{ borderColor: `hsl(${theme.colors.border})` }}>
        <div className="container py-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {BADGES.map((b, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: `hsl(${theme.colors.primary} / 0.05)` }}>
              <div className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `hsl(${theme.colors.primary} / 0.1)`, color: `hsl(${theme.colors.primary})` }}>{b.icon}</div>
              <div>
                <p className="text-xs font-semibold" style={{ color: `hsl(${theme.colors.foreground})` }}>{b.label}</p>
                <p className="text-[10px]" style={{ color: `hsl(${theme.colors.mutedForeground})` }}>{b.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    );
  }

  if (templateId === "fashion") {
    return (
      <section className="border-y" style={{ borderColor: `hsl(${theme.colors.border} / 0.5)` }}>
        <div className="container py-5 flex flex-wrap justify-center gap-8 sm:gap-14">
          {BADGES.map((b, i) => (
            <div key={i} className="flex items-center gap-2 text-[11px] uppercase tracking-widest" style={{ color: `hsl(${theme.colors.mutedForeground})` }}>
              <span style={{ color: `hsl(${theme.colors.foreground})` }}>{b.icon}</span>
              {b.label}
            </div>
          ))}
        </div>
      </section>
    );
  }

  // marketplace / default
  return (
    <section className="border-b" style={{ backgroundColor: `hsl(${theme.colors.card})`, borderColor: `hsl(${theme.colors.border})` }}>
      <div className="container py-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
        {BADGES.map((b, i) => (
          <div key={i} className="flex items-center gap-2.5">
            <span style={{ color: `hsl(${theme.colors.primary})` }}>{b.icon}</span>
            <div>
              <p className="text-xs font-semibold" style={{ color: `hsl(${theme.colors.foreground})` }}>{b.label}</p>
              <p className="text-[10px]" style={{ color: `hsl(${theme.colors.mutedForeground})` }}>{b.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
