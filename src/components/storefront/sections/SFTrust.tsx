import { Truck, Shield, Clock, Package } from "lucide-react";
import type { SFSectionProps } from "../types";

const BADGES = [
  { icon: <Truck size={16} />, label: "Livraison rapide" },
  { icon: <Shield size={16} />, label: "Paiement sécurisé" },
  { icon: <Clock size={16} />, label: "Support 24/7" },
  { icon: <Package size={16} />, label: "Retours faciles" },
];

export function SFTrust({ templateId, theme }: SFSectionProps) {
  if (templateId === "minimal") {
    return (
      <section className="container py-8">
        <div className="flex flex-wrap justify-center gap-10">
          {BADGES.map((b, i) => (
            <div key={i} className="flex items-center gap-2 text-xs" style={{ color: `hsl(${theme.colors.mutedForeground})` }}>
              <span style={{ color: `hsl(${theme.colors.foreground})` }}>{b.icon}</span>
              {b.label}
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="border-b" style={{ backgroundColor: `hsl(${theme.colors.card})`, borderColor: `hsl(${theme.colors.border})` }}>
      <div className="container py-4 flex flex-wrap justify-center gap-6 sm:gap-10">
        {BADGES.map((b, i) => (
          <div key={i} className="flex items-center gap-2 text-sm" style={{ color: `hsl(${theme.colors.mutedForeground})` }}>
            <span style={{ color: `hsl(${theme.colors.primary})` }}>{b.icon}</span>
            {b.label}
          </div>
        ))}
      </div>
    </section>
  );
}
