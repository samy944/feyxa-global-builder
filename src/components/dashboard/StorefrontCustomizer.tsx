import { useState, useMemo, useEffect, useCallback } from "react";
import {
  STOREFRONT_TEMPLATES,
  getTemplateById,
  getDefaultSectionsConfig,
  type SFSectionConfig,
} from "@/lib/storefront-templates";
import {
  STOREFRONT_THEMES,
  getThemeById,
  getThemeCSSVars,
  type StorefrontTheme,
} from "@/lib/storefront-themes";
import { StorefrontRenderer } from "@/components/storefront/StorefrontRenderer";
import type { StoreData, ProductData } from "@/components/storefront/types";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Eye,
  GripVertical,
  Layout,
  Loader2,
  Monitor,
  Palette,
  Save,
  Smartphone,
  Sparkles,
  Undo2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface Props {
  store: StoreData;
  products: ProductData[];
  initialTemplateId: string;
  initialThemeId: string;
  initialSections: SFSectionConfig[];
  initialColorOverrides: Partial<StorefrontTheme["colors"]> | null;
  onSave: (config: {
    templateId: string;
    themeId: string;
    sections: SFSectionConfig[];
    colorOverrides: Partial<StorefrontTheme["colors"]> | null;
  }) => void;
  saving: boolean;
}

const COLOR_FIELDS: { key: keyof StorefrontTheme["colors"]; label: string }[] = [
  { key: "primary", label: "Primaire" },
  { key: "background", label: "Fond" },
  { key: "foreground", label: "Texte" },
  { key: "card", label: "Carte" },
  { key: "accent", label: "Accent" },
  { key: "border", label: "Bordure" },
  { key: "muted", label: "Sourdine" },
];

