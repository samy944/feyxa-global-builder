import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Sparkles, Target, Megaphone, Search, Heart, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LandingSection } from "@/lib/landing-templates";

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

      onApply(optimizedSections, data.seoTitle || seoTitle, data.seoDescription || seoDescription);
      onOpenChange(false);
      toast.success("Landing page optimisée par l'IA !");
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Erreur lors de l'optimisation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
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
          {/* Objective */}
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

          {/* Tone */}
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
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Annuler
          </Button>
          <Button onClick={handleOptimize} disabled={loading} className="gap-2">
            <Sparkles className="w-4 h-4" />
            {loading ? "Optimisation en cours..." : "Optimiser"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
