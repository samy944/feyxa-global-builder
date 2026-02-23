import { useState } from "react";
import { STOREFRONT_THEMES, type StorefrontTheme } from "@/lib/storefront-themes";
import { cn } from "@/lib/utils";
import { Check, Eye, Palette, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

interface ThemePickerProps {
  selectedThemeId: string;
  onSelect: (themeId: string) => void;
  storeSlug?: string;
}

export function StorefrontThemePicker({ selectedThemeId, onSelect, storeSlug }: ThemePickerProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Palette size={20} />
          Thèmes de boutique
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Choisissez un design prédéfini pour votre vitrine. Le thème s'applique instantanément à votre boutique publique.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {STOREFRONT_THEMES.map((theme) => {
          const isSelected = selectedThemeId === theme.id;
          return (
            <motion.button
              key={theme.id}
              onClick={() => onSelect(theme.id)}
              onMouseEnter={() => setHoveredId(theme.id)}
              onMouseLeave={() => setHoveredId(null)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "relative rounded-xl border-2 p-0 overflow-hidden text-left transition-all duration-200",
                isSelected
                  ? "border-primary ring-2 ring-primary/20"
                  : "border-border hover:border-primary/40"
              )}
            >
              {/* Theme preview mini */}
              <div className="h-28 relative" style={{ backgroundColor: theme.preview.bg }}>
                {/* Mini header bar */}
                <div
                  className="h-8 flex items-center px-3 gap-2"
                  style={{ backgroundColor: theme.preview.card, borderBottom: `1px solid ${theme.preview.accent}20` }}
                >
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: theme.preview.accent }} />
                  <div className="h-2 w-16 rounded" style={{ backgroundColor: theme.preview.text + "30" }} />
                  <div className="ml-auto flex gap-1">
                    <div className="h-2 w-8 rounded" style={{ backgroundColor: theme.preview.text + "20" }} />
                    <div className="h-2 w-8 rounded" style={{ backgroundColor: theme.preview.text + "20" }} />
                  </div>
                </div>
                {/* Mini product cards */}
                <div className="flex gap-2 p-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex-1 rounded" style={{ backgroundColor: theme.preview.card }}>
                      <div className="aspect-square rounded-t" style={{ backgroundColor: theme.preview.accent + "15" }} />
                      <div className="p-1.5 space-y-1">
                        <div className="h-1.5 w-3/4 rounded" style={{ backgroundColor: theme.preview.text + "30" }} />
                        <div className="h-1.5 w-1/2 rounded" style={{ backgroundColor: theme.preview.accent + "60" }} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Selected indicator */}
                {isSelected && (
                  <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                    <Check size={14} className="text-primary-foreground" />
                  </div>
                )}
              </div>

              {/* Theme info */}
              <div className="p-3 bg-card border-t border-border">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-foreground">{theme.name}</span>
                  {theme.id === "afro" && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium flex items-center gap-0.5">
                      <Sparkles size={10} /> Nouveau
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{theme.description}</p>
                {/* Color swatches */}
                <div className="flex gap-1 mt-2">
                  {[theme.preview.bg, theme.preview.accent, theme.preview.card, theme.preview.text].map((color, i) => (
                    <div
                      key={i}
                      className="h-4 w-4 rounded-full border border-border"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {storeSlug && (
        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" asChild>
            <a href={`/store/${storeSlug}`} target="_blank" rel="noopener noreferrer">
              <Eye size={14} className="mr-1" />
              Voir ma boutique
            </a>
          </Button>
        </div>
      )}
    </div>
  );
}
