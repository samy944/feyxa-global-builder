import { Link } from "react-router-dom";
import { ArrowRight, LucideIcon } from "lucide-react";

interface MarketSectionHeaderProps {
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  title: string;
  linkTo?: string;
  linkLabel?: string;
}

export function MarketSectionHeader({
  icon: Icon,
  iconColor = "hsl(var(--primary))",
  iconBg = "rgba(71,210,30,0.1)",
  title,
  linkTo,
  linkLabel = "Voir tout",
}: MarketSectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg flex items-center justify-center" style={{ background: iconBg }}>
          <Icon size={16} style={{ color: iconColor }} />
        </div>
        <h2 className="text-lg md:text-xl font-semibold" style={{ color: "#FFFFFF", letterSpacing: "-0.01em" }}>
          {title}
        </h2>
      </div>
      {linkTo && (
        <Link
          to={linkTo}
          className="text-xs font-medium flex items-center gap-1 transition-colors duration-200 hover:opacity-80"
          style={{ color: "hsl(var(--primary))" }}
        >
          {linkLabel} <ArrowRight size={12} />
        </Link>
      )}
    </div>
  );
}
