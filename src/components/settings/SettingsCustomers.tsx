import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useStore } from "@/hooks/useStore";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Save, Loader2, Users } from "lucide-react";

export default function SettingsCustomers() {
  const { store, refetch } = useStore();
  const [customerCount, setCustomerCount] = useState(0);
  const [settings, setSettings] = useState({
    auto_merge_customers: true,
    collect_email: false,
    require_account: false,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!store) return;
    const s = (store.settings as Record<string, any>) || {};
    setSettings({
      auto_merge_customers: s.auto_merge_customers ?? true,
      collect_email: s.collect_email ?? false,
      require_account: s.require_account ?? false,
    });
    supabase.from("customers").select("id", { count: "exact", head: true }).eq("store_id", store.id).then(({ count }) => {
      setCustomerCount(count || 0);
    });
  }, [store]);

  const handleSave = async () => {
    if (!store) return;
    setSaving(true);
    const current = (store.settings as Record<string, any>) || {};
    const { error } = await supabase.from("stores").update({
      settings: { ...current, ...settings },
    }).eq("id", store.id);
    setSaving(false);
    if (error) { toast.error("Erreur"); return; }
    toast.success("Paramètres clients enregistrés");
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
        <h2 className="text-lg font-semibold text-foreground">Clients</h2>
        <p className="text-sm text-muted-foreground mt-1">Gérez le comportement de votre fichier clients.</p>
      </div>

      <div className="p-4 rounded-lg bg-secondary/50 border border-border flex items-center gap-3">
        <Users size={20} className="text-primary" />
        <div>
          <p className="text-2xl font-bold text-foreground">{customerCount}</p>
          <p className="text-xs text-muted-foreground">clients dans votre base</p>
        </div>
      </div>

      <div className="space-y-2">
        <Toggle label="Dédoublonnage automatique" desc="Fusionner les clients avec le même numéro de téléphone" checked={settings.auto_merge_customers} onChange={(v) => setSettings({ ...settings, auto_merge_customers: v })} />
        <Toggle label="Collecter les emails" desc="Demander l'email en plus du téléphone au checkout" checked={settings.collect_email} onChange={(v) => setSettings({ ...settings, collect_email: v })} />
        <Toggle label="Compte client obligatoire" desc="Exiger la création d'un compte pour commander (déconseillé)" checked={settings.require_account} onChange={(v) => setSettings({ ...settings, require_account: v })} />
      </div>

      <Button onClick={handleSave} disabled={saving}>
        {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
        Enregistrer
      </Button>
    </div>
  );
}
