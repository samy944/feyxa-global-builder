import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { LandingSectionRenderer } from "@/components/landing/LandingSectionRenderer";
import { LandingSection, SectionType, getDefaultSectionsForTemplate } from "@/lib/landing-templates";
import { ArrowLeft, Eye, Save, Plus, Trash2, GripVertical, Monitor, Smartphone, Settings2, Palette } from "lucide-react";
import { toast } from "sonner";

const SECTION_TYPES: { type: SectionType; label: string; icon: string }[] = [
  { type: "hero", label: "Hero", icon: "🎯" },
  { type: "benefits", label: "Avantages", icon: "✨" },
  { type: "social-proof", label: "Preuve sociale", icon: "⭐" },
  { type: "product-highlights", label: "Produits", icon: "📦" },
  { type: "pricing", label: "Tarifs / Offre", icon: "💰" },
  { type: "countdown", label: "Compte à rebours", icon: "⏰" },
  { type: "faq", label: "FAQ", icon: "❓" },
  { type: "guarantee", label: "Garantie", icon: "🛡️" },
  { type: "cta", label: "CTA Final", icon: "🚀" },
  { type: "lead-capture", label: "Capture Lead", icon: "📧" },
  { type: "waitlist", label: "Waitlist", icon: "📋" },
];

const DEFAULT_SECTION_DATA: Record<SectionType, Record<string, any>> = {
  hero: { title: "Titre principal", subtitle: "Sous-titre accrocheur", ctaText: "Commander", imageUrl: "" },
  benefits: { title: "Nos avantages", items: [{ icon: "✨", title: "Avantage", desc: "Description" }] },
  "social-proof": { title: "Ils nous font confiance", stats: [{ value: "1,000+", label: "Clients" }], testimonials: [] },
  "product-highlights": { title: "Nos produits", items: [] },
  pricing: { title: "Nos offres", items: [{ name: "Standard", price: 10000, features: ["Feature 1"], highlight: false }] },
  countdown: { title: "Offre limitée", endDate: new Date(Date.now() + 86400000).toISOString() },
  faq: { title: "Questions fréquentes", items: [{ q: "Question ?", a: "Réponse." }] },
  guarantee: { title: "Garantie satisfait ou remboursé", text: "Remboursement sous 30 jours.", icon: "🛡️" },
  cta: { title: "Prêt à commander ?", subtitle: "Ne ratez pas cette offre.", ctaText: "Commander" },
  "lead-capture": { title: "Restez informé", placeholder: "Votre email ou WhatsApp", buttonText: "S'inscrire", incentive: "🎁 -10% offert" },
  waitlist: { title: "Rejoignez la waitlist", placeholder: "Votre email", buttonText: "Me notifier", spotsText: "Places limitées" },
  "collection-grid": { title: "Notre collection", columns: 3 },
};

