import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Save, Loader2, Upload, Palette, Type, Image, FileText, Link2
} from "lucide-react";

type Branding = {
  id: string;
  platform_name: string;
  logo_url: string | null;
  logo_dark_url: string | null;
  favicon_url: string | null;
  primary_color: string;
  secondary_color: string;
  button_color: string;
  button_text_color: string;
  font_family: string;
  font_heading: string;
  default_image_url: string | null;
  footer_text: string | null;
  footer_links: any[];
  meta_description: string | null;
  custom_css: string | null;
};

function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-10 h-10 rounded-lg border border-border cursor-pointer bg-transparent p-0.5"
        />
        <Input value={value} onChange={(e) => onChange(e.target.value)} className="flex-1 font-mono text-xs" placeholder="#000000" />
      </div>
    </div>
  );
}

export default function AdminBranding() {
  const [branding, setBranding] = useState<Branding | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);

  useEffect(() => {
    supabase.from("platform_branding").select("*").limit(1).single().then(({ data }) => {
      if (data) setBranding(data as any as Branding);
      setLoading(false);
    });
  }, []);

  const save = async () => {
    if (!branding) return;
    setSaving(true);
    const { id, ...payload } = branding;
    const { error } = await supabase.from("platform_branding").update(payload as any).eq("id", id);
    setSaving(false);
    if (error) { toast.error("Erreur de sauvegarde: " + error.message); return; }
    toast.success("Branding mis à jour — rechargez la page pour voir les changements");
  };

  const uploadFile = async (field: string, file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Seules les images sont acceptées");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Fichier trop volumineux (max 5 Mo)");
      return;
    }

    setUploading(field);
    const ext = file.name.split(".").pop()?.toLowerCase() || "png";
    const path = `${field}-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("branding-assets")
      .upload(path, file, { upsert: true, contentType: file.type });

    if (uploadError) {
      toast.error("Erreur d'upload: " + uploadError.message);
      setUploading(null);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from("branding-assets").getPublicUrl(path);
    setBranding({ ...branding!, [field]: publicUrl });
    setUploading(null);
    toast.success("Fichier uploadé avec succès");
  };

  const update = (key: string, val: any) => setBranding({ ...branding!, [key]: val });

  if (loading || !branding) return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Branding & Thème</h1>
          <p className="text-sm text-muted-foreground">Personnalisez l'identité visuelle de la plateforme</p>
        </div>
        <Button onClick={save} disabled={saving}>
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Enregistrer
        </Button>
      </div>

      <Tabs defaultValue="identity">
        <TabsList className="w-full justify-start flex-wrap h-auto gap-1">
          <TabsTrigger value="identity" className="gap-1.5"><Type size={14} /> Identité</TabsTrigger>
          <TabsTrigger value="colors" className="gap-1.5"><Palette size={14} /> Couleurs</TabsTrigger>
          <TabsTrigger value="media" className="gap-1.5"><Image size={14} /> Médias</TabsTrigger>
          <TabsTrigger value="footer" className="gap-1.5"><FileText size={14} /> Footer</TabsTrigger>
          <TabsTrigger value="advanced" className="gap-1.5"><Link2 size={14} /> Avancé</TabsTrigger>
        </TabsList>

        <TabsContent value="identity">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Identité de la plateforme</CardTitle>
              <CardDescription>Nom, typographies et description globale</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div><Label>Nom de la plateforme</Label><Input value={branding.platform_name} onChange={(e) => update("platform_name", e.target.value)} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Police principale (body)</Label><Input value={branding.font_family} onChange={(e) => update("font_family", e.target.value)} placeholder="Manrope" /></div>
                <div><Label>Police titres (heading)</Label><Input value={branding.font_heading} onChange={(e) => update("font_heading", e.target.value)} placeholder="Clash Display" /></div>
              </div>
              <div><Label>Meta description</Label><Textarea value={branding.meta_description || ""} onChange={(e) => update("meta_description", e.target.value)} placeholder="Description SEO de la plateforme" /></div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="colors">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Palette de couleurs</CardTitle>
              <CardDescription>Couleurs utilisées sur le site et dans les emails</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <ColorInput label="Couleur principale" value={branding.primary_color} onChange={(v) => update("primary_color", v)} />
                <ColorInput label="Couleur secondaire" value={branding.secondary_color} onChange={(v) => update("secondary_color", v)} />
                <ColorInput label="Couleur boutons" value={branding.button_color} onChange={(v) => update("button_color", v)} />
                <ColorInput label="Texte boutons" value={branding.button_text_color} onChange={(v) => update("button_text_color", v)} />
              </div>
              <div className="mt-6 p-6 rounded-xl border border-border" style={{ background: branding.secondary_color }}>
                <p className="text-sm mb-3" style={{ color: branding.primary_color, fontFamily: branding.font_heading }}>
                  {branding.platform_name} — Aperçu du thème
                </p>
                <button className="px-6 py-2.5 rounded-lg text-sm font-semibold" style={{ background: branding.button_color, color: branding.button_text_color }}>
                  Bouton d'action
                </button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="media">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Médias & Logos</CardTitle>
              <CardDescription>Logo, favicon et images par défaut — uploadés dans le stockage dédié</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {[
                { field: "logo_url", label: "Logo principal", desc: "Utilisé dans le header, footer et les emails" },
                { field: "logo_dark_url", label: "Logo version sombre", desc: "Utilisé sur fond sombre (optionnel)" },
                { field: "favicon_url", label: "Favicon", desc: "Icône de l'onglet navigateur (carré, 32×32 ou 64×64)" },
                { field: "default_image_url", label: "Image par défaut", desc: "Placeholder pour produits et bannières" },
              ].map(({ field, label, desc }) => (
                <div key={field} className="flex items-start gap-4">
                  <div className="h-16 w-16 rounded-lg border border-border bg-secondary flex items-center justify-center overflow-hidden shrink-0">
                    {(branding as any)[field] ? (
                      <img src={(branding as any)[field]} alt={label} className="h-full w-full object-contain" />
                    ) : (
                      <Image size={20} className="text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <Label className="text-sm font-medium">{label}</Label>
                    <p className="text-xs text-muted-foreground mb-2">{desc}</p>
                    <div className="flex items-center gap-2">
                      <Input
                        value={(branding as any)[field] || ""}
                        onChange={(e) => update(field, e.target.value)}
                        placeholder="URL de l'image"
                        className="flex-1 text-xs"
                      />
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) uploadFile(field, file);
                          }}
                        />
                        <Button variant="outline" size="sm" asChild disabled={uploading === field}>
                          <span>{uploading === field ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />} Upload</span>
                        </Button>
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="footer">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Footer global</CardTitle>
              <CardDescription>Texte de copyright et liens</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div><Label>Texte de footer</Label><Input value={branding.footer_text || ""} onChange={(e) => update("footer_text", e.target.value)} placeholder="© 2026 Feyxa. Tous droits réservés." /></div>
              <div>
                <Label>Liens du footer (JSON)</Label>
                <Textarea
                  rows={4}
                  value={JSON.stringify(branding.footer_links || [], null, 2)}
                  onChange={(e) => { try { update("footer_links", JSON.parse(e.target.value)); } catch {} }}
                  placeholder='[{"label": "CGU", "url": "/terms"}]'
                  className="font-mono text-xs"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">CSS personnalisé</CardTitle>
              <CardDescription>CSS additionnel appliqué globalement (avancé)</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                rows={10}
                value={branding.custom_css || ""}
                onChange={(e) => update("custom_css", e.target.value)}
                placeholder={`:root {\n  /* Vos variables CSS personnalisées */\n}`}
                className="font-mono text-xs"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
