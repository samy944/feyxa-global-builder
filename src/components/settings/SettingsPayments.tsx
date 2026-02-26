import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useStore } from "@/hooks/useStore";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Save, Loader2, Wallet, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type PlatformProvider = {
  id: string;
  provider: string;
  display_name: string;
  is_enabled: boolean;
  config: Record<string, any>;
};

export default function SettingsPayments() {
  const { store, refetch } = useStore();
  const [platformProviders, setPlatformProviders] = useState<PlatformProvider[]>([]);
  const [vendorEnabled, setVendorEnabled] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [store]);

  async function loadData() {
    if (!store) return;
    setLoading(true);

    // Load platform-level providers (admin-defined)
    const { data: providers } = await supabase
      .from("platform_payment_providers")
      .select("*")
      .order("display_name");

    const enabledProviders = ((providers as any[]) || []).filter((p: any) => p.is_enabled) as PlatformProvider[];
    setPlatformProviders(enabledProviders);

    // Load vendor's own selections
    const s = (store.settings as Record<string, any>) || {};
    const saved = s.payment_methods || {};
    const initial: Record<string, boolean> = {};
    enabledProviders.forEach(p => {
      // Default: enable COD and mobile_money, others off
      const defaultOn = ["cod", "mobile_money"].includes(p.provider);
      initial[p.provider] = saved[p.provider] ?? defaultOn;
    });
    setVendorEnabled(initial);
    setLoading(false);
  }

  const handleSave = async () => {
    if (!store) return;
    setSaving(true);
    const current = (store.settings as Record<string, any>) || {};
    const { error } = await supabase.from("stores").update({
      settings: { ...current, payment_methods: vendorEnabled },
    }).eq("id", store.id);
    setSaving(false);
    if (error) { toast.error("Erreur de sauvegarde"); return; }
    toast.success("Méthodes de paiement mises à jour");
    refetch();
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-muted-foreground" size={20} /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Paiements</h2>
        <p className="text-sm text-muted-foreground mt-1">Activez les méthodes de paiement que vous souhaitez proposer parmi celles autorisées par la plateforme.</p>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-2 p-3 rounded-lg bg-secondary/50 border border-border">
        <Info size={14} className="text-primary mt-0.5 shrink-0" />
        <p className="text-xs text-muted-foreground">
          Les méthodes de paiement disponibles sont définies par l'administrateur de la plateforme. Vous pouvez activer ou désactiver celles que vous souhaitez utiliser.
        </p>
      </div>

      {platformProviders.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">Aucune méthode de paiement n'a été activée par l'administrateur.</p>
      ) : (
        <div className="space-y-2">
          {platformProviders.map(pm => (
            <div key={pm.id} className="flex items-center justify-between p-4 rounded-lg border border-border">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground">{pm.display_name}</p>
                  <Badge variant="outline" className="text-[10px]">Plateforme</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{(pm.config as Record<string, any>)?.description || pm.provider}</p>
              </div>
              <button
                onClick={() => setVendorEnabled({ ...vendorEnabled, [pm.provider]: !vendorEnabled[pm.provider] })}
                className={`w-11 h-6 rounded-full transition-colors relative ${vendorEnabled[pm.provider] ? "bg-primary" : "bg-secondary"}`}
              >
                <div
                  className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform"
                  style={{ transform: vendorEnabled[pm.provider] ? "translateX(20px)" : "translateX(0)" }}
                />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Escrow info */}
      <div className="p-4 rounded-lg bg-secondary/50 border border-border">
        <div className="flex items-center gap-2 mb-2">
          <Wallet size={16} className="text-primary" />
          <p className="text-sm font-medium text-foreground">Système Escrow Feyxa</p>
        </div>
        <p className="text-xs text-muted-foreground">
          Les fonds sont automatiquement bloqués pendant 7 jours ou jusqu'à confirmation par l'acheteur.
          Le taux de commission est défini globalement par la plateforme. Gérez vos fonds dans l'onglet Portefeuille.
        </p>
      </div>

      <Button onClick={handleSave} disabled={saving}>
        {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
        Enregistrer
      </Button>
    </div>
  );
}
