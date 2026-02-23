import { useState, useEffect } from "react";
import { useStore } from "@/hooks/useStore";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "@/hooks/use-toast";
import {
  Truck, Plus, Trash2, Save, Loader2, MapPin, Edit2, X, Check, ToggleLeft, ToggleRight,
} from "lucide-react";

interface DeliveryZone {
  id: string;
  name: string;
  fee: number;
  is_active: boolean;
  cities: string[] | null;
  quarters: string[] | null;
  created_at: string;
}

export default function DashboardShipping() {
  const { store, loading: storeLoading } = useStore();
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formFee, setFormFee] = useState("");
  const [formCities, setFormCities] = useState("");
  const [formQuarters, setFormQuarters] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!store) return;
    loadZones();
  }, [store]);

  const loadZones = async () => {
    if (!store) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("delivery_zones")
      .select("*")
      .eq("store_id", store.id)
      .order("created_at", { ascending: true });

    if (!error && data) setZones(data as DeliveryZone[]);
    setLoading(false);
  };

  const resetForm = () => {
    setFormName("");
    setFormFee("");
    setFormCities("");
    setFormQuarters("");
    setEditingId(null);
    setShowAdd(false);
  };

  const startEdit = (zone: DeliveryZone) => {
    setEditingId(zone.id);
    setFormName(zone.name);
    setFormFee(zone.fee.toString());
    setFormCities((zone.cities || []).join(", "));
    setFormQuarters((zone.quarters || []).join(", "));
    setShowAdd(false);
  };

  const handleSave = async () => {
    if (!store || !formName.trim()) {
      toast({ title: "Erreur", description: "Le nom de la zone est requis.", variant: "destructive" });
      return;
    }

    setSaving(true);
    const payload = {
      store_id: store.id,
      name: formName.trim(),
      fee: parseFloat(formFee) || 0,
      cities: formCities.trim() ? formCities.split(",").map((c) => c.trim()).filter(Boolean) : [],
      quarters: formQuarters.trim() ? formQuarters.split(",").map((q) => q.trim()).filter(Boolean) : [],
    };

    if (editingId) {
      const { error } = await supabase
        .from("delivery_zones")
        .update(payload)
        .eq("id", editingId);

      if (error) {
        toast({ title: "Erreur", description: "Impossible de mettre à jour la zone.", variant: "destructive" });
      } else {
        toast({ title: "Zone mise à jour" });
      }
    } else {
      const { error } = await supabase
        .from("delivery_zones")
        .insert(payload);

      if (error) {
        toast({ title: "Erreur", description: "Impossible de créer la zone.", variant: "destructive" });
      } else {
        toast({ title: "Zone créée !" });
      }
    }

    setSaving(false);
    resetForm();
    loadZones();
  };

  const toggleActive = async (zone: DeliveryZone) => {
    const { error } = await supabase
      .from("delivery_zones")
      .update({ is_active: !zone.is_active })
      .eq("id", zone.id);

    if (!error) {
      setZones((prev) =>
        prev.map((z) => (z.id === zone.id ? { ...z, is_active: !z.is_active } : z))
      );
      toast({
        title: zone.is_active ? "Zone désactivée" : "Zone activée",
      });
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("delivery_zones")
      .delete()
      .eq("id", id);

    if (!error) {
      setZones((prev) => prev.filter((z) => z.id !== id));
      toast({ title: "Zone supprimée" });
      if (editingId === id) resetForm();
    } else {
      toast({ title: "Erreur", description: "Impossible de supprimer.", variant: "destructive" });
    }
  };

  const formatFee = (fee: number) => {
    if (!store) return `${fee}`;
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: store.currency || "XOF",
      maximumFractionDigits: 0,
    }).format(fee);
  };

  if (storeLoading || loading) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-muted-foreground" size={24} />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <Truck size={24} />
            Logistique & Livraison
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gérez vos zones de livraison, frais et disponibilité.
          </p>
        </div>
        <Button
          variant="hero"
          size="sm"
          onClick={() => {
            resetForm();
            setShowAdd(true);
          }}
        >
          <Plus size={14} className="mr-1" />
          Nouvelle zone
        </Button>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Zones actives</p>
          <p className="text-2xl font-bold text-foreground mt-1">
            {zones.filter((z) => z.is_active).length}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total zones</p>
          <p className="text-2xl font-bold text-foreground mt-1">{zones.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Frais moyen</p>
          <p className="text-2xl font-bold text-foreground mt-1">
            {zones.length > 0
              ? formatFee(zones.reduce((sum, z) => sum + z.fee, 0) / zones.length)
              : "—"}
          </p>
        </div>
      </div>

      {/* Add / Edit form */}
      <AnimatePresence>
        {(showAdd || editingId) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-xl border border-primary/20 bg-primary/5 p-6 space-y-4 overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">
                {editingId ? "Modifier la zone" : "Nouvelle zone de livraison"}
              </h3>
              <button onClick={resetForm} className="text-muted-foreground hover:text-foreground">
                <X size={18} />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">
                  Nom de la zone *
                </label>
                <Input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ex: Cotonou Centre"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">
                  Frais de livraison ({store?.currency || "XOF"})
                </label>
                <Input
                  type="number"
                  value={formFee}
                  onChange={(e) => setFormFee(e.target.value)}
                  placeholder="Ex: 1000"
                  min="0"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Villes couvertes
              </label>
              <Input
                value={formCities}
                onChange={(e) => setFormCities(e.target.value)}
                placeholder="Séparez par des virgules : Cotonou, Porto-Novo, Calavi"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Laissez vide si la zone couvre toutes les villes
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Quartiers couverts
              </label>
              <Input
                value={formQuarters}
                onChange={(e) => setFormQuarters(e.target.value)}
                placeholder="Séparez par des virgules : Akpakpa, Ganhi, Fidjrossè"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="hero" size="sm" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 size={14} className="animate-spin mr-1" /> : <Save size={14} className="mr-1" />}
                {editingId ? "Mettre à jour" : "Créer la zone"}
              </Button>
              <Button variant="outline" size="sm" onClick={resetForm}>
                Annuler
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Zones list */}
      {zones.length === 0 ? (
        <div className="text-center py-16 rounded-xl border border-border bg-card">
          <MapPin size={40} className="mx-auto text-muted-foreground mb-3" />
          <p className="text-foreground font-medium">Aucune zone de livraison</p>
          <p className="text-sm text-muted-foreground mt-1">
            Créez votre première zone pour commencer à livrer vos clients.
          </p>
          <Button
            variant="hero"
            size="sm"
            className="mt-4"
            onClick={() => { resetForm(); setShowAdd(true); }}
          >
            <Plus size={14} className="mr-1" /> Créer une zone
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {zones.map((zone) => (
            <motion.div
              key={zone.id}
              layout
              className={`rounded-xl border bg-card p-4 transition-colors ${
                zone.is_active ? "border-border" : "border-border/50 opacity-60"
              } ${editingId === zone.id ? "ring-2 ring-primary/20" : ""}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-primary shrink-0" />
                    <h3 className="font-semibold text-foreground truncate">{zone.name}</h3>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        zone.is_active
                          ? "bg-primary/10 text-primary"
                          : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {zone.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-4 text-sm">
                    <span className="text-foreground font-medium">{formatFee(zone.fee)}</span>
                    {zone.cities && zone.cities.length > 0 && (
                      <span className="text-muted-foreground">
                        Villes : {zone.cities.join(", ")}
                      </span>
                    )}
                    {zone.quarters && zone.quarters.length > 0 && (
                      <span className="text-muted-foreground">
                        Quartiers : {zone.quarters.join(", ")}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => toggleActive(zone)}
                    className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                    title={zone.is_active ? "Désactiver" : "Activer"}
                  >
                    {zone.is_active ? <ToggleRight size={18} className="text-primary" /> : <ToggleLeft size={18} />}
                  </button>
                  <button
                    onClick={() => startEdit(zone)}
                    className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                    title="Modifier"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(zone.id)}
                    className="p-2 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                    title="Supprimer"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Info box */}
      <div className="rounded-xl border border-border bg-card p-4">
        <h4 className="text-sm font-medium text-foreground mb-2">💡 Comment ça marche ?</h4>
        <ul className="text-xs text-muted-foreground space-y-1.5">
          <li>• Les zones actives apparaissent au checkout pour vos clients</li>
          <li>• Les frais de livraison sont automatiquement ajoutés à la commande</li>
          <li>• Vous pouvez spécifier des villes et quartiers couverts par chaque zone</li>
          <li>• Désactivez temporairement une zone sans la supprimer</li>
        </ul>
      </div>
    </div>
  );
}
