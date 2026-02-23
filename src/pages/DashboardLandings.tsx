import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/hooks/useStore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { LANDING_TEMPLATES, getDefaultSectionsForTemplate, getTemplateById } from "@/lib/landing-templates";
import { Plus, Copy, Eye, Pencil, Trash2, BarChart3, ExternalLink, FileText } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const TEMPLATE_CATEGORIES = [...new Set(LANDING_TEMPLATES.map(t => t.category))];

export default function DashboardLandings() {
  const { store } = useStore();
  const navigate = useNavigate();
  const [landings, setLandings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("one-product");
  const [filterCat, setFilterCat] = useState<string | null>(null);

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
    const template = getTemplateById(selectedTemplate);

    const { data, error } = await supabase
      .from("landing_pages")
      .insert({
        store_id: store.id,
        title: newTitle,
        slug,
        template_id: selectedTemplate,
        sections: sections as any,
        theme: template?.suggestedTheme || null,
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

  const filteredTemplates = filterCat
    ? LANDING_TEMPLATES.filter(t => t.category === filterCat)
    : LANDING_TEMPLATES;

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
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl">Créer une Landing Page</DialogTitle>
              <p className="text-sm text-muted-foreground">Choisissez un template premium, puis personnalisez-le dans l'éditeur visuel.</p>
            </DialogHeader>
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-foreground">Titre</label>
                  <Input value={newTitle} onChange={e => { setNewTitle(e.target.value); if (!newSlug || newSlug === newTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")) setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")); }} placeholder="Ma page de vente" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Slug (URL)</label>
                  <Input value={newSlug} onChange={e => setNewSlug(e.target.value)} placeholder="ma-page" />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Choisir un template</label>
                <div className="flex flex-wrap gap-2 mb-4">
                  <button
                    onClick={() => setFilterCat(null)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${!filterCat ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
                  >
                    Tous
                  </button>
                  {TEMPLATE_CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setFilterCat(cat)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${filterCat === cat ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {filteredTemplates.map(t => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTemplate(t.id)}
                      className={`group relative overflow-hidden rounded-xl border-2 text-left transition-all duration-200 ${
                        selectedTemplate === t.id
                          ? "border-primary ring-2 ring-primary/20 shadow-lg"
                          : "border-border hover:border-primary/40 hover:shadow-md"
                      }`}
                    >
                      <div
                        className="h-20 w-full relative overflow-hidden"
                        style={{ backgroundColor: t.preview || t.suggestedTheme?.bgColor || "#f5f5f5" }}
                      >
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center">
                            <span className="text-3xl block mb-1">{t.icon}</span>
                            {t.suggestedTheme && (
                              <div className="flex gap-1 justify-center">
                                <span className="w-3 h-3 rounded-full border border-white/30" style={{ backgroundColor: t.suggestedTheme.primaryColor }} />
                                <span className="w-3 h-3 rounded-full border border-white/30" style={{ backgroundColor: t.suggestedTheme.textColor }} />
                                <span className="w-3 h-3 rounded-full border border-black/10" style={{ backgroundColor: t.suggestedTheme.bgColor }} />
                              </div>
                            )}
                          </div>
                        </div>
                        {selectedTemplate === t.id && (
                          <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                            <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-semibold text-foreground">{t.name}</h3>
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{t.category}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">{t.description}</p>
                        <div className="flex items-center gap-1 mt-2 text-[10px] text-muted-foreground">
                          <FileText className="w-3 h-3" />
                          <span>{LANDING_TEMPLATES.find(tpl => tpl.id === t.id)?.sections.length || 0} sections</span>
                          {t.suggestedTheme && (
                            <>
                              <span className="mx-1">•</span>
                              <span>{t.suggestedTheme.fontHeading}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <Button onClick={handleCreate} className="w-full" size="lg" disabled={!newTitle.trim() || !newSlug.trim()}>
                Créer la landing page
              </Button>
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
            <div className="text-4xl mb-4">🚀</div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Créez votre première landing page</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">Choisissez parmi nos templates premium et personnalisez-les avec l'éditeur visuel drag & drop.</p>
            <Button onClick={() => setCreateOpen(true)}><Plus className="w-4 h-4 mr-2" /> Créer une landing page</Button>
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
