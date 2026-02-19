import { useState, useRef, useCallback, useEffect } from "react";
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
import { Loader2, ImagePlus, X, GripVertical } from "lucide-react";

const schema = z.object({
  name: z.string().min(2, "Nom requis (min 2 caractères)"),
  price: z.coerce.number().min(0, "Prix invalide"),
  stock_quantity: z.coerce.number().int().min(0, "Stock invalide"),
  description: z.string().optional(),
  sku: z.string().optional(),
  is_published: z.boolean().default(false),
});

type FormData = z.infer<typeof schema>;

export interface ProductToEdit {
  id: string;
  name: string;
  slug: string;
  price: number;
  stock_quantity: number;
  description: string | null;
  sku: string | null;
  is_published: boolean;
  images: any;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  product?: ProductToEdit | null; // null = create mode
}

// Represents either a new file or an existing URL
interface ImageItem {
  type: "file" | "url";
  file?: File;
  preview: string; // blob URL for file, remote URL for existing
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

const MAX_IMAGES = 6;
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export default function ProductFormDialog({ open, onOpenChange, onSuccess, product }: Props) {
  const { store } = useStore();
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<ImageItem[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEdit = !!product;

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

  // Populate form when editing
  useEffect(() => {
    if (open && product) {
      setValue("name", product.name);
      setValue("price", product.price);
      setValue("stock_quantity", product.stock_quantity);
      setValue("description", product.description || "");
      setValue("sku", product.sku || "");
      setValue("is_published", product.is_published);

      // Load existing images as URL items
      const existingImages: ImageItem[] = (
        Array.isArray(product.images) ? product.images : []
      ).map((url: string) => ({ type: "url" as const, preview: url }));
      setImages(existingImages);
    } else if (open && !product) {
      reset({ name: "", price: 0, stock_quantity: 0, description: "", sku: "", is_published: false });
      setImages([]);
    }
  }, [open, product, setValue, reset]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = MAX_IMAGES - images.length;

    if (remaining <= 0) {
      toast.error(`Maximum ${MAX_IMAGES} images autorisées`);
      return;
    }

    const validFiles = files.slice(0, remaining).filter((file) => {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} n'est pas une image`);
        return false;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name} dépasse 5 Mo`);
        return false;
      }
      return true;
    });

    const newItems: ImageItem[] = validFiles.map((file) => ({
      type: "file",
      file,
      preview: URL.createObjectURL(file),
    }));

    setImages((prev) => [...prev, ...newItems]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [images.length]);

  const removeImage = useCallback((index: number) => {
    setImages((prev) => {
      const item = prev[index];
      if (item.type === "file") URL.revokeObjectURL(item.preview);
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const handleDragStart = useCallback((index: number) => setDragIndex(index), []);
  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  }, []);
  const handleDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === dropIndex) {
      setDragIndex(null);
      setDragOverIndex(null);
      return;
    }
    setImages((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(dragIndex, 1);
      updated.splice(dropIndex, 0, moved);
      return updated;
    });
    setDragIndex(null);
    setDragOverIndex(null);
  }, [dragIndex]);
  const handleDragEnd = useCallback(() => {
    setDragIndex(null);
    setDragOverIndex(null);
  }, []);

  const uploadNewImages = async (storeId: string, productSlug: string): Promise<string[]> => {
    const urls: string[] = [];

    for (const item of images) {
      if (item.type === "url") {
        urls.push(item.preview); // keep existing
      } else if (item.file) {
        const ext = item.file.name.split(".").pop() || "jpg";
        const path = `${storeId}/products/${productSlug}/${Date.now()}-${Math.random().toString(36).slice(2, 6)}.${ext}`;

        const { error } = await supabase.storage
          .from("store-assets")
          .upload(path, item.file, { contentType: item.file.type, upsert: false });

        if (error) {
          console.error("Upload error:", error);
          throw new Error("Échec upload image");
        }

        const { data: urlData } = supabase.storage.from("store-assets").getPublicUrl(path);
        urls.push(urlData.publicUrl);
      }
    }

    return urls;
  };

  const onSubmit = async (data: FormData) => {
    if (!store) {
      toast.error("Boutique introuvable");
      return;
    }

    setLoading(true);
    const slug = isEdit ? product!.slug : slugify(data.name) + "-" + Date.now().toString(36);

    let imageUrls: string[] = [];
    const hasNewFiles = images.some((i) => i.type === "file");

    if (images.length > 0) {
      setUploadingImages(true);
      try {
        imageUrls = await uploadNewImages(store.id, slug);
      } catch (err: any) {
        toast.error(err.message || "Erreur lors de l'upload des images");
        setLoading(false);
        setUploadingImages(false);
        return;
      }
      setUploadingImages(false);
    }

    if (isEdit) {
      const { error } = await supabase
        .from("products")
        .update({
          name: data.name,
          price: data.price,
          stock_quantity: data.stock_quantity,
          description: data.description || null,
          sku: data.sku || null,
          is_published: data.is_published,
          images: imageUrls,
        })
        .eq("id", product!.id);

      setLoading(false);
      if (error) {
        console.error(error);
        toast.error("Erreur lors de la mise à jour");
        return;
      }
      toast.success("Produit mis à jour");
    } else {
      const { error } = await supabase.from("products").insert({
        store_id: store.id,
        name: data.name,
        slug,
        price: data.price,
        stock_quantity: data.stock_quantity,
        description: data.description || null,
        sku: data.sku || null,
        is_published: data.is_published,
        images: imageUrls,
      });

      setLoading(false);
      if (error) {
        console.error(error);
        toast.error("Erreur lors de la création du produit");
        return;
      }
      toast.success("Produit créé avec succès");
    }

    // Cleanup blob URLs
    images.forEach((img) => { if (img.type === "file") URL.revokeObjectURL(img.preview); });
    setImages([]);
    reset();
    onOpenChange(false);
    onSuccess();
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      images.forEach((img) => { if (img.type === "file") URL.revokeObjectURL(img.preview); });
      setImages([]);
      reset();
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier le produit" : "Ajouter un produit"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Image upload */}
          <div className="space-y-1.5">
            <Label>Images du produit</Label>
            <div className="grid grid-cols-3 gap-2">
              {images.map((img, i) => (
                <div
                  key={img.preview}
                  draggable
                  onDragStart={() => handleDragStart(i)}
                  onDragOver={(e) => handleDragOver(e, i)}
                  onDrop={(e) => handleDrop(e, i)}
                  onDragEnd={handleDragEnd}
                  className={`relative aspect-square rounded-lg overflow-hidden border bg-secondary group cursor-grab active:cursor-grabbing transition-all ${
                    dragOverIndex === i && dragIndex !== i
                      ? "border-primary ring-2 ring-primary/30 scale-[1.02]"
                      : dragIndex === i
                      ? "opacity-50 border-border"
                      : "border-border"
                  }`}
                >
                  <img src={img.preview} alt="" className="h-full w-full object-cover pointer-events-none" />
                  <div className="absolute top-1 left-1 h-6 w-6 rounded-full bg-background/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground">
                    <GripVertical size={12} />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 h-6 w-6 rounded-full bg-background/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <X size={12} />
                  </button>
                  {i === 0 && (
                    <span className="absolute bottom-1 left-1 text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded font-medium">
                      Principale
                    </span>
                  )}
                </div>
              ))}
              {images.length < MAX_IMAGES && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-primary/50 bg-secondary/50 flex flex-col items-center justify-center gap-1 transition-colors text-muted-foreground hover:text-foreground"
                >
                  <ImagePlus size={20} />
                  <span className="text-[10px]">Ajouter</span>
                </button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {images.length}/{MAX_IMAGES} images · Max 5 Mo · Glissez pour réorganiser · La 1ère = image principale
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pf-name">Nom du produit *</Label>
            <Input id="pf-name" placeholder="Ex: T-shirt Premium" {...register("name")} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="pf-price">Prix (XOF) *</Label>
              <Input id="pf-price" type="number" step="1" {...register("price")} />
              {errors.price && <p className="text-xs text-destructive">{errors.price.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pf-stock">Stock *</Label>
              <Input id="pf-stock" type="number" {...register("stock_quantity")} />
              {errors.stock_quantity && <p className="text-xs text-destructive">{errors.stock_quantity.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pf-sku">SKU (optionnel)</Label>
            <Input id="pf-sku" placeholder="REF-001" {...register("sku")} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pf-desc">Description</Label>
            <Textarea id="pf-desc" placeholder="Décrivez votre produit..." rows={3} {...register("description")} />
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
            <Button type="button" variant="outline" size="sm" onClick={() => handleClose(false)}>
              Annuler
            </Button>
            <Button type="submit" variant="hero" size="sm" disabled={loading}>
              {loading && <Loader2 size={14} className="animate-spin" />}
              {uploadingImages ? "Upload des images..." : isEdit ? "Enregistrer" : "Créer le produit"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