function hslToHex(hsl: string): string {
  const parts = hsl.split(" ").map((p) => parseFloat(p));
  if (parts.length < 3) return "#888888";
  const [h, s, l] = [parts[0], parts[1] / 100, parts[2] / 100];
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function hexToHsl(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) * 60; break;
      case g: h = ((b - r) / d + 2) * 60; break;
      case b: h = ((r - g) / d + 4) * 60; break;
    }
  }
  return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export function StorefrontCustomizer({
  store,
  products,
  initialTemplateId,
  initialThemeId,
  initialSections,
  initialColorOverrides,
  onSave,
  saving,
}: Props) {
  const [templateId, setTemplateId] = useState(initialTemplateId);
  const [themeId, setThemeId] = useState(initialThemeId);
  const [sections, setSections] = useState<SFSectionConfig[]>(initialSections);
  const [colorOverrides, setColorOverrides] = useState<Partial<StorefrontTheme["colors"]> | null>(initialColorOverrides);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");

  const template = useMemo(() => getTemplateById(templateId), [templateId]);
  const baseTheme = useMemo(() => getThemeById(themeId), [themeId]);

  // Merged theme with color overrides
  const mergedTheme: StorefrontTheme = useMemo(() => {
    if (!colorOverrides || Object.keys(colorOverrides).length === 0) return baseTheme;
    return {
      ...baseTheme,
      colors: { ...baseTheme.colors, ...colorOverrides },
    };
  }, [baseTheme, colorOverrides]);

  const cssVars = useMemo(() => getThemeCSSVars(mergedTheme), [mergedTheme]);

  const isDirty =
    templateId !== initialTemplateId ||
    themeId !== initialThemeId ||
    JSON.stringify(sections) !== JSON.stringify(initialSections) ||
    JSON.stringify(colorOverrides) !== JSON.stringify(initialColorOverrides);

  const handleTemplateChange = (id: string) => {
    setTemplateId(id);
    const t = getTemplateById(id);
    setSections(getDefaultSectionsConfig(t));
    setThemeId(t.defaultThemeId);
    setColorOverrides(null);
  };

  const toggleSection = (idx: number) => {
    const s = template.sections.find((ts) => ts.type === sections[idx].type);
    if (s?.required) return;
    setSections((prev) =>
      prev.map((sec, i) => (i === idx ? { ...sec, visible: !sec.visible } : sec))
    );
  };

  const moveSection = (idx: number, dir: -1 | 1) => {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= sections.length) return;
    const s = template.sections.find((ts) => ts.type === sections[idx].type);
    const t = template.sections.find((ts) => ts.type === sections[newIdx].type);
    if (s?.required || t?.required) return;
    setSections((prev) => {
      const arr = [...prev];
      [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
      return arr;
    });
  };

  const handleColorChange = (key: keyof StorefrontTheme["colors"], hex: string) => {
    const hsl = hexToHsl(hex);
    setColorOverrides((prev) => ({ ...(prev || {}), [key]: hsl }));
  };

  const resetColors = () => setColorOverrides(null);

  const formatPrice = useCallback(
    (price: number) =>
      new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: store.currency || "XOF",
        maximumFractionDigits: 0,
      }).format(price),
    [store.currency]
  );

  // Load Google Fonts for preview
  useEffect(() => {
    const fonts = [mergedTheme.fonts.heading, mergedTheme.fonts.body].filter(
      (f, i, arr) => arr.indexOf(f) === i
    );
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?${fonts
      .map((f) => `family=${f.replace(/ /g, "+")}:wght@400;500;600;700`)
      .join("&")}&display=swap`;
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, [mergedTheme]);

  const previewStyle: React.CSSProperties = {
    ...(cssVars as React.CSSProperties),
    backgroundColor: `hsl(${mergedTheme.colors.background})`,
    color: `hsl(${mergedTheme.colors.foreground})`,
    fontFamily: `"${mergedTheme.fonts.body}", system-ui, sans-serif`,
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* ── Sidebar ── */}
      <aside className="w-[320px] shrink-0 border-r border-border bg-card overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-primary" />
            <span className="text-sm font-semibold text-foreground">Éditeur de vitrine</span>
          </div>
          <div className="flex gap-1.5">
            <Button
              size="sm"
              variant="ghost"
              disabled={!isDirty}
              onClick={() => {
                setTemplateId(initialTemplateId);
                setThemeId(initialThemeId);
                setSections(initialSections);
                setColorOverrides(initialColorOverrides);
              }}
              className="h-7 text-xs"
            >
              <Undo2 size={12} className="mr-1" /> Annuler
            </Button>
            <Button
              size="sm"
              disabled={!isDirty || saving}
              onClick={() => onSave({ templateId, themeId, sections, colorOverrides })}
              className="h-7 text-xs"
            >
              {saving ? <Loader2 size={12} className="mr-1 animate-spin" /> : <Save size={12} className="mr-1" />}
              Sauvegarder
            </Button>
          </div>
        </div>

        <Accordion type="multiple" defaultValue={["template", "theme", "sections"]} className="px-3 py-2">
          {/* ─── Template ─── */}
          <AccordionItem value="template">
            <AccordionTrigger className="text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:no-underline py-2">
              <div className="flex items-center gap-1.5"><Layout size={13} /> Modèle</div>
            </AccordionTrigger>
            <AccordionContent className="pb-3">
              <div className="grid grid-cols-2 gap-2">
                {STOREFRONT_TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleTemplateChange(t.id)}
                    className={cn(
                      "relative rounded-lg border p-2.5 text-left transition-all text-[11px]",
                      templateId === t.id
                        ? "border-primary ring-1 ring-primary/20 bg-primary/5"
                        : "border-border hover:border-primary/40"
                    )}
                  >
                    {templateId === t.id && (
                      <div className="absolute top-1.5 right-1.5 h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                        <Check size={10} className="text-primary-foreground" />
                      </div>
                    )}
                    <span className="text-sm">{t.icon}</span>
                    <p className="font-medium text-foreground mt-0.5">{t.name}</p>
                    <p className="text-muted-foreground line-clamp-1 mt-0.5">{t.description}</p>
                  </button>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* ─── Theme / Colors ─── */}
          <AccordionItem value="theme">
            <AccordionTrigger className="text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:no-underline py-2">
              <div className="flex items-center gap-1.5"><Palette size={13} /> Thème & Couleurs</div>
            </AccordionTrigger>
            <AccordionContent className="pb-3 space-y-4">
              {/* Theme presets */}
              <div>
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-2">
                  Presets
                </p>
                <div className="grid grid-cols-3 gap-1.5">
                  {STOREFRONT_THEMES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setThemeId(t.id);
                        setColorOverrides(null);
                      }}
                      className={cn(
                        "rounded-md border p-1.5 text-center transition-all",
                        themeId === t.id
                          ? "border-primary ring-1 ring-primary/20"
                          : "border-border hover:border-primary/40"
                      )}
                    >
                      <div className="flex gap-0.5 justify-center mb-1">
                        {[t.preview.bg, t.preview.accent, t.preview.text].map((c, i) => (
                          <div
                            key={i}
                            className="h-3 w-3 rounded-full border border-border/50"
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                      <p className="text-[9px] font-medium text-foreground truncate">{t.name}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Color overrides */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                    Personnaliser
                  </p>
                  {colorOverrides && Object.keys(colorOverrides).length > 0 && (
                    <button
                      onClick={resetColors}
                      className="text-[10px] text-primary hover:underline"
                    >
                      Réinitialiser
                    </button>
                  )}
                </div>
                <div className="space-y-1.5">
                  {COLOR_FIELDS.map(({ key, label }) => {
                    const currentHsl = mergedTheme.colors[key];
                    const hex = hslToHex(currentHsl);
                    return (
                      <div key={key} className="flex items-center gap-2">
                        <label className="text-[11px] text-foreground w-16 shrink-0">{label}</label>
                        <div className="relative">
                          <input
                            type="color"
                            value={hex}
                            onChange={(e) => handleColorChange(key, e.target.value)}
                            className="h-7 w-7 rounded-md border border-border cursor-pointer appearance-none bg-transparent p-0"
                            style={{ colorScheme: "auto" }}
                          />
                        </div>
                        <span className="text-[9px] text-muted-foreground font-mono flex-1 truncate">
                          {currentHsl}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* ─── Sections ─── */}
          <AccordionItem value="sections">
            <AccordionTrigger className="text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:no-underline py-2">
              <div className="flex items-center gap-1.5"><GripVertical size={13} /> Sections</div>
            </AccordionTrigger>
            <AccordionContent className="pb-3">
              <div className="space-y-1">
                {sections.map((sec, idx) => {
                  const def = template.sections.find((ts) => ts.type === sec.type);
                  return (
                    <div
                      key={sec.type}
                      className={cn(
                        "flex items-center gap-2 p-2 rounded-lg border transition-colors",
                        sec.visible
                          ? "bg-card border-border"
                          : "bg-muted/40 border-transparent opacity-60"
                      )}
                    >
                      <GripVertical
                        size={12}
                        className="text-muted-foreground shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-[11px] font-medium text-foreground">
                          {def?.label || sec.type}
                        </span>
                        {def?.required && (
                          <span className="text-[9px] text-muted-foreground ml-1">
                            (requis)
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-0.5">
                        <button
                          onClick={() => moveSection(idx, -1)}
                          disabled={idx === 0 || def?.required}
                          className="h-5 w-5 rounded flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-20"
                        >
                          <ChevronUp size={12} />
                        </button>
                        <button
                          onClick={() => moveSection(idx, 1)}
                          disabled={idx === sections.length - 1 || def?.required}
                          className="h-5 w-5 rounded flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-20"
                        >
                          <ChevronDown size={12} />
                        </button>
                        <Switch
                          checked={sec.visible}
                          onCheckedChange={() => toggleSection(idx)}
                          disabled={def?.required}
                          className="scale-[0.65] ml-1"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </aside>

      {/* ── Preview ── */}
      <div className="flex-1 flex flex-col bg-muted/30 overflow-hidden">
        {/* Preview toolbar */}
        <div className="h-10 shrink-0 border-b border-border bg-card flex items-center justify-between px-4">
          <div className="flex items-center gap-1 bg-muted rounded-md p-0.5">
            <button
              onClick={() => setPreviewMode("desktop")}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium transition-colors",
                previewMode === "desktop"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Monitor size={12} /> Desktop
            </button>
            <button
              onClick={() => setPreviewMode("mobile")}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium transition-colors",
                previewMode === "mobile"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Smartphone size={12} /> Mobile
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground">
              {mergedTheme.name} · {template.name}
            </span>
            {store.slug && (
              <Button variant="outline" size="sm" className="h-6 text-[10px]" asChild>
                <a
                  href={`/store/${store.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Eye size={10} className="mr-1" /> Voir en ligne
                </a>
              </Button>
            )}
          </div>
        </div>

        {/* Preview area */}
        <div className="flex-1 overflow-y-auto flex justify-center py-6 px-4">
          <motion.div
            layout
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className={cn(
              "relative rounded-xl overflow-hidden shadow-2xl border border-border/50",
              previewMode === "mobile" ? "w-[390px]" : "w-full max-w-[1280px]"
            )}
            style={{ minHeight: 600 }}
          >
            {/* Device chrome */}
            {previewMode === "mobile" && (
              <div className="h-6 bg-black/90 flex items-center justify-center">
                <div className="h-1.5 w-16 rounded-full bg-white/20" />
              </div>
            )}
            {previewMode === "desktop" && (
              <div className="h-7 bg-muted border-b border-border flex items-center px-3 gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
                <div className="h-2.5 w-2.5 rounded-full bg-yellow-400/70" />
                <div className="h-2.5 w-2.5 rounded-full bg-green-400/70" />
                <div className="flex-1 flex justify-center">
                  <div className="h-4 w-48 rounded bg-background border border-border flex items-center justify-center">
                    <span className="text-[8px] text-muted-foreground truncate">
                      {store.slug ? `feyxa.shop/store/${store.slug}` : "feyxa.shop/store/..."}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Rendered storefront */}
            <div style={previewStyle}>
              <StorefrontRenderer
                templateId={templateId}
                store={store}
                products={products}
                theme={mergedTheme}
                formatPrice={formatPrice}
                sectionsConfig={sections}
              />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
