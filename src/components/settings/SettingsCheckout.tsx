import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStore } from "@/hooks/useStore";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Save, Loader2 } from "lucide-react";

export default function SettingsCheckout() {
  const { store, refetch } = useStore();
  const [settings, setSettings] = useState({
    require_phone: true,
    require_city: true,
    require_quarter: true,
    require_address: false,
    whatsapp_confirmation: true,
    cod_enabled: true,
    min_order_amount: "",
    checkout_note_placeholder: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!store) return;
    const s = (store.settings as Record<string, any>) || {};
    setSettings({
      require_phone: s.checkout_require_phone ?? true,
      require_city: s.checkout_require_city ?? true,
      require_quarter: s.checkout_require_quarter ?? true,
      require_address: s.checkout_require_address ?? false,
      whatsapp_confirmation: s.checkout_whatsapp_confirmation ?? true,
      cod_enabled: s.checkout_cod_enabled ?? true,
      min_order_amount: s.checkout_min_order_amount?.toString() || "",
      checkout_note_placeholder: s.checkout_note_placeholder || "",
    });
  }, [store]);

  const handleSave = async () => {
    if (!store) return;
    setSaving(true);
    const current = (store.settings as Record<string, any>) || {};
    const minVal = parseFloat(settings.min_order_amount);
    const newSettings = {
      ...current,
      checkout_require_phone: settings.require_phone,
      checkout_require_city: settings.require_city,
      checkout_require_quarter: settings.require_quarter,
      checkout_require_address: settings.require_address,
      checkout_whatsapp_confirmation: settings.whatsapp_confirmation,
      checkout_cod_enabled: settings.cod_enabled,
      checkout_min_order_amount: isNaN(minVal) ? null : minVal,
      checkout_note_placeholder: settings.checkout_note_placeholder.trim() || null,
    };
    const { error } = await supabase.from("stores").update({ settings: newSettings }).eq("id", store.id);
    setSaving(false);
    if (error) { toast.error("Erreur de sauvegarde"); return; }
    toast.success("Paramètres checkout enregistrés");
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
        <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5.5 left-0.5" : "left-0.5"}`}
          style={{ transform: checked ? "translateX(20px)" : "translateX(0)" }}
        />
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Checkout</h2>
        <p className="text-sm text-muted-foreground mt-1">Personnalisez l'expérience de paiement Africa-first de votre boutique.</p>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Champs requis</p>
        <Toggle label="Numéro de téléphone" desc="Obligatoire pour la livraison" checked={settings.require_phone} onChange={(v) => setSettings({ ...settings, require_phone: v })} />
        <Toggle label="Ville" desc="Aide à calculer les frais de livraison" checked={settings.require_city} onChange={(v) => setSettings({ ...settings, require_city: v })} />
        <Toggle label="Quartier / Repère" desc="Indispensable pour les livraisons en Afrique de l'Ouest" checked={settings.require_quarter} onChange={(v) => setSettings({ ...settings, require_quarter: v })} />
        <Toggle label="Adresse complète" desc="Adresse détaillée (optionnel dans la plupart des villes)" checked={settings.require_address} onChange={(v) => setSettings({ ...settings, require_address: v })} />
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Options</p>
        <Toggle label="Notification de commande" desc="Envoyer une notification après chaque commande" checked={settings.whatsapp_confirmation} onChange={(v) => setSettings({ ...settings, whatsapp_confirmation: v })} />
        <Toggle label="Paiement à la livraison (COD)" desc="Permettre le paiement en espèces à la réception" checked={settings.cod_enabled} onChange={(v) => setSettings({ ...settings, cod_enabled: v })} />
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">Montant minimum de commande</label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={settings.min_order_amount}
              onChange={(e) => setSettings({ ...settings, min_order_amount: e.target.value })}
              placeholder="0"
              className="w-40"
            />
            <span className="text-sm text-muted-foreground">{store?.currency || "XOF"}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Laissez vide ou 0 pour aucun minimum.</p>
        </div>

        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">Placeholder note de commande</label>
          <Input
            value={settings.checkout_note_placeholder}
            onChange={(e) => setSettings({ ...settings, checkout_note_placeholder: e.target.value })}
            placeholder="Ex: Instructions spéciales de livraison..."
          />
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving}>
        {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
        Enregistrer
      </Button>
    </div>
  );
}
