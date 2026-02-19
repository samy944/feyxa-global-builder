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
import { Loader2, ImagePlus, X, GripVertical, Plus, Trash2 } from "lucide-react";

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
  product?: ProductToEdit | null;
}

interface ImageItem {
  type: "file" | "url";
  file?: File;
  preview: string;
}

interface VariantRow {
  _key: string; // local key for React
  id?: string; // DB id if existing
  name: string;
  price: number;
  stock_quantity: number;
  sku: string;
  options: Record<string, string>; // e.g. { Taille: "M", Couleur: "Noir" }
}

function slugify(text: string) {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 80);
}

const MAX_IMAGES = 6;
const MAX_FILE_SIZE = 5 * 1024 * 1024;

function newVariantRow(defaults?: Partial<VariantRow>): VariantRow {
  return {
    _key: Math.random().toString(36).slice(2, 8),
    name: "",
    price: 0,
    stock_quantity: 0,
    sku: "",
    options: {},
    ...defaults,
  };
}

export default function ProductFormDialog({ open, onOpenChange, onSuccess, product }: Props) {
  const { store } = useStore();
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<ImageItem[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEdit = !!product;

  // Variants
  const [hasVariants, setHasVariants] = useState(false);
  const [variants, setVariants] = useState<VariantRow[]>([]);
  const [optionTypes, setOptionTypes] = useState<string[]>([]); // e.g. ["Taille", "Couleur"]
  const [deletedVariantIds, setDeletedVariantIds] = useState<string[]>([]);

  const {
    register, handleSubmit, reset, setValue, watch,
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

      const existingImages: ImageItem[] = (
        Array.isArray(product.images) ? product.images : []
      ).map((url: string) => ({ type: "url" as const, preview: url }));
      setImages(existingImages);

      // Load variants
      supabase
        .from("product_variants")
        .select("*")
        .eq("product_id", product.id)
        .order("created_at")
        .then(({ data }) => {
          if (data && data.length > 0) {
            setHasVariants(true);
            const rows: VariantRow[] = data.map((v) => ({
              _key: Math.random().toString(36).slice(2, 8),
              id: v.id,
              name: v.name,
              price: v.price,
              stock_quantity: v.stock_quantity,
              sku: v.sku || "",
              options: (v.options as Record<string, string>) || {},
            }));
            setVariants(rows);
            // Infer option types from existing variants
            const types = new Set<string>();
            rows.forEach((r) => Object.keys(r.options).forEach((k) => types.add(k)));
            setOptionTypes(types.size > 0 ? Array.from(types) : ["Taille"]);
          } else {
            setHasVariants(false);
            setVariants([]);
            setOptionTypes(["Taille"]);
          }
        });
      setDeletedVariantIds([]);
    } else if (open && !product) {
      reset({ name: "", price: 0, stock_quantity: 0, description: "", sku: "", is_published: false });
      setImages([]);
      setHasVariants(false);
      setVariants([]);
      setOptionTypes(["Taille"]);
      setDeletedVariantIds([]);
    }
  }, [open, product, setValue, reset]);

  // --- Image handling (unchanged) ---
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) { toast.error(`Maximum ${MAX_IMAGES} images autorisées`); return; }
    const validFiles = files.slice(0, remaining).filter((file) => {
      if (!file.type.startsWith("image/")) { toast.error(`${file.name} n'est pas une image`); return false; }
      if (file.size > MAX_FILE_SIZE) { toast.error(`${file.name} dépasse 5 Mo`); return false; }
      return true;
    });
    const newItems: ImageItem[] = validFiles.map((file) => ({ type: "file", file, preview: URL.createObjectURL(file) }));
    setImages((prev) => [...prev, ...newItems]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [images.length]);

  const removeImage = useCallback((index: number) => {
    setImages((prev) => { const item = prev[index]; if (item.type === "file") URL.revokeObjectURL(item.preview); return prev.filter((_, i) => i !== index); });
  }, []);

  const handleDragStart = useCallback((index: number) => setDragIndex(index), []);
  const handleDragOver = useCallback((e: React.DragEvent, index: number) => { e.preventDefault(); setDragOverIndex(index); }, []);
  const handleDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === dropIndex) { setDragIndex(null); setDragOverIndex(null); return; }
    setImages((prev) => { const u = [...prev]; const [m] = u.splice(dragIndex, 1); u.splice(dropIndex, 0, m); return u; });
    setDragIndex(null); setDragOverIndex(null);
  }, [dragIndex]);
  const handleDragEnd = useCallback(() => { setDragIndex(null); setDragOverIndex(null); }, []);

  const uploadNewImages = async (storeId: string, productSlug: string): Promise<string[]> => {
    const urls: string[] = [];
    for (const item of images) {
      if (item.type === "url") { urls.push(item.preview); }
      else if (item.file) {
        const ext = item.file.name.split(".").pop() || "jpg";
        const path = `${storeId}/products/${productSlug}/${Date.now()}-${Math.random().toString(36).slice(2, 6)}.${ext}`;
        const { error } = await supabase.storage.from("store-assets").upload(path, item.file, { contentType: item.file.type, upsert: false });
        if (error) throw new Error("Échec upload image");
        const { data: urlData } = supabase.storage.from("store-assets").getPublicUrl(path);
        urls.push(urlData.publicUrl);
      }
    }
    return urls;
  };

  // --- Variant helpers ---
  const addVariant = () => setVariants((prev) => [...prev, newVariantRow()]);

  const removeVariant = (index: number) => {
    setVariants((prev) => {
      const v = prev[index];
      if (v.id) setDeletedVariantIds((d) => [...d, v.id!]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const updateVariant = (index: number, field: keyof VariantRow, value: any) => {
    setVariants((prev) => prev.map((v, i) => i === index ? { ...v, [field]: value } : v));
  };

  const updateVariantOption = (index: number, optionType: string, value: string) => {
    setVariants((prev) => prev.map((v, i) => i === index ? { ...v, options: { ...v.options, [optionType]: value } } : v));
  };

  const addOptionType = () => {
    const name = prompt("Nom de l'option (ex: Couleur, Matière)");
    if (name && name.trim() && !optionTypes.includes(name.trim())) {
      setOptionTypes((prev) => [...prev, name.trim()]);
    }
  };

  const removeOptionType = (type: string) => {
    setOptionTypes((prev) => prev.filter((t) => t !== type));
    setVariants((prev) => prev.map((v) => {
      const opts = { ...v.options };
      delete opts[type];
      return { ...v, options: opts };
    }));
  };

  const autoGenerateVariantName = (v: VariantRow) => {
    const parts = optionTypes.map((t) => v.options[t]).filter(Boolean);
    return parts.length > 0 ? parts.join(" / ") : "";
  };

  // --- Submit ---
  const onSubmit = async (data: FormData) => {
    if (!store) { toast.error("Boutique introuvable"); return; }

    // Validate variants
    if (hasVariants && variants.length > 0) {
      for (const v of variants) {
        const name = v.name || autoGenerateVariantName(v);
        if (!name) { toast.error("Chaque variante doit avoir un nom ou des options renseignées"); return; }
      }
    }

    setLoading(true);
    const slug = isEdit ? product!.slug : slugify(data.name) + "-" + Date.now().toString(36);

    let imageUrls: string[] = [];
    if (images.length > 0) {
      setUploadingImages(true);
      try { imageUrls = await uploadNewImages(store.id, slug); }
      catch (err: any) { toast.error(err.message); setLoading(false); setUploadingImages(false); return; }
      setUploadingImages(false);
    }

    let productId = product?.id;

    if (isEdit) {
      const { error } = await supabase.from("products").update({
        name: data.name, price: data.price, stock_quantity: data.stock_quantity,
        description: data.description || null, sku: data.sku || null,
        is_published: data.is_published, images: imageUrls,
      }).eq("id", product!.id);
      if (error) { console.error(error); toast.error("Erreur lors de la mise à jour"); setLoading(false); return; }
    } else {
      const { data: inserted, error } = await supabase.from("products").insert({
        store_id: store.id, name: data.name, slug,
        price: data.price, stock_quantity: data.stock_quantity,
        description: data.description || null, sku: data.sku || null,
        is_published: data.is_published, images: imageUrls,
      }).select("id").single();
      if (error || !inserted) { console.error(error); toast.error("Erreur lors de la création"); setLoading(false); return; }
      productId = inserted.id;
    }

    // Save variants
    if (hasVariants && productId) {
      // Delete removed variants
      if (deletedVariantIds.length > 0) {
        await supabase.from("product_variants").delete().in("id", deletedVariantIds);
      }

      for (const v of variants) {
        const variantName = v.name || autoGenerateVariantName(v);
        const payload = {
          product_id: productId,
          name: variantName,
          price: v.price,
          stock_quantity: v.stock_quantity,
          sku: v.sku || null,
          options: v.options,
        };

        if (v.id) {
          await supabase.from("product_variants").update(payload).eq("id", v.id);
        } else {
          await supabase.from("product_variants").insert(payload);
        }
      }
    } else if (!hasVariants && productId && isEdit) {
      // If variants were disabled, delete all existing variants
      await supabase.from("product_variants").delete().eq("product_id", productId);
    }

    setLoading(false);
    toast.success(isEdit ? "Produit mis à jour" : "Produit créé avec succès");
    images.forEach((img) => { if (img.type === "file") URL.revokeObjectURL(img.preview); });
    setImages([]);
    setVariants([]);
    reset();
    onOpenChange(false);
    onSuccess();
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      images.forEach((img) => { if (img.type === "file") URL.revokeObjectURL(img.preview); });
      setImages([]);
      setVariants([]);
      reset();
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
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
                    dragOverIndex === i && dragIndex !== i ? "border-primary ring-2 ring-primary/30 scale-[1.02]"
                    : dragIndex === i ? "opacity-50 border-border" : "border-border"
                  }`}
                >
                  <img src={img.preview} alt="" className="h-full w-full object-cover pointer-events-none" />
                  <div className="absolute top-1 left-1 h-6 w-6 rounded-full bg-background/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground">
                    <GripVertical size={12} />
                  </div>
                  <button type="button" onClick={() => removeImage(i)} className="absolute top-1 right-1 h-6 w-6 rounded-full bg-background/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:bg-destructive hover:text-destructive-foreground">
                    <X size={12} />
                  </button>
                  {i === 0 && (
                    <span className="absolute bottom-1 left-1 text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded font-medium">Principale</span>
                  )}
                </div>
              ))}
              {images.length < MAX_IMAGES && (
                <button type="button" onClick={() => fileInputRef.current?.click()} className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-primary/50 bg-secondary/50 flex flex-col items-center justify-center gap-1 transition-colors text-muted-foreground hover:text-foreground">
                  <ImagePlus size={20} />
                  <span className="text-[10px]">Ajouter</span>
                </button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{images.length}/{MAX_IMAGES} images · Max 5 Mo · Glissez pour réorganiser</p>
            <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileSelect} className="hidden" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pf-name">Nom du produit *</Label>
            <Input id="pf-name" placeholder="Ex: T-shirt Premium" {...register("name")} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="pf-price">Prix de base (XOF) *</Label>
              <Input id="pf-price" type="number" step="1" {...register("price")} />
              {errors.price && <p className="text-xs text-destructive">{errors.price.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pf-stock">Stock {hasVariants ? "(global)" : "*"}</Label>
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

          {/* Variants section */}
          <div className="rounded-lg border border-border overflow-hidden">
            <div className="flex items-center justify-between p-3 bg-secondary/30">
              <div>
                <p className="text-sm font-medium text-foreground">Variantes</p>
                <p className="text-xs text-muted-foreground">Tailles, couleurs, etc.</p>
              </div>
              <Switch checked={hasVariants} onCheckedChange={(v) => {
                setHasVariants(v);
                if (v && variants.length === 0) addVariant();
              }} />
            </div>

            {hasVariants && (
              <div className="p-3 space-y-3 border-t border-border">
                {/* Option types */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-muted-foreground">Options :</span>
                  {optionTypes.map((type) => (
                    <span key={type} className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary text-xs px-2 py-0.5 font-medium">
                      {type}
                      {optionTypes.length > 1 && (
                        <button type="button" onClick={() => removeOptionType(type)} className="hover:text-destructive">
                          <X size={10} />
                        </button>
                      )}
                    </span>
                  ))}
                  <button type="button" onClick={addOptionType} className="text-xs text-primary hover:underline">
                    + Ajouter une option
                  </button>
                </div>

                {/* Variant rows */}
                <div className="space-y-2">
                  {variants.map((v, vi) => (
                    <div key={v._key} className="rounded-lg border border-border p-3 space-y-2 bg-card">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">
                          Variante {vi + 1}
                          {autoGenerateVariantName(v) && ` — ${autoGenerateVariantName(v)}`}
                        </span>
                        <button type="button" onClick={() => removeVariant(vi)} className="text-muted-foreground hover:text-destructive transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>

                      {/* Option values */}
                      <div className="grid grid-cols-2 gap-2">
                        {optionTypes.map((type) => (
                          <div key={type} className="space-y-1">
                            <Label className="text-xs">{type}</Label>
                            <Input
                              placeholder={`Ex: ${type === "Taille" ? "M" : type === "Couleur" ? "Noir" : "..."}`}
                              value={v.options[type] || ""}
                              onChange={(e) => updateVariantOption(vi, type, e.target.value)}
                              className="h-8 text-xs"
                            />
                          </div>
                        ))}
                      </div>

                      {/* Price, stock, SKU */}
                      <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs">Prix (XOF)</Label>
                          <Input
                            type="number" step="1"
                            value={v.price}
                            onChange={(e) => updateVariant(vi, "price", Number(e.target.value))}
                            className="h-8 text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Stock</Label>
                          <Input
                            type="number"
                            value={v.stock_quantity}
                            onChange={(e) => updateVariant(vi, "stock_quantity", Number(e.target.value))}
                            className="h-8 text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">SKU</Label>
                          <Input
                            placeholder="SKU"
                            value={v.sku}
                            onChange={(e) => updateVariant(vi, "sku", e.target.value)}
                            className="h-8 text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <Button type="button" variant="outline" size="sm" onClick={addVariant} className="w-full">
                  <Plus size={14} />
                  Ajouter une variante
                </Button>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <p className="text-sm font-medium text-foreground">Publier le produit</p>
              <p className="text-xs text-muted-foreground">Rendre visible sur votre boutique</p>
            </div>
            <Switch checked={isPublished} onCheckedChange={(v) => setValue("is_published", v)} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => handleClose(false)}>Annuler</Button>
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
