import { useState } from "react";
import { STOREFRONT_TEMPLATES, getTemplateById, getDefaultSectionsConfig, type SFSectionConfig, type StorefrontTemplate } from "@/lib/storefront-templates";
import { STOREFRONT_THEMES } from "@/lib/storefront-themes";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Check, Eye, GripVertical, Layout, Palette } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface Props {
  currentTemplateId: string;
  currentThemeId: string;
  sectionsConfig: SFSectionConfig[];
  onSave: (templateId: string, themeId: string, sections: SFSectionConfig[]) => void;
  storeSlug?: string;
}

export function StorefrontBuilder({ currentTemplateId, currentThemeId, sectionsConfig, onSave, storeSlug }: Props) {
  const [templateId, setTemplateId] = useState(currentTemplateId);
  const [themeId, setThemeId] = useState(currentThemeId);
  const [sections, setSections] = useState<SFSectionConfig[]>(sectionsConfig);
  const [tab, setTab] = useState<"template" | "theme" | "sections">("template");

  const template = getTemplateById(templateId);
  const dirty = templateId !== currentTemplateId || themeId !== currentThemeId || JSON.stringify(sections) !== JSON.stringify(sectionsConfig);

  const handleTemplateChange = (id: string) => {
    setTemplateId(id);
    const t = getTemplateById(id);
    setSections(getDefaultSectionsConfig(t));
    setThemeId(t.defaultThemeId);
  };

  const toggleSection = (idx: number) => {
    const s = template.sections.find(ts => ts.type === sections[idx].type);
    if (s?.required) return;
    setSections(prev => prev.map((sec, i) => i === idx ? { ...sec, visible: !sec.visible } : sec));
  };

  const moveSection = (idx: number, dir: -1 | 1) => {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= sections.length) return;
    const s = template.sections.find(ts => ts.type === sections[idx].type);
    const t = template.sections.find(ts => ts.type === sections[newIdx].type);
    if (s?.required || t?.required) return;
    setSections(prev => {
      const arr = [...prev];
      [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
      return arr;
    });
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-muted rounded-lg">
        {([["template", Layout, "Modèle"], ["theme", Palette, "Thème"], ["sections", GripVertical, "Sections"]] as const).map(([key, Icon, label]) => (
          <button key={key} onClick={() => setTab(key as any)} className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-colors ${tab === key ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* Template picker */}
      {tab === "template" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {STOREFRONT_TEMPLATES.map((t) => (
            <motion.div key={t.id} whileHover={{ y: -2 }} onClick={() => handleTemplateChange(t.id)} className={`relative rounded-xl border-2 p-4 cursor-pointer transition-all ${templateId === t.id ? "border-primary ring-2 ring-primary/20 bg-primary/5" : "border-border hover:border-primary/40"}`}>
              {templateId === t.id && <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-primary flex items-center justify-center"><Check size={12} className="text-primary-foreground" /></div>}
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{t.icon}</span>
                <span className="font-semibold text-sm text-foreground">{t.name}</span>
              </div>
              <p className="text-xs text-muted-foreground">{t.description}</p>
              <div className="flex gap-1.5 mt-2">
                {t.tags.map(tag => <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{tag}</span>)}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Theme picker (color) */}
      {tab === "theme" && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {STOREFRONT_THEMES.map((t) => (
            <button key={t.id} onClick={() => setThemeId(t.id)} className={`rounded-lg border-2 p-2.5 text-left transition-all ${themeId === t.id ? "border-primary ring-1 ring-primary/20" : "border-border hover:border-primary/40"}`}>
              <div className="flex gap-1 mb-1.5">
                {[t.preview.bg, t.preview.accent, t.preview.card, t.preview.text].map((c, i) => (
                  <div key={i} className="h-4 w-4 rounded-full border border-border" style={{ backgroundColor: c }} />
                ))}
                {themeId === t.id && <Check size={14} className="text-primary ml-auto" />}
              </div>
              <p className="text-xs font-medium text-foreground">{t.name}</p>
            </button>
          ))}
        </div>
      )}

      {/* Section builder */}
      {tab === "sections" && (
        <div className="space-y-1.5">
          {sections.map((sec, idx) => {
            const def = template.sections.find(ts => ts.type === sec.type);
            return (
              <div key={sec.type} className="flex items-center gap-2 p-2.5 rounded-lg border border-border bg-card">
                <GripVertical size={14} className="text-muted-foreground shrink-0 cursor-grab" />
                <div className="flex-1">
                  <span className="text-xs font-medium text-foreground">{def?.label || sec.type}</span>
                  {def?.required && <span className="text-[9px] text-muted-foreground ml-1.5">(requis)</span>}
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => moveSection(idx, -1)} disabled={idx === 0 || def?.required} className="h-6 w-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 text-xs">↑</button>
                  <button onClick={() => moveSection(idx, 1)} disabled={idx === sections.length - 1 || def?.required} className="h-6 w-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 text-xs">↓</button>
                  <Switch checked={sec.visible} onCheckedChange={() => toggleSection(idx)} disabled={def?.required} className="scale-75" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        {storeSlug && (
          <Button variant="outline" size="sm" asChild>
            <a href={`/store/${storeSlug}`} target="_blank" rel="noopener noreferrer"><Eye size={14} className="mr-1" /> Prévisualiser</a>
          </Button>
        )}
        <Button size="sm" disabled={!dirty} onClick={() => { onSave(templateId, themeId, sections); toast.success("Design sauvegardé !"); }} className="ml-auto">
          Sauvegarder le design
        </Button>
      </div>
    </div>
  );
}
