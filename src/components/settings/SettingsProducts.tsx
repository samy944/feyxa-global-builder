import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStore } from "@/hooks/useStore";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Save, Loader2 } from "lucide-react";

export default function SettingsProducts() {
  const { store, refetch } = useStore();
  const [settings, setSettings] = useState({
    default_low_stock: "5",
    track_inventory: true,
    allow_oversell: false,
    min_margin_pct: "",
    show_compare_price: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!store) return;
    const s = (store.settings as Record<string, any>) || {};
    setSettings({
      default_low_stock: (s.default_low_stock_threshold ?? 5).toString(),
      track_inventory: s.track_inventory ?? true,
      allow_oversell: s.allow_oversell ?? false,
      min_margin_pct: s.min_margin_pct?.toString() || "",
      show_compare_price: s.show_compare_price ?? true,
    });
  }, [store]);

  const handleSave = async () => {
    if (!store) return;
    setSaving(true);
    const current = (store.settings as Record<string, any>) || {};
    const minMargin = parseFloat(settings.min_margin_pct);
    const { error } = await supabase.from("stores").update({
      settings: {
        ...current,
        default_low_stock_threshold: parseInt(settings.default_low_stock) || 5,
        track_inventory: settings.track_inventory,
        allow_oversell: settings.allow_oversell,
        min_margin_pct: isNaN(minMargin) ? null : minMargin,
        show_compare_price: settings.show_compare_price,
      },
    }).eq("id", store.id);
    setSaving(false);
    if (error) { toast.error("Erreur"); return; }
    toast.success("Paramètres produits enregistrés");
    refetch();
  };

  const Toggle = ({ label, desc, checked, onChange }: { label: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) => (
    <div className="flex items-center justify-between p-3 rounded-lg border border-border">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <button onClick={() => onChange(!checked)} className={`w-11 h-6 rounded-full transition-colors relative ${checked ? "bg-primary" : "bg-secondary"}`}>
        <div className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform" style={{ transform: checked ? "translateX(20px)" : "translateX(0)" }} />
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Produits & Inventaire</h2>
        <p className="text-sm text-muted-foreground mt-1">Gérez les paramètres par défaut de vos produits et le suivi de stock.</p>
      </div>

      <div className="space-y-2">
        <Toggle label="Suivi d'inventaire" desc="Décrémenter automatiquement le stock à chaque vente" checked={settings.track_inventory} onChange={(v) => setSettings({ ...settings, track_inventory: v })} />
        <Toggle label="Autoriser la survente" desc="Permettre les commandes même quand le stock est à 0" checked={settings.allow_oversell} onChange={(v) => setSettings({ ...settings, allow_oversell: v })} />
        <Toggle label="Afficher le prix barré" desc="Montrer l'ancien prix quand un produit est en promotion" checked={settings.show_compare_price} onChange={(v) => setSettings({ ...settings, show_compare_price: v })} />
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">Seuil de stock bas (par défaut)</label>
          <div className="flex items-center gap-2">
            <Input type="number" value={settings.default_low_stock} onChange={(e) => setSettings({ ...settings, default_low_stock: e.target.value })} className="w-24" min="1" />
            <span className="text-sm text-muted-foreground">unités</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Alerte quand le stock descend en dessous de ce seuil.</p>
        </div>

        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">Marge minimale (%)</label>
          <div className="flex items-center gap-2">
            <Input type="number" value={settings.min_margin_pct} onChange={(e) => setSettings({ ...settings, min_margin_pct: e.target.value })} className="w-24" placeholder="20" min="0" max="100" />
            <span className="text-sm text-muted-foreground">%</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Smart pricing : alerte si un prix de vente est trop proche du coût. Laissez vide pour désactiver.</p>
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving}>
        {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
        Enregistrer
      </Button>
    </div>
  );
}
