import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/hooks/useStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Warehouse, Package, Truck, TrendingUp, AlertTriangle, Plus,
  Loader2, ArrowRight, CheckCircle2, Clock, ShieldCheck, BarChart3,
  Send, Box, ChevronRight,
} from "lucide-react";

interface FulfillmentStats {
  total_units: number;
  reserved_units: number;
  available_units: number;
  pending_inbound: number;
  total_outbound: number;
  delivered_outbound: number;
  sla_compliance: number;
  sla_breaches: number;
}

interface WarehouseRow {
  id: string;
  name: string;
  city: string;
  capacity: number;
  current_occupancy: number;
  is_active: boolean;
}

interface InboundShipment {
  id: string;
  status: string;
  tracking_number: string | null;
  created_at: string;
  shipped_at: string | null;
  received_at: string | null;
  warehouses: { name: string; city: string } | null;
}

interface InventoryRow {
  id: string;
  quantity: number;
  reserved_quantity: number;
  products: { name: string; images: any } | null;
  warehouses: { name: string; city: string } | null;
}

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  in_transit: "bg-blue-500/10 text-blue-500",
  received: "bg-green-500/10 text-green-500",
  cancelled: "bg-destructive/10 text-destructive",
};

const statusLabels: Record<string, string> = {
  draft: "Brouillon",
  in_transit: "En transit",
  received: "Reçu",
  cancelled: "Annulé",
};

