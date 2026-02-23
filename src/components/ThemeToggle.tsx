import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, setTheme } = useTheme();

  const options = [
    { value: "light" as const, icon: Sun, label: "Clair" },
    { value: "dark" as const, icon: Moon, label: "Sombre" },
    { value: "system" as const, icon: Monitor, label: "Système" },
  ];

  return (
    <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => setTheme(opt.value)}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all",
            theme === opt.value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
          title={opt.label}
        >
          <opt.icon size={14} />
          {!compact && <span>{opt.label}</span>}
        </button>
      ))}
    </div>
  );
}
