import { useState, useRef, useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import VariantEditor, { type VariantRow } from "@/components/dashboard/VariantEditor";
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
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2, ImagePlus, X, GripVertical, Plus,
  Package, DollarSign, Layers, Tag, Settings2, Globe, BarChart3, Weight, Barcode, Info,
  Send, CheckCircle2, Clock, XCircle, AlertTriangle, Video, Flame
} from "lucide-react";

// ── Schema ──────────────────────────────────────────────────────────
const schema = z.object({
  name: z.string().min(2, "Nom requis (min 2 caractères)").max(200),
  price: z.coerce.number().min(0, "Prix invalide"),
  compare_at_price: z.coerce.number().min(0).optional().or(z.literal("")),
  cost_price: z.coerce.number().min(0).optional().or(z.literal("")),
  stock_quantity: z.coerce.number().int().min(0, "Stock invalide"),
  low_stock_threshold: z.coerce.number().int().min(0).optional().or(z.literal("")),
  description: z.string().max(5000).optional(),
  sku: z.string().max(100).optional(),
  barcode: z.string().max(100).optional(),
  weight_grams: z.coerce.number().int().min(0).optional().or(z.literal("")),
  is_published: z.boolean().default(false),
  is_marketplace_published: z.boolean().default(false),
  marketplace_category_id: z.string().optional(),
  tags: z.string().optional(),
  video_url: z.string().url("URL invalide").optional().or(z.literal("")),
  low_stock_alert_enabled: z.boolean().default(false),
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
  compare_at_price?: number | null;
  cost_price?: number | null;
  barcode?: string | null;
  weight_grams?: number | null;
  tags?: string[] | null;
  low_stock_threshold?: number | null;
  is_marketplace_published?: boolean;
  marketplace_category_id?: string | null;
  video_url?: string | null;
  low_stock_alert_enabled?: boolean;
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

// VariantRow imported from VariantEditor above

interface MarketCategory {
  id: string;
  name: string;
}

function slugify(text: string) {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 80);
}

const MAX_IMAGES = 6;
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// newVariantRow moved to VariantEditor

// ── Marketplace Submit Section ──────────────────────────────────────
function MarketplaceSubmitSection({
  productId, storeId, canPublish, categories,
  showNewCategory, setShowNewCategory, newCategoryName, setNewCategoryName,
  creatingCategory, setCreatingCategory, setCategories, watch, setValue,
}: {
  productId: string;
  storeId: string;
  canPublish: boolean;
  categories: MarketCategory[];
  showNewCategory: boolean;
  setShowNewCategory: (v: boolean) => void;
  newCategoryName: string;
  setNewCategoryName: (v: string) => void;
  creatingCategory: boolean;
  setCreatingCategory: (v: boolean) => void;
  setCategories: React.Dispatch<React.SetStateAction<MarketCategory[]>>;
  watch: any;
  setValue: any;
}) {
  const [listingStatus, setListingStatus] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [loadingListing, setLoadingListing] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchListing = async () => {
      const { data } = await supabase
        .from("marketplace_listings")
        .select("status, rejection_reason")
        .eq("product_id", productId)
        .maybeSingle();
      if (data) {
        setListingStatus(data.status);
        setRejectionReason(data.rejection_reason);
      }
      setLoadingListing(false);
    };
    fetchListing();
  }, [productId]);

  const handleSubmitToMarketplace = async () => {
    if (!canPublish) {
      toast.error("Complétez toutes les informations requises avant de soumettre.");
      return;
    }
    const categoryId = watch("marketplace_category_id");
    if (!categoryId) {
      toast.error("Sélectionnez une catégorie marketplace.");
      return;
    }

    setSubmitting(true);
    // Update product category
    await supabase.from("products").update({ marketplace_category_id: categoryId }).eq("id", productId);

    if (listingStatus) {
      // Update existing listing
      const { error } = await supabase
        .from("marketplace_listings")
        .update({ status: "submitted", submitted_at: new Date().toISOString(), rejection_reason: null })
        .eq("product_id", productId);
      if (error) { toast.error("Erreur lors de la soumission"); setSubmitting(false); return; }
    } else {
      // Create new listing
      const { error } = await supabase
        .from("marketplace_listings")
        .insert({ product_id: productId, store_id: storeId, status: "submitted", submitted_at: new Date().toISOString() });
      if (error) { toast.error("Erreur lors de la soumission"); setSubmitting(false); return; }
    }

    setListingStatus("submitted");
    setRejectionReason(null);
    setSubmitting(false);
    toast.success("Produit soumis à la marketplace !");
  };

  const handleWithdraw = async () => {
    setSubmitting(true);
    await supabase
      .from("marketplace_listings")
      .update({ status: "hidden" })
      .eq("product_id", productId);
    setListingStatus("hidden");
    setSubmitting(false);
    toast.success("Produit retiré de la marketplace.");
  };

  if (loadingListing) {
    return (
      <div className="rounded-xl border border-border p-4 flex items-center justify-center py-6">
        <Loader2 size={16} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  const statusConfig: Record<string, { icon: React.ReactNode; label: string; color: string; bg: string }> = {
    submitted: { icon: <Clock size={14} />, label: "En attente de modération", color: "text-yellow-500", bg: "bg-yellow-500/10" },
    approved: { icon: <CheckCircle2 size={14} />, label: "Approuvé", color: "text-blue-500", bg: "bg-blue-500/10" },
    published: { icon: <CheckCircle2 size={14} />, label: "Publié sur la marketplace", color: "text-green-500", bg: "bg-green-500/10" },
    rejected: { icon: <XCircle size={14} />, label: "Rejeté", color: "text-red-500", bg: "bg-red-500/10" },
    hidden: { icon: <Globe size={14} />, label: "Non soumis", color: "text-muted-foreground", bg: "bg-secondary" },
  };

  const currentStatus = statusConfig[listingStatus || "hidden"] || statusConfig.hidden;

  return (
    <div className="rounded-xl border border-border p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            <Globe size={14} /> Marketplace Feyxa
          </p>
          <p className="text-xs text-muted-foreground">Soumettez votre produit pour modération avant publication</p>
        </div>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${currentStatus.color} ${currentStatus.bg}`}>
          {currentStatus.icon}
          {currentStatus.label}
        </div>
      </div>

      {/* Rejection reason */}
      {listingStatus === "rejected" && rejectionReason && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3 space-y-1">
          <p className="text-xs font-semibold text-red-400 flex items-center gap-1">
            <AlertTriangle size={12} /> Motif de rejet
          </p>
          <p className="text-xs text-muted-foreground">{rejectionReason}</p>
        </div>
      )}

      {/* Category selector — always show if not yet published */}
      {listingStatus !== "published" && (
        <div className="space-y-2 pt-1 border-t border-border">
          <Label className="text-sm">Catégorie marketplace *</Label>
          {!showNewCategory ? (
            <Select
              value={watch("marketplace_category_id") || ""}
              onValueChange={(v) => {
                if (v === "__other__") setShowNewCategory(true);
                else setValue("marketplace_category_id", v);
              }}
            >
              <SelectTrigger><SelectValue placeholder="Choisir une catégorie..." /></SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
                <SelectItem value="__other__">+ Autre (créer une catégorie)</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Nom de la nouvelle catégorie"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="button" size="sm"
                  disabled={!newCategoryName.trim() || creatingCategory}
                  onClick={async () => {
                    if (!newCategoryName.trim()) return;
                    setCreatingCategory(true);
                    const slug = newCategoryName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
                    const { data: inserted, error } = await supabase.from("marketplace_categories").insert({
                      name: newCategoryName.trim(), slug: slug || `cat-${Date.now()}`,
                    }).select("id, name").single();
                    setCreatingCategory(false);
                    if (error) { toast.error("Erreur lors de la création"); return; }
                    if (inserted) {
                      setCategories((prev) => [...prev, inserted]);
                      setValue("marketplace_category_id", inserted.id);
                      setNewCategoryName(""); setShowNewCategory(false);
                      toast.success("Catégorie créée !");
                    }
                  }}
                >
                  {creatingCategory ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                </Button>
              </div>
              <button type="button" className="text-xs text-muted-foreground hover:text-foreground transition-colors" onClick={() => { setShowNewCategory(false); setNewCategoryName(""); }}>
                ← Retour aux catégories existantes
              </button>
            </div>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-2 pt-1">
        {(!listingStatus || listingStatus === "hidden" || listingStatus === "rejected") && (
          <Button
            type="button" size="sm" variant="hero"
            disabled={submitting || !canPublish}
            onClick={handleSubmitToMarketplace}
            className="gap-1.5"
          >
            {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            {listingStatus === "rejected" ? "Resoumettre" : "Soumettre à la marketplace"}
          </Button>
        )}
        {(listingStatus === "submitted" || listingStatus === "published" || listingStatus === "approved") && (
          <Button
            type="button" size="sm" variant="outline"
            disabled={submitting}
            onClick={handleWithdraw}
            className="gap-1.5"
          >
            {submitting ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
            Retirer de la marketplace
          </Button>
        )}
        {!canPublish && (
          <p className="text-xs text-amber-500 flex items-center gap-1">
            <AlertTriangle size={12} /> Complétez le produit pour soumettre
          </p>
        )}
      </div>
    </div>
  );
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

  // Tags UI
  const [tagInput, setTagInput] = useState("");
  const [tagList, setTagList] = useState<string[]>([]);

  // Categories
  const [categories, setCategories] = useState<MarketCategory[]>([]);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);

  // Variants
  const [hasVariants, setHasVariants] = useState(false);
  const [variants, setVariants] = useState<VariantRow[]>([]);
  const [optionTypes, setOptionTypes] = useState<string[]>([]);
  const [deletedVariantIds, setDeletedVariantIds] = useState<string[]>([]);

  const {
    register, handleSubmit, reset, setValue, watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "", price: 0, compare_at_price: "", cost_price: "",
      stock_quantity: 0, low_stock_threshold: "",
      description: "", sku: "", barcode: "", weight_grams: "",
      is_published: false, is_marketplace_published: false,
      marketplace_category_id: "", tags: "",
      video_url: "", low_stock_alert_enabled: false,
    },
  });

  const isPublished = watch("is_published");
  const isMarketplace = watch("is_marketplace_published");
  const price = watch("price");
  const compareAtPrice = watch("compare_at_price");

  // Load categories once
  useEffect(() => {
    supabase.from("marketplace_categories").select("id, name").order("sort_order").then(({ data }) => {
      if (data) setCategories(data);
    });
  }, []);

  // Populate form when editing
  useEffect(() => {
    if (open && product) {
      setValue("name", product.name);
      setValue("price", product.price);
      setValue("compare_at_price", product.compare_at_price ?? "");
      setValue("cost_price", product.cost_price ?? "");
      setValue("stock_quantity", product.stock_quantity);
      setValue("low_stock_threshold", product.low_stock_threshold ?? "");
      setValue("description", product.description || "");
      setValue("sku", product.sku || "");
      setValue("barcode", product.barcode || "");
      setValue("weight_grams", product.weight_grams ?? "");
      setValue("is_published", product.is_published);
      setValue("is_marketplace_published", product.is_marketplace_published ?? false);
      setValue("marketplace_category_id", product.marketplace_category_id || "");
      setValue("video_url", product.video_url || "");
      setValue("low_stock_alert_enabled", product.low_stock_alert_enabled ?? false);

      setTagList(product.tags ?? []);

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
            const rows: VariantRow[] = data.map((v) => {
              const opts = (v.options as Record<string, string>) || {};
              const { _image_url, _description, ...cleanOpts } = opts;
              return {
                _key: Math.random().toString(36).slice(2, 8),
                id: v.id,
                name: v.name,
                price: v.price,
                stock_quantity: v.stock_quantity,
                sku: v.sku || "",
                options: cleanOpts,
                image_url: _image_url || "",
                description: _description || "",
              };
            });
            setVariants(rows);
            const types = new Set<string>();
            rows.forEach((r) => Object.keys(r.options).forEach((k) => !k.startsWith("_") && types.add(k)));
            setOptionTypes(types.size > 0 ? Array.from(types) : ["Taille"]);
          } else {
            setHasVariants(false);
            setVariants([]);
            setOptionTypes(["Taille"]);
          }
        });
      setDeletedVariantIds([]);
    } else if (open && !product) {
      reset();
      setImages([]);
      setTagList([]);
      setTagInput("");
      setHasVariants(false);
      setVariants([]);
      setOptionTypes(["Taille"]);
      setDeletedVariantIds([]);
    }
  }, [open, product, setValue, reset]);

  // Discount calculation
  const discountPercent = (() => {
    const cp = Number(compareAtPrice);
    const p = Number(price);
    if (cp && cp > p && p > 0) return Math.round(((cp - p) / cp) * 100);
    return 0;
  })();

  // Margin calculation
  const costPrice = Number(watch("cost_price"));
  const margin = (() => {
    const p = Number(price);
    if (costPrice > 0 && p > 0) return Math.round(((p - costPrice) / p) * 100);
    return null;
  })();

  // --- Tags ---
  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tagList.includes(t) && tagList.length < 20) {
      setTagList((prev) => [...prev, t]);
      setTagInput("");
    }
  };
  const removeTag = (tag: string) => setTagList((prev) => prev.filter((t) => t !== tag));

  // --- Image handling ---
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

  // autoGenerateVariantName helper for submit validation
  const autoGenerateVariantName = (v: VariantRow) => {
    const parts = optionTypes.map((t) => v.options[t]).filter(Boolean);
    return parts.length > 0 ? parts.join(" / ") : "";
  };

  // --- Validation: check completeness for publishing ---
  const canPublish = () => {
    const name = watch("name");
    const desc = watch("description");
    const p = Number(watch("price"));
    const stock = Number(watch("stock_quantity"));
    return !!(name && name.length >= 2 && desc && desc.length >= 10 && p > 0 && stock > 0 && images.length >= 1);
  };

  // --- Submit ---
  const onSubmit = async (data: FormData) => {
    if (!store) { toast.error("Boutique introuvable"); return; }

    // Block publishing if form is incomplete
    if ((data.is_published || data.is_marketplace_published) && !canPublish()) {
      toast.error("Pour publier, complétez : nom, description (min 10 car.), prix, stock, et au moins 1 image.");
      return;
    }

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

    const productPayload = {
      name: data.name,
      price: data.price,
      compare_at_price: data.compare_at_price ? Number(data.compare_at_price) : null,
      cost_price: data.cost_price ? Number(data.cost_price) : null,
      stock_quantity: data.stock_quantity,
      low_stock_threshold: data.low_stock_threshold ? Number(data.low_stock_threshold) : null,
      description: data.description || null,
      sku: data.sku || null,
      barcode: data.barcode || null,
      weight_grams: data.weight_grams ? Number(data.weight_grams) : null,
      is_published: data.is_published,
      is_marketplace_published: data.is_marketplace_published,
      marketplace_category_id: data.marketplace_category_id || null,
      images: imageUrls,
      tags: tagList.length > 0 ? tagList : null,
      video_url: data.video_url || null,
      low_stock_alert_enabled: data.low_stock_alert_enabled,
    };

    let productId = product?.id;

    if (isEdit) {
      const { error } = await supabase.from("products").update(productPayload).eq("id", product!.id);
      if (error) { console.error(error); toast.error("Erreur lors de la mise à jour"); setLoading(false); return; }
    } else {
      const { data: inserted, error } = await supabase.from("products").insert({
        store_id: store.id, slug, ...productPayload,
      }).select("id").single();
      if (error || !inserted) { console.error(error); toast.error("Erreur lors de la création"); setLoading(false); return; }
      productId = inserted.id;
    }

    // Save variants
    if (hasVariants && productId) {
      if (deletedVariantIds.length > 0) {
        await supabase.from("product_variants").delete().in("id", deletedVariantIds);
      }
      for (const v of variants) {
        const variantName = v.name || autoGenerateVariantName(v);
        // Store image_url and description inside options jsonb
        const enrichedOptions: Record<string, string> = { ...v.options };
        if (v.image_url) enrichedOptions._image_url = v.image_url;
        if (v.description) enrichedOptions._description = v.description;
        const payload = {
          product_id: productId,
          name: variantName,
          price: v.price,
          stock_quantity: v.stock_quantity,
          sku: v.sku || null,
          options: enrichedOptions,
        };
        if (v.id) {
          await supabase.from("product_variants").update(payload).eq("id", v.id);
        } else {
          await supabase.from("product_variants").insert(payload);
        }
      }
    } else if (!hasVariants && productId && isEdit) {
      await supabase.from("product_variants").delete().eq("product_id", productId);
    }

    setLoading(false);
    toast.success(isEdit ? "Produit mis à jour" : "Produit créé avec succès");
    images.forEach((img) => { if (img.type === "file") URL.revokeObjectURL(img.preview); });
    setImages([]);
    setVariants([]);
    setTagList([]);
    reset();
    onOpenChange(false);
    onSuccess();
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      images.forEach((img) => { if (img.type === "file") URL.revokeObjectURL(img.preview); });
      setImages([]);
      setVariants([]);
      setTagList([]);
      reset();
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-3xl max-h-[92vh] overflow-y-auto p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-xl font-bold">
            {isEdit ? "Modifier le produit" : "Nouveau produit"}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {isEdit ? "Mettez à jour les informations de votre produit" : "Remplissez les informations pour créer votre produit"}
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="px-6 pb-6">
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="w-full grid grid-cols-4 mb-6">
              <TabsTrigger value="general" className="gap-1.5 text-xs">
                <Package size={14} />
                Général
              </TabsTrigger>
              <TabsTrigger value="pricing" className="gap-1.5 text-xs">
                <DollarSign size={14} />
                Prix & Stock
              </TabsTrigger>
              <TabsTrigger value="variants" className="gap-1.5 text-xs">
                <Layers size={14} />
                Variantes
              </TabsTrigger>
              <TabsTrigger value="publishing" className="gap-1.5 text-xs">
                <Globe size={14} />
                Publication
              </TabsTrigger>
            </TabsList>

            {/* ── TAB: General ── */}
            <TabsContent value="general" className="space-y-5 mt-0">
              {/* Images */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold flex items-center gap-1.5">
                  <ImagePlus size={14} /> Images du produit
                </Label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
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
                      <div className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-background/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground">
                        <GripVertical size={10} />
                      </div>
                      <button type="button" onClick={() => removeImage(i)} className="absolute top-0.5 right-0.5 h-5 w-5 rounded-full bg-background/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:bg-destructive hover:text-destructive-foreground">
                        <X size={10} />
                      </button>
                      {i === 0 && (
                        <span className="absolute bottom-0.5 left-0.5 text-[9px] bg-primary text-primary-foreground px-1 py-0.5 rounded font-medium">Principale</span>
                      )}
                    </div>
                  ))}
                  {images.length < MAX_IMAGES && (
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-primary/50 bg-secondary/50 flex flex-col items-center justify-center gap-0.5 transition-colors text-muted-foreground hover:text-foreground">
                      <ImagePlus size={18} />
                      <span className="text-[9px]">Ajouter</span>
                    </button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{images.length}/{MAX_IMAGES} images · Max 5 Mo · Glissez pour réorganiser</p>
                <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileSelect} className="hidden" />
              </div>

              {/* Name */}
              <div className="space-y-1.5">
                <Label htmlFor="pf-name" className="font-semibold">Nom du produit *</Label>
                <Input id="pf-name" placeholder="Ex: T-shirt Premium Coton Bio" {...register("name")} className="h-11" />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label htmlFor="pf-desc" className="font-semibold">Description</Label>
                <Textarea id="pf-desc" placeholder="Décrivez votre produit en détail : matériaux, dimensions, conseils d'utilisation..." rows={5} {...register("description")} />
                <p className="text-xs text-muted-foreground">Une bonne description augmente les conversions de 30%</p>
              </div>

              {/* Tags */}
              <div className="space-y-1.5">
                <Label className="font-semibold flex items-center gap-1.5">
                  <Tag size={14} /> Tags / Mots-clés
                </Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Ex: coton, premium, été..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={addTag} disabled={!tagInput.trim()}>
                    <Plus size={14} />
                  </Button>
                </div>
                {tagList.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {tagList.map((tag) => (
                      <Badge key={tag} variant="secondary" className="gap-1 text-xs">
                        {tag}
                        <button type="button" onClick={() => removeTag(tag)} className="hover:text-destructive">
                          <X size={10} />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">Les tags améliorent la recherche. Max 20 tags. Appuyez Entrée pour ajouter.</p>
              </div>

              {/* Video URL */}
              <div className="space-y-1.5">
                <Label htmlFor="pf-video" className="font-semibold flex items-center gap-1.5">
                  <Video size={14} /> URL de la vidéo du produit
                </Label>
                <Input
                  id="pf-video"
                  placeholder="https://youtube.com/watch?v=... ou lien MP4"
                  {...register("video_url")}
                />
                {errors.video_url && <p className="text-xs text-destructive">{errors.video_url.message}</p>}
                <p className="text-xs text-muted-foreground">YouTube, Vimeo ou lien MP4 direct. La vidéo apparaîtra dans la galerie produit.</p>
              </div>

              {/* Low stock alert toggle */}
              <div className="rounded-xl border border-border p-4 flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                    <Flame size={14} className="text-destructive" /> Activer le mode urgence
                  </p>
                  <p className="text-xs text-muted-foreground">Affiche une alerte "stock faible" animée sur la page produit</p>
                </div>
                <Switch
                  checked={watch("low_stock_alert_enabled")}
                  onCheckedChange={(v) => setValue("low_stock_alert_enabled", v)}
                />
              </div>
            </TabsContent>

            {/* ── TAB: Pricing & Stock ── */}
            <TabsContent value="pricing" className="space-y-5 mt-0">
              {/* Pricing section */}
              <div className="rounded-xl border border-border p-4 space-y-4">
                <h3 className="text-sm font-semibold flex items-center gap-1.5">
                  <DollarSign size={14} /> Tarification
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="pf-price">Prix de vente ({store?.currency || "XOF"}) *</Label>
                    <Input id="pf-price" type="number" step="1" placeholder="0" {...register("price")} className="h-11 text-lg font-semibold" />
                    {errors.price && <p className="text-xs text-destructive">{errors.price.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="pf-compare">Prix barré (ancien prix)</Label>
                    <Input id="pf-compare" type="number" step="1" placeholder="Optionnel" {...register("compare_at_price")} />
                    {discountPercent > 0 && (
                      <p className="text-xs text-accent font-medium">↓ Remise de {discountPercent}%</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="pf-cost">Prix d'achat / coût</Label>
                    <Input id="pf-cost" type="number" step="1" placeholder="Optionnel" {...register("cost_price")} />
                    {margin !== null && (
                      <p className={`text-xs font-medium ${margin > 0 ? "text-accent" : "text-destructive"}`}>
                        Marge : {margin}%
                      </p>
                    )}
                  </div>
                  <div className="flex items-end pb-1">
                    <div className="rounded-lg bg-secondary/50 p-3 w-full text-center">
                      <p className="text-xs text-muted-foreground">Bénéfice estimé</p>
                      <p className="text-lg font-bold text-foreground">
                        {costPrice > 0 && Number(price) > 0
                          ? `${(Number(price) - costPrice).toLocaleString()} ${store?.currency || "XOF"}`
                          : "—"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stock & Inventory */}
              <div className="rounded-xl border border-border p-4 space-y-4">
                <h3 className="text-sm font-semibold flex items-center gap-1.5">
                  <BarChart3 size={14} /> Inventaire
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="pf-stock">Quantité en stock *</Label>
                    <Input id="pf-stock" type="number" placeholder="0" {...register("stock_quantity")} className="h-11" />
                    {errors.stock_quantity && <p className="text-xs text-destructive">{errors.stock_quantity.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="pf-low-stock">Seuil d'alerte stock bas</Label>
                    <Input id="pf-low-stock" type="number" placeholder="5" {...register("low_stock_threshold")} />
                    <p className="text-xs text-muted-foreground">Notification quand le stock passe en dessous</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="pf-sku" className="flex items-center gap-1">
                      <Barcode size={12} /> SKU
                    </Label>
                    <Input id="pf-sku" placeholder="REF-001" {...register("sku")} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="pf-barcode" className="flex items-center gap-1">
                      <Barcode size={12} /> Code-barres
                    </Label>
                    <Input id="pf-barcode" placeholder="EAN / UPC" {...register("barcode")} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="pf-weight" className="flex items-center gap-1">
                      <Weight size={12} /> Poids (g)
                    </Label>
                    <Input id="pf-weight" type="number" placeholder="500" {...register("weight_grams")} />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* ── TAB: Variants ── */}
            <TabsContent value="variants" className="mt-0">
              <VariantEditor
                hasVariants={hasVariants}
                setHasVariants={setHasVariants}
                variants={variants}
                setVariants={setVariants}
                optionTypes={optionTypes}
                setOptionTypes={setOptionTypes}
                deletedVariantIds={deletedVariantIds}
                setDeletedVariantIds={setDeletedVariantIds}
                storeId={store?.id || ""}
                currency={store?.currency || "XOF"}
                basePrice={Number(price) || 0}
              />
            </TabsContent>

            {/* ── TAB: Publishing ── */}
            <TabsContent value="publishing" className="space-y-5 mt-0">
              {/* Completeness check */}
              {!canPublish() && (
                <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 space-y-2">
                  <p className="text-sm font-semibold text-destructive flex items-center gap-1.5">
                    <Info size={14} /> Formulaire incomplet
                  </p>
                  <ul className="text-xs text-muted-foreground space-y-1 ml-5 list-disc">
                    {(!watch("name") || watch("name").length < 2) && <li>Nom du produit (min 2 caractères)</li>}
                    {(!watch("description") || watch("description").length < 10) && <li>Description (min 10 caractères)</li>}
                    {Number(watch("price")) <= 0 && <li>Prix de vente supérieur à 0</li>}
                    {Number(watch("stock_quantity")) <= 0 && <li>Stock supérieur à 0</li>}
                    {images.length < 1 && <li>Au moins 1 image</li>}
                  </ul>
                  <p className="text-xs text-muted-foreground">Complétez ces champs pour pouvoir publier votre produit.</p>
                </div>
              )}

              {/* Publish toggle */}
              <div className="rounded-xl border border-border p-4 flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                    <Settings2 size={14} /> Publier sur ma boutique
                  </p>
                  <p className="text-xs text-muted-foreground">Le produit sera visible sur votre vitrine en ligne</p>
                </div>
                <Switch
                  checked={isPublished}
                  onCheckedChange={(v) => {
                    if (v && !canPublish()) {
                      toast.error("Complétez toutes les informations requises avant de publier.");
                      return;
                    }
                    setValue("is_published", v);
                  }}
                />
              </div>

              {/* Marketplace submission — only for existing products */}
              {isEdit && product && (
                <MarketplaceSubmitSection
                  productId={product.id}
                  storeId={store?.id || ""}
                  canPublish={canPublish()}
                  categories={categories}
                  showNewCategory={showNewCategory}
                  setShowNewCategory={setShowNewCategory}
                  newCategoryName={newCategoryName}
                  setNewCategoryName={setNewCategoryName}
                  creatingCategory={creatingCategory}
                  setCreatingCategory={setCreatingCategory}
                  setCategories={setCategories}
                  watch={watch}
                  setValue={setValue}
                />
              )}

              {!isEdit && (
                <div className="rounded-xl border border-border bg-secondary/20 p-4 space-y-2">
                  <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                    <Globe size={14} /> Marketplace
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Vous pourrez soumettre votre produit à la marketplace après l'avoir créé et enregistré.
                  </p>
                </div>
              )}

              {/* Summary card */}
              <div className="rounded-xl bg-secondary/30 border border-border p-4 space-y-3">
                <h3 className="text-sm font-semibold text-foreground">Récapitulatif</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Statut boutique</p>
                    <p className="font-medium">{isPublished ? "✅ Publié" : "📝 Brouillon"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Marketplace</p>
                    <p className="font-medium">{isEdit ? "Voir onglet Publication" : "Après création"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Images</p>
                    <p className="font-medium">{images.length} image{images.length !== 1 ? "s" : ""}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Variantes</p>
                    <p className="font-medium">{hasVariants ? `${variants.length} variante${variants.length !== 1 ? "s" : ""}` : "Aucune"}</p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Actions */}
          <div className="flex items-center justify-between pt-6 mt-6 border-t border-border">
            <Button type="button" variant="ghost" size="sm" onClick={() => handleClose(false)}>
              Annuler
            </Button>
            <Button type="submit" variant="hero" size="default" disabled={loading} className="min-w-[160px]">
              {loading && <Loader2 size={14} className="animate-spin" />}
              {uploadingImages ? "Upload des images..." : isEdit ? "Enregistrer les modifications" : "Créer le produit"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
