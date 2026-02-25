import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useStore } from "@/hooks/useStore";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Save, Loader2, Wallet } from "lucide-react";

const PAYMENT_METHODS = [
  { key: "cod", name: "Paiement à la livraison (COD)", desc: "Le client paie en espèces à la réception", default: true },
  { key: "mobile_money", name: "Mobile Money (MTN/Orange/Wave)", desc: "Paiement via mobile money", default: true },
  
  { key: "stripe", name: "Stripe", desc: "Paiement par carte bancaire internationale", default: false },
  { key: "paystack", name: "Paystack", desc: "Paiement en ligne pour l'Afrique", default: false },
];

export default function SettingsPayments() {
  const { store, refetch } = useStore();
  const [methods, setMethods] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!store) return;
    const s = (store.settings as Record<string, any>) || {};
    const saved = s.payment_methods || {};
    const initial: Record<string, boolean> = {};
    PAYMENT_METHODS.forEach(m => {
      initial[m.key] = saved[m.key] ?? m.default;
    });
    setMethods(initial);
  }, [store]);

  const handleSave = async () => {
    if (!store) return;
    setSaving(true);
    const current = (store.settings as Record<string, any>) || {};
    const { error } = await supabase.from("stores").update({
      settings: { ...current, payment_methods: methods },
    }).eq("id", store.id);
    setSaving(false);
    if (error) { toast.error("Erreur de sauvegarde"); return; }
    toast.success("Méthodes de paiement mises à jour");
    refetch();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Paiements</h2>
        <p className="text-sm text-muted-foreground mt-1">Choisissez les méthodes de paiement acceptées par votre boutique.</p>
      </div>

      <div className="space-y-2">
        {PAYMENT_METHODS.map(pm => (
          <div key={pm.key} className="flex items-center justify-between p-4 rounded-lg border border-border">
            <div>
              <p className="text-sm font-medium text-foreground">{pm.name}</p>
              <p className="text-xs text-muted-foreground">{pm.desc}</p>
            </div>
            <button
              onClick={() => setMethods({ ...methods, [pm.key]: !methods[pm.key] })}
              className={`w-11 h-6 rounded-full transition-colors relative ${methods[pm.key] ? "bg-primary" : "bg-secondary"}`}
            >
              <div
                className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform"
                style={{ transform: methods[pm.key] ? "translateX(20px)" : "translateX(0)" }}
              />
            </button>
          </div>
        ))}
      </div>

      {/* Escrow info */}
      <div className="p-4 rounded-lg bg-secondary/50 border border-border">
        <div className="flex items-center gap-2 mb-2">
          <Wallet size={16} className="text-primary" />
          <p className="text-sm font-medium text-foreground">Système Escrow Feyxa</p>
        </div>
        <p className="text-xs text-muted-foreground">
          Les fonds sont automatiquement bloqués pendant 7 jours ou jusqu'à confirmation par l'acheteur.
          Commission de 5% prélevée automatiquement. Gérez vos fonds dans l'onglet Portefeuille.
        </p>
      </div>

      <Button onClick={handleSave} disabled={saving}>
        {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
        Enregistrer
      </Button>
    </div>
  );
}
