import { useStore } from "@/hooks/useStore";
import { Globe, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SettingsDomains() {
  const { store } = useStore();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Domaines</h2>
        <p className="text-sm text-muted-foreground mt-1">Configurez les adresses web de votre boutique.</p>
      </div>

      {/* Current subdomain */}
      <div className="p-4 rounded-lg bg-secondary/50 border border-border space-y-2">
        <div className="flex items-center gap-2">
          <Globe size={16} className="text-primary" />
          <p className="text-sm font-medium text-foreground">Sous-domaine Feyxa</p>
        </div>
        <p className="text-sm text-primary font-mono">{store?.slug || "ma-boutique"}.feyxa.app</p>
        <p className="text-xs text-muted-foreground">Actif automatiquement — Gratuit avec tous les plans.</p>
      </div>

      {/* Custom domain */}
      <div className="p-4 rounded-lg border border-border space-y-3">
        <div className="flex items-center gap-2">
          <Globe size={16} className="text-foreground" />
          <p className="text-sm font-medium text-foreground">Domaine personnalisé</p>
        </div>
        <p className="text-xs text-muted-foreground">
          Connectez votre propre domaine (ex: maboutique.com) à votre boutique Feyxa.
          Ajoutez un enregistrement A pointant vers <code className="font-mono bg-secondary px-1 py-0.5 rounded">185.158.133.1</code>.
        </p>

        <div className="p-3 rounded bg-secondary/30 text-xs text-muted-foreground space-y-1.5">
          <p className="font-medium text-foreground text-sm">Instructions DNS :</p>
          <ul className="list-disc list-inside space-y-0.5">
            <li><strong>A Record</strong> : @ → 185.158.133.1</li>
            <li><strong>A Record</strong> : www → 185.158.133.1</li>
            <li><strong>TXT Record</strong> : _lovable → lovable_verify=...</li>
          </ul>
          <p>La propagation DNS peut prendre jusqu'à 72 heures. Le SSL est provisionné automatiquement.</p>
        </div>

        <Button variant="outline" size="sm" asChild>
          <a href="https://docs.lovable.dev/features/custom-domain" target="_blank" rel="noopener">
            <ExternalLink size={14} /> Documentation complète
          </a>
        </Button>
      </div>
    </div>
  );
}
