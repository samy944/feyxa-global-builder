import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Loader2, Search, Package, CheckCircle, XCircle, Eye, Clock,
  Image as ImageIcon, Store, ExternalLink,
} from "lucide-react";

interface ListingRow {
  id: string;
  status: string;
  submitted_at: string | null;
  rejection_reason: string | null;
  reviewed_at: string | null;
  product_id: string;
  store_id: string;
  products: {
    name: string;
    slug: string;
    price: number;
    stock_quantity: number;
    images: any;
    description: string | null;
    marketplace_category_id: string | null;
  } | null;
  stores: {
    name: string;
    slug: string;
    currency: string;
  } | null;
}

const statusLabels: Record<string, string> = {
  hidden: "Masqué",
  submitted: "En attente",
  approved: "Approuvé",
  published: "Publié",
  rejected: "Rejeté",
};

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  hidden: "secondary",
  submitted: "outline",
  approved: "default",
  published: "default",
  rejected: "destructive",
};

export default function AdminProducts() {
  const [listings, setListings] = useState<ListingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [actionDialog, setActionDialog] = useState<{
    listing: ListingRow;
    action: "approve" | "reject";
  } | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("marketplace_listings")
      .select("id, status, submitted_at, rejection_reason, reviewed_at, product_id, store_id, products(name, slug, price, stock_quantity, images, description, marketplace_category_id), stores(name, slug, currency)")
      .order("submitted_at", { ascending: false, nullsFirst: false })
      .limit(500);
    setListings((data as unknown as ListingRow[]) || []);
    setLoading(false);
  };

  const handleAction = async () => {
    if (!actionDialog) return;
    setProcessing(true);
    const { listing, action } = actionDialog;

    if (action === "approve") {
      // Approve: set listing to published + product is_marketplace_published = true
      const { error: e1 } = await supabase
        .from("marketplace_listings")
        .update({
          status: "published",
          reviewed_at: new Date().toISOString(),
          rejection_reason: null,
        })
        .eq("id", listing.id);

      const { error: e2 } = await supabase
        .from("products")
        .update({ is_marketplace_published: true })
        .eq("id", listing.product_id);

      if (e1 || e2) {
        toast.error("Erreur lors de l'approbation");
      } else {
        toast.success("Produit approuvé et publié sur la marketplace");
      }
    } else {
      // Reject
      const { error: e1 } = await supabase
        .from("marketplace_listings")
        .update({
          status: "rejected",
          reviewed_at: new Date().toISOString(),
          rejection_reason: rejectionReason || null,
        })
        .eq("id", listing.id);

      const { error: e2 } = await supabase
        .from("products")
        .update({ is_marketplace_published: false })
        .eq("id", listing.product_id);

      if (e1 || e2) {
        toast.error("Erreur lors du rejet");
      } else {
        toast.success("Produit rejeté");
      }
    }

    setProcessing(false);
    setActionDialog(null);
    setRejectionReason("");
    fetchListings();
  };

  const filtered = listings.filter((l) => {
    const matchesSearch =
      (l.products?.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (l.stores?.name || "").toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === "all" || l.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = listings.filter((l) => l.status === "submitted").length;

  const formatPrice = (price: number, currency: string) =>
    new Intl.NumberFormat("fr-FR").format(price) + " " + currency;

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Package size={20} className="text-primary" />
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Modération Produits</h1>
          <p className="text-sm text-muted-foreground">
            {pendingCount} produit{pendingCount !== 1 ? "s" : ""} en attente de validation
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher un produit ou boutique..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="submitted">En attente</SelectItem>
            <SelectItem value="published">Publiés</SelectItem>
            <SelectItem value="rejected">Rejetés</SelectItem>
            <SelectItem value="hidden">Masqués</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-primary" size={24} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Package size={40} className="mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">Aucun produit ne correspond à vos critères.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produit</TableHead>
                <TableHead>Boutique</TableHead>
                <TableHead className="text-right">Prix</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Soumis le</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((listing) => {
                const product = listing.products;
                const store = listing.stores;
                const firstImage = product?.images && Array.isArray(product.images) && product.images.length > 0
                  ? product.images[0]
                  : null;

                return (
                  <TableRow key={listing.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center overflow-hidden shrink-0">
                          {firstImage ? (
                            <img src={firstImage} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <ImageIcon size={16} className="text-muted-foreground" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <span className="font-medium text-foreground text-sm block truncate max-w-[200px]">
                            {product?.name || "—"}
                          </span>
                          <span className="text-xs text-muted-foreground">/{product?.slug}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm">
                        <Store size={12} className="text-muted-foreground shrink-0" />
                        <span className="truncate max-w-[120px]">{store?.name || "—"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono font-medium text-sm">
                      {product ? formatPrice(product.price, store?.currency || "XOF") : "—"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {product?.stock_quantity ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[listing.status] || "outline"}>
                        {listing.status === "submitted" && <Clock size={10} className="mr-1" />}
                        {statusLabels[listing.status] || listing.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {listing.submitted_at
                        ? new Date(listing.submitted_at).toLocaleDateString("fr-FR")
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {product?.slug && (
                          <Button
                            size="sm"
                            variant="ghost"
                            asChild
                          >
                            <a href={`/market/product/${product.slug}`} target="_blank" rel="noopener">
                              <Eye size={14} />
                            </a>
                          </Button>
                        )}
                        {(listing.status === "submitted" || listing.status === "rejected") && (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => setActionDialog({ listing, action: "approve" })}
                          >
                            <CheckCircle size={14} className="mr-1" />
                            Approuver
                          </Button>
                        )}
                        {(listing.status === "submitted" || listing.status === "published") && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setActionDialog({ listing, action: "reject" })}
                          >
                            <XCircle size={14} className="mr-1" />
                            Rejeter
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Action Dialog */}
      <Dialog open={!!actionDialog} onOpenChange={() => setActionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog?.action === "approve" ? "Approuver ce produit" : "Rejeter ce produit"}
            </DialogTitle>
            <DialogDescription>
              {actionDialog?.listing.products?.name} — {actionDialog?.listing.stores?.name}
            </DialogDescription>
          </DialogHeader>

          {actionDialog?.action === "approve" ? (
            <p className="text-sm text-muted-foreground">
              Ce produit sera publié sur la marketplace et visible par tous les acheteurs.
            </p>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Indiquez la raison du rejet (visible par le vendeur) :
              </p>
              <Textarea
                placeholder="Motif du rejet..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog(null)}>
              Annuler
            </Button>
            <Button
              variant={actionDialog?.action === "approve" ? "default" : "destructive"}
              onClick={handleAction}
              disabled={processing}
            >
              {processing && <Loader2 className="animate-spin mr-2" size={14} />}
              {actionDialog?.action === "approve" ? "Approuver et publier" : "Rejeter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
