import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Save, Loader2, Settings, CreditCard, ToggleLeft, Package,
  Plus, Trash2, Globe, Palette, Shield, Zap, MessageSquare,
  Search, Bot, Layers, Wallet, Eye, EyeOff
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter
} from "@/components/ui/dialog";

/* ─── Types ─── */
type PlatformSetting = { key: string; value: Record<string, any> };
type PlatformPlan = {
  id: string; name: string; slug: string; description: string | null;
  price: number; currency: string; billing_interval: string;
  features: string[]; limits: Record<string, number>;
  is_active: boolean; is_default: boolean; sort_order: number;
  stripe_price_id: string | null; fedapay_plan_id: string | null;
};
type PaymentProvider = {
  id: string; provider: string; display_name: string;
  is_enabled: boolean; config: Record<string, any>;
  supported_countries: string[];
};
type FeatureFlag = {
  id: string; key: string; name: string; description: string | null;
  is_enabled: boolean; category: string;
};

const CATEGORY_ICONS: Record<string, any> = {
  commerce: Package, paiement: Wallet, marketing: Zap,
  ai: Bot, infrastructure: Globe, communication: MessageSquare,
  sécurité: Shield, general: Settings,
};

/* ─── General Tab ─── */
function GeneralTab() {
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [seo, setSeo] = useState<Record<string, any>>({});
  const [commissions, setCommissions] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("platform_settings").select("*").then(({ data }) => {
      if (data) {
        data.forEach((row: any) => {
          if (row.key === "general") setSettings(row.value as Record<string, any>);
          if (row.key === "seo") setSeo(row.value as Record<string, any>);
          if (row.key === "commissions") setCommissions(row.value as Record<string, any>);
        });
      }
      setLoading(false);
    });
  }, []);

  const save = async (key: string, value: any) => {
    setSaving(true);
    const { error } = await supabase.from("platform_settings").update({ value }).eq("key", key);
    setSaving(false);
    if (error) { toast.error("Erreur de sauvegarde"); return; }
    toast.success("Paramètres mis à jour");
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informations du site</CardTitle>
          <CardDescription>Nom, description et paramètres de base</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label>Nom du site</Label><Input value={settings.site_name || ""} onChange={e => setSettings({ ...settings, site_name: e.target.value })} /></div>
            <div><Label>Email support</Label><Input value={settings.support_email || ""} onChange={e => setSettings({ ...settings, support_email: e.target.value })} /></div>
            <div><Label>Téléphone support</Label><Input value={settings.support_phone || ""} onChange={e => setSettings({ ...settings, support_phone: e.target.value })} /></div>
            <div><Label>Devise par défaut</Label><Input value={settings.default_currency || "XOF"} onChange={e => setSettings({ ...settings, default_currency: e.target.value })} /></div>
          </div>
          <div><Label>Description</Label><Textarea value={settings.site_description || ""} onChange={e => setSettings({ ...settings, site_description: e.target.value })} /></div>
          <div className="flex items-center justify-between p-3 rounded-lg border border-border">
            <div><p className="text-sm font-medium text-foreground">Mode maintenance</p><p className="text-xs text-muted-foreground">Désactiver l'accès public au site</p></div>
            <Switch checked={!!settings.maintenance_mode} onCheckedChange={v => setSettings({ ...settings, maintenance_mode: v })} />
          </div>
          <Button onClick={() => save("general", settings)} disabled={saving}>{saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Enregistrer</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">SEO Global</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div><Label>Meta titre</Label><Input value={seo.meta_title || ""} onChange={e => setSeo({ ...seo, meta_title: e.target.value })} /></div>
          <div><Label>Meta description</Label><Textarea value={seo.meta_description || ""} onChange={e => setSeo({ ...seo, meta_description: e.target.value })} /></div>
          <Button onClick={() => save("seo", seo)} disabled={saving}>{saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Enregistrer</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Commissions</CardTitle>
          <CardDescription>Taux de commission et seuil minimum de retrait</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label>Taux de commission (%)</Label><Input type="number" value={((commissions.default_rate || 0.05) * 100).toString()} onChange={e => setCommissions({ ...commissions, default_rate: parseFloat(e.target.value) / 100 })} /></div>
            <div><Label>Retrait minimum (XOF)</Label><Input type="number" value={commissions.min_payout || 5000} onChange={e => setCommissions({ ...commissions, min_payout: parseInt(e.target.value) })} /></div>
          </div>
          <Button onClick={() => save("commissions", commissions)} disabled={saving}>{saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Enregistrer</Button>
        </CardContent>
      </Card>
    </div>
  );
}

/* ─── Plans Tab ─── */
function PlansTab() {
  const [plans, setPlans] = useState<PlatformPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editPlan, setEditPlan] = useState<Partial<PlatformPlan> | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchPlans = () => {
    supabase.from("platform_plans").select("*").order("sort_order").then(({ data }) => {
      setPlans((data as any[] || []) as PlatformPlan[]);
      setLoading(false);
    });
  };
  useEffect(fetchPlans, []);

  const savePlan = async () => {
    if (!editPlan?.name || !editPlan?.slug) { toast.error("Nom et slug requis"); return; }
    setSaving(true);
    const payload = {
      name: editPlan.name,
      slug: editPlan.slug,
      description: editPlan.description || null,
      price: editPlan.price || 0,
      currency: editPlan.currency || "XOF",
      billing_interval: editPlan.billing_interval || "monthly",
      features: editPlan.features || [],
      limits: editPlan.limits || {},
      is_active: editPlan.is_active ?? true,
      is_default: editPlan.is_default ?? false,
      sort_order: editPlan.sort_order ?? plans.length,
      stripe_price_id: editPlan.stripe_price_id || null,
      fedapay_plan_id: editPlan.fedapay_plan_id || null,
    };
    if (editPlan.id) {
      await supabase.from("platform_plans").update(payload).eq("id", editPlan.id);
    } else {
      await supabase.from("platform_plans").insert(payload);
    }
    setSaving(false);
    setEditPlan(null);
    toast.success("Forfait enregistré");
    fetchPlans();
  };

  const deletePlan = async (id: string) => {
    await supabase.from("platform_plans").delete().eq("id", id);
    toast.success("Forfait supprimé");
    fetchPlans();
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-foreground">Forfaits vendeurs</h3>
        <Dialog open={!!editPlan} onOpenChange={v => !v && setEditPlan(null)}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={() => setEditPlan({ features: [], limits: {}, is_active: true })}><Plus size={14} /> Nouveau forfait</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editPlan?.id ? "Modifier" : "Nouveau"} forfait</DialogTitle></DialogHeader>
            {editPlan && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Nom</Label><Input value={editPlan.name || ""} onChange={e => setEditPlan({ ...editPlan, name: e.target.value })} /></div>
                  <div><Label>Slug</Label><Input value={editPlan.slug || ""} onChange={e => setEditPlan({ ...editPlan, slug: e.target.value })} /></div>
                </div>
                <div><Label>Description</Label><Input value={editPlan.description || ""} onChange={e => setEditPlan({ ...editPlan, description: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Prix (XOF)</Label><Input type="number" value={editPlan.price || 0} onChange={e => setEditPlan({ ...editPlan, price: parseInt(e.target.value) })} /></div>
                  <div><Label>Intervalle</Label><Input value={editPlan.billing_interval || "monthly"} onChange={e => setEditPlan({ ...editPlan, billing_interval: e.target.value })} /></div>
                </div>
                <div><Label>Fonctionnalités (une par ligne)</Label><Textarea rows={4} value={(editPlan.features || []).join("\n")} onChange={e => setEditPlan({ ...editPlan, features: e.target.value.split("\n").filter(Boolean) })} /></div>
                <div className="grid grid-cols-3 gap-3">
                  <div><Label>Max produits</Label><Input type="number" value={editPlan.limits?.max_products ?? 10} onChange={e => setEditPlan({ ...editPlan, limits: { ...editPlan.limits, max_products: parseInt(e.target.value) } })} /></div>
                  <div><Label>Max landings</Label><Input type="number" value={editPlan.limits?.max_landings ?? 1} onChange={e => setEditPlan({ ...editPlan, limits: { ...editPlan.limits, max_landings: parseInt(e.target.value) } })} /></div>
                  <div><Label>Max membres</Label><Input type="number" value={editPlan.limits?.max_team_members ?? 1} onChange={e => setEditPlan({ ...editPlan, limits: { ...editPlan.limits, max_team_members: parseInt(e.target.value) } })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Stripe Price ID</Label><Input value={editPlan.stripe_price_id || ""} onChange={e => setEditPlan({ ...editPlan, stripe_price_id: e.target.value })} placeholder="price_xxx" /></div>
                  <div><Label>FedaPay Plan ID</Label><Input value={editPlan.fedapay_plan_id || ""} onChange={e => setEditPlan({ ...editPlan, fedapay_plan_id: e.target.value })} placeholder="plan_xxx" /></div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2"><Switch checked={editPlan.is_active ?? true} onCheckedChange={v => setEditPlan({ ...editPlan, is_active: v })} /><Label>Actif</Label></div>
                  <div className="flex items-center gap-2"><Switch checked={editPlan.is_default ?? false} onCheckedChange={v => setEditPlan({ ...editPlan, is_default: v })} /><Label>Par défaut</Label></div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button onClick={savePlan} disabled={saving}>{saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Enregistrer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map(plan => (
          <Card key={plan.id} className={!plan.is_active ? "opacity-50" : ""}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{plan.name}</CardTitle>
                <div className="flex gap-1">
                  {plan.is_default && <Badge variant="secondary">Défaut</Badge>}
                  {!plan.is_active && <Badge variant="outline">Inactif</Badge>}
                </div>
              </div>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-2xl font-bold text-foreground">{plan.price === 0 ? "Gratuit" : `${plan.price.toLocaleString()} ${plan.currency}`}<span className="text-xs text-muted-foreground font-normal">/{plan.billing_interval === "monthly" ? "mois" : "an"}</span></p>
              <ul className="space-y-1">
                {(plan.features as string[]).map((f, i) => (
                  <li key={i} className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <span className="h-1 w-1 rounded-full bg-primary shrink-0" />{f}
                  </li>
                ))}
              </ul>
              <div className="flex gap-2 pt-2">
                <Button size="sm" variant="outline" className="flex-1" onClick={() => setEditPlan(plan)}>Modifier</Button>
                {!plan.is_default && <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deletePlan(plan.id)}><Trash2 size={14} /></Button>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ─── Payments Tab ─── */
function PaymentsTab() {
  const [providers, setProviders] = useState<PaymentProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const fetchProviders = () => {
    supabase.from("platform_payment_providers").select("*").order("display_name").then(({ data }) => {
      setProviders((data as any[] || []) as PaymentProvider[]);
      setLoading(false);
    });
  };
  useEffect(fetchProviders, []);

  const toggleProvider = async (id: string, enabled: boolean) => {
    setSaving(id);
    await supabase.from("platform_payment_providers").update({ is_enabled: enabled }).eq("id", id);
    setSaving(null);
    toast.success(enabled ? "Activé" : "Désactivé");
    fetchProviders();
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <h3 className="text-base font-semibold text-foreground">Fournisseurs de paiement</h3>
      <div className="space-y-3">
        {providers.map(p => (
          <Card key={p.id}>
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
                  <CreditCard size={18} className="text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{p.display_name}</p>
                  <p className="text-xs text-muted-foreground">{(p.config as Record<string, any>)?.description || p.provider}</p>
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {p.supported_countries.map(c => (
                      <Badge key={c} variant="outline" className="text-[10px] px-1 py-0">{c}</Badge>
                    ))}
                  </div>
                </div>
              </div>
              <Switch
                checked={p.is_enabled}
                onCheckedChange={v => toggleProvider(p.id, v)}
                disabled={saving === p.id}
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ─── Feature Flags Tab ─── */
function FeaturesTab() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFlags = () => {
    supabase.from("feature_flags").select("*").order("category").then(({ data }) => {
      setFlags((data as any[] || []) as FeatureFlag[]);
      setLoading(false);
    });
  };
  useEffect(fetchFlags, []);

  const toggle = async (id: string, enabled: boolean) => {
    await supabase.from("feature_flags").update({ is_enabled: enabled }).eq("id", id);
    toast.success(enabled ? "Fonctionnalité activée" : "Fonctionnalité désactivée");
    fetchFlags();
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" /></div>;

  const grouped = flags.reduce((acc, f) => {
    if (!acc[f.category]) acc[f.category] = [];
    acc[f.category].push(f);
    return acc;
  }, {} as Record<string, FeatureFlag[]>);

  return (
    <div className="space-y-6">
      <h3 className="text-base font-semibold text-foreground">Feature Flags</h3>
      {Object.entries(grouped).map(([cat, items]) => {
        const Icon = CATEGORY_ICONS[cat] || Settings;
        return (
          <Card key={cat}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2 capitalize"><Icon size={16} className="text-primary" />{cat}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {items.map(f => (
                <div key={f.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div>
                    <p className="text-sm font-medium text-foreground">{f.name}</p>
                    {f.description && <p className="text-xs text-muted-foreground">{f.description}</p>}
                  </div>
                  <Switch checked={f.is_enabled} onCheckedChange={v => toggle(f.id, v)} />
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

/* ─── Main ─── */
export default function AdminSettings() {
  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Paramètres de la plateforme</h1>
        <p className="text-sm text-muted-foreground">Configurez les paramètres globaux de Feyxa</p>
      </div>

      <Tabs defaultValue="general">
        <TabsList className="w-full justify-start flex-wrap h-auto gap-1">
          <TabsTrigger value="general" className="gap-1.5"><Settings size={14} /> Général</TabsTrigger>
          <TabsTrigger value="plans" className="gap-1.5"><Package size={14} /> Forfaits</TabsTrigger>
          <TabsTrigger value="payments" className="gap-1.5"><CreditCard size={14} /> Paiements</TabsTrigger>
          <TabsTrigger value="features" className="gap-1.5"><ToggleLeft size={14} /> Fonctionnalités</TabsTrigger>
        </TabsList>

        <TabsContent value="general"><GeneralTab /></TabsContent>
        <TabsContent value="plans"><PlansTab /></TabsContent>
        <TabsContent value="payments"><PaymentsTab /></TabsContent>
        <TabsContent value="features"><FeaturesTab /></TabsContent>
      </Tabs>
    </div>
  );
}
