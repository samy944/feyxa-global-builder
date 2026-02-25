import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStore } from "@/hooks/useStore";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Save, Loader2 } from "lucide-react";

export default function SettingsSeo() {
  const { store, refetch } = useStore();
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [ogImageUrl, setOgImageUrl] = useState("");
  const [googleVerification, setGoogleVerification] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!store) return;
    const s = (store.settings as Record<string, any>) || {};
    setSeoTitle(s.seo_title || store.name || "");
    setSeoDescription(s.seo_description || store.description || "");
    setOgImageUrl(s.og_image_url || "");
    setGoogleVerification(s.google_site_verification || "");
  }, [store]);

  const handleSave = async () => {
    if (!store) return;
    setSaving(true);
    const current = (store.settings as Record<string, any>) || {};
    const { error } = await supabase.from("stores").update({
      settings: {
        ...current,
        seo_title: seoTitle.trim() || null,
        seo_description: seoDescription.trim() || null,
        og_image_url: ogImageUrl.trim() || null,
        google_site_verification: googleVerification.trim() || null,
      },
    }).eq("id", store.id);
    setSaving(false);
    if (error) { toast.error("Erreur de sauvegarde"); return; }
    toast.success("Paramètres SEO enregistrés");
    refetch();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">SEO & Référencement</h2>
        <p className="text-sm text-muted-foreground mt-1">Optimisez la visibilité de votre boutique sur les moteurs de recherche.</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">Titre SEO</label>
          <Input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} placeholder="Titre de votre boutique" maxLength={60} />
          <p className="text-xs text-muted-foreground mt-1">{seoTitle.length}/60 caractères — Apparaît dans les résultats Google</p>
        </div>

        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">Meta description</label>
          <textarea
            value={seoDescription}
            onChange={(e) => setSeoDescription(e.target.value)}
            rows={3}
            maxLength={160}
            placeholder="Description courte de votre boutique..."
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          />
          <p className="text-xs text-muted-foreground mt-1">{seoDescription.length}/160 caractères</p>
        </div>

        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">Image OG (partage réseaux sociaux)</label>
          <Input value={ogImageUrl} onChange={(e) => setOgImageUrl(e.target.value)} placeholder="https://..." />
          <p className="text-xs text-muted-foreground mt-1">Image affichée lors du partage sur les réseaux sociaux. Taille recommandée : 1200×630px</p>
        </div>

        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">Google Search Console — Verification</label>
          <Input value={googleVerification} onChange={(e) => setGoogleVerification(e.target.value)} placeholder="google-site-verification=..." className="font-mono text-sm" />
        </div>

        {/* Preview */}
        <div className="p-4 rounded-lg bg-secondary/50 border border-border space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Aperçu Google</p>
          <p className="text-sm text-primary font-medium truncate">{seoTitle || "Titre de la boutique"}</p>
          <p className="text-xs text-accent truncate">feyxa.app/store/{store?.slug || "ma-boutique"}</p>
          <p className="text-xs text-muted-foreground line-clamp-2">{seoDescription || "Description de votre boutique..."}</p>
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving}>
        {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
        Enregistrer
      </Button>
    </div>
  );
}
