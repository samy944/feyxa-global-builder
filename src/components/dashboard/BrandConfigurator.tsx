import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Loader2, Upload, Palette, Type, Globe, Sparkles, Eye, X, Check,
} from "lucide-react";

/* ───── Types ───── */
export interface BrandConfig {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    foreground: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
  style: {
    borderRadius: string;
    vibe: string;
  };
  logoUrl: string | null;
}

const DEFAULT_BRAND: BrandConfig = {
  colors: {
    primary: "142 72% 29%",
    secondary: "210 40% 96%",
    accent: "38 92% 50%",
    background: "0 0% 100%",
    foreground: "0 0% 9%",
  },
  fonts: { heading: "Inter", body: "Inter" },
  style: { borderRadius: "rounded-xl", vibe: "minimal" },
  logoUrl: null,
};

const POPULAR_FONTS = [
  "Inter", "DM Sans", "Space Grotesk", "Plus Jakarta Sans", "Manrope",
  "Poppins", "Lato", "Playfair Display", "Cormorant Garamond",
  "Clash Display", "Outfit", "Sora", "Lexend", "Work Sans", "Montserrat",
];

const RADIUS_OPTIONS = [
  { label: "Aucun", value: "rounded-none" },
  { label: "Léger", value: "rounded-sm" },
  { label: "Moyen", value: "rounded-lg" },
  { label: "Large", value: "rounded-xl" },
  { label: "Très large", value: "rounded-2xl" },
];

interface Props {
  storeId: string;
  initialBrand?: BrandConfig | null;
  onBrandChange?: (brand: BrandConfig) => void;
  compact?: boolean;
}

