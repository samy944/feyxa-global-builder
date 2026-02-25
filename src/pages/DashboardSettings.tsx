import { useState } from "react";
import { motion } from "framer-motion";
import {
  Store, Palette, Globe, Navigation, Package, ShoppingCart,
  CreditCard, Truck, Receipt, Users, BarChart3, Search,
  Bell, Shield, FileText, ShoppingBag,
} from "lucide-react";

// Section components
import SettingsStoreDetails from "@/components/settings/SettingsStoreDetails";
import SettingsShipping from "@/components/settings/SettingsShipping";
import SettingsTeam from "@/components/settings/SettingsTeam";
import SettingsCheckout from "@/components/settings/SettingsCheckout";
import SettingsPayments from "@/components/settings/SettingsPayments";
import SettingsLegal from "@/components/settings/SettingsLegal";
import SettingsSeo from "@/components/settings/SettingsSeo";
import SettingsNotifications from "@/components/settings/SettingsNotifications";
import SettingsMarketplace from "@/components/settings/SettingsMarketplace";
import SettingsProducts from "@/components/settings/SettingsProducts";
import SettingsDomains from "@/components/settings/SettingsDomains";
import SettingsTaxes from "@/components/settings/SettingsTaxes";
import SettingsSecurity from "@/components/settings/SettingsSecurity";
import SettingsNavPages from "@/components/settings/SettingsNavPages";
import SettingsCustomers from "@/components/settings/SettingsCustomers";
import { StorefrontThemePicker } from "@/components/dashboard/StorefrontThemePicker";
import { useStore } from "@/hooks/useStore";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Tracking section from previous implementation
import { useState as useStateAlias, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Save, Loader2, Activity } from "lucide-react";

const sections = [
  { id: "store", label: "Boutique", icon: Store, group: "Général" },
  { id: "branding", label: "Apparence & Thème", icon: Palette, group: "Général" },
  { id: "domains", label: "Domaines", icon: Globe, group: "Général" },
  { id: "nav", label: "Navigation & Pages", icon: Navigation, group: "Général" },

  { id: "products", label: "Produits & Inventaire", icon: Package, group: "Commerce" },
  { id: "checkout", label: "Checkout", icon: ShoppingCart, group: "Commerce" },
  { id: "payments", label: "Paiements", icon: CreditCard, group: "Commerce" },
  { id: "shipping", label: "Livraison", icon: Truck, group: "Commerce" },
  { id: "taxes", label: "Taxes & Facturation", icon: Receipt, group: "Commerce" },
  { id: "customers", label: "Clients", icon: Users, group: "Commerce" },

  { id: "tracking", label: "Marketing & Pixels", icon: BarChart3, group: "Marketing" },
  { id: "seo", label: "SEO", icon: Search, group: "Marketing" },

  { id: "team", label: "Équipe & Rôles", icon: Users, group: "Système" },
  { id: "notifications", label: "Notifications", icon: Bell, group: "Système" },
  { id: "security", label: "Sécurité", icon: Shield, group: "Système" },
  { id: "legal", label: "Légal & Conformité", icon: FileText, group: "Système" },
  { id: "marketplace", label: "Marketplace", icon: ShoppingBag, group: "Système" },
];

const groups = ["Général", "Commerce", "Marketing", "Système"];

