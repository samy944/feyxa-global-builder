import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Search, Ban, CheckCircle, Store, LogIn } from "lucide-react";
import { useStore } from "@/hooks/useStore";
import { useNavigate } from "react-router-dom";

interface StoreRow {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  is_active: boolean;
  is_banned: boolean;
  ban_reason: string | null;
  plan: string;
  created_at: string;
  owner_id: string;
  currency: string;
}

export default function AdminStores() {
  const [stores, setStores] = useState<StoreRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [banDialog, setBanDialog] = useState<{ store: StoreRow; action: "ban" | "unban" } | null>(null);
  const [banReason, setBanReason] = useState("");
  const [processing, setProcessing] = useState(false);
  const { impersonateStore } = useStore();
  const navigate = useNavigate();

  useEffect(() => { fetchStores(); }, []);

  const fetchStores = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("stores")
      .select("id, name, slug, city, is_active, is_banned, ban_reason, plan, created_at, owner_id, currency")
      .order("created_at", { ascending: false })
      .limit(500);
    setStores((data as StoreRow[]) || []);
    setLoading(false);
  };

  const handleBanAction = async () => {
    if (!banDialog) return;
    setProcessing(true);
    const isBan = banDialog.action === "ban";

    const { error } = await supabase
      .from("stores")
      .update({
        is_banned: isBan,
        is_active: !isBan,
        ban_reason: isBan ? banReason || null : null,
      })
      .eq("id", banDialog.store.id);

    if (error) {
      toast.error("Erreur");
    } else {
      toast.success(isBan ? "Boutique bannie" : "Boutique réactivée");
      fetchStores();
    }
    setProcessing(false);
    setBanDialog(null);
    setBanReason("");
  };

  const toggleActive = async (store: StoreRow) => {
    if (store.is_banned) return;
    const { error } = await supabase
      .from("stores")
      .update({ is_active: !store.is_active })
      .eq("id", store.id);
    if (!error) {
      toast.success(store.is_active ? "Boutique désactivée" : "Boutique activée");
      fetchStores();
    }
  };

  const filtered = stores.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.slug.toLowerCase().includes(search.toLowerCase()) ||
      (s.city || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Store size={20} className="text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Boutiques</h1>
            <p className="text-sm text-muted-foreground">{stores.length} boutique{stores.length > 1 ? "s" : ""}</p>
          </div>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Rechercher une boutique..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-primary" size={24} />
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Boutique</TableHead>
                <TableHead>Ville</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Créée le</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((store) => (
                <TableRow key={store.id}>
                  <TableCell>
                    <div>
                      <span className="font-medium text-foreground">{store.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">/{store.slug}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{store.city || "—"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">{store.plan}</Badge>
                  </TableCell>
                  <TableCell>
                    {store.is_banned ? (
                      <Badge variant="destructive">Bannie</Badge>
                    ) : store.is_active ? (
                      <Badge variant="default">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {new Date(store.created_at).toLocaleDateString("fr-FR")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={async () => {
                          await impersonateStore(store.id);
                          navigate("/dashboard");
                          toast.success(`Accès à "${store.name}" en mode support`);
                        }}
                      >
                        <LogIn size={14} className="mr-1" /> Accéder
                      </Button>
                      {!store.is_banned && (
                        <Button size="sm" variant="outline" onClick={() => toggleActive(store)}>
                          {store.is_active ? "Désactiver" : "Activer"}
                        </Button>
                      )}
                      {store.is_banned ? (
                        <Button size="sm" variant="outline" onClick={() => setBanDialog({ store, action: "unban" })}>
                          <CheckCircle size={14} className="mr-1" /> Débannir
                        </Button>
                      ) : (
                        <Button size="sm" variant="destructive" onClick={() => setBanDialog({ store, action: "ban" })}>
                          <Ban size={14} className="mr-1" /> Bannir
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={!!banDialog} onOpenChange={() => setBanDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {banDialog?.action === "ban" ? "Bannir la boutique" : "Débannir la boutique"}
            </DialogTitle>
            <DialogDescription>
              {banDialog?.store.name}
            </DialogDescription>
          </DialogHeader>
          {banDialog?.action === "ban" && (
            <Textarea
              placeholder="Raison du bannissement..."
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
            />
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setBanDialog(null)}>Annuler</Button>
            <Button
              variant={banDialog?.action === "ban" ? "destructive" : "default"}
              onClick={handleBanAction}
              disabled={processing}
            >
              {processing && <Loader2 className="animate-spin mr-2" size={14} />}
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
