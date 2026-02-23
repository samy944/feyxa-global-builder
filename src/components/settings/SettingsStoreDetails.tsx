import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStore } from "@/hooks/useStore";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Save, Loader2, Upload } from "lucide-react";
import BrandConfigurator, { BrandConfig } from "@/components/dashboard/BrandConfigurator";

export default function SettingsStoreDetails() {
  const { store, refetch } = useStore();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [currency, setCurrency] = useState("XOF");
  const [locale, setLocale] = useState("fr");
  const [city, setCity] = useState("");
  const [slug, setSlug] = useState("");
  const [deliveryDelay, setDeliveryDelay] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!store) return;
    setName(store.name || "");
    setDescription(store.description || "");
    setCurrency(store.currency || "XOF");
    setLocale(store.locale || "fr");
    setCity(store.city || "");
    setSlug(store.slug || "");
    setDeliveryDelay(store.delivery_delay || "");
    setLogoUrl(store.logo_url || "");
  }, [store]);

  const handleSave = async () => {
    if (!store) return;
    if (!name.trim()) { toast.error("Le nom est requis"); return; }
    setSaving(true);
    const { error } = await supabase.from("stores").update({
      name: name.trim(),
      description: description.trim() || null,
      currency,
      locale,
      city: city.trim() || null,
      delivery_delay: deliveryDelay.trim() || null,
      logo_url: logoUrl.trim() || null,
    }).eq("id", store.id);
    setSaving(false);
    if (error) { toast.error("Erreur de sauvegarde"); return; }
    toast.success("Informations mises à jour");
    refetch();
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !store) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${store.id}/logo.${ext}`;
    const { error } = await supabase.storage.from("store-assets").upload(path, file, { upsert: true });
    if (error) { toast.error("Erreur upload logo"); setUploading(false); return; }
    const { data } = supabase.storage.from("store-assets").getPublicUrl(path);
    setLogoUrl(data.publicUrl);
    setUploading(false);
    toast.success("Logo uploadé");
  };

  return (
    <div className="space-y-8">
      {/* ── Informations de base ── */}
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Informations de la boutique</h2>
          <p className="text-sm text-muted-foreground mt-1">Les informations de base de votre boutique, visibles par vos clients.</p>
        </div>

        {/* Logo */}
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">Logo</label>
          <div className="flex items-center gap-4">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="h-16 w-16 rounded-lg object-cover border border-border" />
            ) : (
              <div className="h-16 w-16 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground">
                <Upload size={20} />
              </div>
            )}
            <label className="cursor-pointer">
              <Button variant="outline" size="sm" asChild>
                <span>{uploading ? <Loader2 size={14} className="animate-spin" /> : "Changer le logo"}</span>
              </Button>
              <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={uploading} />
            </label>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Nom de la boutique *</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ma Boutique" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Décrivez votre boutique en quelques mots..."
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Ville</label>
            <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Cotonou" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Devise</label>
              <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="XOF">XOF (Franc CFA)</option>
                <option value="EUR">EUR (Euro)</option>
                <option value="USD">USD (Dollar US)</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Langue</label>
              <select value={locale} onChange={(e) => setLocale(e.target.value)} className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="fr">Français</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Délai de livraison estimé</label>
            <Input value={deliveryDelay} onChange={(e) => setDeliveryDelay(e.target.value)} placeholder="2-5 jours" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Slug (URL)</label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">feyxa.app/store/</span>
              <Input value={slug} disabled className="font-mono text-sm flex-1 bg-secondary/50" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">Le slug ne peut pas être modifié après la création.</p>
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          Enregistrer
        </Button>
      </div>

      {/* ── Identité de marque ── */}
      {store && (
        <div className="border-t border-border pt-8">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-foreground">Identité de marque</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Clonez le design d'un site existant ou configurez manuellement vos couleurs, polices et logo.
            </p>
          </div>
          <BrandConfigurator
            storeId={store.id}
            initialBrand={store.theme as BrandConfig | null}
            onBrandChange={() => {}}
          />
        </div>
      )}
    </div>
  );
}
