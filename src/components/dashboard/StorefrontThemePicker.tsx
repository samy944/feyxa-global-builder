import { useState } from "react";
import { STOREFRONT_THEMES, type StorefrontTheme } from "@/lib/storefront-themes";
import { cn } from "@/lib/utils";
import { Check, Eye, Palette, Sparkles, ShoppingBag, Star, Search, Heart, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

interface ThemePickerProps {
  selectedThemeId: string;
  onSelect: (themeId: string) => void;
  storeSlug?: string;
}

/* ── Mini Storefront Preview inside each card ── */
function ThemeMiniPreview({ theme }: { theme: StorefrontTheme }) {
  const bg = theme.preview.bg;
  const card = theme.preview.card;
  const accent = theme.preview.accent;
  const text = theme.preview.text;

  return (
    <div className="w-full h-full overflow-hidden select-none pointer-events-none" style={{ backgroundColor: bg, fontFamily: "system-ui" }}>
      {/* Mini header */}
      <div
        className="flex items-center justify-between px-3 h-7"
        style={{
          backgroundColor: theme.style.headerStyle === "gradient" ? accent : card,
          borderBottom: `1px solid ${accent}18`,
        }}
      >
        <div className="flex items-center gap-1.5">
          <div className="h-3.5 w-3.5 rounded-sm" style={{ backgroundColor: accent }} />
          <div className="h-1.5 w-10 rounded-full" style={{ backgroundColor: theme.style.headerStyle === "gradient" ? bg + "90" : text + "40" }} />
        </div>
        <div className="flex gap-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-1.5 w-6 rounded-full" style={{ backgroundColor: theme.style.headerStyle === "gradient" ? bg + "50" : text + "20" }} />
          ))}
        </div>
        <div className="flex gap-1">
          <Search size={7} style={{ color: theme.style.headerStyle === "gradient" ? bg : text + "60" }} />
          <Heart size={7} style={{ color: theme.style.headerStyle === "gradient" ? bg : text + "60" }} />
        </div>
      </div>

      {/* Mini hero */}
      <div className="px-3 py-3" style={{ background: `linear-gradient(135deg, ${accent}12 0%, ${bg} 70%)` }}>
        <div className="h-2 w-16 rounded-full mb-1" style={{ backgroundColor: text + "60" }} />
        <div className="h-1.5 w-24 rounded-full mb-2" style={{ backgroundColor: text + "25" }} />
        <div
          className="h-4 w-14 rounded-sm flex items-center justify-center"
          style={{ backgroundColor: accent }}
        >
          <div className="h-1 w-8 rounded-full" style={{ backgroundColor: bg }} />
        </div>
      </div>

      {/* Mini product grid */}
      <div className="px-3 pb-2">
        <div className="h-1.5 w-12 rounded-full mb-1.5" style={{ backgroundColor: text + "35" }} />
        <div className="grid grid-cols-3 gap-1.5">
          {[1, 2, 3].map(i => (
            <div key={i} style={{ backgroundColor: card, border: `1px solid ${accent}10` }} className="rounded-sm overflow-hidden">
              <div
                className={theme.style.productImageRatio === "portrait" ? "aspect-[3/4]" : "aspect-square"}
                style={{ backgroundColor: accent + "10" }}
              >
                <div className="h-full w-full flex items-center justify-center">
                  <ShoppingBag size={8} style={{ color: accent + "40" }} />
                </div>
              </div>
              <div className="p-1 space-y-0.5">
                <div className="h-1 w-full rounded-full" style={{ backgroundColor: text + "20" }} />
                <div className="h-1 w-1/2 rounded-full" style={{ backgroundColor: accent + "50" }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mini testimonials row */}
      <div className="px-3 py-1.5" style={{ backgroundColor: card }}>
        <div className="flex gap-1">
          {[1, 2].map(i => (
            <div key={i} className="flex-1 rounded-sm p-1" style={{ border: `1px solid ${accent}10`, backgroundColor: bg }}>
              <div className="flex gap-0.5 mb-0.5">
                {[1, 2, 3, 4, 5].map(s => (
                  <Star key={s} size={4} fill={accent} style={{ color: accent }} />
                ))}
              </div>
              <div className="h-0.5 w-full rounded-full" style={{ backgroundColor: text + "15" }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Full preview in dialog ── */
function ThemeFullPreview({ theme }: { theme: StorefrontTheme }) {
  const { bg, card, accent, text } = theme.preview;
  return (
    <div className="w-full rounded-lg overflow-hidden" style={{ backgroundColor: bg, fontFamily: "system-ui" }}>
      {/* Full header */}
      <div
        className="flex items-center justify-between px-6 h-12"
        style={{
          backgroundColor: theme.style.headerStyle === "gradient" ? accent : card,
          borderBottom: `1px solid ${accent}20`,
        }}
      >
        <div className="flex items-center gap-3">
          <div className="h-6 w-6 rounded" style={{ backgroundColor: accent }} />
          <div className="h-2.5 w-20 rounded-full" style={{ backgroundColor: theme.style.headerStyle === "gradient" ? bg + "80" : text + "40" }} />
        </div>
        <div className="flex gap-4">
          {["Accueil", "Produits", "Promos", "Contact"].map(l => (
            <div key={l} className="h-2 w-10 rounded-full" style={{ backgroundColor: theme.style.headerStyle === "gradient" ? bg + "50" : text + "25" }} />
          ))}
        </div>
        <div className="flex gap-2">
          <div className="h-6 w-6 rounded-full" style={{ backgroundColor: accent + "20" }} />
          <div className="h-6 w-6 rounded-full" style={{ backgroundColor: accent + "20" }} />
        </div>
      </div>

      {/* Hero */}
      <div className="px-8 py-10 relative" style={{ background: `linear-gradient(135deg, ${accent}15 0%, ${bg} 80%)` }}>
        <div className="h-4 w-40 rounded-full mb-2" style={{ backgroundColor: text + "60" }} />
        <div className="h-3 w-64 rounded-full mb-1.5" style={{ backgroundColor: text + "25" }} />
        <div className="h-3 w-48 rounded-full mb-4" style={{ backgroundColor: text + "15" }} />
        <div className="h-8 w-28 rounded flex items-center justify-center gap-1" style={{ backgroundColor: accent }}>
          <div className="h-1.5 w-12 rounded-full" style={{ backgroundColor: bg }} />
          <ArrowRight size={10} style={{ color: bg }} />
        </div>
      </div>

      {/* Products */}
      <div className="px-8 py-6">
        <div className="h-3 w-28 rounded-full mb-4" style={{ backgroundColor: text + "40" }} />
        <div className="grid grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="rounded overflow-hidden" style={{ backgroundColor: card, border: `1px solid ${accent}12` }}>
              <div
                className={theme.style.productImageRatio === "portrait" ? "aspect-[3/4]" : "aspect-square"}
                style={{ backgroundColor: accent + "08" }}
              >
                <div className="h-full flex items-center justify-center">
                  <ShoppingBag size={18} style={{ color: accent + "30" }} />
                </div>
              </div>
              <div className="p-2.5 space-y-1.5">
                <div className="h-2 w-full rounded-full" style={{ backgroundColor: text + "20" }} />
                <div className="h-2 w-3/4 rounded-full" style={{ backgroundColor: text + "12" }} />
                <div className="h-2.5 w-12 rounded-full" style={{ backgroundColor: accent + "50" }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="px-8 py-4 border-t" style={{ backgroundColor: card, borderColor: accent + "15" }}>
        <div className="flex justify-between">
          <div className="h-2 w-20 rounded-full" style={{ backgroundColor: text + "20" }} />
          <div className="h-2 w-16 rounded-full" style={{ backgroundColor: text + "15" }} />
        </div>
      </div>
    </div>
  );
}

/* ── Tag badges for theme features ── */
const THEME_TAGS: Record<string, { label: string; color: string }[]> = {
  classic: [{ label: "Polyvalent", color: "blue" }],
  luxe: [{ label: "Premium", color: "amber" }, { label: "Dark", color: "slate" }],
  fresh: [{ label: "Bio", color: "green" }],
  sunset: [{ label: "Warm", color: "orange" }],
  minimal: [{ label: "Clean", color: "gray" }],
  afro: [{ label: "Nouveau", color: "yellow" }, { label: "Bold", color: "purple" }],
  ocean: [{ label: "Tech", color: "cyan" }],
  rose: [{ label: "Féminin", color: "pink" }],
  tech: [{ label: "Fintech", color: "indigo" }, { label: "Dark", color: "slate" }],
  fashion: [{ label: "Visuel", color: "amber" }, { label: "Masonry", color: "rose" }],
  marketplace: [{ label: "Dense", color: "yellow" }, { label: "Pro", color: "blue" }],
};

export function StorefrontThemePicker({ selectedThemeId, onSelect, storeSlug }: ThemePickerProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [previewTheme, setPreviewTheme] = useState<StorefrontTheme | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Palette size={20} className="text-primary" />
            Thèmes de boutique
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Choisissez un design pour votre vitrine. Survolez pour un aperçu.
          </p>
        </div>
        {storeSlug && (
          <Button variant="outline" size="sm" asChild>
            <a href={`/store/${storeSlug}`} target="_blank" rel="noopener noreferrer">
              <Eye size={14} className="mr-1" />
              Voir ma boutique
            </a>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {STOREFRONT_THEMES.map((theme) => {
          const isSelected = selectedThemeId === theme.id;
          const isHovered = hoveredId === theme.id;
          const tags = THEME_TAGS[theme.id] || [];

          return (
            <motion.div
              key={theme.id}
              layout
              onMouseEnter={() => setHoveredId(theme.id)}
              onMouseLeave={() => setHoveredId(null)}
              className={cn(
                "relative rounded-xl border-2 overflow-hidden cursor-pointer transition-all duration-300 group",
                isSelected
                  ? "border-primary ring-2 ring-primary/30 shadow-lg shadow-primary/10"
                  : "border-border hover:border-primary/50 hover:shadow-xl"
              )}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelect(theme.id)}
            >
              {/* ─ Visual Preview ─ */}
              <div className="h-44 relative overflow-hidden">
                <ThemeMiniPreview theme={theme} />

                {/* Hover overlay with full preview button */}
                <AnimatePresence>
                  {isHovered && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center"
                    >
                      <Button
                        size="sm"
                        variant="secondary"
                        className="text-xs shadow-lg"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewTheme(theme);
                        }}
                      >
                        <Eye size={13} className="mr-1" />
                        Aperçu complet
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Selected checkmark */}
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-2 right-2 h-6 w-6 rounded-full bg-primary flex items-center justify-center shadow-lg"
                  >
                    <Check size={14} className="text-primary-foreground" />
                  </motion.div>
                )}
              </div>

              {/* ─ Theme Info ─ */}
              <div className="p-3.5 bg-card border-t border-border">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm text-foreground">{theme.name}</span>
                  {tags.map((tag, i) => (
                    <span
                      key={i}
                      className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium"
                    >
                      {tag.label}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-1">{theme.description}</p>

                {/* Color palette + typography */}
                <div className="flex items-center justify-between mt-2.5">
                  <div className="flex gap-1">
                    {[theme.preview.bg, theme.preview.accent, theme.preview.card, theme.preview.text].map((color, i) => (
                      <div
                        key={i}
                        className="h-4 w-4 rounded-full border border-border shadow-sm"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                  <span className="text-[10px] text-muted-foreground font-medium">
                    {theme.fonts.heading}
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ─ Full Preview Dialog ─ */}
      <Dialog open={!!previewTheme} onOpenChange={(open) => !open && setPreviewTheme(null)}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden">
          <DialogTitle className="sr-only">Aperçu du thème {previewTheme?.name}</DialogTitle>
          {previewTheme && (
            <div>
              <div className="p-4 border-b border-border flex items-center justify-between bg-card">
                <div>
                  <h3 className="font-semibold text-foreground">{previewTheme.name}</h3>
                  <p className="text-xs text-muted-foreground">{previewTheme.description}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      onSelect(previewTheme.id);
                      setPreviewTheme(null);
                    }}
                  >
                    <Check size={14} className="mr-1" />
                    Appliquer ce thème
                  </Button>
                </div>
              </div>
              <div className="p-4 bg-muted/30">
                <ThemeFullPreview theme={previewTheme} />
              </div>
              <div className="p-4 border-t border-border bg-card">
                <div className="flex items-center gap-6 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">Couleurs :</span>
                    {[previewTheme.preview.bg, previewTheme.preview.accent, previewTheme.preview.card, previewTheme.preview.text].map((c, i) => (
                      <div key={i} className="h-5 w-5 rounded-full border border-border" style={{ backgroundColor: c }} />
                    ))}
                  </div>
                  <div>
                    <span className="font-medium text-foreground">Titre :</span> {previewTheme.fonts.heading}
                  </div>
                  <div>
                    <span className="font-medium text-foreground">Corps :</span> {previewTheme.fonts.body}
                  </div>
                  <div>
                    <span className="font-medium text-foreground">Layout :</span> {previewTheme.layout}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
