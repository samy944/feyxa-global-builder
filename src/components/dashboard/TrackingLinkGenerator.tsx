import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Link2, Copy, Check } from "lucide-react";

const PLATFORMS = [
  { value: "facebook", label: "Facebook", medium: "social" },
  { value: "instagram", label: "Instagram", medium: "social" },
  { value: "whatsapp", label: "WhatsApp", medium: "social" },
  { value: "tiktok", label: "TikTok", medium: "social" },
  { value: "google", label: "Google", medium: "cpc" },
] as const;

interface Props {
  storeId: string;
  productId: string;
  productSlug: string;
  productName: string;
}

export function TrackingLinkGenerator({ storeId, productId, productSlug, productName }: Props) {
  const [open, setOpen] = useState(false);
  const [source, setSource] = useState("facebook");
  const [campaign, setCampaign] = useState("");
  const [content, setContent] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const generateShortCode = () => {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    let code = "";
    for (let i = 0; i < 7; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  };

  const handleGenerate = async () => {
    setGenerating(true);
    const platform = PLATFORMS.find((p) => p.value === source);
    const shortCode = generateShortCode();

    // Build target URL with UTM params
    const baseUrl = `/market/product/${encodeURIComponent(productSlug)}`;
    const utmParams = new URLSearchParams({
      utm_source: source,
      utm_medium: platform?.medium || "social",
      ...(campaign && { utm_campaign: campaign }),
      ...(content && { utm_content: content }),
    });
    const targetUrl = `${baseUrl}?${utmParams.toString()}`;

    const { error } = await supabase.from("tracking_links").insert({
      store_id: storeId,
      product_id: productId,
      source,
      medium: platform?.medium || "social",
      campaign: campaign || null,
      content: content || null,
      short_code: shortCode,
      target_url: targetUrl,
    });

    if (error) {
      toast.error("Erreur lors de la création du lien");
      setGenerating(false);
      return;
    }

    const fullLink = `${window.location.origin}/r/${shortCode}`;
    setGeneratedLink(fullLink);
    setGenerating(false);
    toast.success("Lien tracké créé !");
  };

  const handleCopy = async () => {
    if (!generatedLink) return;
    await navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Lien copié !");
  };

  const handleReset = () => {
    setGeneratedLink(null);
    setCampaign("");
    setContent("");
    setCopied(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) handleReset(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Link2 className="w-4 h-4 mr-1" /> Lien tracké
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">Générer un lien tracké</DialogTitle>
        </DialogHeader>

        <p className="text-xs text-muted-foreground mb-4 truncate">
          Produit : <span className="font-medium text-foreground">{productName}</span>
        </p>

        {!generatedLink ? (
          <div className="space-y-4">
            <div>
              <Label className="text-xs">Plateforme *</Label>
              <Select value={source} onValueChange={setSource}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLATFORMS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Campagne (optionnel)</Label>
              <Input
                value={campaign}
                onChange={(e) => setCampaign(e.target.value)}
                placeholder="promo-noel-2025"
                className="mt-1"
                maxLength={100}
              />
            </div>

            <div>
              <Label className="text-xs">Note / ID du post (optionnel)</Label>
              <Input
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="post-story-15dec"
                className="mt-1"
                maxLength={200}
              />
            </div>

            <Button onClick={handleGenerate} disabled={generating} className="w-full">
              {generating ? "Génération..." : "Générer le lien"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-3 bg-secondary rounded-lg">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Lien tracké</p>
              <div className="flex items-center gap-2">
                <code className="text-sm font-mono text-foreground flex-1 truncate">{generatedLink}</code>
                <Button size="icon" variant="ghost" className="shrink-0 w-8 h-8" onClick={handleCopy}>
                  {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div className="text-xs text-muted-foreground space-y-1">
              <p>📊 Source : <span className="text-foreground font-medium">{source}</span></p>
              {campaign && <p>🎯 Campagne : <span className="text-foreground font-medium">{campaign}</span></p>}
              {content && <p>📝 Note : <span className="text-foreground font-medium">{content}</span></p>}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={handleReset}>
                Créer un autre
              </Button>
              <Button size="sm" className="flex-1" onClick={() => setOpen(false)}>
                Fermer
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
