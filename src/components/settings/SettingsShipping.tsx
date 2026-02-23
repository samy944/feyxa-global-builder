import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStore } from "@/hooks/useStore";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Save, Loader2, Plus, Trash2, ToggleLeft, ToggleRight } from "lucide-react";

interface Zone {
  id: string;
  name: string;
  fee: number;
  cities: string[];
  quarters: string[];
  is_active: boolean;
}

export default function SettingsShipping() {
  const { store } = useStore();
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [newZone, setNewZone] = useState({ name: "", fee: "", cities: "" });
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!store?.id) return;
    loadZones();
  }, [store?.id]);

  async function loadZones() {
    setLoading(true);
    const { data } = await supabase
      .from("delivery_zones")
      .select("*")
      .eq("store_id", store!.id)
      .order("name");
    setZones((data as Zone[]) || []);
    setLoading(false);
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
    loadZones();
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
        <p className="text-sm text-muted-foreground mt-1">Configurez vos zones de livraison et les frais associés.</p>
      </div>

      {/* Existing zones */}
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
    </div>
  );
}
