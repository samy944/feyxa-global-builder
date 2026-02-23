import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStore } from "@/hooks/useStore";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Save, Loader2 } from "lucide-react";

export default function SettingsTaxes() {
  const { store, refetch } = useStore();
  const [settings, setSettings] = useState({
    tax_included: true,
    tax_rate: "",
    tax_id: "",
    invoice_prefix: "FX-",
    show_tax_on_receipt: false,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!store) return;
    const s = (store.settings as Record<string, any>) || {};
    setSettings({
      tax_included: s.tax_included ?? true,
      tax_rate: s.tax_rate?.toString() || "",
      tax_id: s.tax_id || "",
      invoice_prefix: s.invoice_prefix || "FX-",
      show_tax_on_receipt: s.show_tax_on_receipt ?? false,
    });
  }, [store]);

  const handleSave = async () => {
    if (!store) return;
    setSaving(true);
    const current = (store.settings as Record<string, any>) || {};
    const rate = parseFloat(settings.tax_rate);
    const { error } = await supabase.from("stores").update({
      settings: {
        ...current,
        tax_included: settings.tax_included,
        tax_rate: isNaN(rate) ? null : rate,
        tax_id: settings.tax_id.trim() || null,
        invoice_prefix: settings.invoice_prefix.trim() || "FX-",
        show_tax_on_receipt: settings.show_tax_on_receipt,
      },
    }).eq("id", store.id);
    setSaving(false);
    if (error) { toast.error("Erreur"); return; }
    toast.success("Paramètres fiscaux enregistrés");
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
        <h2 className="text-lg font-semibold text-foreground">Taxes & Facturation</h2>
        <p className="text-sm text-muted-foreground mt-1">Configurez la gestion fiscale et la facturation de votre boutique.</p>
      </div>

      <div className="space-y-2">
        <Toggle label="Prix TTC" desc="Les prix affichés incluent déjà les taxes" checked={settings.tax_included} onChange={(v) => setSettings({ ...settings, tax_included: v })} />
        <Toggle label="Afficher la TVA sur les reçus" desc="Détailler le montant de TVA sur les reçus de commande" checked={settings.show_tax_on_receipt} onChange={(v) => setSettings({ ...settings, show_tax_on_receipt: v })} />
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">Taux de TVA (%)</label>
          <div className="flex items-center gap-2">
            <Input type="number" value={settings.tax_rate} onChange={(e) => setSettings({ ...settings, tax_rate: e.target.value })} className="w-24" placeholder="18" min="0" max="100" />
            <span className="text-sm text-muted-foreground">%</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">TVA standard au Bénin : 18%. Laissez vide si pas applicable.</p>
        </div>

        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">Numéro d'identification fiscale (IFU / NIF)</label>
          <Input value={settings.tax_id} onChange={(e) => setSettings({ ...settings, tax_id: e.target.value })} placeholder="Ex: 1234567890" className="font-mono" />
        </div>

        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">Préfixe des factures</label>
          <Input value={settings.invoice_prefix} onChange={(e) => setSettings({ ...settings, invoice_prefix: e.target.value })} className="w-32 font-mono" placeholder="FX-" />
          <p className="text-xs text-muted-foreground mt-1">Exemple : {settings.invoice_prefix || "FX-"}0001</p>
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving}>
        {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
        Enregistrer
      </Button>
    </div>
  );
}
