import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStore } from "@/hooks/useStore";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Save, Loader2, Plus, Trash2, GripVertical } from "lucide-react";

interface NavItem {
  label: string;
  url: string;
}

export default function SettingsNavPages() {
  const { store, refetch } = useStore();
  const [navItems, setNavItems] = useState<NavItem[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!store) return;
    const s = (store.settings as Record<string, any>) || {};
    setNavItems(s.storefront_nav || [
      { label: "Accueil", url: "/" },
      { label: "Produits", url: "/products" },
      { label: "Contact", url: "/contact" },
    ]);
  }, [store]);

  const handleSave = async () => {
    if (!store) return;
    setSaving(true);
    const current = (store.settings as Record<string, any>) || {};
    const { error } = await supabase.from("stores").update({
      settings: { ...current, storefront_nav: navItems.filter(n => n.label.trim()) as any },
    } as any).eq("id", store.id);
    setSaving(false);
    if (error) { toast.error("Erreur"); return; }
    toast.success("Navigation enregistrée");
    refetch();
  };

  const addItem = () => setNavItems([...navItems, { label: "", url: "" }]);
  const removeItem = (i: number) => setNavItems(navItems.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: keyof NavItem, value: string) => {
    const updated = [...navItems];
    updated[i] = { ...updated[i], [field]: value };
    setNavItems(updated);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Navigation & Pages</h2>
        <p className="text-sm text-muted-foreground mt-1">Configurez les liens de navigation de votre storefront.</p>
      </div>

      <div className="space-y-2">
        {navItems.map((item, i) => (
          <div key={i} className="flex items-center gap-2 p-2 rounded-lg border border-border">
            <GripVertical size={14} className="text-muted-foreground shrink-0 cursor-grab" />
            <Input
              value={item.label}
              onChange={(e) => updateItem(i, "label", e.target.value)}
              placeholder="Label"
              className="flex-1"
            />
            <Input
              value={item.url}
              onChange={(e) => updateItem(i, "url", e.target.value)}
              placeholder="/page-url"
              className="flex-1 font-mono text-sm"
            />
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive shrink-0" onClick={() => removeItem(i)}>
              <Trash2 size={14} />
            </Button>
          </div>
        ))}
      </div>

      <Button variant="outline" size="sm" onClick={addItem}>
        <Plus size={14} /> Ajouter un lien
      </Button>

      <Button onClick={handleSave} disabled={saving}>
        {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
        Enregistrer
      </Button>
    </div>
  );
}
