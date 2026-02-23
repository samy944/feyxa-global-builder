import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Wand2, Check, ArrowLeft, Palette, Type, Layers } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LandingSection } from "@/lib/landing-templates";

const PROMPT_SUGGESTIONS = [
  { label: "Minimaliste noir & or", prompt: "Style minimaliste noir et or, épuré et luxueux" },
  { label: "Moderne chrétien", prompt: "Landing page moderne pour marque chrétienne, couleurs douces et inspirantes" },
  { label: "Dynamique jeune", prompt: "Design dynamique et coloré pour jeunes, tons vifs et modernes" },
  { label: "Afro-luxe", prompt: "Style afro-luxe avec des tons terre, doré et motifs africains modernes" },
  { label: "Tech startup", prompt: "Design tech startup moderne, tons bleu-violet, futuriste" },
  { label: "Nature & bio", prompt: "Style naturel et bio, tons verts et terreux, ambiance organique" },
  { label: "Mode streetwear", prompt: "Style streetwear urbain, contrastes forts, typographie bold" },
  { label: "Élégance rose", prompt: "Design élégant et féminin, tons rose poudré et doré" },
];

type Step = "prompt" | "preview";

interface ThemeResult {
  primaryColor: string;
  bgColor: string;
  textColor: string;
  radius: string;
  fontHeading: string;
  fontBody: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sections: LandingSection[];
  currentTheme: Record<string, string>;
  storeName?: string;
  productName?: string;
  onApply: (sections: LandingSection[], theme: ThemeResult, seoTitle: string, seoDescription: string) => void;
}

export function AiDesignDialog({ open, onOpenChange, sections, currentTheme, storeName, productName, onApply }: Props) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<Step>("prompt");
  const [result, setResult] = useState<{
    theme: ThemeResult;
    sections: LandingSection[];
    seoTitle: string;
    seoDescription: string;
  } | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Décrivez le style souhaité");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("design-landing", {
        body: { sections, prompt: prompt.trim(), storeName, productName, currentTheme },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const optimizedSections = (data.sections || []).map((s: any) => ({
        ...s,
        id: s.id || Math.random().toString(36).slice(2, 10),
        visible: s.visible !== undefined ? s.visible : true,
      }));

      setResult({
        theme: data.theme || currentTheme,
        sections: optimizedSections,
        seoTitle: data.seoTitle || "",
        seoDescription: data.seoDescription || "",
      });
      setStep("preview");
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Erreur lors de la génération");
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (!result) return;
    onApply(result.sections, result.theme, result.seoTitle, result.seoDescription);
    onOpenChange(false);
    toast.success("Design appliqué avec succès !");
    setStep("prompt");
    setResult(null);
    setPrompt("");
  };

  const handleClose = (v: boolean) => {
    if (!v) {
      setStep("prompt");
      setResult(null);
    }
    onOpenChange(v);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className={step === "preview" ? "sm:max-w-2xl max-h-[85vh] flex flex-col" : "sm:max-w-lg"}>
        {step === "prompt" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Wand2 className="w-5 h-5 text-primary" />
                Designer IA — Prompt libre
              </DialogTitle>
              <DialogDescription>
                Décrivez le style souhaité et l'IA transformera entièrement le design de votre landing page.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div>
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Ex: Style minimaliste noir et or, landing page moderne pour marque chrétienne, design dynamique pour jeunes..."
                  className="min-h-[100px] text-sm"
                  maxLength={500}
                />
                <p className="text-[10px] text-muted-foreground mt-1 text-right">{prompt.length}/500</p>
              </div>

              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">💡 Suggestions</p>
                <div className="flex flex-wrap gap-1.5">
                  {PROMPT_SUGGESTIONS.map((s) => (
                    <button
                      key={s.label}
                      onClick={() => setPrompt(s.prompt)}
                      className={`px-2.5 py-1.5 rounded-full border text-[11px] font-medium transition-all ${
                        prompt === s.prompt
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => handleClose(false)} disabled={loading}>
                Annuler
              </Button>
              <Button onClick={handleGenerate} disabled={loading || !prompt.trim()} className="gap-2">
                <Wand2 className="w-4 h-4" />
                {loading ? "Génération en cours..." : "Générer le design"}
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "preview" && result && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Wand2 className="w-5 h-5 text-primary" />
                Aperçu du nouveau design
              </DialogTitle>
              <DialogDescription className="text-xs">
                « {prompt} »
              </DialogDescription>
            </DialogHeader>

            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="space-y-4 py-2">
                {/* Theme preview */}
                <div className="rounded-xl border border-border p-4 space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Palette className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold">Nouveau thème</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "Principale", color: result.theme.primaryColor },
                      { label: "Fond", color: result.theme.bgColor },
                      { label: "Texte", color: result.theme.textColor },
                    ].map((c) => (
                      <div key={c.label} className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg border border-border shadow-sm" style={{ backgroundColor: c.color }} />
                        <div>
                          <p className="text-[10px] text-muted-foreground">{c.label}</p>
                          <p className="text-xs font-mono font-medium">{c.color}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-4 pt-2 border-t border-border">
                    <div className="flex items-center gap-2">
                      <Type className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-xs"><strong>Titres:</strong> {result.theme.fontHeading}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Type className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-xs"><strong>Corps:</strong> {result.theme.fontBody}</span>
                    </div>
                    <span className="text-xs"><strong>Radius:</strong> {result.theme.radius}</span>
                  </div>
                </div>

                {/* Sections summary */}
                <div className="rounded-xl border border-border p-4 space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Layers className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold">Structure ({result.sections.length} sections)</span>
                  </div>
                  <div className="space-y-1">
                    {result.sections.map((s, i) => (
                      <div key={s.id || i} className="flex items-center gap-2 py-1.5 px-2 rounded-lg bg-muted/50 text-xs">
                        <span className="text-muted-foreground font-mono text-[10px] w-5">{i + 1}</span>
                        <Badge variant="outline" className="text-[10px]">{s.type}</Badge>
                        <span className="text-foreground truncate flex-1">
                          {s.data?.title || s.data?.text || s.data?.content || "—"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* SEO */}
                {(result.seoTitle || result.seoDescription) && (
                  <div className="rounded-xl border border-border p-4 space-y-2">
                    <p className="text-sm font-semibold">🔍 SEO</p>
                    {result.seoTitle && (
                      <div className="text-xs">
                        <span className="text-muted-foreground">Title:</span>{" "}
                        <span className="font-medium">{result.seoTitle}</span>
                      </div>
                    )}
                    {result.seoDescription && (
                      <div className="text-xs">
                        <span className="text-muted-foreground">Description:</span>{" "}
                        <span className="font-medium">{result.seoDescription}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </ScrollArea>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => { setStep("prompt"); setResult(null); }} className="gap-1.5">
                <ArrowLeft className="w-3.5 h-3.5" /> Modifier le prompt
              </Button>
              <Button variant="outline" onClick={() => handleClose(false)}>
                Annuler
              </Button>
              <Button onClick={handleApply} className="gap-2">
                <Check className="w-4 h-4" /> Appliquer le design
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
