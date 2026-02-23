import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ImagePlus, Check, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface AiImageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storeId: string;
  onImageGenerated: (url: string) => void;
  context?: string;
}

const SUGGESTIONS = [
  "Photo lifestyle produit sur fond neutre avec lumière naturelle",
  "Image hero e-commerce minimaliste avec des tons chauds",
  "Photo ambiance premium avec modèle utilisant le produit",
  "Flat lay produit vue du dessus sur fond texturé",
  "Photo avant/après transformation avec le produit",
];

export function AiImageDialog({ open, onOpenChange, storeId, onImageGenerated, context }: AiImageDialogProps) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setPreviewUrl(null);

    try {
      const { data, error } = await supabase.functions.invoke("generate-landing-images", {
        body: { prompt: prompt.trim(), storeId, context },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setPreviewUrl(data.url);
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de la génération");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (previewUrl) {
      onImageGenerated(previewUrl);
      onOpenChange(false);
      setPrompt("");
      setPreviewUrl(null);
      toast.success("Image insérée !");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-violet-600" />
            Générer une image avec l'IA
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Décrivez l'image souhaitée... Ex: Photo lifestyle d'une crème de beauté sur fond marble avec des fleurs séchées"
              rows={3}
              className="text-sm"
            />
          </div>

          {/* Quick suggestions */}
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTIONS.map((s, i) => (
              <button
                key={i}
                onClick={() => setPrompt(s)}
                className="text-[10px] px-2.5 py-1 rounded-full border border-border hover:border-violet-300 hover:bg-violet-50 text-muted-foreground hover:text-violet-700 transition-colors"
              >
                {s.slice(0, 45)}…
              </button>
            ))}
          </div>

          <Button
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
            className="w-full gap-2 bg-violet-600 hover:bg-violet-700"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Génération en cours…
              </>
            ) : (
              <>
                <ImagePlus className="w-4 h-4" />
                Générer l'image
              </>
            )}
          </Button>

          {/* Preview */}
          {previewUrl && (
            <div className="space-y-3">
              <div className="rounded-lg overflow-hidden border border-border">
                <img src={previewUrl} alt="Generated" className="w-full h-auto max-h-80 object-cover" />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={handleGenerate} disabled={loading}>
                  Régénérer
                </Button>
                <Button className="flex-1 gap-2 bg-green-600 hover:bg-green-700" onClick={handleConfirm}>
                  <Check className="w-4 h-4" />
                  Utiliser cette image
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
