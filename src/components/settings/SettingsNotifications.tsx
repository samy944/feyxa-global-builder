import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useStore } from "@/hooks/useStore";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Save, Loader2 } from "lucide-react";

const NOTIFICATION_TYPES = [
  { key: "new_order", label: "Nouvelle commande", desc: "Notification push et son à chaque nouvelle commande", default: true },
  { key: "low_stock", label: "Stock bas", desc: "Alerte quand un produit atteint le seuil minimum", default: true },
  { key: "conversion_alert", label: "Alerte conversion", desc: "Notification si le taux de conversion baisse", default: false },
  { key: "trend_alert", label: "Tendances marché", desc: "Alertes sur les tendances de votre catégorie", default: true },
  { key: "review_received", label: "Nouvel avis", desc: "Quand un client laisse un avis sur un produit", default: true },
  { key: "payout_update", label: "Mise à jour retrait", desc: "Statut de vos demandes de retrait", default: true },
  { key: "escrow_release", label: "Fonds libérés", desc: "Quand les fonds d'une commande sont disponibles", default: true },
];

export default function SettingsNotifications() {
  const { store, refetch } = useStore();
  const [prefs, setPrefs] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!store) return;
    const s = (store.settings as Record<string, any>) || {};
    const saved = s.notification_prefs || {};
    const initial: Record<string, boolean> = {};
    NOTIFICATION_TYPES.forEach(n => {
      initial[n.key] = saved[n.key] ?? n.default;
    });
    setPrefs(initial);
  }, [store]);

  const handleSave = async () => {
    if (!store) return;
    setSaving(true);
    const current = (store.settings as Record<string, any>) || {};
    const { error } = await supabase.from("stores").update({
      settings: { ...current, notification_prefs: prefs },
    }).eq("id", store.id);
    setSaving(false);
    if (error) { toast.error("Erreur"); return; }
    toast.success("Préférences de notification enregistrées");
    refetch();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Notifications</h2>
        <p className="text-sm text-muted-foreground mt-1">Choisissez les notifications que vous souhaitez recevoir.</p>
      </div>

      <div className="space-y-2">
        {NOTIFICATION_TYPES.map(n => (
          <div key={n.key} className="flex items-center justify-between p-3 rounded-lg border border-border">
            <div>
              <p className="text-sm font-medium text-foreground">{n.label}</p>
              <p className="text-xs text-muted-foreground">{n.desc}</p>
            </div>
            <button
              onClick={() => setPrefs({ ...prefs, [n.key]: !prefs[n.key] })}
              className={`w-11 h-6 rounded-full transition-colors relative ${prefs[n.key] ? "bg-primary" : "bg-secondary"}`}
            >
              <div
                className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform"
                style={{ transform: prefs[n.key] ? "translateX(20px)" : "translateX(0)" }}
              />
            </button>
          </div>
        ))}
      </div>

      <Button onClick={handleSave} disabled={saving}>
        {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
        Enregistrer
      </Button>
    </div>
  );
}
