import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/hooks/useStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { LANDING_TEMPLATES, getDefaultSectionsForTemplate } from "@/lib/landing-templates";
import { Plus, Copy, Eye, Pencil, Trash2, BarChart3, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function DashboardLandings() {
  const { store } = useStore();
  const navigate = useNavigate();
  const [landings, setLandings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("one-product");

  const fetchLandings = async () => {
    if (!store) return;
    const { data } = await supabase
      .from("landing_pages")
      .select("*")
      .eq("store_id", store.id)
      .order("created_at", { ascending: false });
    setLandings(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchLandings(); }, [store]);

  const handleCreate = async () => {
    if (!store || !newTitle.trim() || !newSlug.trim()) return;

    const slug = newSlug.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-");
    const sections = getDefaultSectionsForTemplate(selectedTemplate);

    const { data, error } = await supabase
      .from("landing_pages")
      .insert({
        store_id: store.id,
        title: newTitle,
        slug,
        template_id: selectedTemplate,
        sections: sections as any,
      })
      .select()
      .single();

    if (error) {
      toast.error(error.message.includes("duplicate") ? "Ce slug existe déjà" : error.message);
      return;
    }

    toast.success("Landing page créée !");
    setCreateOpen(false);
    setNewTitle("");
    setNewSlug("");
    navigate(`/dashboard/landings/${data.id}/edit`);
  };

  const handleDuplicate = async (lp: any) => {
    const { error } = await supabase.from("landing_pages").insert({
      store_id: store.id,
      title: lp.title + " (copie)",
      slug: lp.slug + "-copy-" + Date.now().toString(36),
      template_id: lp.template_id,
      sections: lp.sections,
      theme: lp.theme,
      seo_title: lp.seo_title,
      seo_description: lp.seo_description,
      status: "draft",
    });
    if (error) toast.error(error.message);
    else { toast.success("Landing dupliquée"); fetchLandings(); }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("landing_pages").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Supprimée"); fetchLandings(); }
  };

  const handleStatusChange = async (id: string, status: "draft" | "published" | "archived") => {
    const { error } = await supabase.from("landing_pages").update({ status }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Statut mis à jour"); fetchLandings(); }
  };

  const statusColor = (s: string) => {
    if (s === "published") return "bg-emerald-100 text-emerald-700";
    if (s === "archived") return "bg-gray-100 text-gray-500";
    return "bg-amber-100 text-amber-700";
  };

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Landing Pages</h1>
          <p className="text-sm text-muted-foreground">Créez des pages de vente haute conversion</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> Nouvelle Landing</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Créer une Landing Page</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-foreground">Titre</label>
                  <Input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Ma page de vente" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Slug (URL)</label>
                  <Input value={newSlug} onChange={e => setNewSlug(e.target.value)} placeholder="ma-page" />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Choisir un template</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {LANDING_TEMPLATES.map(t => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTemplate(t.id)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${selectedTemplate === t.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}
                    >
                      <span className="text-2xl mb-2 block">{t.icon}</span>
                      <h3 className="text-sm font-semibold text-foreground">{t.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{t.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              <Button onClick={handleCreate} className="w-full">Créer la landing page</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : landings.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <p className="text-muted-foreground mb-4">Aucune landing page pour le moment</p>
            <Button onClick={() => setCreateOpen(true)} variant="outline"><Plus className="w-4 h-4 mr-2" /> Créer votre première</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {landings.map(lp => (
            <Card key={lp.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="text-2xl">{LANDING_TEMPLATES.find(t => t.id === lp.template_id)?.icon || "📄"}</div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{lp.title}</h3>
                    <p className="text-xs text-muted-foreground">/lp/{lp.slug}</p>
                  </div>
                  <Badge className={statusColor(lp.status)} variant="secondary">{lp.status}</Badge>
                  {lp.ab_enabled && <Badge variant="outline" className="text-xs">A/B</Badge>}
                </div>
                <div className="flex items-center gap-1">
                  {lp.status === "draft" && (
                    <Button size="sm" variant="ghost" onClick={() => handleStatusChange(lp.id, "published")} title="Publier">
                      <Eye className="w-4 h-4" />
                    </Button>
                  )}
                  {lp.status === "published" && (
                    <Button size="sm" variant="ghost" asChild>
                      <a href={`/lp/${lp.slug}`} target="_blank" rel="noopener noreferrer" title="Voir">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => navigate(`/dashboard/landings/${lp.id}/edit`)} title="Éditer">
                    <Pencil className="w-4 h-4" />
                  </Button>
                  {lp.ab_enabled && (
                    <Button size="sm" variant="ghost" onClick={() => navigate(`/dashboard/landings/${lp.id}/ab`)} title="A/B Test">
                      <BarChart3 className="w-4 h-4" />
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => handleDuplicate(lp)} title="Dupliquer">
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(lp.id)} title="Supprimer" className="text-destructive hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