export default function DashboardSettings() {
  const [activeSection, setActiveSection] = useState("store");

  return (
    <div className="p-6 lg:p-8">
      <h1 className="text-2xl font-bold text-foreground tracking-tight mb-1">Paramètres</h1>
      <p className="text-sm text-muted-foreground mb-6">Configurez chaque aspect de votre boutique Feyxa.</p>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar nav */}
        <nav className="lg:w-52 shrink-0 space-y-4 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0">
          {/* Mobile: horizontal scroll */}
          <div className="flex lg:hidden gap-1 overflow-x-auto pb-2">
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                  activeSection === s.id
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                <s.icon size={14} />
                {s.label}
              </button>
            ))}
          </div>

          {/* Desktop: grouped vertical nav */}
          <div className="hidden lg:block space-y-4">
            {groups.map((group) => (
              <div key={group}>
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider px-3 mb-1">{group}</p>
                <div className="space-y-0.5">
                  {sections.filter(s => s.group === group).map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setActiveSection(s.id)}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors text-left ${
                        activeSection === s.id
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                      }`}
                    >
                      <s.icon size={16} />
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </nav>

        {/* Content */}
        <div className="flex-1 max-w-2xl">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-border bg-card p-6"
          >
            {activeSection === "store" && <SettingsStoreDetails />}
            {activeSection === "branding" && <BrandingSection />}
            {activeSection === "domains" && <SettingsDomains />}
            {activeSection === "nav" && <SettingsNavPages />}
            {activeSection === "products" && <SettingsProducts />}
            {activeSection === "checkout" && <SettingsCheckout />}
            {activeSection === "payments" && <SettingsPayments />}
            {activeSection === "shipping" && <SettingsShipping />}
            {activeSection === "taxes" && <SettingsTaxes />}
            {activeSection === "customers" && <SettingsCustomers />}
            {activeSection === "tracking" && <TrackingPixelsSection />}
            {activeSection === "seo" && <SettingsSeo />}
            {activeSection === "team" && <SettingsTeam />}
            {activeSection === "notifications" && <SettingsNotifications />}
            {activeSection === "security" && <SettingsSecurity />}
            {activeSection === "legal" && <SettingsLegal />}
            {activeSection === "marketplace" && <SettingsMarketplace />}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// --- Branding Section (wraps StorefrontThemePicker) ---
function BrandingSection() {
  const { store, refetch } = useStore();
  const [selectedTheme, setSelectedTheme] = useState("classic");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!store) return;
    const theme = store.theme as Record<string, any> | null;
    if (theme?.storefront_theme_id) {
      setSelectedTheme(theme.storefront_theme_id);
    }
  }, [store]);

  const handleSelect = async (themeId: string) => {
    setSelectedTheme(themeId);
    if (!store) return;
    setSaving(true);
    const currentTheme = (store.theme as Record<string, any>) || {};
    const { error } = await supabase
      .from("stores")
      .update({ theme: { ...currentTheme, storefront_theme_id: themeId } as any })
      .eq("id", store.id);
    setSaving(false);
    if (error) { toast.error("Erreur de sauvegarde"); return; }
    toast.success("Thème appliqué !");
    refetch();
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Apparence & Thème</h2>
        <p className="text-sm text-muted-foreground mt-1">Choisissez le design de votre storefront parmi nos templates premium.</p>
      </div>
      <StorefrontThemePicker selectedThemeId={selectedTheme} onSelect={handleSelect} storeSlug={store?.slug} />
    </div>
  );
}

// --- Tracking Pixels (migrated from old file) ---
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
    const { error } = await supabase
      .from("store_tracking_settings")
      .upsert({
        store_id: store.id,
        meta_pixel_id: metaPixelId.trim() || null,
        tiktok_pixel_id: tiktokPixelId.trim() || null,
        google_tag_id: googleTagId.trim() || null,
        snapchat_pixel_id: snapchatPixelId.trim() || null,
        pinterest_tag_id: pinterestTagId.trim() || null,
      }, { onConflict: "store_id" });
    setSaving(false);
    if (error) { toast.error("Erreur"); return; }
    toast.success("Pixels sauvegardés");
  }

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-muted-foreground" size={20} /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Marketing & Pixels</h2>
        <p className="text-sm text-muted-foreground mt-1">Ajoutez vos pixels marketing pour suivre les conversions.</p>
      </div>
      <div className="space-y-4">
        {[
          { label: "Meta Pixel ID (Facebook/Instagram)", value: metaPixelId, set: setMetaPixelId, placeholder: "Ex: 123456789012345", help: "Meta Events Manager → Paramètres → ID du pixel" },
          { label: "TikTok Pixel ID", value: tiktokPixelId, set: setTiktokPixelId, placeholder: "Ex: C1234567890ABCDEF", help: "TikTok Ads Manager → Ressources → Événements" },
          { label: "Google Tag ID (GA4 / GTM)", value: googleTagId, set: setGoogleTagId, placeholder: "Ex: G-XXXXXXXXXX", help: "Google Analytics → Admin → Flux de données" },
          { label: "Snapchat Pixel ID", value: snapchatPixelId, set: setSnapchatPixelId, placeholder: "Ex: 12345678-abcd-...", help: "Snapchat Ads Manager → Events Manager" },
          { label: "Pinterest Tag ID", value: pinterestTagId, set: setPinterestTagId, placeholder: "Ex: 1234567890123", help: "Pinterest Ads → Conversions → Tag ID" },
        ].map(field => (
          <div key={field.label}>
            <label className="text-sm font-medium text-foreground mb-1.5 block">{field.label}</label>
            <Input value={field.value} onChange={(e) => field.set(e.target.value)} placeholder={field.placeholder} className="font-mono text-sm" />
            <p className="text-xs text-muted-foreground mt-1">{field.help}</p>
          </div>
        ))}

        <div className="p-3 rounded-lg bg-secondary/50 text-xs text-muted-foreground space-y-1">
          <p className="font-medium text-foreground text-sm">Événements suivis automatiquement :</p>
          <ul className="list-disc list-inside space-y-0.5">
            <li><strong>PageView</strong> — Chaque visite</li>
            <li><strong>ViewContent</strong> — Consultation produit</li>
            <li><strong>AddToCart</strong> — Ajout au panier</li>
            <li><strong>InitiateCheckout</strong> — Début checkout</li>
            <li><strong>Purchase</strong> — Achat confirmé</li>
          </ul>
        </div>

        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          Enregistrer les pixels
        </Button>
      </div>

      {/* Conversion threshold */}
      <div className="border-t border-border pt-6 space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Alerte de conversion</h3>
        <p className="text-xs text-muted-foreground">Notification si votre taux descend en dessous du seuil.</p>
        <div className="flex items-center gap-3">
          <Input type="number" step="0.1" min="0" max="100" value={conversionThreshold} onChange={(e) => setConversionThreshold(e.target.value)} placeholder="2.5" className="font-mono text-sm w-40" />
          <span className="text-sm text-muted-foreground">%</span>
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
            const { error } = await supabase.from("stores").update({
              settings: { ...currentSettings, conversion_threshold: isNaN(val) || val <= 0 ? null : val },
            }).eq("id", store.id);
            setSavingThreshold(false);
            if (error) { toast.error("Erreur"); return; }
            refetchStore();
            toast.success(isNaN(val) || val <= 0 ? "Alertes désactivées" : `Seuil enregistré : ${val}%`);
          }}
        >
          {savingThreshold ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          Enregistrer le seuil
        </Button>
      </div>
    </div>
  );
}
