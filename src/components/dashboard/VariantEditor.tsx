import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Plus, Trash2, X, Layers, ImagePlus, Loader2, Palette,
  ChevronDown, ChevronUp, GripVertical, Copy
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface VariantRow {
  _key: string;
  id?: string;
  name: string;
  price: number;
  stock_quantity: number;
  sku: string;
  options: Record<string, string>;
  image_url?: string;
  description?: string;
}

interface Props {
  hasVariants: boolean;
  setHasVariants: (v: boolean) => void;
  variants: VariantRow[];
  setVariants: React.Dispatch<React.SetStateAction<VariantRow[]>>;
  optionTypes: string[];
  setOptionTypes: React.Dispatch<React.SetStateAction<string[]>>;
  deletedVariantIds: string[];
  setDeletedVariantIds: React.Dispatch<React.SetStateAction<string[]>>;
  storeId: string;
  currency: string;
  basePrice: number;
}

const COLOR_PRESETS = [
  { name: "Noir", hex: "#000000" },
  { name: "Blanc", hex: "#FFFFFF" },
  { name: "Rouge", hex: "#EF4444" },
  { name: "Bleu", hex: "#3B82F6" },
  { name: "Vert", hex: "#22C55E" },
  { name: "Jaune", hex: "#EAB308" },
  { name: "Orange", hex: "#F97316" },
  { name: "Rose", hex: "#EC4899" },
  { name: "Violet", hex: "#8B5CF6" },
  { name: "Gris", hex: "#6B7280" },
  { name: "Marron", hex: "#92400E" },
  { name: "Beige", hex: "#D2B48C" },
];

function newVariantRow(defaults?: Partial<VariantRow>): VariantRow {
  return {
    _key: Math.random().toString(36).slice(2, 8),
    name: "",
    price: 0,
    stock_quantity: 0,
    sku: "",
    options: {},
    image_url: "",
    description: "",
    ...defaults,
  };
}

