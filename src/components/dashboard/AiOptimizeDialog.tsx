import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Target, Megaphone, Search, Heart, Zap, ArrowLeft, ArrowRight, Check, Plus, Pencil, Equal } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LandingSection, getBlockDefinition } from "@/lib/landing-templates";

const OBJECTIVES = [
  { value: "conversion", label: "Conversion", desc: "Maximiser les ventes", icon: Target },
  { value: "branding", label: "Branding", desc: "Image de marque", icon: Heart },
  { value: "leads", label: "Leads", desc: "Capturer des contacts", icon: Megaphone },
  { value: "seo", label: "SEO", desc: "Référencement naturel", icon: Search },
  { value: "engagement", label: "Engagement", desc: "Interactivité", icon: Zap },
] as const;

const TONES = [
  { value: "professional", label: "Professionnel", emoji: "💼" },
  { value: "dynamic", label: "Dynamique", emoji: "⚡" },
  { value: "premium", label: "Premium", emoji: "💎" },
  { value: "friendly", label: "Amical", emoji: "😊" },
  { value: "urgent", label: "Urgent", emoji: "🔥" },
] as const;

type Step = "config" | "preview";

interface DiffItem {
  type: "unchanged" | "modified" | "added" | "removed";
  sectionType: string;
  label: string;
  icon: string;
  beforeTexts: string[];
  afterTexts: string[];
}

function extractTexts(data: Record<string, any>): string[] {
  const texts: string[] = [];
  for (const [key, val] of Object.entries(data)) {
    if (typeof val === "string" && val.trim() && !key.match(/url|image|color|bg|phone|icon|id|endDate|poster/i)) {
      texts.push(val);
    }
    if (Array.isArray(val)) {
      val.forEach((item) => {
        if (typeof item === "object" && item !== null) {
          texts.push(...extractTexts(item));
        } else if (typeof item === "string") {
          texts.push(item);
        }
      });
    }
  }
  return texts;
}

function buildDiff(before: LandingSection[], after: LandingSection[]): DiffItem[] {
  const result: DiffItem[] = [];
  const afterById = new Map(after.map((s) => [s.id, s]));
  const matchedIds = new Set<string>();

  for (const b of before) {
    const a = afterById.get(b.id);
    const block = getBlockDefinition(b.type);
    if (a) {
      matchedIds.add(b.id);
      const bTexts = extractTexts(b.data);
      const aTexts = extractTexts(a.data);
      const changed = JSON.stringify(b.data) !== JSON.stringify(a.data);
      result.push({
        type: changed ? "modified" : "unchanged",
        sectionType: b.type,
        label: block?.label || b.type,
        icon: block?.icon || "📄",
        beforeTexts: bTexts,
        afterTexts: aTexts,
      });
    } else {
      result.push({
        type: "removed",
        sectionType: b.type,
        label: block?.label || b.type,
        icon: block?.icon || "📄",
        beforeTexts: extractTexts(b.data),
        afterTexts: [],
      });
    }
  }

  for (const a of after) {
    if (!matchedIds.has(a.id)) {
      const block = getBlockDefinition(a.type);
      result.push({
        type: "added",
        sectionType: a.type,
        label: block?.label || a.type,
        icon: block?.icon || "📄",
        beforeTexts: [],
        afterTexts: extractTexts(a.data),
      });
    }
  }

  return result;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sections: LandingSection[];
  seoTitle: string;
  seoDescription: string;
  storeName?: string;
  productName?: string;
  onApply: (sections: LandingSection[], seoTitle: string, seoDescription: string) => void;
}