export default function DashboardLandingEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [landing, setLanding] = useState<any>(null);
  const [sections, setSections] = useState<LandingSection[]>([]);
  const [theme, setTheme] = useState({
    primaryColor: "#3b82f6",
    bgColor: "#ffffff",
    textColor: "#0f172a",
    radius: "0.75rem",
    fontHeading: "Clash Display",
    fontBody: "Manrope",
  });
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDesc, setSeoDesc] = useState("");
  const [abEnabled, setAbEnabled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"sections" | "seo" | "theme">("sections");
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    supabase
      .from("landing_pages")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data }) => {
        if (!data) return navigate("/dashboard/landings");
        setLanding(data);
        setSections((data.sections as unknown as LandingSection[]) || []);
        if (data.theme) setTheme({ ...theme, ...(data.theme as any) });
        setSeoTitle(data.seo_title || "");
        setSeoDesc(data.seo_description || "");
        setAbEnabled(data.ab_enabled || false);
      });
  }, [id]);

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    const { error } = await supabase
      .from("landing_pages")
      .update({
        sections: sections as any,
        theme: theme as any,
        seo_title: seoTitle,
        seo_description: seoDesc,
        ab_enabled: abEnabled,
      })
      .eq("id", id);

    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Sauvegardé !");
  };

  const addSection = (type: SectionType) => {
    const newSection: LandingSection = {
      id: Math.random().toString(36).slice(2, 10),
      type,
      visible: true,
      data: { ...DEFAULT_SECTION_DATA[type] },
    };
    setSections([...sections, newSection]);
    setSelectedSectionId(newSection.id);
  };

  const removeSection = (sectionId: string) => {
    setSections(sections.filter(s => s.id !== sectionId));
    if (selectedSectionId === sectionId) setSelectedSectionId(null);
  };

  const moveSection = (index: number, dir: -1 | 1) => {
    const newIdx = index + dir;
    if (newIdx < 0 || newIdx >= sections.length) return;
    const arr = [...sections];
    [arr[index], arr[newIdx]] = [arr[newIdx], arr[index]];
    setSections(arr);
  };

  const updateSectionData = (sectionId: string, newData: Record<string, any>) => {
    setSections(sections.map(s => s.id === sectionId ? { ...s, data: newData } : s));
  };

  const toggleSectionVisibility = (sectionId: string) => {
    setSections(sections.map(s => s.id === sectionId ? { ...s, visible: !s.visible } : s));
  };

  const selectedSection = sections.find(s => s.id === selectedSectionId);

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      {/* Toolbar */}
      <div className="h-12 border-b border-border bg-card flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <Button size="sm" variant="ghost" onClick={() => navigate("/dashboard/landings")}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Retour
          </Button>
          <span className="text-sm font-medium text-foreground truncate max-w-[200px]">{landing?.title}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex border border-border rounded-lg overflow-hidden">
            <button onClick={() => setPreviewMode("desktop")} className={`px-2 py-1 ${previewMode === "desktop" ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}>
              <Monitor className="w-4 h-4" />
            </button>
            <button onClick={() => setPreviewMode("mobile")} className={`px-2 py-1 ${previewMode === "mobile" ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}>
              <Smartphone className="w-4 h-4" />
            </button>
          </div>
          {landing?.slug && (
            <Button size="sm" variant="outline" asChild>
              <a href={`/lp/${landing.slug}`} target="_blank" rel="noopener noreferrer">
                <Eye className="w-4 h-4 mr-1" /> Prévisualiser
              </a>
            </Button>
          )}
          <Button size="sm" onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4 mr-1" /> {saving ? "..." : "Sauvegarder"}
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-72 border-r border-border bg-card overflow-y-auto shrink-0">
          <div className="flex border-b border-border">
            {[
              { key: "sections", icon: "📝", label: "Sections" },
              { key: "theme", icon: "🎨", label: "Style" },
              { key: "seo", icon: "🔍", label: "SEO" },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex-1 py-2.5 text-xs font-medium transition-colors ${activeTab === tab.key ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          <div className="p-3 space-y-3">
            {activeTab === "sections" && (
              <>
                {/* Section list */}
                {sections.map((s, i) => (
                  <div
                    key={s.id}
                    onClick={() => setSelectedSectionId(s.id)}
                    className={`p-3 rounded-lg border text-sm cursor-pointer transition-all ${selectedSectionId === s.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-foreground">{SECTION_TYPES.find(t => t.type === s.type)?.icon} {SECTION_TYPES.find(t => t.type === s.type)?.label || s.type}</span>
                      <div className="flex items-center gap-1">
                        <button onClick={(e) => { e.stopPropagation(); moveSection(i, -1); }} className="text-muted-foreground hover:text-foreground" disabled={i === 0}>↑</button>
                        <button onClick={(e) => { e.stopPropagation(); moveSection(i, 1); }} className="text-muted-foreground hover:text-foreground" disabled={i === sections.length - 1}>↓</button>
                        <button onClick={(e) => { e.stopPropagation(); toggleSectionVisibility(s.id); }} className={`text-xs ${s.visible ? "text-emerald-500" : "text-muted-foreground"}`}>{s.visible ? "👁" : "👁‍🗨"}</button>
                        <button onClick={(e) => { e.stopPropagation(); removeSection(s.id); }} className="text-destructive"><Trash2 className="w-3 h-3" /></button>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Add section */}
                <div className="border border-dashed border-border rounded-lg p-3">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Ajouter une section</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {SECTION_TYPES.map(st => (
                      <button
                        key={st.type}
                        onClick={() => addSection(st.type)}
                        className="text-xs p-2 rounded border border-border hover:border-primary/30 hover:bg-primary/5 text-left transition-colors"
                      >
                        {st.icon} {st.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Section data editor */}
                {selectedSection && (
                  <Card>
                    <CardHeader className="py-3 px-3">
                      <CardTitle className="text-sm">Éditer : {SECTION_TYPES.find(t => t.type === selectedSection.type)?.label}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                      <SectionDataEditor section={selectedSection} onChange={(d) => updateSectionData(selectedSection.id, d)} />
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {activeTab === "theme" && (
              <div className="space-y-4">
                <div>
                  <Label className="text-xs">Couleur principale</Label>
                  <div className="flex gap-2 mt-1">
                    <input type="color" value={theme.primaryColor} onChange={e => setTheme({ ...theme, primaryColor: e.target.value })} className="w-8 h-8 rounded cursor-pointer" />
                    <Input value={theme.primaryColor} onChange={e => setTheme({ ...theme, primaryColor: e.target.value })} className="h-8 text-xs" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Fond</Label>
                  <div className="flex gap-2 mt-1">
                    <input type="color" value={theme.bgColor} onChange={e => setTheme({ ...theme, bgColor: e.target.value })} className="w-8 h-8 rounded cursor-pointer" />
                    <Input value={theme.bgColor} onChange={e => setTheme({ ...theme, bgColor: e.target.value })} className="h-8 text-xs" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Texte</Label>
                  <div className="flex gap-2 mt-1">
                    <input type="color" value={theme.textColor} onChange={e => setTheme({ ...theme, textColor: e.target.value })} className="w-8 h-8 rounded cursor-pointer" />
                    <Input value={theme.textColor} onChange={e => setTheme({ ...theme, textColor: e.target.value })} className="h-8 text-xs" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Police titres</Label>
                  <Input value={theme.fontHeading} onChange={e => setTheme({ ...theme, fontHeading: e.target.value })} className="h-8 text-xs mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Police corps</Label>
                  <Input value={theme.fontBody} onChange={e => setTheme({ ...theme, fontBody: e.target.value })} className="h-8 text-xs mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Border radius</Label>
                  <Input value={theme.radius} onChange={e => setTheme({ ...theme, radius: e.target.value })} className="h-8 text-xs mt-1" placeholder="0.75rem" />
                </div>
              </div>
            )}

            {activeTab === "seo" && (
              <div className="space-y-4">
                <div>
                  <Label className="text-xs">Meta Title</Label>
                  <Input value={seoTitle} onChange={e => setSeoTitle(e.target.value)} className="h-8 text-xs mt-1" placeholder="Titre SEO (max 60 car.)" maxLength={60} />
                  <p className="text-[10px] text-muted-foreground mt-1">{seoTitle.length}/60</p>
                </div>
                <div>
                  <Label className="text-xs">Meta Description</Label>
                  <Textarea value={seoDesc} onChange={e => setSeoDesc(e.target.value)} className="text-xs mt-1" placeholder="Description SEO (max 160 car.)" maxLength={160} rows={3} />
                  <p className="text-[10px] text-muted-foreground mt-1">{seoDesc.length}/160</p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={abEnabled} onCheckedChange={setAbEnabled} />
                  <Label className="text-xs">A/B Testing activé</Label>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Preview Canvas */}
        <div className="flex-1 bg-muted/30 overflow-y-auto flex justify-center p-4">
          <div className={`bg-white shadow-xl rounded-lg overflow-hidden transition-all ${previewMode === "mobile" ? "w-[390px]" : "w-full max-w-5xl"}`} style={{ backgroundColor: theme.bgColor }}>
            {sections.filter(s => s.visible).length === 0 ? (
              <div className="py-32 text-center text-muted-foreground">
                <p className="text-lg mb-2">Aucune section</p>
                <p className="text-sm">Ajoutez des sections depuis le panneau de gauche</p>
              </div>
            ) : (
              sections.filter(s => s.visible).map(s => (
                <div
                  key={s.id}
                  onClick={() => setSelectedSectionId(s.id)}
                  className={`relative cursor-pointer transition-all ${selectedSectionId === s.id ? "ring-2 ring-primary ring-offset-2" : "hover:ring-1 hover:ring-primary/20"}`}
                >
                  <LandingSectionRenderer section={s} theme={theme} onCtaClick={() => {}} />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Generic section data editor ---
function SectionDataEditor({ section, onChange }: { section: LandingSection; onChange: (d: any) => void }) {
  const { data } = section;

  const set = (key: string, value: any) => onChange({ ...data, [key]: value });

  return (
    <div className="space-y-3 text-xs">
      {data.title !== undefined && (
        <div>
          <Label className="text-xs">Titre</Label>
          <Input value={data.title} onChange={e => set("title", e.target.value)} className="h-7 text-xs mt-1" />
        </div>
      )}
      {data.subtitle !== undefined && (
        <div>
          <Label className="text-xs">Sous-titre</Label>
          <Input value={data.subtitle} onChange={e => set("subtitle", e.target.value)} className="h-7 text-xs mt-1" />
        </div>
      )}
      {data.ctaText !== undefined && (
        <div>
          <Label className="text-xs">Texte CTA</Label>
          <Input value={data.ctaText} onChange={e => set("ctaText", e.target.value)} className="h-7 text-xs mt-1" />
        </div>
      )}
      {data.text !== undefined && (
        <div>
          <Label className="text-xs">Texte</Label>
          <Textarea value={data.text} onChange={e => set("text", e.target.value)} className="text-xs mt-1" rows={3} />
        </div>
      )}
      {data.imageUrl !== undefined && (
        <div>
          <Label className="text-xs">Image URL</Label>
          <Input value={data.imageUrl} onChange={e => set("imageUrl", e.target.value)} className="h-7 text-xs mt-1" placeholder="https://..." />
        </div>
      )}
      {data.placeholder !== undefined && (
        <div>
          <Label className="text-xs">Placeholder</Label>
          <Input value={data.placeholder} onChange={e => set("placeholder", e.target.value)} className="h-7 text-xs mt-1" />
        </div>
      )}
      {data.buttonText !== undefined && (
        <div>
          <Label className="text-xs">Texte bouton</Label>
          <Input value={data.buttonText} onChange={e => set("buttonText", e.target.value)} className="h-7 text-xs mt-1" />
        </div>
      )}
      {data.endDate !== undefined && (
        <div>
          <Label className="text-xs">Date de fin</Label>
          <Input type="datetime-local" value={data.endDate?.slice(0, 16)} onChange={e => set("endDate", new Date(e.target.value).toISOString())} className="h-7 text-xs mt-1" />
        </div>
      )}
      {/* Items array editor */}
      {data.items && Array.isArray(data.items) && (
        <div>
          <Label className="text-xs mb-1 block">{section.type === "faq" ? "Questions" : "Éléments"} ({data.items.length})</Label>
          {data.items.map((item: any, i: number) => (
            <div key={i} className="p-2 border border-border rounded mb-1.5 space-y-1.5">
              {item.title !== undefined && <Input value={item.title} onChange={e => { const items = [...data.items]; items[i] = { ...items[i], title: e.target.value }; set("items", items); }} className="h-6 text-[11px]" placeholder="Titre" />}
              {item.name !== undefined && <Input value={item.name} onChange={e => { const items = [...data.items]; items[i] = { ...items[i], name: e.target.value }; set("items", items); }} className="h-6 text-[11px]" placeholder="Nom" />}
              {item.desc !== undefined && <Input value={item.desc} onChange={e => { const items = [...data.items]; items[i] = { ...items[i], desc: e.target.value }; set("items", items); }} className="h-6 text-[11px]" placeholder="Description" />}
              {item.q !== undefined && <Input value={item.q} onChange={e => { const items = [...data.items]; items[i] = { ...items[i], q: e.target.value }; set("items", items); }} className="h-6 text-[11px]" placeholder="Question" />}
              {item.a !== undefined && <Input value={item.a} onChange={e => { const items = [...data.items]; items[i] = { ...items[i], a: e.target.value }; set("items", items); }} className="h-6 text-[11px]" placeholder="Réponse" />}
              <button onClick={() => { const items = data.items.filter((_: any, j: number) => j !== i); set("items", items); }} className="text-[10px] text-destructive">Supprimer</button>
            </div>
          ))}
          <Button size="sm" variant="outline" className="w-full h-6 text-[11px]" onClick={() => {
            const template = data.items[0] || {};
            const newItem: any = {};
            Object.keys(template).forEach(k => { newItem[k] = ""; });
            set("items", [...data.items, newItem]);
          }}>
            <Plus className="w-3 h-3 mr-1" /> Ajouter
          </Button>
        </div>
      )}
    </div>
  );
}
