import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useStore } from "@/hooks/useStore";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { toast } from "@/hooks/use-toast";
import {
  Store, Globe, Palette, Truck, CreditCard, Bell, Shield, Users, Save, Activity, Loader2
} from "lucide-react";

const sections = [
  { id: "general", label: "Général", icon: Store },
  { id: "team", label: "Équipe", icon: Users },
  { id: "delivery", label: "Livraison", icon: Truck },
  { id: "payments", label: "Paiements", icon: CreditCard },
  { id: "tracking", label: "Tracking & Pixels", icon: Activity },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "domain", label: "Domaine", icon: Globe },
  { id: "theme", label: "Apparence", icon: Palette },
  { id: "security", label: "Sécurité", icon: Shield },
];

export default function DashboardSettings() {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState("general");

  return (
    <div className="p-6 lg:p-8">
      <h1 className="text-2xl font-bold text-foreground tracking-tight mb-6">Paramètres</h1>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar nav */}
        <nav className="lg:w-48 flex lg:flex-col gap-1 overflow-x-auto pb-2 lg:pb-0">
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors whitespace-nowrap ${
                activeSection === s.id
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              <s.icon size={16} />
              {s.label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="flex-1 max-w-2xl">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-border bg-card p-6 space-y-6"
          >
            {activeSection === "general" && (
              <>
                <h2 className="text-lg font-semibold text-foreground">Informations générales</h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Nom de la boutique</label>
                    <input
                      defaultValue="Ma Boutique Demo"
                      className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Description</label>
                    <textarea
                      rows={3}
                      defaultValue="Boutique de mode et accessoires à Cotonou"
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Devise</label>
                      <select className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
                        <option>XOF (Franc CFA)</option>
                        <option>EUR (Euro)</option>
                        <option>USD (Dollar US)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Langue</label>
                      <select className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
                        <option>Français</option>
                        <option>English</option>
                      </select>
                    </div>
                  </div>
                  <Button variant="hero" size="sm">
                    <Save size={14} />
                    Enregistrer
                  </Button>
                </div>
              </>
            )}

            {activeSection === "payments" && (
              <>
                <h2 className="text-lg font-semibold text-foreground">Méthodes de paiement</h2>
                <div className="space-y-3">
                  {[
                    { name: "Paiement à la livraison (COD)", desc: "Le client paie en espèces à la réception", enabled: true },
                    { name: "Mobile Money (MTN/Orange/Wave)", desc: "Paiement via mobile money — sandbox", enabled: true },
                    { name: "WhatsApp Pay", desc: "Commande via WhatsApp avec confirmation vendeur", enabled: true },
                    { name: "Stripe", desc: "Paiement par carte bancaire internationale", enabled: false },
                    { name: "Paystack", desc: "Paiement en ligne pour l'Afrique", enabled: false },
                  ].map((p) => (
                    <div key={p.name} className="flex items-center justify-between p-4 rounded-lg border border-border">
                      <div>
                        <p className="text-sm font-medium text-foreground">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.desc}</p>
                      </div>
                      <div className={`px-2 py-1 rounded text-xs font-medium ${p.enabled ? "bg-accent/10 text-accent" : "bg-secondary text-muted-foreground"}`}>
                        {p.enabled ? "Actif" : "À configurer"}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {activeSection === "delivery" && (
              <>
                <h2 className="text-lg font-semibold text-foreground">Zones de livraison</h2>
                <div className="space-y-3">
                  {[
                    { zone: "Cotonou Centre", fee: "500 XOF", active: true },
                    { zone: "Abomey-Calavi", fee: "1,000 XOF", active: true },
                    { zone: "Porto-Novo", fee: "1,500 XOF", active: true },
                    { zone: "Parakou", fee: "3,000 XOF", active: false },
                  ].map((z) => (
                    <div key={z.zone} className="flex items-center justify-between p-4 rounded-lg border border-border">
                      <div>
                        <p className="text-sm font-medium text-foreground">{z.zone}</p>
                        <p className="text-xs text-muted-foreground">Frais: {z.fee}</p>
                      </div>
                      <span className={`text-xs font-medium ${z.active ? "text-accent" : "text-muted-foreground"}`}>
                        {z.active ? "Active" : "Inactive"}
                      </span>
                    </div>
                  ))}
                  <Button variant="outline" size="sm">+ Ajouter une zone</Button>
                </div>
              </>
            )}

            {activeSection === "domain" && (
              <>
                <h2 className="text-lg font-semibold text-foreground">Domaine</h2>
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-secondary/50">
                    <p className="text-sm text-foreground font-medium">Sous-domaine actuel</p>
                    <p className="text-sm text-primary font-mono mt-1">ma-boutique.feyxa.app</p>
                  </div>
                  <div className="p-4 rounded-lg border border-border">
                    <p className="text-sm font-medium text-foreground">Domaine personnalisé</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Disponible avec le plan Pro. Configurez votre propre domaine (ex: maboutique.com).
                    </p>
                    <Button variant="outline" size="sm" className="mt-3">Configurer</Button>
                  </div>
                </div>
              </>
            )}

            {activeSection === "team" && (
              <>
                <h2 className="text-lg font-semibold text-foreground">Équipe</h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
                        {user?.email?.[0]?.toUpperCase() || "U"}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{user?.email}</p>
                        <p className="text-xs text-muted-foreground">Propriétaire</p>
                      </div>
                    </div>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded font-medium">Owner</span>
                  </div>
                  <Button variant="outline" size="sm">+ Inviter un membre</Button>
                </div>
              </>
            )}

            {activeSection === "tracking" && (
              <TrackingPixelsSection />
            )}

            {["notifications", "theme", "security"].includes(activeSection) && (
              <div className="text-center py-8">
                <p className="text-muted-foreground text-sm">Configuration {sections.find(s => s.id === activeSection)?.label} — bientôt disponible</p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// --- Tracking Pixels Sub-component ---

function TrackingPixelsSection() {
  const { store, refetch: refetchStore } = useStore();
  const [metaPixelId, setMetaPixelId] = useState("");
  const [tiktokPixelId, setTiktokPixelId] = useState("");
  const [googleTagId, setGoogleTagId] = useState("");
  const [snapchatPixelId, setSnapchatPixelId] = useState("");
  const [pinterestTagId, setPinterestTagId] = useState("");
  const [conversionThreshold, setConversionThreshold] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingThreshold, setSavingThreshold] = useState(false);

  useEffect(() => {
    if (!store) return;
    loadSettings();
    // Load conversion threshold from store settings
    const settings = (store.settings as Record<string, any>) || {};
    setConversionThreshold(settings.conversion_threshold?.toString() || "");
  }, [store]);

  async function loadSettings() {
    setLoading(true);
    const { data } = await supabase
      .from("store_tracking_settings")
      .select("meta_pixel_id, tiktok_pixel_id, google_tag_id, snapchat_pixel_id, pinterest_tag_id")
      .eq("store_id", store!.id)
      .maybeSingle();

    if (data) {
      setMetaPixelId(data.meta_pixel_id || "");
      setTiktokPixelId(data.tiktok_pixel_id || "");
      setGoogleTagId(data.google_tag_id || "");
      setSnapchatPixelId(data.snapchat_pixel_id || "");
      setPinterestTagId(data.pinterest_tag_id || "");
    }
    setLoading(false);
  }

  async function handleSave() {
    if (!store) return;
    setSaving(true);

    const payload = {
      store_id: store.id,
      meta_pixel_id: metaPixelId.trim() || null,
      tiktok_pixel_id: tiktokPixelId.trim() || null,
      google_tag_id: googleTagId.trim() || null,
      snapchat_pixel_id: snapchatPixelId.trim() || null,
      pinterest_tag_id: pinterestTagId.trim() || null,
    };

    const { error } = await supabase
      .from("store_tracking_settings")
      .upsert(payload, { onConflict: "store_id" });

    setSaving(false);

    if (error) {
      toast({ title: "Erreur", description: "Impossible de sauvegarder les pixels.", variant: "destructive" });
    } else {
      toast({ title: "Pixels sauvegardés", description: "Vos pixels marketing sont actifs sur votre storefront." });
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-muted-foreground" size={20} />
      </div>
    );
  }

  return (
    <>
      <h2 className="text-lg font-semibold text-foreground">Tracking & Pixels</h2>
      <p className="text-sm text-muted-foreground -mt-4">
        Ajoutez vos pixels marketing pour suivre les conversions sur votre boutique.
      </p>
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">Meta Pixel ID (Facebook/Instagram)</label>
          <Input
            value={metaPixelId}
            onChange={(e) => setMetaPixelId(e.target.value)}
            placeholder="Ex: 123456789012345"
            className="font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Trouvez-le dans Meta Events Manager → Paramètres → ID du pixel
          </p>
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">TikTok Pixel ID</label>
          <Input
            value={tiktokPixelId}
            onChange={(e) => setTiktokPixelId(e.target.value)}
            placeholder="Ex: C1234567890ABCDEF"
            className="font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Trouvez-le dans TikTok Ads Manager → Ressources → Événements
          </p>
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">Google Tag ID (GA4 / GTM)</label>
          <Input
            value={googleTagId}
            onChange={(e) => setGoogleTagId(e.target.value)}
            placeholder="Ex: G-XXXXXXXXXX ou GTM-XXXXXXX"
            className="font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Trouvez-le dans Google Analytics → Admin → Flux de données
          </p>
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">Snapchat Pixel ID</label>
          <Input
            value={snapchatPixelId}
            onChange={(e) => setSnapchatPixelId(e.target.value)}
            placeholder="Ex: 12345678-abcd-1234-efgh-123456789012"
            className="font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Trouvez-le dans Snapchat Ads Manager → Events Manager → Pixel ID
          </p>
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">Pinterest Tag ID</label>
          <Input
            value={pinterestTagId}
            onChange={(e) => setPinterestTagId(e.target.value)}
            placeholder="Ex: 1234567890123"
            className="font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Trouvez-le dans Pinterest Ads → Conversions → Tag ID
          </p>
        </div>

        <div className="p-3 rounded-lg bg-secondary/50 text-xs text-muted-foreground space-y-1">
          <p className="font-medium text-foreground text-sm">Événements suivis automatiquement :</p>
          <ul className="list-disc list-inside space-y-0.5">
            <li><strong>PageView</strong> — Chaque visite de page</li>
            <li><strong>ViewContent</strong> — Consultation d'un produit</li>
            <li><strong>AddToCart</strong> — Ajout au panier</li>
            <li><strong>InitiateCheckout</strong> — Début de checkout</li>
            <li><strong>Purchase</strong> — Achat confirmé (valeur, devise, produits)</li>
          </ul>
        </div>

        <Button variant="hero" size="sm" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          Enregistrer les pixels
        </Button>
      </div>

      {/* Conversion Alert Threshold */}
      <div className="border-t border-border pt-6 mt-6 space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Alerte de conversion</h2>
        <p className="text-sm text-muted-foreground -mt-3">
          Recevez une notification quotidienne si votre taux de conversion (pages vues → achats) descend en dessous du seuil défini.
        </p>
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">Seuil de conversion (%)</label>
          <div className="flex items-center gap-3">
            <Input
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={conversionThreshold}
              onChange={(e) => setConversionThreshold(e.target.value)}
              placeholder="Ex: 2.5"
              className="font-mono text-sm w-40"
            />
            <span className="text-sm text-muted-foreground">%</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Laissez vide pour désactiver les alertes. Un bon taux e-commerce est entre 1% et 5%.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={savingThreshold}
          onClick={async () => {
            if (!store) return;
            setSavingThreshold(true);
            const currentSettings = (store.settings as Record<string, any>) || {};
            const val = parseFloat(conversionThreshold);
            const newSettings = {
              ...currentSettings,
              conversion_threshold: isNaN(val) || val <= 0 ? null : val,
            };
            const { error } = await supabase
              .from("stores")
              .update({ settings: newSettings })
              .eq("id", store.id);
            setSavingThreshold(false);
            if (error) {
              toast({ title: "Erreur", description: "Impossible de sauvegarder le seuil.", variant: "destructive" });
            } else {
              refetchStore();
              toast({
                title: isNaN(val) || val <= 0 ? "Alertes désactivées" : "Seuil enregistré",
                description: isNaN(val) || val <= 0
                  ? "Vous ne recevrez plus d'alertes de conversion."
                  : `Vous serez alerté si votre taux descend en dessous de ${val}%.`,
              });
            }
          }}
        >
          {savingThreshold ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          Enregistrer le seuil
        </Button>
      </div>
    </>
  );
}
