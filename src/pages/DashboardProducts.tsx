import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Plus, Search, Filter, Image as ImageIcon, Loader2, Pencil, Trash2, MoreHorizontal, Link2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/hooks/useStore";
import { toast } from "sonner";
import ProductFormDialog, { type ProductToEdit } from "@/components/dashboard/ProductFormDialog";
import { TrackingLinkGenerator } from "@/components/dashboard/TrackingLinkGenerator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  stock_quantity: number;
  is_published: boolean;
  images: any;
  tags: string[] | null;
  low_stock_threshold: number | null;
  description: string | null;
  sku: string | null;
}

function getStatus(p: Product) {
  if (!p.is_published) return "Brouillon";
  if (p.stock_quantity <= 0) return "Rupture";
  if (p.low_stock_threshold && p.stock_quantity <= p.low_stock_threshold) return "Stock bas";
  return "Actif";
}

export default function DashboardProducts() {
  const { store } = useStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<ProductToEdit | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchProducts = useCallback(async () => {
    if (!store) return;
    setLoading(true);
    const { data } = await supabase
      .from("products")
      .select("id, name, slug, price, stock_quantity, is_published, images, tags, low_stock_threshold, description, sku")
      .eq("store_id", store.id)
      .order("created_at", { ascending: false });
    setProducts(data ?? []);
    setLoading(false);
  }, [store]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleEdit = (p: Product) => {
    setEditProduct({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: p.price,
      stock_quantity: p.stock_quantity,
      description: p.description,
      sku: p.sku,
      is_published: p.is_published,
      images: p.images,
    });
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setEditProduct(null);
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await supabase.from("products").delete().eq("id", deleteTarget.id);
    setDeleting(false);
    if (error) {
      console.error(error);
      toast.error("Erreur lors de la suppression");
    } else {
      toast.success("Produit supprimé");
      fetchProducts();
    }
    setDeleteTarget(null);
  };

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Produits</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {products.length} {products.length <= 1 ? "produit" : "produits"} dans votre catalogue
          </p>
        </div>
        <Button variant="hero" size="sm" onClick={handleCreate}>
          <Plus size={16} />
          Ajouter un produit
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher un produit..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 rounded-lg border border-border bg-card pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <Button variant="outline" size="sm">
          <Filter size={14} />
          Filtres
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground text-sm">
          {products.length === 0 ? "Aucun produit. Ajoutez votre premier produit !" : "Aucun résultat."}
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted-foreground text-xs border-b border-border">
                <th className="text-left font-medium p-4">Produit</th>
                <th className="text-left font-medium p-4">Prix</th>
                <th className="text-left font-medium p-4">Stock</th>
                <th className="text-left font-medium p-4">Statut</th>
                <th className="text-right font-medium p-4"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => {
                const status = getStatus(p);
                const firstImage = Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : null;
                return (
                  <motion.tr
                    key={p.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-border last:border-0 hover:bg-secondary/50 transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center overflow-hidden">
                          {firstImage ? (
                            <img src={firstImage} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <ImageIcon size={16} className="text-muted-foreground" />
                          )}
                        </div>
                        <span className="font-medium text-foreground">{p.name}</span>
                      </div>
                    </td>
                    <td className="p-4 font-medium text-foreground">{p.price.toLocaleString()} XOF</td>
                    <td className="p-4 text-foreground">{p.stock_quantity}</td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          status === "Actif"
                            ? "bg-accent/10 text-accent"
                            : status === "Rupture"
                            ? "bg-destructive/10 text-destructive"
                            : status === "Brouillon"
                            ? "bg-muted text-muted-foreground"
                            : "bg-primary/10 text-primary"
                        }`}
                      >
                        {status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {store && (
                          <TrackingLinkGenerator
                            storeId={store.id}
                            productId={p.id}
                            productSlug={p.slug}
                            productName={p.name}
                          />
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                              <MoreHorizontal size={16} />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem onClick={() => handleEdit(p)}>
                              <Pencil size={14} className="mr-2" />
                              Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setDeleteTarget(p)}
                            >
                              <Trash2 size={14} className="mr-2" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <ProductFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={fetchProducts}
        product={editProduct}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce produit ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le produit « {deleteTarget?.name} » sera définitivement supprimé. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting && <Loader2 size={14} className="animate-spin mr-2" />}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
