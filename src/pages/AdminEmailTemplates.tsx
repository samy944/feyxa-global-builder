import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Save, Loader2, Eye, Mail, Code, FileText, Plus
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter
} from "@/components/ui/dialog";

type EmailTemplate = {
  id: string;
  slug: string;
  name: string;
  subject: string;
  html_body: string;
  is_active: boolean;
  variables: string[];
  category: string;
};

export default function AdminEmailTemplates() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editTemplate, setEditTemplate] = useState<Partial<EmailTemplate> | null>(null);
  const [saving, setSaving] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [branding, setBranding] = useState<Record<string, any>>({});

  const fetchTemplates = async () => {
    const { data } = await supabase.from("email_templates").select("*").order("category");
    setTemplates((data as any[] || []) as EmailTemplate[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchTemplates();
    // Load branding for preview
    supabase.from("platform_branding").select("*").limit(1).single().then(({ data }) => {
      if (data) setBranding(data as Record<string, any>);
    });
  }, []);

  const saveTemplate = async () => {
    if (!editTemplate?.slug || !editTemplate?.name || !editTemplate?.subject) {
      toast.error("Slug, nom et sujet requis");
      return;
    }
    setSaving(true);
    const payload = {
      slug: editTemplate.slug,
      name: editTemplate.name,
      subject: editTemplate.subject,
      html_body: editTemplate.html_body || "",
      is_active: editTemplate.is_active ?? true,
      variables: editTemplate.variables || [],
      category: editTemplate.category || "transactional",
    };

    if (editTemplate.id) {
      await supabase.from("email_templates").update(payload).eq("id", editTemplate.id);
    } else {
      await supabase.from("email_templates").insert(payload);
    }
    setSaving(false);
    setEditTemplate(null);
    toast.success("Template enregistré");
    fetchTemplates();
  };

  const renderPreview = (template: EmailTemplate) => {
    // Replace variables with branding/demo values
    let html = template.html_body;
    const replacements: Record<string, string> = {
      "{{platform_name}}": branding.platform_name || "Feyxa",
      "{{logo_url}}": branding.logo_url || "",
      "{{primary_color}}": branding.primary_color || "#E5FB26",
      "{{secondary_color}}": branding.secondary_color || "#0E0E11",
      "{{button_color}}": branding.button_color || "#E5FB26",
      "{{button_text_color}}": branding.button_text_color || "#0E0E11",
      "{{footer_text}}": branding.footer_text || "© 2026 Feyxa",
      "{{otp}}": "482917",
      "{{customer_name}}": "Jean Dupont",
      "{{order_number}}": "FX-20260225-001",
      "{{order_details}}": "<p>Produit test × 1 — 15 000 FCFA</p>",
      "{{tracking_link}}": "#",
      "{{user_name}}": "Jean Dupont",
      "{{app_url}}": "#",
    };

    Object.entries(replacements).forEach(([key, val]) => {
      html = html.split(key).join(val);
    });

    setPreviewHtml(html);
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" /></div>;

  const grouped = templates.reduce((acc, t) => {
    if (!acc[t.category]) acc[t.category] = [];
    acc[t.category].push(t);
    return acc;
  }, {} as Record<string, EmailTemplate[]>);

  const categoryLabels: Record<string, string> = {
    authentication: "Authentification",
    transactional: "Transactionnel",
    marketing: "Marketing",
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Templates Email</h1>
          <p className="text-sm text-muted-foreground">Personnalisez les templates d'email de la plateforme</p>
        </div>
        <Button size="sm" onClick={() => setEditTemplate({ is_active: true, variables: [], category: "transactional" })}>
          <Plus size={14} /> Nouveau template
        </Button>
      </div>

      {Object.entries(grouped).map(([cat, items]) => (
        <Card key={cat}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">{categoryLabels[cat] || cat}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {items.map((t) => (
              <div key={t.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div className="flex items-center gap-3">
                  <Mail size={16} className="text-primary" />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground">{t.name}</p>
                      <Badge variant="outline" className="text-[10px] font-mono">{t.slug}</Badge>
                      {!t.is_active && <Badge variant="secondary" className="text-[10px]">Inactif</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">{t.subject}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => renderPreview(t)}>
                    <Eye size={14} /> Aperçu
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditTemplate(t)}>
                    <Code size={14} /> Modifier
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      {/* Edit Dialog */}
      <Dialog open={!!editTemplate} onOpenChange={(v) => !v && setEditTemplate(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editTemplate?.id ? "Modifier" : "Nouveau"} template email</DialogTitle>
          </DialogHeader>
          {editTemplate && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Nom</Label><Input value={editTemplate.name || ""} onChange={(e) => setEditTemplate({ ...editTemplate, name: e.target.value })} /></div>
                <div><Label>Slug (unique)</Label><Input value={editTemplate.slug || ""} onChange={(e) => setEditTemplate({ ...editTemplate, slug: e.target.value })} placeholder="order_confirmation" className="font-mono text-xs" /></div>
              </div>
              <div><Label>Sujet</Label><Input value={editTemplate.subject || ""} onChange={(e) => setEditTemplate({ ...editTemplate, subject: e.target.value })} placeholder="Utilisez {{variable}} pour les données dynamiques" /></div>
              <div>
                <Label>Corps HTML</Label>
                <Textarea
                  rows={16}
                  value={editTemplate.html_body || ""}
                  onChange={(e) => setEditTemplate({ ...editTemplate, html_body: e.target.value })}
                  className="font-mono text-xs"
                  placeholder="<html>...</html>"
                />
              </div>
              <div><Label>Variables disponibles (une par ligne)</Label>
                <Textarea
                  rows={3}
                  value={(editTemplate.variables || []).join("\n")}
                  onChange={(e) => setEditTemplate({ ...editTemplate, variables: e.target.value.split("\n").filter(Boolean) })}
                  className="font-mono text-xs"
                  placeholder="otp\nplatform_name\nlogo_url"
                />
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch checked={editTemplate.is_active ?? true} onCheckedChange={(v) => setEditTemplate({ ...editTemplate, is_active: v })} />
                  <Label>Actif</Label>
                </div>
                <div>
                  <Label className="text-xs">Catégorie</Label>
                  <Input value={editTemplate.category || "transactional"} onChange={(e) => setEditTemplate({ ...editTemplate, category: e.target.value })} className="text-xs w-40" />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={saveTemplate} disabled={saving}>
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={!!previewHtml} onOpenChange={(v) => !v && setPreviewHtml(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto p-0">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle>Aperçu email</DialogTitle>
          </DialogHeader>
          {previewHtml && (
            <div className="p-4">
              <div className="border border-border rounded-lg overflow-hidden bg-[#f4f4f5]">
                <iframe
                  srcDoc={previewHtml}
                  className="w-full h-[500px] border-0"
                  title="Email preview"
                  sandbox=""
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
