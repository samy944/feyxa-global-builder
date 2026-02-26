import { useState, useEffect, useMemo, useCallback } from "react";
import { useStore } from "@/hooks/useStore";
import { supabase } from "@/integrations/supabase/client";
import { StorefrontCustomizer } from "@/components/dashboard/StorefrontCustomizer";
import { getTemplateById, getDefaultSectionsConfig, mergeSectionsConfig, type SFSectionConfig } from "@/lib/storefront-templates";
import { getThemeById, type StorefrontTheme } from "@/lib/storefront-themes";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import type { ProductData } from "@/components/storefront/types";

export default function DashboardStorefront() {
  const { store, refetch } = useStore();
  const [products, setProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!store) return;
    supabase
      .from("products")
      .select("*")
      .eq("store_id", store.id)
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setProducts((data as ProductData[]) || []);
        setLoading(false);
      });
  }, [store]);

  const themeObj = store?.theme as Record<string, any> | null;
  const templateId = themeObj?.storefront_template_id || themeObj?.storefront_theme_id || "minimal";
  const themeId = themeObj?.storefront_theme_id || templateId;
  const colorOverrides = themeObj?.color_overrides || null;

  const initialSections = useMemo(() => {
    const template = getTemplateById(templateId);
    return mergeSectionsConfig(themeObj?.sections_config as SFSectionConfig[] | null, template);
  }, [themeObj, templateId]);

  const handleSave = useCallback(async (config: {
    templateId: string;
    themeId: string;
    sections: SFSectionConfig[];
    colorOverrides: Partial<StorefrontTheme["colors"]> | null;
  }) => {
    if (!store) return;
    setSaving(true);
    const newTheme = {
      ...(themeObj || {}),
      storefront_template_id: config.templateId,
      storefront_theme_id: config.themeId,
      sections_config: config.sections,
      color_overrides: config.colorOverrides,
    };
    const { error } = await supabase
      .from("stores")
      .update({ theme: newTheme as any })
      .eq("id", store.id);
    setSaving(false);
    if (error) {
      toast.error("Erreur lors de la sauvegarde");
    } else {
      toast.success("Apparence sauvegardée !");
      refetch();
    }
  }, [store, themeObj, refetch]);

  if (!store || loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="animate-spin text-muted-foreground" size={32} />
      </div>
    );
  }

  return (
    <StorefrontCustomizer
      store={store}
      products={products}
      initialTemplateId={templateId}
      initialThemeId={themeId}
      initialSections={initialSections}
      initialColorOverrides={colorOverrides}
      onSave={handleSave}
      saving={saving}
    />
  );
}