export function AiOptimizeDialog({ open, onOpenChange, sections, seoTitle, seoDescription, storeName, productName, onApply }: Props) {
  const [objective, setObjective] = useState("conversion");
  const [tone, setTone] = useState("professional");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<Step>("config");
  const [result, setResult] = useState<{ sections: LandingSection[]; seoTitle: string; seoDescription: string } | null>(null);

  const diff = useMemo(() => {
    if (!result) return [];
    return buildDiff(sections, result.sections);
  }, [sections, result]);

  const stats = useMemo(() => {
    const modified = diff.filter((d) => d.type === "modified").length;
    const added = diff.filter((d) => d.type === "added").length;
    const unchanged = diff.filter((d) => d.type === "unchanged").length;
    return { modified, added, unchanged };
  }, [diff]);

  const handleOptimize = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("optimize-landing", {
        body: { sections, objective, tone, storeName, productName, seoTitle, seoDescription },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const optimizedSections = (data.sections || []).map((s: any) => ({
        ...s,
        id: s.id || Math.random().toString(36).slice(2, 10),
        visible: s.visible !== undefined ? s.visible : true,
      }));

      setResult({
        sections: optimizedSections,
        seoTitle: data.seoTitle || seoTitle,
        seoDescription: data.seoDescription || seoDescription,
      });
      setStep("preview");
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Erreur lors de l'optimisation");
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (!result) return;
    onApply(result.sections, result.seoTitle, result.seoDescription);
    onOpenChange(false);
    toast.success("Landing page optimisée par l'IA !");
    // Reset for next use
    setStep("config");
    setResult(null);
  };

  const handleClose = (v: boolean) => {
    if (!v) {
      setStep("config");
      setResult(null);
    }
    onOpenChange(v);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className={step === "preview" ? "sm:max-w-3xl max-h-[85vh] flex flex-col" : "sm:max-w-lg"}>
        {step === "config" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Optimiser avec l'IA
              </DialogTitle>
              <DialogDescription>
                L'IA va réécrire vos textes, améliorer le SEO et ajouter des sections stratégiques.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 py-2">
              <div>
                <Label className="text-sm font-semibold mb-2 block">🎯 Objectif marketing</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {OBJECTIVES.map((o) => {
                    const Icon = o.icon;
                    return (
                      <button
                        key={o.value}
                        onClick={() => setObjective(o.value)}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          objective === o.value
                            ? "border-primary bg-primary/5 shadow-sm"
                            : "border-border hover:border-primary/30"
                        }`}
                      >
                        <Icon className={`w-4 h-4 mb-1.5 ${objective === o.value ? "text-primary" : "text-muted-foreground"}`} />
                        <p className="text-xs font-semibold">{o.label}</p>
                        <p className="text-[10px] text-muted-foreground">{o.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <Label className="text-sm font-semibold mb-2 block">🎨 Ton de la page</Label>
                <div className="flex flex-wrap gap-2">
                  {TONES.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => setTone(t.value)}
                      className={`px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                        tone === t.value
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/30"
                      }`}
                    >
                      {t.emoji} {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => handleClose(false)} disabled={loading}>
                Annuler
              </Button>
              <Button onClick={handleOptimize} disabled={loading} className="gap-2">
                <Sparkles className="w-4 h-4" />
                {loading ? "Optimisation en cours..." : "Générer l'aperçu"}
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "preview" && result && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Aperçu des modifications
              </DialogTitle>
              <DialogDescription className="flex items-center gap-3 pt-1">
                <Badge variant="outline" className="gap-1 text-amber-600 border-amber-200 bg-amber-50">
                  <Pencil className="w-3 h-3" /> {stats.modified} modifiée{stats.modified > 1 ? "s" : ""}
                </Badge>
                <Badge variant="outline" className="gap-1 text-emerald-600 border-emerald-200 bg-emerald-50">
                  <Plus className="w-3 h-3" /> {stats.added} ajoutée{stats.added > 1 ? "s" : ""}
                </Badge>
                <Badge variant="outline" className="gap-1 text-muted-foreground">
                  <Equal className="w-3 h-3" /> {stats.unchanged} inchangée{stats.unchanged > 1 ? "s" : ""}
                </Badge>
              </DialogDescription>
            </DialogHeader>

            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="space-y-3 py-2">
                {/* SEO Diff */}
                {(result.seoTitle !== seoTitle || result.seoDescription !== seoDescription) && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-amber-100 text-amber-700 border-0 text-[10px]">SEO</Badge>
                      <span className="text-xs font-semibold text-foreground">Métadonnées SEO</span>
                    </div>
                    {result.seoTitle !== seoTitle && (
                      <div className="text-xs space-y-1">
                        <p className="text-muted-foreground">Title:</p>
                        <p className="line-through text-destructive/70 bg-destructive/5 rounded px-2 py-1">{seoTitle || "(vide)"}</p>
                        <p className="text-emerald-700 bg-emerald-50 rounded px-2 py-1">{result.seoTitle}</p>
                      </div>
                    )}
                    {result.seoDescription !== seoDescription && (
                      <div className="text-xs space-y-1">
                        <p className="text-muted-foreground">Description:</p>
                        <p className="line-through text-destructive/70 bg-destructive/5 rounded px-2 py-1">{seoDescription || "(vide)"}</p>
                        <p className="text-emerald-700 bg-emerald-50 rounded px-2 py-1">{result.seoDescription}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Section Diffs */}
                {diff.map((d, i) => (
                  <DiffCard key={i} item={d} />
                ))}
              </div>
            </ScrollArea>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => { setStep("config"); setResult(null); }} className="gap-1.5">
                <ArrowLeft className="w-3.5 h-3.5" /> Refaire
              </Button>
              <Button variant="outline" onClick={() => handleClose(false)}>
                Annuler
              </Button>
              <Button onClick={handleApply} className="gap-2">
                <Check className="w-4 h-4" /> Appliquer les changements
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function DiffCard({ item }: { item: DiffItem }) {
  const [expanded, setExpanded] = useState(item.type !== "unchanged");

  const borderColor = {
    unchanged: "border-border",
    modified: "border-amber-200",
    added: "border-emerald-200",
    removed: "border-destructive/20",
  }[item.type];

  const bgColor = {
    unchanged: "bg-card",
    modified: "bg-amber-50/30",
    added: "bg-emerald-50/30",
    removed: "bg-destructive/5",
  }[item.type];

  const badgeStyle = {
    unchanged: "bg-muted text-muted-foreground",
    modified: "bg-amber-100 text-amber-700",
    added: "bg-emerald-100 text-emerald-700",
    removed: "bg-destructive/10 text-destructive",
  }[item.type];

  const badgeLabel = {
    unchanged: "Inchangée",
    modified: "Modifiée",
    added: "Nouvelle",
    removed: "Supprimée",
  }[item.type];

  return (
    <div className={`rounded-lg border ${borderColor} ${bgColor} overflow-hidden`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 p-3 text-left hover:bg-black/[0.02] transition-colors"
      >
        <span className="text-base shrink-0">{item.icon}</span>
        <span className="text-xs font-semibold text-foreground flex-1">{item.label}</span>
        <Badge className={`${badgeStyle} border-0 text-[10px] shrink-0`}>{badgeLabel}</Badge>
        <ArrowRight className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${expanded ? "rotate-90" : ""}`} />
      </button>

      {expanded && item.type !== "unchanged" && (
        <div className="px-3 pb-3 space-y-2">
          {item.type === "modified" && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">Avant</p>
                <div className="space-y-1">
                  {item.beforeTexts.slice(0, 6).map((t, i) => (
                    <p key={i} className="text-[11px] text-destructive/70 bg-destructive/5 rounded px-2 py-1 line-through truncate" title={t}>
                      {t}
                    </p>
                  ))}
                  {item.beforeTexts.length > 6 && (
                    <p className="text-[10px] text-muted-foreground italic">+{item.beforeTexts.length - 6} textes...</p>
                  )}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">Après</p>
                <div className="space-y-1">
                  {item.afterTexts.slice(0, 6).map((t, i) => (
                    <p key={i} className="text-[11px] text-emerald-700 bg-emerald-50 rounded px-2 py-1 truncate" title={t}>
                      {t}
                    </p>
                  ))}
                  {item.afterTexts.length > 6 && (
                    <p className="text-[10px] text-muted-foreground italic">+{item.afterTexts.length - 6} textes...</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {item.type === "added" && (
            <div>
              <p className="text-[10px] font-semibold text-emerald-600 uppercase mb-1">Nouveau contenu</p>
              <div className="space-y-1">
                {item.afterTexts.slice(0, 6).map((t, i) => (
                  <p key={i} className="text-[11px] text-emerald-700 bg-emerald-50 rounded px-2 py-1 truncate" title={t}>
                    {t}
                  </p>
                ))}
                {item.afterTexts.length > 6 && (
                  <p className="text-[10px] text-muted-foreground italic">+{item.afterTexts.length - 6} textes...</p>
                )}
              </div>
            </div>
          )}

          {item.type === "removed" && (
            <div>
              <p className="text-[10px] font-semibold text-destructive uppercase mb-1">Contenu supprimé</p>
              <div className="space-y-1">
                {item.beforeTexts.slice(0, 4).map((t, i) => (
                  <p key={i} className="text-[11px] text-destructive/70 bg-destructive/5 rounded px-2 py-1 line-through truncate" title={t}>
                    {t}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
