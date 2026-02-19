import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/hooks/useStore";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";

const schema = z.object({
  name: z.string().min(2, "Nom requis (min 2 caractères)"),
  price: z.coerce.number().min(0, "Prix invalide"),
  stock_quantity: z.coerce.number().int().min(0, "Stock invalide"),
  description: z.string().optional(),
  sku: z.string().optional(),
  is_published: z.boolean().default(false),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

export default function AddProductDialog({ open, onOpenChange, onSuccess }: Props) {
  const { store } = useStore();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", price: 0, stock_quantity: 0, description: "", sku: "", is_published: false },
  });

  const isPublished = watch("is_published");

  const onSubmit = async (data: FormData) => {
    if (!store) {
      toast.error("Boutique introuvable");
      return;
    }

    setLoading(true);
    const slug = slugify(data.name) + "-" + Date.now().toString(36);

    const { error } = await supabase.from("products").insert({
      store_id: store.id,
      name: data.name,
      slug,
      price: data.price,
      stock_quantity: data.stock_quantity,
      description: data.description || null,
      sku: data.sku || null,
      is_published: data.is_published,
    });

    setLoading(false);

    if (error) {
      console.error(error);
      toast.error("Erreur lors de la création du produit");
      return;
    }

    toast.success("Produit créé avec succès");
    reset();
    onOpenChange(false);
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Ajouter un produit</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Nom du produit *</Label>
            <Input id="name" placeholder="Ex: T-shirt Premium" {...register("name")} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="price">Prix (XOF) *</Label>
              <Input id="price" type="number" step="1" {...register("price")} />
              {errors.price && <p className="text-xs text-destructive">{errors.price.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="stock_quantity">Stock *</Label>
              <Input id="stock_quantity" type="number" {...register("stock_quantity")} />
              {errors.stock_quantity && <p className="text-xs text-destructive">{errors.stock_quantity.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sku">SKU (optionnel)</Label>
            <Input id="sku" placeholder="REF-001" {...register("sku")} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" placeholder="Décrivez votre produit..." rows={3} {...register("description")} />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <p className="text-sm font-medium text-foreground">Publier le produit</p>
              <p className="text-xs text-muted-foreground">Rendre visible sur votre boutique</p>
            </div>
            <Switch
              checked={isPublished}
              onCheckedChange={(v) => setValue("is_published", v)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" variant="hero" size="sm" disabled={loading}>
              {loading && <Loader2 size={14} className="animate-spin" />}
              Créer le produit
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
