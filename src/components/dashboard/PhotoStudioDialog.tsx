import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Wand2, ImageOff, Sparkles, Sun, Download } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  productName: string;
  category?: string;
  onImageReady: (url: string) => void;
}

const ACTIONS = [
  {
    id: "remove_bg",
    label: "Supprimer le fond",
    description: "Fond blanc professionnel",
    icon: ImageOff,
  },
  {
    id: "enhance",
    label: "Améliorer la photo",
    description: "Lumière, netteté, couleurs",
    icon: Sun,
  },
  {
    id: "lifestyle",
    label: "Mise en scène",
    description: "Contexte lifestyle attrayant",
    icon: Sparkles,
  },
];

export function PhotoStudioDialog({ open, onOpenChange, imageUrl, productName, category, onImageReady }: Props) {
  const [processing, setProcessing] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);

  const handleAction = async (action: string) => {
    setProcessing(action);
    setResultImage(null);
    try {
      const { data, error } = await supabase.functions.invoke("ai-photo-studio", {
        body: { action, imageUrl, productName, category },
      });
      if (error) throw error;
      if (data?.error) { toast.error(data.error); return; }
      setResultImage(data.imageUrl);
      toast.success("Image traitée avec succès !");
    } catch (e) {
      console.error(e);
      toast.error("Erreur lors du traitement de l'image");
    } finally {
      setProcessing(null);
    }
  };

  const handleUseImage = () => {
    if (resultImage) {
      onImageReady(resultImage);
      onOpenChange(false);
      setResultImage(null);
    }
  };

  const handleDownload = () => {
    if (!resultImage) return;
    const a = document.createElement("a");
    a.href = resultImage;
    a.download = `${productName}-studio.png`;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setResultImage(null); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 size={18} className="text-primary" />
            Studio Photo IA
          </DialogTitle>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Original */}
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground font-medium">Image originale</p>
            <div className="relative rounded-xl overflow-hidden border border-border aspect-square bg-secondary">
              <img src={imageUrl} alt="Original" className="w-full h-full object-contain" />
            </div>

            {/* Actions */}
            <div className="space-y-2">
              {ACTIONS.map((action) => (
                <Button
                  key={action.id}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-2"
                  disabled={!!processing}
                  onClick={() => handleAction(action.id)}
                >
                  {processing === action.id ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <action.icon size={14} />
                  )}
                  <div className="text-left">
                    <span className="text-sm">{action.label}</span>
                    <span className="text-xs text-muted-foreground ml-2">{action.description}</span>
                  </div>
                </Button>
              ))}
            </div>
          </div>

          {/* Result */}
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground font-medium">Résultat IA</p>
            <div className="relative rounded-xl overflow-hidden border border-border aspect-square bg-secondary flex items-center justify-center">
              {processing ? (
                <div className="flex flex-col items-center gap-3 text-muted-foreground">
                  <Loader2 size={32} className="animate-spin" />
                  <p className="text-sm">Traitement en cours...</p>
                </div>
              ) : resultImage ? (
                <img src={resultImage} alt="Résultat" className="w-full h-full object-contain" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <Sparkles size={24} />
                  <p className="text-sm text-center px-4">
                    Choisissez une action<br />pour transformer votre photo
                  </p>
                </div>
              )}
            </div>

            {resultImage && (
              <div className="flex gap-2">
                <Button onClick={handleUseImage} className="flex-1 gap-1.5" size="sm">
                  <Sparkles size={14} />
                  Utiliser cette image
                </Button>
                <Button variant="outline" onClick={handleDownload} size="sm">
                  <Download size={14} />
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
