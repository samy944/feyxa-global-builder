import { useState, useMemo, useEffect, useCallback } from "react";
import {
  STOREFRONT_TEMPLATES,
  getTemplateById,
  getDefaultSectionsConfig,
  type SFSectionConfig,
  type SFSectionType,
} from "@/lib/storefront-templates";
import {
  STOREFRONT_THEMES,
  getThemeById,
  getThemeCSSVars,
  type StorefrontTheme,
} from "@/lib/storefront-themes";
import { SECTION_SETTINGS_SCHEMA, getDefaultSettings } from "@/lib/storefront-section-settings";
import { StorefrontRenderer } from "@/components/storefront/StorefrontRenderer";
import type { StoreData, ProductData } from "@/components/storefront/types";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Check,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  Eye,
  EyeOff,
  GripVertical,
  Layout,
  Loader2,
  Monitor,
  Palette,
  Save,
  Settings2,
  Smartphone,
  Sparkles,
  Undo2,
  X,
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
  const [editingSection, setEditingSection] = useState<number | null>(null);
  const [sidebarTab, setSidebarTab] = useState<"sections" | "global">("sections");

  const template = useMemo(() => getTemplateById(templateId), [templateId]);
  const baseTheme = useMemo(() => getThemeById(themeId), [themeId]);

  const mergedTheme: StorefrontTheme = useMemo(() => {
    if (!colorOverrides || Object.keys(colorOverrides).length === 0) return baseTheme;
    return { ...baseTheme, colors: { ...baseTheme.colors, ...colorOverrides } };
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
    setEditingSection(null);
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
    if (editingSection === idx) setEditingSection(newIdx);
    else if (editingSection === newIdx) setEditingSection(idx);
  };

  const handleColorChange = (key: keyof StorefrontTheme["colors"], hex: string) => {
    const hsl = hexToHsl(hex);
    setColorOverrides((prev) => ({ ...(prev || {}), [key]: hsl }));
  };

  const resetColors = () => setColorOverrides(null);

  const updateSectionSetting = (idx: number, key: string, value: any) => {
    setSections((prev) =>
      prev.map((sec, i) =>
        i === idx
          ? { ...sec, settings: { ...(sec.settings || {}), [key]: value } }
          : sec
      )
    );
  };

  const formatPrice = useCallback(
    (price: number) =>
      new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: store.currency || "XOF",
        maximumFractionDigits: 0,
      }).format(price),
    [store.currency]
  );

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
    return () => { document.head.removeChild(link); };
  }, [mergedTheme]);

  const previewStyle: React.CSSProperties = {
    ...(cssVars as React.CSSProperties),
    backgroundColor: `hsl(${mergedTheme.colors.background})`,
    color: `hsl(${mergedTheme.colors.foreground})`,
    fontFamily: `"${mergedTheme.fonts.body}", system-ui, sans-serif`,
  };

  const editingSec = editingSection !== null ? sections[editingSection] : null;
  const editingSchema = editingSec ? SECTION_SETTINGS_SCHEMA[editingSec.type] : null;
  const editingDef = editingSec ? template.sections.find((ts) => ts.type === editingSec.type) : null;

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* ── Panel 1: Section List / Global Settings ── */}
      <aside className="w-[280px] shrink-0 border-r border-border bg-card overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-card border-b border-border px-3 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Sparkles size={14} className="text-primary" />
            <span className="text-xs font-semibold text-foreground">Éditeur de vitrine</span>
          </div>
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" disabled={!isDirty} onClick={() => {
              setTemplateId(initialTemplateId);
              setThemeId(initialThemeId);
              setSections(initialSections);
              setColorOverrides(initialColorOverrides);
              setEditingSection(null);
            }} className="h-6 text-[10px] px-2">
              <Undo2 size={10} className="mr-0.5" /> Annuler
            </Button>
            <Button size="sm" disabled={!isDirty || saving} onClick={() => onSave({ templateId, themeId, sections, colorOverrides })} className="h-6 text-[10px] px-2">
              {saving ? <Loader2 size={10} className="mr-0.5 animate-spin" /> : <Save size={10} className="mr-0.5" />}
              Sauver
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          <button onClick={() => { setSidebarTab("sections"); setEditingSection(null); }} className={cn("flex-1 py-2 text-[10px] font-semibold uppercase tracking-wider transition-colors", sidebarTab === "sections" ? "text-primary border-b-2 border-primary" : "text-muted-foreground")}>
            <GripVertical size={11} className="inline mr-1" /> Sections
          </button>
          <button onClick={() => { setSidebarTab("global"); setEditingSection(null); }} className={cn("flex-1 py-2 text-[10px] font-semibold uppercase tracking-wider transition-colors", sidebarTab === "global" ? "text-primary border-b-2 border-primary" : "text-muted-foreground")}>
            <Palette size={11} className="inline mr-1" /> Apparence
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2.5 py-2">
          {sidebarTab === "sections" && (
            <div className="space-y-1">
              {sections.map((sec, idx) => {
                const def = template.sections.find((ts) => ts.type === sec.type);
                const isEditing = editingSection === idx;
                return (
                  <div
                    key={`${sec.type}-${idx}`}
                    onClick={() => setEditingSection(isEditing ? null : idx)}
                    className={cn(
                      "flex items-center gap-1.5 p-2 rounded-lg border transition-all cursor-pointer",
                      isEditing
                        ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                        : sec.visible
                          ? "bg-card border-border hover:border-primary/30"
                          : "bg-muted/40 border-transparent opacity-50"
                    )}
                  >
                    <GripVertical size={11} className="text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-[11px] font-medium text-foreground">{def?.label || sec.type}</span>
                      {def?.required && <span className="text-[8px] text-muted-foreground ml-1">(requis)</span>}
                    </div>
                    <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => moveSection(idx, -1)} disabled={idx === 0 || def?.required} className="h-5 w-5 rounded flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-20">
                        <ChevronUp size={10} />
                      </button>
                      <button onClick={() => moveSection(idx, 1)} disabled={idx === sections.length - 1 || def?.required} className="h-5 w-5 rounded flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-20">
                        <ChevronDown size={10} />
                      </button>
                      <button onClick={() => toggleSection(idx)} disabled={def?.required} className="h-5 w-5 rounded flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-20">
                        {sec.visible ? <Eye size={10} /> : <EyeOff size={10} />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {sidebarTab === "global" && (
            <Accordion type="multiple" defaultValue={["template", "theme"]} className="space-y-0">
              {/* Template */}
              <AccordionItem value="template" className="border-none">
                <AccordionTrigger className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground hover:no-underline py-1.5">
                  <div className="flex items-center gap-1"><Layout size={11} /> Modèle</div>
                </AccordionTrigger>
                <AccordionContent className="pb-2">
                  <div className="grid grid-cols-2 gap-1.5">
                    {STOREFRONT_TEMPLATES.map((t) => (
                      <button key={t.id} onClick={() => handleTemplateChange(t.id)} className={cn(
                        "relative rounded-md border p-2 text-left transition-all text-[10px]",
                        templateId === t.id ? "border-primary ring-1 ring-primary/20 bg-primary/5" : "border-border hover:border-primary/40"
                      )}>
                        {templateId === t.id && <div className="absolute top-1 right-1 h-3.5 w-3.5 rounded-full bg-primary flex items-center justify-center"><Check size={8} className="text-primary-foreground" /></div>}
                        <span className="text-sm">{t.icon}</span>
                        <p className="font-medium text-foreground mt-0.5">{t.name}</p>
                      </button>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Theme */}
              <AccordionItem value="theme" className="border-none">
                <AccordionTrigger className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground hover:no-underline py-1.5">
                  <div className="flex items-center gap-1"><Palette size={11} /> Thème</div>
                </AccordionTrigger>
                <AccordionContent className="pb-2 space-y-3">
                  <div className="grid grid-cols-3 gap-1">
                    {STOREFRONT_THEMES.map((t) => (
                      <button key={t.id} onClick={() => { setThemeId(t.id); setColorOverrides(null); }} className={cn(
                        "rounded-md border p-1 text-center transition-all",
                        themeId === t.id ? "border-primary ring-1 ring-primary/20" : "border-border hover:border-primary/40"
                      )}>
                        <div className="flex gap-0.5 justify-center mb-0.5">
                          {[t.preview.bg, t.preview.accent, t.preview.text].map((c, i) => (
                            <div key={i} className="h-2.5 w-2.5 rounded-full border border-border/50" style={{ backgroundColor: c }} />
                          ))}
                        </div>
                        <p className="text-[8px] font-medium text-foreground truncate">{t.name}</p>
                      </button>
                    ))}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-[9px] font-medium text-muted-foreground uppercase tracking-wide">Couleurs</p>
                      {colorOverrides && Object.keys(colorOverrides).length > 0 && (
                        <button onClick={resetColors} className="text-[9px] text-primary hover:underline">Reset</button>
                      )}
                    </div>
                    <div className="space-y-1">
                      {COLOR_FIELDS.map(({ key, label }) => {
                        const hex = hslToHex(mergedTheme.colors[key]);
                        return (
                          <div key={key} className="flex items-center gap-1.5">
                            <label className="text-[10px] text-foreground w-14 shrink-0">{label}</label>
                            <input type="color" value={hex} onChange={(e) => handleColorChange(key, e.target.value)} className="h-6 w-6 rounded border border-border cursor-pointer appearance-none bg-transparent p-0" />
                            <span className="text-[8px] text-muted-foreground font-mono flex-1 truncate">{mergedTheme.colors[key]}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}
        </div>
      </aside>

      {/* ── Panel 2: Section Settings Editor (appears when a section is selected) ── */}
      <AnimatePresence>
        {editingSection !== null && editingSchema && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="shrink-0 border-r border-border bg-card overflow-hidden"
          >
            <div className="w-[280px] h-full overflow-y-auto">
              <div className="sticky top-0 z-10 bg-card border-b border-border px-3 py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Settings2 size={13} className="text-primary" />
                  <span className="text-xs font-semibold text-foreground">{editingDef?.label || editingSec?.type}</span>
                </div>
                <button onClick={() => setEditingSection(null)} className="h-6 w-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground">
                  <X size={14} />
                </button>
              </div>

              <div className="p-3 space-y-3">
                {editingSchema.map((field) => {
                  const value = editingSec?.settings?.[field.key] ?? field.defaultValue ?? "";
                  return (
                    <div key={field.key}>
                      <Label className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1 block">{field.label}</Label>
                      {field.type === "text" && (
                        <Input
                          value={value as string}
                          onChange={(e) => updateSectionSetting(editingSection!, field.key, e.target.value)}
                          placeholder={field.placeholder}
                          className="h-8 text-xs"
                        />
                      )}
                      {field.type === "textarea" && (
                        <Textarea
                          value={value as string}
                          onChange={(e) => updateSectionSetting(editingSection!, field.key, e.target.value)}
                          placeholder={field.placeholder}
                          className="text-xs min-h-[60px]"
                        />
                      )}
                      {field.type === "toggle" && (
                        <Switch
                          checked={value as boolean}
                          onCheckedChange={(v) => updateSectionSetting(editingSection!, field.key, v)}
                          className="scale-[0.8]"
                        />
                      )}
                      {field.type === "select" && (
                        <select
                          value={value as string}
                          onChange={(e) => updateSectionSetting(editingSection!, field.key, e.target.value)}
                          className="w-full h-8 rounded-md border border-border bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                          {field.options?.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      )}
                      {field.type === "image" && (
                        <Input
                          value={value as string}
                          onChange={(e) => updateSectionSetting(editingSection!, field.key, e.target.value)}
                          placeholder="URL de l'image"
                          className="h-8 text-xs"
                        />
                      )}
                    </div>
                  );
                })}
                {!editingSchema.length && (
                  <p className="text-xs text-muted-foreground text-center py-6">
                    Aucun paramètre modifiable pour cette section.
                  </p>
                )}
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ── Panel 3: Live Preview ── */}
      <div className="flex-1 flex flex-col bg-muted/30 overflow-hidden">
        <div className="h-9 shrink-0 border-b border-border bg-card flex items-center justify-between px-3">
          <div className="flex items-center gap-1 bg-muted rounded-md p-0.5">
            <button onClick={() => setPreviewMode("desktop")} className={cn("flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium transition-colors", previewMode === "desktop" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground")}>
              <Monitor size={11} /> Desktop
            </button>
            <button onClick={() => setPreviewMode("mobile")} className={cn("flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium transition-colors", previewMode === "mobile" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground")}>
              <Smartphone size={11} /> Mobile
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-muted-foreground">{mergedTheme.name} · {template.name}</span>
            {store.slug && (
              <Button variant="outline" size="sm" className="h-5 text-[9px] px-2" asChild>
                <a href={`/store/${store.slug}`} target="_blank" rel="noopener noreferrer">
                  <Eye size={9} className="mr-0.5" /> Live
                </a>
              </Button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto flex justify-center py-4 px-3">
          <motion.div
            layout
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className={cn(
              "relative rounded-xl overflow-hidden shadow-2xl border border-border/50",
              previewMode === "mobile" ? "w-[390px]" : "w-full max-w-[1280px]"
            )}
            style={{ minHeight: 600 }}
          >
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
                      {store.slug}.feyxa.com
                    </span>
                  </div>
                </div>
              </div>
            )}

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