export default function DashboardFulfillment() {
  const { store } = useStore();
  const [stats, setStats] = useState<FulfillmentStats | null>(null);
  const [warehouses, setWarehouses] = useState<WarehouseRow[]>([]);
  const [shipments, setShipments] = useState<InboundShipment[]>([]);
  const [inventory, setInventory] = useState<InventoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    if (store?.id) loadAll();
  }, [store?.id]);

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([loadStats(), loadWarehouses(), loadShipments(), loadInventory()]);
    setLoading(false);
  };

  const loadStats = async () => {
    try {
      const { data } = await supabase.functions.invoke("fulfillment-engine", {
        body: { action: "store_stats", store_id: store!.id },
      });
      if (data && !data.error) setStats(data);
    } catch {}
  };

  const loadWarehouses = async () => {
    const { data } = await supabase
      .from("warehouses")
      .select("id, name, city, capacity, current_occupancy, is_active")
      .eq("is_active", true)
      .order("name");
    setWarehouses((data || []) as WarehouseRow[]);
  };

  const loadShipments = async () => {
    const { data } = await supabase
      .from("inbound_shipments")
      .select("id, status, tracking_number, created_at, shipped_at, received_at, warehouses(name, city)")
      .eq("store_id", store!.id)
      .order("created_at", { ascending: false })
      .limit(20);
    setShipments((data || []) as unknown as InboundShipment[]);
  };

  const loadInventory = async () => {
    const { data } = await supabase
      .from("warehouse_inventory")
      .select("id, quantity, reserved_quantity, products(name, images), warehouses(name, city)")
      .eq("store_id", store!.id)
      .order("quantity", { ascending: true });
    setInventory((data || []) as unknown as InventoryRow[]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-muted-foreground" size={24} />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground flex items-center gap-2">
            <Warehouse size={22} className="text-primary" />
            Feyxa Fulfillment
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gérez votre stock dans les entrepôts Feyxa
          </p>
        </div>
        <CreateShipmentDialog
          open={showCreate}
          onOpenChange={setShowCreate}
          warehouses={warehouses}
          storeId={store?.id || ""}
          onCreated={() => { loadShipments(); loadStats(); }}
        />
      </div>

      {/* KPI Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard icon={Box} label="Unités en entrepôt" value={stats.total_units} />
          <KpiCard icon={Package} label="Disponibles" value={stats.available_units} accent />
          <KpiCard icon={Send} label="Envois en cours" value={stats.pending_inbound} />
          <KpiCard icon={ShieldCheck} label="SLA Conformité" value={`${stats.sla_compliance}%`} accent={stats.sla_compliance >= 90} warn={stats.sla_compliance < 80} />
        </div>
      )}

      <Tabs defaultValue="inventory" className="space-y-4">
        <TabsList>
          <TabsTrigger value="inventory">Stock entrepôt</TabsTrigger>
          <TabsTrigger value="inbound">Envois entrants</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        {/* ── Inventory Tab ── */}
        <TabsContent value="inventory">
          {inventory.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Warehouse size={40} className="mx-auto mb-3 opacity-30" />
                <p>Aucun produit en entrepôt Feyxa</p>
                <p className="text-xs mt-1">Créez un envoi entrant pour stocker vos produits</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {inventory.map((inv) => {
                const available = inv.quantity - inv.reserved_quantity;
                const pct = inv.quantity > 0 ? (available / inv.quantity) * 100 : 0;
                const img = Array.isArray(inv.products?.images) && inv.products.images[0];
                return (
                  <Card key={inv.id}>
                    <CardContent className="flex items-center gap-4 py-3 px-4">
                      {img ? (
                        <img src={img} alt="" className="h-10 w-10 rounded-lg object-cover border border-border" />
                      ) : (
                        <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
                          <Package size={16} className="text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{inv.products?.name}</p>
                        <p className="text-xs text-muted-foreground">{inv.warehouses?.name} · {inv.warehouses?.city}</p>
                      </div>
                      <div className="text-right space-y-1 w-36">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Dispo</span>
                          <span className="font-medium text-foreground">{available} / {inv.quantity}</span>
                        </div>
                        <Progress value={pct} className="h-1.5" />
                      </div>
                      {inv.reserved_quantity > 0 && (
                        <Badge variant="secondary" className="text-xs shrink-0">{inv.reserved_quantity} réservé(s)</Badge>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ── Inbound Tab ── */}
        <TabsContent value="inbound">
          {shipments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Truck size={40} className="mx-auto mb-3 opacity-30" />
                <p>Aucun envoi entrant</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {shipments.map((s) => (
                <Card key={s.id}>
                  <CardContent className="flex items-center gap-4 py-3 px-4">
                    <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                      <Truck size={16} className="text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        Envoi → {(s.warehouses as any)?.name || "Entrepôt"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(s.created_at).toLocaleDateString("fr-FR")}
                        {s.tracking_number && ` · N° ${s.tracking_number}`}
                      </p>
                    </div>
                    <Badge className={statusColors[s.status] || ""}>
                      {statusLabels[s.status] || s.status}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Performance Tab ── */}
        <TabsContent value="performance">
          {stats && (
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <BarChart3 size={14} className="text-primary" />
                    Expéditions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total expédiées</span>
                    <span className="font-medium text-foreground">{stats.total_outbound}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Livrées</span>
                    <span className="font-medium text-foreground">{stats.delivered_outbound}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Taux de livraison</span>
                    <span className="font-medium text-foreground">
                      {stats.total_outbound ? Math.round((stats.delivered_outbound / stats.total_outbound) * 100) : 0}%
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <ShieldCheck size={14} className="text-primary" />
                    SLA (48h)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <span className={`text-4xl font-bold ${stats.sla_compliance >= 90 ? "text-green-500" : stats.sla_compliance >= 70 ? "text-yellow-500" : "text-destructive"}`}>
                      {stats.sla_compliance}%
                    </span>
                    <p className="text-xs text-muted-foreground mt-1">Conformité SLA</p>
                  </div>
                  {stats.sla_breaches > 0 && (
                    <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/5 rounded-lg p-2">
                      <AlertTriangle size={14} />
                      <span>{stats.sla_breaches} dépassement(s) actif(s)</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ── KPI Card ── */
function KpiCard({ icon: Icon, label, value, accent, warn }: {
  icon: any; label: string; value: number | string; accent?: boolean; warn?: boolean;
}) {
  return (
    <Card>
      <CardContent className="py-4 px-4 flex items-center gap-3">
        <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
          warn ? "bg-destructive/10" : accent ? "bg-primary/10" : "bg-secondary"
        }`}>
          <Icon size={16} className={warn ? "text-destructive" : accent ? "text-primary" : "text-muted-foreground"} />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-lg font-bold text-foreground">{typeof value === "number" ? value.toLocaleString("fr-FR") : value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Create Shipment Dialog ── */
function CreateShipmentDialog({ open, onOpenChange, warehouses, storeId, onCreated }: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  warehouses: WarehouseRow[];
  storeId: string;
  onCreated: () => void;
}) {
  const [warehouseId, setWarehouseId] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [products, setProducts] = useState<{ id: string; name: string }[]>([]);
  const [items, setItems] = useState<{ product_id: string; quantity: number }[]>([{ product_id: "", quantity: 1 }]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && storeId) {
      supabase
        .from("products")
        .select("id, name")
        .eq("store_id", storeId)
        .eq("is_published", true)
        .order("name")
        .then(({ data }) => setProducts((data || []) as any));
    }
  }, [open, storeId]);

  const addItem = () => setItems([...items, { product_id: "", quantity: 1 }]);

  const handleCreate = async () => {
    if (!warehouseId || items.some((i) => !i.product_id || i.quantity < 1)) {
      toast.error("Remplissez tous les champs");
      return;
    }
    setSaving(true);

    const { data: ship, error } = await supabase
      .from("inbound_shipments")
      .insert({
        store_id: storeId,
        warehouse_id: warehouseId,
        status: "draft" as any,
        tracking_number: trackingNumber || null,
        notes: notes || null,
      })
      .select("id")
      .single();

    if (error || !ship) {
      toast.error("Erreur de création");
      setSaving(false);
      return;
    }

    const { error: itemsErr } = await supabase.from("inbound_items").insert(
      items.map((i) => ({
        shipment_id: ship.id,
        product_id: i.product_id,
        quantity: i.quantity,
      }))
    );

    if (itemsErr) {
      toast.error("Erreur ajout articles");
    } else {
      toast.success("Envoi créé avec succès");
      onOpenChange(false);
      onCreated();
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus size={14} className="mr-1.5" />
          Nouvel envoi
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck size={18} className="text-primary" />
            Créer un envoi entrant
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Entrepôt de destination</label>
            <Select value={warehouseId} onValueChange={setWarehouseId}>
              <SelectTrigger><SelectValue placeholder="Choisir un entrepôt" /></SelectTrigger>
              <SelectContent>
                {warehouses.map((w) => (
                  <SelectItem key={w.id} value={w.id}>
                    {w.name} — {w.city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">N° de suivi (optionnel)</label>
            <Input value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} placeholder="EX12345678" />
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Produits</label>
            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={idx} className="flex gap-2">
                  <Select value={item.product_id} onValueChange={(v) => {
                    const copy = [...items];
                    copy[idx].product_id = v;
                    setItems(copy);
                  }}>
                    <SelectTrigger className="flex-1"><SelectValue placeholder="Produit" /></SelectTrigger>
                    <SelectContent>
                      {products.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    min={1}
                    className="w-20"
                    value={item.quantity}
                    onChange={(e) => {
                      const copy = [...items];
                      copy[idx].quantity = parseInt(e.target.value) || 1;
                      setItems(copy);
                    }}
                  />
                </div>
              ))}
              <Button variant="ghost" size="sm" onClick={addItem} className="text-xs">
                <Plus size={12} className="mr-1" /> Ajouter un produit
              </Button>
            </div>
          </div>

          <Button onClick={handleCreate} disabled={saving} className="w-full">
            {saving ? <Loader2 size={14} className="animate-spin mr-1.5" /> : <Send size={14} className="mr-1.5" />}
            Créer l'envoi
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