export default function VariantEditor({
  hasVariants, setHasVariants,
  variants, setVariants,
  optionTypes, setOptionTypes,
  deletedVariantIds, setDeletedVariantIds,
  storeId, currency, basePrice,
}: Props) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const fileInputRefs = useRef<Map<number, HTMLInputElement>>(new Map());

  const addVariant = () => {
    const row = newVariantRow({ price: basePrice });
    setVariants((prev) => [...prev, row]);
    setExpandedIndex(variants.length);
  };

  const removeVariant = (index: number) => {
    const v = variants[index];
    if (v.id) setDeletedVariantIds((d) => [...d, v.id!]);
    setVariants((prev) => prev.filter((_, i) => i !== index));
    if (expandedIndex === index) setExpandedIndex(null);
  };

  const duplicateVariant = (index: number) => {
    const source = variants[index];
    const dup = newVariantRow({
      price: source.price,
      stock_quantity: source.stock_quantity,
      options: { ...source.options },
      description: source.description,
    });
    setVariants((prev) => {
      const arr = [...prev];
      arr.splice(index + 1, 0, dup);
      return arr;
    });
    setExpandedIndex(index + 1);
  };

  const updateVariant = (index: number, field: keyof VariantRow, value: any) => {
    setVariants((prev) => prev.map((v, i) => i === index ? { ...v, [field]: value } : v));
  };

  const updateVariantOption = (index: number, optionType: string, value: string) => {
    setVariants((prev) => prev.map((v, i) => i === index ? { ...v, options: { ...v.options, [optionType]: value } } : v));
  };

  const addOptionType = () => {
    const name = prompt("Nom de l'option (ex: Couleur, Matière, Pointure)");
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

  const handleVariantImageUpload = useCallback(async (index: number, file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("Fichier non valide"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Image trop lourde (max 5 Mo)"); return; }

    setUploadingIndex(index);
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${storeId}/variants/${Date.now()}-${Math.random().toString(36).slice(2, 6)}.${ext}`;
    const { error } = await supabase.storage.from("store-assets").upload(path, file, { contentType: file.type });
    if (error) {
      toast.error("Échec de l'upload");
      setUploadingIndex(null);
      return;
    }
    const { data: urlData } = supabase.storage.from("store-assets").getPublicUrl(path);
    updateVariant(index, "image_url", urlData.publicUrl);
    setUploadingIndex(null);
    toast.success("Image ajoutée");
  }, [storeId, updateVariant]);

  const isColorOption = (type: string) =>
    ["couleur", "color", "colour"].includes(type.toLowerCase());

  const totalVariantStock = variants.reduce((sum, v) => sum + v.stock_quantity, 0);

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="flex items-center justify-between p-4 bg-secondary/30">
          <div>
            <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <Layers size={14} /> Variantes du produit
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Tailles, couleurs, matières... avec images et prix indépendants
            </p>
          </div>
          <Switch checked={hasVariants} onCheckedChange={(v) => {
            setHasVariants(v);
            if (v && variants.length === 0) addVariant();
          }} />
        </div>

        {hasVariants && (
          <div className="p-4 space-y-4 border-t border-border">
            {/* Option types */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Types d'options</Label>
              <div className="flex items-center gap-2 flex-wrap">
                {optionTypes.map((type) => (
                  <Badge key={type} variant="outline" className="gap-1 px-2.5 py-1 text-xs font-medium border-primary/30 bg-primary/5 text-primary">
                    {isColorOption(type) && <Palette size={10} />}
                    {type}
                    {optionTypes.length > 1 && (
                      <button type="button" onClick={() => removeOptionType(type)} className="hover:text-destructive ml-0.5">
                        <X size={10} />
                      </button>
                    )}
                  </Badge>
                ))}
                <Button type="button" variant="ghost" size="sm" onClick={addOptionType} className="text-xs text-primary h-7">
                  <Plus size={12} /> Ajouter un type
                </Button>
              </div>
            </div>

            {/* Stats bar */}
            {variants.length > 0 && (
              <div className="flex items-center gap-4 text-xs text-muted-foreground bg-secondary/50 rounded-lg px-3 py-2">
                <span><strong className="text-foreground">{variants.length}</strong> variante{variants.length > 1 ? "s" : ""}</span>
                <span>·</span>
                <span>Stock total : <strong className="text-foreground">{totalVariantStock}</strong></span>
                <span>·</span>
                <span>Prix min : <strong className="text-foreground">{Math.min(...variants.map(v => v.price)).toLocaleString()} {currency}</strong></span>
                <span>–</span>
                <span>max : <strong className="text-foreground">{Math.max(...variants.map(v => v.price)).toLocaleString()} {currency}</strong></span>
              </div>
            )}

            {/* Variant rows */}
            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {variants.map((v, vi) => {
                  const displayName = autoGenerateVariantName(v) || v.name || `Variante ${vi + 1}`;
                  const isExpanded = expandedIndex === vi;

                  return (
                    <motion.div
                      key={v._key}
                      layout
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, height: 0, overflow: "hidden" }}
                      className="rounded-lg border border-border bg-card overflow-hidden hover:border-primary/20 transition-colors"
                    >
                      {/* Collapsed header */}
                      <div
                        className="flex items-center gap-3 p-3 cursor-pointer select-none"
                        onClick={() => setExpandedIndex(isExpanded ? null : vi)}
                      >
                        {/* Variant image thumbnail */}
                        <div className="h-10 w-10 rounded-lg bg-secondary flex-shrink-0 overflow-hidden border border-border">
                          {v.image_url ? (
                            <img src={v.image_url} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-muted-foreground/40">
                              <ImagePlus size={14} />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{displayName}</p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span>{v.price.toLocaleString()} {currency}</span>
                            <span>·</span>
                            <span className={v.stock_quantity <= 0 ? "text-destructive" : ""}>
                              Stock: {v.stock_quantity}
                            </span>
                            {v.sku && <><span>·</span><span>SKU: {v.sku}</span></>}
                          </div>
                        </div>

                        {/* Color swatches preview */}
                        {optionTypes.some(isColorOption) && v.options[optionTypes.find(isColorOption)!] && (
                          <div
                            className="h-5 w-5 rounded-full border border-border flex-shrink-0"
                            style={{
                              backgroundColor:
                                COLOR_PRESETS.find(c => c.name.toLowerCase() === (v.options[optionTypes.find(isColorOption)!] || "").toLowerCase())?.hex
                                || v.options[optionTypes.find(isColorOption)!]
                            }}
                          />
                        )}

                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); duplicateVariant(vi); }}
                            className="h-7 w-7 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                            title="Dupliquer"
                          >
                            <Copy size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); removeVariant(vi); }}
                            className="h-7 w-7 rounded flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                          {isExpanded ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
                        </div>
                      </div>

                      {/* Expanded content */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="p-4 pt-2 space-y-4 border-t border-border">
                              {/* Image upload */}
                              <div className="space-y-2">
                                <Label className="text-xs font-medium flex items-center gap-1.5">
                                  <ImagePlus size={12} /> Image de la variante
                                </Label>
                                <div className="flex items-start gap-3">
                                  <div
                                    className="h-20 w-20 rounded-lg border-2 border-dashed border-border hover:border-primary/50 bg-secondary/30 flex-shrink-0 overflow-hidden cursor-pointer transition-colors relative group"
                                    onClick={() => {
                                      const input = fileInputRefs.current.get(vi);
                                      input?.click();
                                    }}
                                  >
                                    {uploadingIndex === vi ? (
                                      <div className="h-full w-full flex items-center justify-center">
                                        <Loader2 size={18} className="animate-spin text-primary" />
                                      </div>
                                    ) : v.image_url ? (
                                      <>
                                        <img src={v.image_url} alt="" className="h-full w-full object-cover" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                          <ImagePlus size={16} className="text-white" />
                                        </div>
                                      </>
                                    ) : (
                                      <div className="h-full w-full flex flex-col items-center justify-center gap-1 text-muted-foreground">
                                        <ImagePlus size={18} />
                                        <span className="text-[9px]">Ajouter</span>
                                      </div>
                                    )}
                                    <input
                                      ref={(el) => { if (el) fileInputRefs.current.set(vi, el); }}
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleVariantImageUpload(vi, file);
                                        e.target.value = "";
                                      }}
                                    />
                                  </div>
                                  <div className="flex-1 space-y-1">
                                    <p className="text-xs text-muted-foreground">
                                      Image spécifique à cette variante. Elle sera affichée quand le client sélectionne cette option.
                                    </p>
                                    {v.image_url && (
                                      <button
                                        type="button"
                                        onClick={() => updateVariant(vi, "image_url", "")}
                                        className="text-xs text-destructive hover:underline"
                                      >
                                        Supprimer l'image
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Option values */}
                              <div className="space-y-3">
                                {optionTypes.map((type) => (
                                  <div key={type} className="space-y-1.5">
                                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                                      {isColorOption(type) && <Palette size={10} />}
                                      {type}
                                    </Label>
                                    {isColorOption(type) ? (
                                      <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                          <Input
                                            placeholder="Ex: Noir, Rouge..."
                                            value={v.options[type] || ""}
                                            onChange={(e) => updateVariantOption(vi, type, e.target.value)}
                                            className="h-8 text-xs flex-1"
                                          />
                                          {v.options[type] && (
                                            <div
                                              className="h-8 w-8 rounded-md border border-border flex-shrink-0"
                                              style={{
                                                backgroundColor:
                                                  COLOR_PRESETS.find(c => c.name.toLowerCase() === (v.options[type] || "").toLowerCase())?.hex
                                                  || "#ccc"
                                              }}
                                            />
                                          )}
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                          {COLOR_PRESETS.map((color) => (
                                            <button
                                              key={color.name}
                                              type="button"
                                              onClick={() => updateVariantOption(vi, type, color.name)}
                                              className={`h-6 w-6 rounded-full border-2 transition-all hover:scale-110 ${
                                                (v.options[type] || "").toLowerCase() === color.name.toLowerCase()
                                                  ? "border-primary ring-2 ring-primary/30 scale-110"
                                                  : "border-border"
                                              }`}
                                              style={{ backgroundColor: color.hex }}
                                              title={color.name}
                                            />
                                          ))}
                                        </div>
                                      </div>
                                    ) : (
                                      <Input
                                        placeholder={`Ex: ${type === "Taille" ? "M, L, XL" : type === "Pointure" ? "42, 43, 44" : "..."}`}
                                        value={v.options[type] || ""}
                                        onChange={(e) => updateVariantOption(vi, type, e.target.value)}
                                        className="h-8 text-xs"
                                      />
                                    )}
                                  </div>
                                ))}
                              </div>

                              {/* Price, stock, SKU */}
                              <div className="grid grid-cols-3 gap-3">
                                <div className="space-y-1">
                                  <Label className="text-xs text-muted-foreground">Prix ({currency})</Label>
                                  <Input
                                    type="number" step="1"
                                    value={v.price}
                                    onChange={(e) => updateVariant(vi, "price", Number(e.target.value))}
                                    className="h-9 text-sm font-medium"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs text-muted-foreground">Stock</Label>
                                  <Input
                                    type="number"
                                    value={v.stock_quantity}
                                    onChange={(e) => updateVariant(vi, "stock_quantity", Number(e.target.value))}
                                    className="h-9 text-sm"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs text-muted-foreground">SKU</Label>
                                  <Input
                                    placeholder="REF-001-M"
                                    value={v.sku}
                                    onChange={(e) => updateVariant(vi, "sku", e.target.value)}
                                    className="h-9 text-sm"
                                  />
                                </div>
                              </div>

                              {/* Description */}
                              <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">Détails / Notes</Label>
                                <Textarea
                                  placeholder="Détails spécifiques à cette variante (matière, dimensions, particularités...)"
                                  value={v.description || ""}
                                  onChange={(e) => updateVariant(vi, "description", e.target.value)}
                                  rows={2}
                                  className="text-xs resize-none"
                                />
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            <Button type="button" variant="outline" size="sm" onClick={addVariant} className="w-full gap-1.5">
              <Plus size={14} /> Ajouter une variante
            </Button>
          </div>
        )}
      </div>

      {!hasVariants && (
        <div className="rounded-xl border border-dashed border-border p-6 text-center space-y-2">
          <Layers size={32} className="mx-auto text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">Activez les variantes pour proposer différentes options</p>
          <p className="text-xs text-muted-foreground/70">Idéal pour les tailles, couleurs, matières, pointures...</p>
          <Button type="button" variant="outline" size="sm" onClick={() => { setHasVariants(true); addVariant(); }} className="mt-2">
            <Plus size={14} /> Activer les variantes
          </Button>
        </div>
      )}
    </div>
  );
}