export default function BrandConfigurator({ storeId, initialBrand, onBrandChange, compact }: Props) {
  const [brand, setBrand] = useState<BrandConfig>(() => {
    if (!initialBrand || !initialBrand.colors) return DEFAULT_BRAND;
    return {
      ...DEFAULT_BRAND,
      ...initialBrand,
      colors: { ...DEFAULT_BRAND.colors, ...initialBrand.colors },
      fonts: { ...DEFAULT_BRAND.fonts, ...(initialBrand.fonts || {}) },
      style: { ...DEFAULT_BRAND.style, ...(initialBrand.style || {}) },
    };
  });
  const [cloneUrl, setCloneUrl] = useState("");
  const [cloning, setCloning] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<"manual" | "clone">("manual");

  const update = useCallback(
    (path: string, value: string) => {
      setBrand((prev) => {
        const next = JSON.parse(JSON.stringify(prev)) as BrandConfig;
        const keys = path.split(".");
        let obj: any = next;
        for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
        obj[keys[keys.length - 1]] = value;
        onBrandChange?.(next);
        return next;
      });
    },
    [onBrandChange]
  );

  /* ── Clone via URL ── */
  const handleClone = async () => {
    if (!cloneUrl.trim()) return;
    setCloning(true);
    try {
      const { data, error } = await supabase.functions.invoke("clone-brand", {
        body: { url: cloneUrl.trim() },
      });
      if (error) throw error;
      if (data?.brand) {
        const merged = { ...DEFAULT_BRAND, ...data.brand };
        setBrand(merged);
        onBrandChange?.(merged);
        toast.success("Identité visuelle extraite !");
      } else {
        toast.error(data?.error || "Extraction échouée");
      }
    } catch (e: any) {
      toast.error(e.message || "Erreur lors du clonage");
    } finally {
      setCloning(false);
    }
  };

  /* ── Clone via Screenshot ── */
  const handleScreenshot = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCloning(true);
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const { data, error } = await supabase.functions.invoke("clone-brand", {
        body: { screenshot_base64: base64 },
      });
      if (error) throw error;
      if (data?.brand) {
        const merged = { ...DEFAULT_BRAND, ...data.brand };
        setBrand(merged);
        onBrandChange?.(merged);
        toast.success("Identité visuelle extraite depuis la capture !");
      } else {
        toast.error(data?.error || "Extraction échouée");
      }
    } catch (e: any) {
      toast.error(e.message || "Erreur lors de l'analyse");
    } finally {
      setCloning(false);
    }
  };

  /* ── Logo Upload ── */
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${storeId}/brand-logo.${ext}`;
    const { error } = await supabase.storage
      .from("store-assets")
      .upload(path, file, { upsert: true });
    if (error) {
      toast.error("Erreur upload logo");
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from("store-assets").getPublicUrl(path);
    update("logoUrl", data.publicUrl);
    setUploading(false);
    toast.success("Logo uploadé");
  };

  /* ── Save to store.theme ── */
  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("stores")
      .update({ theme: brand as any })
      .eq("id", storeId);
    setSaving(false);
    if (error) {
      toast.error("Erreur de sauvegarde");
      return;
    }
    toast.success("Identité de marque enregistrée");
  };

  /* ── HSL Color Input ── */
  const ColorInput = ({ label, path, value }: { label: string; path: string; value: string }) => {
    // Convert HSL string to hex for the native picker
    const hslToHex = (hsl: string) => {
      try {
        const [h, s, l] = hsl.split(" ").map((v) => parseFloat(v));
        const sN = s / 100;
        const lN = l / 100;
        const a = sN * Math.min(lN, 1 - lN);
        const f = (n: number) => {
          const k = (n + h / 30) % 12;
          const color = lN - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
          return Math.round(255 * color)
            .toString(16)
            .padStart(2, "0");
        };
        return `#${f(0)}${f(8)}${f(4)}`;
      } catch {
        return "#000000";
      }
    };

    const hexToHsl = (hex: string) => {
      const r = parseInt(hex.slice(1, 3), 16) / 255;
      const g = parseInt(hex.slice(3, 5), 16) / 255;
      const b = parseInt(hex.slice(5, 7), 16) / 255;
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      let h = 0, s = 0;
      const l = (max + min) / 2;
      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r: h = ((g - b) / d + (g < b ? 6 : 0)) * 60; break;
          case g: h = ((b - r) / d + 2) * 60; break;
          case b: h = ((r - g) / d + 4) * 60; break;
        }
      }
      return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
    };

    return (
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={hslToHex(value)}
          onChange={(e) => update(path, hexToHsl(e.target.value))}
          className="h-8 w-8 rounded-md border border-border cursor-pointer shrink-0"
          style={{ padding: 0 }}
        />
        <div className="flex-1">
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {/* Tab Toggle */}
      <div className="flex gap-1 p-1 rounded-lg bg-secondary/50">
        <button
          onClick={() => setTab("manual")}
          className="flex-1 py-2 px-3 rounded-md text-xs font-medium transition-all"
          style={{
            background: tab === "manual" ? "hsl(var(--background))" : "transparent",
            color: tab === "manual" ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
            boxShadow: tab === "manual" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
          }}
        >
          <Palette size={12} className="inline mr-1" />
          Manuel
        </button>
        <button
          onClick={() => setTab("clone")}
          className="flex-1 py-2 px-3 rounded-md text-xs font-medium transition-all"
          style={{
            background: tab === "clone" ? "hsl(var(--background))" : "transparent",
            color: tab === "clone" ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
            boxShadow: tab === "clone" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
          }}
        >
          <Sparkles size={12} className="inline mr-1" />
          Clonage IA
        </button>
      </div>

      {tab === "clone" && (
        <div className="space-y-4">
          {/* URL Clone */}
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">
              <Globe size={14} className="inline mr-1" />
              URL de la boutique à cloner
            </label>
            <div className="flex gap-2">
              <Input
                value={cloneUrl}
                onChange={(e) => setCloneUrl(e.target.value)}
                placeholder="https://monsite.com"
                className="flex-1"
              />
              <Button onClick={handleClone} disabled={cloning || !cloneUrl.trim()} size="sm">
                {cloning ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                Analyser
              </Button>
            </div>
          </div>

          {/* Screenshot Clone */}
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">
              <Eye size={14} className="inline mr-1" />
              Ou uploadez une capture d'écran
            </label>
            <label className="flex items-center justify-center gap-2 h-20 rounded-xl border-2 border-dashed border-border hover:border-primary/40 cursor-pointer transition-colors bg-secondary/30">
              {cloning ? (
                <Loader2 size={18} className="animate-spin text-muted-foreground" />
              ) : (
                <>
                  <Upload size={18} className="text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Glissez ou cliquez pour uploader</span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleScreenshot}
                disabled={cloning}
              />
            </label>
          </div>

          {/* Preview result */}
          {brand !== DEFAULT_BRAND && (
            <div className="rounded-xl border border-border p-3 space-y-2">
              <p className="text-xs font-medium text-foreground flex items-center gap-1">
                <Check size={12} className="text-primary" />
                Identité extraite — modifiable ci-dessous
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Manual Config (always visible below clone results) ── */}
      <div className="space-y-4">
        {/* Logo */}
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">Logo</label>
          <div className="flex items-center gap-3">
            {brand.logoUrl ? (
              <div className="relative">
                <img
                  src={brand.logoUrl}
                  alt="Logo"
                  className="h-14 w-14 rounded-lg object-contain border border-border bg-secondary/30"
                />
                <button
                  onClick={() => update("logoUrl", "")}
                  className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                >
                  <X size={10} />
                </button>
              </div>
            ) : (
              <div className="h-14 w-14 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground border border-dashed border-border">
                <Upload size={16} />
              </div>
            )}
            <label className="cursor-pointer">
              <Button variant="outline" size="sm" asChild>
                <span>{uploading ? <Loader2 size={14} className="animate-spin" /> : "Uploader un logo"}</span>
              </Button>
              <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={uploading} />
            </label>
          </div>
        </div>

        {/* Colors */}
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">
            <Palette size={14} className="inline mr-1" />
            Couleurs
          </label>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <ColorInput label="Principale" path="colors.primary" value={brand.colors.primary} />
            <ColorInput label="Secondaire" path="colors.secondary" value={brand.colors.secondary} />
            <ColorInput label="Accent" path="colors.accent" value={brand.colors.accent} />
            <ColorInput label="Fond" path="colors.background" value={brand.colors.background} />
            <ColorInput label="Texte" path="colors.foreground" value={brand.colors.foreground} />
          </div>
        </div>

        {/* Fonts */}
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">
            <Type size={14} className="inline mr-1" />
            Typographies
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-xs text-muted-foreground mb-1 block">Titres</span>
              <select
                value={brand.fonts.heading}
                onChange={(e) => update("fonts.heading", e.target.value)}
                className="w-full h-9 rounded-lg border border-border bg-background px-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {POPULAR_FONTS.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
            <div>
              <span className="text-xs text-muted-foreground mb-1 block">Corps</span>
              <select
                value={brand.fonts.body}
                onChange={(e) => update("fonts.body", e.target.value)}
                className="w-full h-9 rounded-lg border border-border bg-background px-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {POPULAR_FONTS.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Border Radius */}
        {!compact && (
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Arrondis</label>
            <div className="flex gap-2 flex-wrap">
              {RADIUS_OPTIONS.map((r) => (
                <button
                  key={r.value}
                  onClick={() => update("style.borderRadius", r.value)}
                  className="px-3 py-1.5 text-xs font-medium border transition-all"
                  style={{
                    borderColor: brand.style.borderRadius === r.value ? "hsl(var(--primary))" : "hsl(var(--border))",
                    background: brand.style.borderRadius === r.value ? "hsl(var(--primary) / 0.08)" : "transparent",
                    color: brand.style.borderRadius === r.value ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
                    borderRadius: r.value === "rounded-none" ? "0" : r.value === "rounded-sm" ? "4px" : r.value === "rounded-lg" ? "8px" : r.value === "rounded-xl" ? "12px" : "16px",
                  }}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Preview */}
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">
            <Eye size={14} className="inline mr-1" />
            Aperçu
          </label>
          <div
            className="rounded-xl border border-border p-4 space-y-3"
            style={{ background: `hsl(${brand.colors.background})` }}
          >
            <div className="flex items-center gap-3">
              {brand.logoUrl && (
                <img src={brand.logoUrl} alt="" className="h-8 w-8 rounded-md object-contain" />
              )}
              <span
                className="text-lg font-bold"
                style={{
                  color: `hsl(${brand.colors.foreground})`,
                  fontFamily: brand.fonts.heading,
                }}
              >
                Ma Boutique
              </span>
            </div>
            <div className="flex gap-2">
              <div
                className="px-4 py-2 text-sm font-medium"
                style={{
                  background: `hsl(${brand.colors.primary})`,
                  color: "#fff",
                  borderRadius: brand.style.borderRadius === "rounded-none" ? "0" : "8px",
                  fontFamily: brand.fonts.body,
                }}
              >
                Acheter
              </div>
              <div
                className="px-4 py-2 text-sm font-medium border"
                style={{
                  borderColor: `hsl(${brand.colors.primary})`,
                  color: `hsl(${brand.colors.primary})`,
                  borderRadius: brand.style.borderRadius === "rounded-none" ? "0" : "8px",
                  fontFamily: brand.fonts.body,
                }}
              >
                En savoir +
              </div>
            </div>
            <div className="flex gap-2">
              {["primary", "secondary", "accent", "background", "foreground"].map((key) => (
                <div
                  key={key}
                  className="h-6 w-6 rounded-full border border-border/20"
                  style={{ background: `hsl(${(brand.colors as any)[key]})` }}
                  title={key}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Save */}
      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
        Enregistrer l'identité de marque
      </Button>
    </div>
  );
}
