import { useState, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, Upload, X, Loader2, Search, ImageIcon, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { MarketProductCard } from "@/components/market/MarketProductCard";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface VisualProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  compare_at_price: number | null;
  images: any;
  avg_rating: number | null;
  review_count: number | null;
  stores: { name: string; slug: string; city: string | null; currency: string };
}

interface VisualSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VisualSearchDialog({ open, onOpenChange }: VisualSearchDialogProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState("image/jpeg");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<VisualProduct[] | null>(null);
  const [analysis, setAnalysis] = useState<{ description?: string; keywords?: string[] } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setPreview(null);
    setResults(null);
    setAnalysis(null);
    setSearching(false);
  };

  const handleFile = useCallback((file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image trop lourde (max 5 Mo)");
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Format non supporté");
      return;
    }
    setMimeType(file.type);
    setResults(null);
    setAnalysis(null);

    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  const handleSearch = async () => {
    if (!preview) return;
    setSearching(true);

    try {
      // Extract base64 from data URL
      const base64 = preview.split(",")[1];

      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/visual-search`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ image_base64: base64, mime_type: mimeType }),
        }
      );

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || "Erreur de recherche");
      }

      const data = await resp.json();
      setResults(data.products || []);
      setAnalysis(data.analysis || null);
    } catch (e: any) {
      toast.error(e.message || "Erreur lors de la recherche visuelle");
    } finally {
      setSearching(false);
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-primary" />
            Recherche visuelle
            <Badge variant="secondary" className="text-[10px] gap-1">
              <Sparkles className="w-3 h-3" /> IA
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {/* Upload zone */}
        {!results && (
          <div className="space-y-4">
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => !preview && inputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-xl transition-all cursor-pointer ${
                dragOver
                  ? "border-primary bg-primary/5 scale-[1.01]"
                  : preview
                  ? "border-border"
                  : "border-muted-foreground/30 hover:border-primary/50"
              } ${preview ? "p-2" : "p-8"}`}
            >
              {preview ? (
                <div className="relative">
                  <img
                    src={preview}
                    alt="Aperçu"
                    className="w-full max-h-64 object-contain rounded-lg"
                  />
                  <button
                    onClick={(e) => { e.stopPropagation(); reset(); }}
                    className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:scale-110 transition-transform"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      Glissez une image ici
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      ou cliquez pour sélectionner • JPG, PNG, WebP • 5 Mo max
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Upload className="w-4 h-4" />
                    Parcourir
                  </Button>
                </div>
              )}
            </div>

            {preview && (
              <Button
                onClick={handleSearch}
                disabled={searching}
                className="w-full gap-2"
                size="lg"
              >
                {searching ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyse en cours…
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    Rechercher des produits similaires
                  </>
                )}
              </Button>
            )}

            {searching && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center text-sm text-muted-foreground"
              >
                <p>🔍 L'IA analyse votre image…</p>
              </motion.div>
            )}
          </div>
        )}

        {/* Results */}
        <AnimatePresence>
          {results !== null && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Analysis summary */}
              {analysis && (
                <div className="bg-secondary/50 rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge className="gap-1 bg-primary/10 text-primary border-primary/20">
                      <Sparkles className="w-3 h-3" />
                      Résultats visuels
                    </Badge>
                    {analysis.description && (
                      <span className="text-sm text-muted-foreground">
                        « {analysis.description} »
                      </span>
                    )}
                  </div>
                  {analysis.keywords && analysis.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {analysis.keywords.map((kw, i) => (
                        <Badge key={i} variant="outline" className="text-[10px]">
                          {kw}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Thumbnail + new search */}
              <div className="flex items-center gap-3">
                {preview && (
                  <img
                    src={preview}
                    alt=""
                    className="h-12 w-12 rounded-lg object-cover border border-border"
                  />
                )}
                <Button variant="outline" size="sm" onClick={reset} className="gap-1.5">
                  <Camera className="w-3.5 h-3.5" />
                  Nouvelle recherche
                </Button>
                <span className="text-sm text-muted-foreground ml-auto">
                  {results.length} résultat{results.length !== 1 ? "s" : ""}
                </span>
              </div>

              {results.length === 0 ? (
                <div className="text-center py-8">
                  <ImageIcon className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Aucun produit similaire trouvé
                  </p>
                  <Button variant="ghost" size="sm" onClick={reset} className="mt-2">
                    Essayer avec une autre image
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {results.map((p, i) => (
                    <MarketProductCard
                      key={p.id}
                      id={p.id}
                      name={p.name}
                      slug={p.slug}
                      price={p.price}
                      compare_at_price={p.compare_at_price}
                      images={p.images}
                      store_name={p.stores.name}
                      store_slug={p.stores.slug}
                      store_city={p.stores.city}
                      currency={p.stores.currency}
                      avg_rating={p.avg_rating}
                      review_count={p.review_count}
                      index={i}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = "";
          }}
          className="hidden"
        />
      </DialogContent>
    </Dialog>
  );
}
