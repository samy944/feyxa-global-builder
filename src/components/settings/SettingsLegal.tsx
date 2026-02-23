import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useStore } from "@/hooks/useStore";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Save, Loader2, FileText, Sparkles } from "lucide-react";

const POLICY_TEMPLATES: Record<string, { label: string; template: string }> = {
  benin: {
    label: "🇧🇯 Bénin",
    template: `Politique de retour — Conformément à la réglementation béninoise :

• Vous disposez d'un délai de 7 jours après réception pour demander un retour.
• Le produit doit être retourné dans son état d'origine, non utilisé, avec son emballage.
• Les frais de retour sont à la charge du client sauf en cas de produit défectueux.
• Le remboursement sera effectué sous 14 jours ouvrés via le même moyen de paiement.
• Les produits personnalisés ou périssables ne sont pas éligibles au retour.

Pour toute réclamation, contactez-nous via WhatsApp ou email.`,
  },
  senegal: {
    label: "🇸🇳 Sénégal",
    template: `Politique de retour — Conformément au droit sénégalais de la consommation :

• Droit de rétractation de 7 jours après livraison.
• Produit en état neuf avec emballage d'origine exigé.
• Remboursement sous 15 jours via Mobile Money ou virement.
• Exclusions : denrées alimentaires, articles personnalisés.

Contact : support par WhatsApp ou email.`,
  },
  civ: {
    label: "🇨🇮 Côte d'Ivoire",
    template: `Politique de retour — Selon la loi ivoirienne sur la protection du consommateur :

• Retour possible sous 7 jours après réception.
• Article non utilisé, dans son emballage d'origine.
• Remboursement sous 14 jours par Mobile Money.
• Les produits soldés sont échangeables mais non remboursables.

Contactez notre service client pour initier un retour.`,
  },
};

export default function SettingsLegal() {
  const { store, refetch } = useStore();
  const [returnPolicy, setReturnPolicy] = useState("");
  const [termsOfService, setTermsOfService] = useState("");
  const [privacyPolicy, setPrivacyPolicy] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!store) return;
    setReturnPolicy(store.return_policy || "");
    const s = (store.settings as Record<string, any>) || {};
    setTermsOfService(s.terms_of_service || "");
    setPrivacyPolicy(s.privacy_policy || "");
  }, [store]);

  const applyTemplate = (key: string) => {
    setReturnPolicy(POLICY_TEMPLATES[key].template);
    toast.success(`Template ${POLICY_TEMPLATES[key].label} appliqué`);
  };

  const handleSave = async () => {
    if (!store) return;
    setSaving(true);
    const current = (store.settings as Record<string, any>) || {};
    const [res1, res2] = await Promise.all([
      supabase.from("stores").update({ return_policy: returnPolicy.trim() || null }).eq("id", store.id),
      supabase.from("stores").update({
        settings: {
          ...current,
          terms_of_service: termsOfService.trim() || null,
          privacy_policy: privacyPolicy.trim() || null,
        },
      }).eq("id", store.id),
    ]);
    setSaving(false);
    if (res1.error || res2.error) { toast.error("Erreur de sauvegarde"); return; }
    toast.success("Pages légales enregistrées");
    refetch();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Mentions légales & Conformité</h2>
        <p className="text-sm text-muted-foreground mt-1">Configurez vos politiques légales. Des templates par pays sont disponibles.</p>
      </div>

      {/* Return Policy */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-foreground">Politique de retour</label>
          <div className="flex gap-1">
            <Sparkles size={14} className="text-primary" />
            {Object.entries(POLICY_TEMPLATES).map(([key, val]) => (
              <Button key={key} variant="ghost" size="sm" className="text-xs h-7" onClick={() => applyTemplate(key)}>
                {val.label}
              </Button>
            ))}
          </div>
        </div>
        <textarea
          value={returnPolicy}
          onChange={(e) => setReturnPolicy(e.target.value)}
          rows={8}
          placeholder="Décrivez votre politique de retour..."
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
        />
      </div>

      {/* Terms of Service */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Conditions générales de vente</label>
        <textarea
          value={termsOfService}
          onChange={(e) => setTermsOfService(e.target.value)}
          rows={6}
          placeholder="Vos CGV..."
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
        />
      </div>

      {/* Privacy Policy */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Politique de confidentialité</label>
        <textarea
          value={privacyPolicy}
          onChange={(e) => setPrivacyPolicy(e.target.value)}
          rows={6}
          placeholder="Votre politique de confidentialité..."
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
        />
      </div>

      <Button onClick={handleSave} disabled={saving}>
        {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
        Enregistrer
      </Button>
    </div>
  );
}
