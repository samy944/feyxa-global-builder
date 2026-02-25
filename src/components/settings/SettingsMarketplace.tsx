import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useStore } from "@/hooks/useStore";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Save, Loader2, Store, Globe } from "lucide-react";

export default function SettingsMarketplace() {
  const { store, refetch } = useStore();
  const [settings, setSettings] = useState({
    marketplace_enabled: false,
    marketplace_commission_rate: "5",
    marketplace_auto_publish: false,
  });
  const [productCount, setProductCount] = useState(0);
  const [publishedCount, setPublishedCount] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!store) return;
    const s = (store.settings as Record<string, any>) || {};
    setSettings({
      marketplace_enabled: s.marketplace_enabled ?? false,
      marketplace_commission_rate: (s.marketplace_commission_rate ?? 5).toString(),
      marketplace_auto_publish: s.marketplace_auto_publish ?? false,
    });
    // Count products
    supabase.from("products").select("id, is_marketplace_published", { count: "exact" }).eq("store_id", store.id).then(({ count, data }) => {
      setProductCount(count || 0);
      setPublishedCount(data?.filter(p => p.is_marketplace_published).length || 0);
    });
  }, [store]);

  const handleSave = async () => {
    if (!store) return;
    setSaving(true);
    const current = (store.settings as Record<string, any>) || {};
    const { error } = await supabase.from("stores").update({
      settings: {
        ...current,
        marketplace_enabled: settings.marketplace_enabled,
        marketplace_commission_rate: parseFloat(settings.marketplace_commission_rate) || 5,
        marketplace_auto_publish: settings.marketplace_auto_publish,
      },
    }).eq("id", store.id);
    setSaving(false);
    if (error) { toast.error("Erreur de sauvegarde"); return; }
    toast.success("Paramètres marketplace enregistrés");
    refetch();
  };

  const Toggle = ({ label, desc, checked, onChange }: { label: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) => (
    <div className="flex items-center justify-between p-3 rounded-lg border border-border">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`w-11 h-6 rounded-full transition-colors relative ${checked ? "bg-primary" : "bg-secondary"}`}
      >
        <div className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform" style={{ transform: checked ? "translateX(20px)" : "translateX(0)" }} />
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Feyxa Marketplace</h2>
        <p className="text-sm text-muted-foreground mt-1">Configurez la présence de votre boutique sur la place de marché Feyxa.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 rounded-lg bg-secondary/50 border border-border">
          <p className="text-2xl font-bold text-foreground">{productCount}</p>
          <p className="text-xs text-muted-foreground">Produits total</p>
        </div>
        <div className="p-4 rounded-lg bg-secondary/50 border border-border">
          <div className="flex items-center gap-2">
            <p className="text-2xl font-bold text-foreground">{publishedCount}</p>
            <Globe size={16} className="text-accent" />
          </div>
          <p className="text-xs text-muted-foreground">Publiés sur le marketplace</p>
        </div>
      </div>

      <div className="space-y-2">
        <Toggle
          label="Activer la marketplace"
          desc="Rendre vos produits visibles sur Feyxa Market"
          checked={settings.marketplace_enabled}
          onChange={(v) => setSettings({ ...settings, marketplace_enabled: v })}
        />
        <Toggle
          label="Publication automatique"
          desc="Publier automatiquement les nouveaux produits sur le marketplace"
          checked={settings.marketplace_auto_publish}
          onChange={(v) => setSettings({ ...settings, marketplace_auto_publish: v })}
        />
      </div>

      <div>
        <label className="text-sm font-medium text-foreground mb-1.5 block">Commission marketplace</label>
        <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary/50 border border-border">
          <span className="text-lg font-bold text-foreground">{settings.marketplace_commission_rate}%</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">Taux de commission défini par la plateforme Feyxa. Ce taux n'est pas modifiable.</p>
      </div>

      <Button onClick={handleSave} disabled={saving}>
        {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
        Enregistrer
      </Button>
    </div>
  );
}
