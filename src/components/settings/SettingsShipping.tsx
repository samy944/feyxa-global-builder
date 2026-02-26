import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStore } from "@/hooks/useStore";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Save, Loader2, Plus, Trash2, ToggleLeft, ToggleRight, Info, Truck, MapPin, Store, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Zone {
  id: string;
  name: string;
  fee: number;
  cities: string[];
  quarters: string[];
  is_active: boolean;
}

interface ShippingMode {
  id: string;
  name: string;
  description: string;
  is_enabled: boolean;
  icon: string;
}

const ICONS: Record<string, any> = { Truck, MapPin, Store, Zap };

export default function SettingsShipping() {
  const { store, refetch } = useStore();
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [newZone, setNewZone] = useState({ name: "", fee: "", cities: "" });
  const [adding, setAdding] = useState(false);
  const [platformModes, setPlatformModes] = useState<ShippingMode[]>([]);
  const [vendorModes, setVendorModes] = useState<Record<string, boolean>>({});
  const [savingModes, setSavingModes] = useState(false);
  const [allowCustomZones, setAllowCustomZones] = useState(true);

  useEffect(() => {
    if (!store?.id) return;
    loadData();
  }, [store?.id]);

  async function loadData() {
    setLoading(true);

    // Load platform shipping config
    const { data: shippingConfig } = await supabase
      .from("platform_settings")
      .select("value")
      .eq("key", "shipping_modes")
      .single();

    const config = (shippingConfig?.value as Record<string, any>) || {};
    const modes = ((config.modes || []) as ShippingMode[]).filter(m => m.is_enabled);
    setPlatformModes(modes);
    setAllowCustomZones(config.allow_vendor_custom_zones ?? true);

    // Load vendor's mode selections
    const s = (store!.settings as Record<string, any>) || {};
    const savedModes = s.shipping_modes || {};
    const initial: Record<string, boolean> = {};
    modes.forEach(m => {
      initial[m.id] = savedModes[m.id] ?? true;
    });
    setVendorModes(initial);

    // Load zones
    const { data } = await supabase
      .from("delivery_zones")
      .select("*")
      .eq("store_id", store!.id)
      .order("name");
    setZones((data as Zone[]) || []);
    setLoading(false);
  }

  async function handleSaveModes() {
    if (!store) return;
    setSavingModes(true);
    const current = (store.settings as Record<string, any>) || {};
    const { error } = await supabase.from("stores").update({
      settings: { ...current, shipping_modes: vendorModes },
    }).eq("id", store.id);
    setSavingModes(false);
    if (error) { toast.error("Erreur de sauvegarde"); return; }
    toast.success("Modes de livraison mis à jour");
    refetch();
  }

  async function handleAddZone() {
    if (!store || !newZone.name.trim()) { toast.error("Nom requis"); return; }
    setAdding(true);
    const { error } = await supabase.from("delivery_zones").insert({
      store_id: store.id,
      name: newZone.name.trim(),
      fee: parseFloat(newZone.fee) || 0,
      cities: newZone.cities.split(",").map(c => c.trim()).filter(Boolean),
    });
    setAdding(false);
    if (error) { toast.error("Erreur lors de l'ajout"); return; }
    setNewZone({ name: "", fee: "", cities: "" });
    toast.success("Zone ajoutée");
    loadData();
  }

  async function toggleZone(zone: Zone) {
    const { error } = await supabase.from("delivery_zones").update({ is_active: !zone.is_active }).eq("id", zone.id);
    if (error) { toast.error("Erreur"); return; }
    setZones(zones.map(z => z.id === zone.id ? { ...z, is_active: !z.is_active } : z));
  }

  async function deleteZone(id: string) {
    const { error } = await supabase.from("delivery_zones").delete().eq("id", id);
    if (error) { toast.error("Erreur suppression"); return; }
    setZones(zones.filter(z => z.id !== id));
    toast.success("Zone supprimée");
  }

  const formatPrice = (v: number) =>
    store?.currency === "XOF" ? `${v.toLocaleString("fr-FR")} FCFA` : `€${v.toFixed(2)}`;

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-muted-foreground" size={20} /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Livraison & Expédition</h2>
        <p className="text-sm text-muted-foreground mt-1">Configurez vos modes et zones de livraison dans le cadre défini par la plateforme.</p>
      </div>

      {/* Platform shipping modes */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Modes de livraison disponibles</p>
          <Badge variant="outline" className="text-[10px]">Définis par la plateforme</Badge>
        </div>

        <div className="flex items-start gap-2 p-3 rounded-lg bg-secondary/50 border border-border">
          <Info size={14} className="text-primary mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground">
            Les modes de livraison ci-dessous sont autorisés par l'administrateur. Activez ceux que vous souhaitez proposer dans votre boutique.
          </p>
        </div>

        {platformModes.map(mode => {
          const Icon = ICONS[mode.icon] || Truck;
          return (
            <div key={mode.id} className="flex items-center justify-between p-4 rounded-lg border border-border">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-secondary flex items-center justify-center">
                  <Icon size={16} className="text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{mode.name}</p>
                  <p className="text-xs text-muted-foreground">{mode.description}</p>
                </div>
              </div>
              <button
                onClick={() => setVendorModes({ ...vendorModes, [mode.id]: !vendorModes[mode.id] })}
                className={`w-11 h-6 rounded-full transition-colors relative ${vendorModes[mode.id] ? "bg-primary" : "bg-secondary"}`}
              >
                <div
                  className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform"
                  style={{ transform: vendorModes[mode.id] ? "translateX(20px)" : "translateX(0)" }}
                />
              </button>
            </div>
          );
        })}

        <Button variant="outline" size="sm" onClick={handleSaveModes} disabled={savingModes}>
          {savingModes ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          Enregistrer les modes
        </Button>
      </div>

      {/* Custom zones */}
      {allowCustomZones ? (
        <>
          <div className="border-t border-border pt-6">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Zones de livraison personnalisées</p>
          </div>

          <div className="space-y-2">
            {zones.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">Aucune zone de livraison configurée</p>
            )}
            {zones.map(zone => (
              <div key={zone.id} className="flex items-center justify-between p-4 rounded-lg border border-border">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">{zone.name}</p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${zone.is_active ? "bg-accent/10 text-accent" : "bg-secondary text-muted-foreground"}`}>
                      {zone.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Frais : {formatPrice(zone.fee)}
                    {zone.cities?.length > 0 && ` • ${zone.cities.join(", ")}`}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleZone(zone)}>
                    {zone.is_active ? <ToggleRight size={16} className="text-accent" /> : <ToggleLeft size={16} />}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteZone(zone.id)}>
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Add new zone */}
          <div className="border border-dashed border-border rounded-lg p-4 space-y-3">
            <p className="text-sm font-medium text-foreground">Ajouter une zone</p>
            <div className="grid grid-cols-3 gap-3">
              <Input value={newZone.name} onChange={(e) => setNewZone({ ...newZone, name: e.target.value })} placeholder="Nom (ex: Cotonou Centre)" />
              <Input type="number" value={newZone.fee} onChange={(e) => setNewZone({ ...newZone, fee: e.target.value })} placeholder="Frais (ex: 1000)" />
              <Input value={newZone.cities} onChange={(e) => setNewZone({ ...newZone, cities: e.target.value })} placeholder="Villes (séparées par ,)" />
            </div>
            <Button variant="outline" size="sm" onClick={handleAddZone} disabled={adding}>
              {adding ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              Ajouter la zone
            </Button>
          </div>
        </>
      ) : (
        <div className="p-4 rounded-lg bg-secondary/50 border border-border">
          <p className="text-sm text-muted-foreground">
            La création de zones de livraison personnalisées est actuellement désactivée par l'administrateur de la plateforme.
          </p>
        </div>
      )}
    </div>
  );
}
