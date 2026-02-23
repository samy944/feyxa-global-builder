import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LandingSection, SectionType, BLOCK_LIBRARY, getBlockDefinition } from "@/lib/landing-templates";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowLeft, Eye, Save, Plus, Trash2, GripVertical, Monitor, Smartphone, Tablet,
  Palette, Search, Copy, EyeOff, Undo2, Redo2, History, Layers, Maximize2, X, Sparkles, Wand2, FileText, Brush,
} from "lucide-react";
import { toast } from "sonner";
import { AiOptimizeDialog } from "@/components/dashboard/AiOptimizeDialog";
import { AiDesignDialog } from "@/components/dashboard/AiDesignDialog";
import { LandingThemePresets } from "@/components/dashboard/LandingThemePresets";
import { AiImageDialog } from "@/components/dashboard/AiImageDialog";
import { BuilderCanvas } from "@/components/builder/BuilderCanvas";
import { SectionDataEditor } from "@/components/builder/SectionDataEditor";
import { SectionStyleEditor } from "@/components/builder/SectionStyleEditor";
import { LandingSectionRenderer } from "@/components/landing/LandingSectionRenderer";

const BLOCK_CATEGORIES = [
  { key: "essential", label: "Essentiels" },
  { key: "content", label: "Contenu" },
  { key: "conversion", label: "Conversion" },
  { key: "social", label: "Social" },
  { key: "ecommerce", label: "E-commerce" },
  { key: "advanced", label: "Avancé" },
] as const;

// Sortable layer item (left panel)
function SortableLayerItem({
  section, isSelected, onSelect, onRemove, onToggleVisibility, onDuplicate,
}: {
  section: LandingSection; isSelected: boolean; onSelect: () => void; onRemove: () => void; onToggleVisibility: () => void; onDuplicate: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  const block = getBlockDefinition(section.type);

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      className={`group flex items-center gap-2 p-2.5 rounded-lg border text-sm cursor-pointer transition-all ${
        isSelected ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-primary/30"
      } ${!section.visible ? "opacity-50" : ""}`}
    >
      <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground shrink-0">
        <GripVertical className="w-3.5 h-3.5" />
      </button>
      <span className="text-base shrink-0">{block?.icon || "📄"}</span>
      <span className="font-medium text-foreground truncate flex-1 text-xs">{block?.label || section.type}</span>
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={(e) => { e.stopPropagation(); onDuplicate(); }} className="p-1 text-muted-foreground hover:text-foreground" title="Dupliquer">
          <Copy className="w-3 h-3" />
        </button>
        <button onClick={(e) => { e.stopPropagation(); onToggleVisibility(); }} className="p-1 text-muted-foreground hover:text-foreground" title="Visibilité">
          {section.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
        </button>
        <button onClick={(e) => { e.stopPropagation(); onRemove(); }} className="p-1 text-destructive hover:text-destructive" title="Supprimer">
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

export default function DashboardLandingEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [landing, setLanding] = useState<any>(null);
  const [sections, setSections] = useState<LandingSection[]>([]);
  const [theme, setTheme] = useState({
    primaryColor: "#3b82f6", bgColor: "#ffffff", textColor: "#0f172a",
    radius: "0.75rem", fontHeading: "Clash Display", fontBody: "Manrope",
  });
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDesc, setSeoDesc] = useState("");
  const [abEnabled, setAbEnabled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [previewMode, setPreviewMode] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [leftTab, setLeftTab] = useState<"blocks" | "layers">("layers");
  const [blockSearch, setBlockSearch] = useState("");
  const [revisions, setRevisions] = useState<any[]>([]);
  const [showRevisions, setShowRevisions] = useState(false);
  const [showFullPreview, setShowFullPreview] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [showAiOptimize, setShowAiOptimize] = useState(false);
  const [showAiDesign, setShowAiDesign] = useState(false);
  const autosaveRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [previewTheme, setPreviewTheme] = useState<typeof theme | null>(null);
  const sectionsRef = useRef(sections);
  const themeRef = useRef(theme);
  const seoTitleRef = useRef(seoTitle);
  const seoDescRef = useRef(seoDesc);
  const abEnabledRef = useRef(abEnabled);
  const [subpages, setSubpages] = useState<any[]>([]);
  const [activeSubpageId, setActiveSubpageId] = useState<string | null>(null);
  const [showAiImage, setShowAiImage] = useState(false);
  const [aiImageTargetField, setAiImageTargetField] = useState<{ sectionId: string; field: string } | null>(null);
  const [rightTab, setRightTab] = useState<"content" | "style">("content");
  const [showInsertMenu, setShowInsertMenu] = useState<number | null>(null);

  // Keep refs in sync
  useEffect(() => { sectionsRef.current = sections; }, [sections]);
  useEffect(() => { themeRef.current = theme; }, [theme]);
  useEffect(() => { seoTitleRef.current = seoTitle; }, [seoTitle]);
  useEffect(() => { seoDescRef.current = seoDesc; }, [seoDesc]);
  useEffect(() => { abEnabledRef.current = abEnabled; }, [abEnabled]);

  // Undo/Redo
  const [history, setHistory] = useState<LandingSection[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const pushHistory = useCallback((newSections: LandingSection[]) => {
    setHistory(prev => {
      const trimmed = prev.slice(0, historyIndex + 1);
      return [...trimmed, JSON.parse(JSON.stringify(newSections))].slice(-30);
    });
    setHistoryIndex(prev => Math.min(prev + 1, 29));
  }, [historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setSections(JSON.parse(JSON.stringify(history[historyIndex - 1])));
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setSections(JSON.parse(JSON.stringify(history[historyIndex + 1])));
    }
  }, [history, historyIndex]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey) { e.preventDefault(); undo(); }
      if ((e.metaKey || e.ctrlKey) && e.key === "z" && e.shiftKey) { e.preventDefault(); redo(); }
      if (e.key === "Delete" && selectedSectionId) { removeSection(selectedSectionId); }
      if (e.key === "Escape") { setSelectedSectionId(null); setShowInsertMenu(null); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undo, redo, selectedSectionId]);

  // DnD sensors for layers panel
  const layerSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  useEffect(() => {
    if (!id) return;
    supabase
      .from("landing_pages")
      .select("*")
      .eq("id", id)
      .single()
      .then(async ({ data }) => {
        if (!data) return navigate("/dashboard/landings");
        setLanding(data);
        if (data.theme) setTheme(prev => ({ ...prev, ...(data.theme as any) }));
        setSeoTitle(data.seo_title || "");
        setSeoDesc(data.seo_description || "");
        setAbEnabled(data.ab_enabled || false);

        const { data: subs } = await supabase
          .from("landing_subpages").select("*").eq("landing_page_id", id).order("sort_order");

        if (subs && subs.length > 0) {
          setSubpages(subs);
          const homePage = subs.find((s: any) => s.is_home) || subs[0];
          setActiveSubpageId(homePage.id);
          const s = (homePage.sections as unknown as LandingSection[]) || [];
          setSections(s);
          pushHistory(s);
        } else {
          setSubpages([]);
          setActiveSubpageId(null);
          const s = (data.sections as unknown as LandingSection[]) || [];
          setSections(s);
          pushHistory(s);
        }
      });
  }, [id]);

  useEffect(() => {
    if (!id) return;
    supabase.from("landing_revisions").select("id, created_at, label")
      .eq("landing_page_id", id).order("created_at", { ascending: false }).limit(20)
      .then(({ data }) => setRevisions(data || []));
  }, [id, lastSaved]);

  const handleSave = async (silent = false) => {
    if (!id) return;
    setSaving(true);
    if (!silent) {
      await supabase.from("landing_revisions").insert({
        landing_page_id: id, sections: sectionsRef.current as any,
        theme: themeRef.current as any, label: `v${revisions.length + 1}`,
      });
    }
    if (activeSubpageId) {
      await supabase.from("landing_subpages").update({ sections: sectionsRef.current as any }).eq("id", activeSubpageId);
    }
    const { error } = await supabase.from("landing_pages").update({
      sections: activeSubpageId ? (landing?.sections || []) : sectionsRef.current as any,
      theme: themeRef.current as any, seo_title: seoTitleRef.current,
      seo_description: seoDescRef.current, ab_enabled: abEnabledRef.current,
    }).eq("id", id);

    setSaving(false);
    setIsDirty(false);
    if (error) { if (!silent) toast.error(error.message); }
    else { setLastSaved(new Date()); if (!silent) toast.success("Sauvegardé !"); }
  };

  // Subpage management
  const addSubpage = async () => {
    if (!id) return;
    const title = `Page ${subpages.length + 1}`;
    const slug = `page-${subpages.length + 1}`;
    const isHome = subpages.length === 0;
    const migratedSections = isHome ? sectionsRef.current : [];
    const { data, error } = await supabase.from("landing_subpages")
      .insert({ landing_page_id: id, title, slug, sections: migratedSections as any, sort_order: subpages.length, is_home: isHome })
      .select().single();
    if (error) { toast.error(error.message); return; }
    if (data) {
      setSubpages([...subpages, data]);
      setActiveSubpageId(data.id);
      const s = (data.sections as unknown as LandingSection[]) || [];
      setSections(s);
      pushHistory(s);
      toast.success(`"${title}" ajoutée`);
    }
  };

  const switchSubpage = async (subpageId: string) => {
    if (isDirty && activeSubpageId) {
      await supabase.from("landing_subpages").update({ sections: sectionsRef.current as any }).eq("id", activeSubpageId);
    }
    const sub = subpages.find(s => s.id === subpageId);
    if (!sub) return;
    setActiveSubpageId(subpageId);
    const s = (sub.sections as unknown as LandingSection[]) || [];
    setSections(s);
    pushHistory(s);
    setSelectedSectionId(null);
    setIsDirty(false);
  };

  const renameSubpage = async (subpageId: string, newTitle: string) => {
    await supabase.from("landing_subpages")
      .update({ title: newTitle, slug: newTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") })
      .eq("id", subpageId);
    setSubpages(subpages.map(s => s.id === subpageId ? { ...s, title: newTitle } : s));
  };

  const deleteSubpage = async (subpageId: string) => {
    if (subpages.length <= 1) { toast.error("Impossible de supprimer la dernière page"); return; }
    await supabase.from("landing_subpages").delete().eq("id", subpageId);
    const remaining = subpages.filter(s => s.id !== subpageId);
    setSubpages(remaining);
    if (activeSubpageId === subpageId) {
      const next = remaining[0];
      setActiveSubpageId(next.id);
      const s = (next.sections as unknown as LandingSection[]) || [];
      setSections(s);
      pushHistory(s);
    }
    toast.success("Page supprimée");
  };

  // Autosave
  useEffect(() => {
    autosaveRef.current = setInterval(() => { if (isDirty && id) handleSave(true); }, 30000);
    return () => { if (autosaveRef.current) clearInterval(autosaveRef.current); };
  }, [isDirty, id]);

  const handleRestoreRevision = async (revisionId: string) => {
    const { data } = await supabase.from("landing_revisions").select("sections, theme").eq("id", revisionId).single();
    if (data) {
      const s = (data.sections as unknown as LandingSection[]) || [];
      setSections(s); pushHistory(s);
      if (data.theme) setTheme(prev => ({ ...prev, ...(data.theme as any) }));
      setShowRevisions(false);
      toast.success("Révision restaurée");
    }
  };

  const updateSections = (newSections: LandingSection[]) => {
    setSections(newSections);
    pushHistory(newSections);
    setIsDirty(true);
  };

  const addSection = (type: SectionType) => {
    const block = getBlockDefinition(type);
    const newSection: LandingSection = {
      id: Math.random().toString(36).slice(2, 10),
      type, visible: true,
      data: JSON.parse(JSON.stringify(block?.defaultData || {})),
    };
    updateSections([...sections, newSection]);
    setSelectedSectionId(newSection.id);
    setLeftTab("layers");
  };

  const insertSectionAt = (type: SectionType, atIndex: number) => {
    const block = getBlockDefinition(type);
    const newSection: LandingSection = {
      id: Math.random().toString(36).slice(2, 10),
      type, visible: true,
      data: JSON.parse(JSON.stringify(block?.defaultData || {})),
    };
    const arr = [...sections];
    // Map visible index to actual index
    const visibleSections = sections.filter(s => s.visible);
    let actualIndex = atIndex;
    if (atIndex < visibleSections.length) {
      const targetSection = visibleSections[atIndex];
      actualIndex = sections.findIndex(s => s.id === targetSection.id);
    } else {
      actualIndex = sections.length;
    }
    arr.splice(actualIndex, 0, newSection);
    updateSections(arr);
    setSelectedSectionId(newSection.id);
    setShowInsertMenu(null);
  };

  const removeSection = (sectionId: string) => {
    updateSections(sections.filter(s => s.id !== sectionId));
    if (selectedSectionId === sectionId) setSelectedSectionId(null);
  };

  const duplicateSection = (sectionId: string) => {
    const idx = sections.findIndex(s => s.id === sectionId);
    if (idx === -1) return;
    const clone: LandingSection = { ...JSON.parse(JSON.stringify(sections[idx])), id: Math.random().toString(36).slice(2, 10) };
    const arr = [...sections];
    arr.splice(idx + 1, 0, clone);
    updateSections(arr);
    setSelectedSectionId(clone.id);
  };

  const toggleSectionVisibility = (sectionId: string) => {
    updateSections(sections.map(s => s.id === sectionId ? { ...s, visible: !s.visible } : s));
  };

  const updateSectionData = (sectionId: string, newData: Record<string, any>) => {
    setSections(sections.map(s => s.id === sectionId ? { ...s, data: newData } : s));
    setIsDirty(true);
  };

  const updateSectionStyle = (sectionId: string, newStyle: Record<string, any>) => {
    setSections(sections.map(s => s.id === sectionId ? { ...s, data: { ...s.data, _style: newStyle } } : s));
    setIsDirty(true);
  };

  const handleLayerDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = sections.findIndex(s => s.id === active.id);
      const newIndex = sections.findIndex(s => s.id === over.id);
      updateSections(arrayMove(sections, oldIndex, newIndex));
    }
  };

  const selectedSection = sections.find(s => s.id === selectedSectionId);
  const canvasTheme = previewTheme || theme;

  const filteredBlocks = useMemo(() => {
    if (!blockSearch) return BLOCK_LIBRARY;
    const q = blockSearch.toLowerCase();
    return BLOCK_LIBRARY.filter(b => b.label.toLowerCase().includes(q) || b.type.toLowerCase().includes(q));
  }, [blockSearch]);

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      {/* Top Toolbar */}
      <div className="h-12 border-b border-border bg-card flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <Button size="sm" variant="ghost" onClick={() => navigate("/dashboard/landings")}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Retour
          </Button>
          <span className="text-sm font-medium text-foreground truncate max-w-[200px]">{landing?.title}</span>
          {saving ? (
            <span className="text-[10px] text-primary animate-pulse">Sauvegarde...</span>
          ) : isDirty ? (
            <span className="text-[10px] text-destructive/70">● Modifié</span>
          ) : lastSaved ? (
            <span className="text-[10px] text-muted-foreground">✓ Sauvé {lastSaved.toLocaleTimeString()}</span>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <Button size="icon" variant="ghost" onClick={undo} disabled={historyIndex <= 0} className="w-8 h-8" title="Annuler (Ctrl+Z)">
            <Undo2 className="w-4 h-4" />
          </Button>
          <Button size="icon" variant="ghost" onClick={redo} disabled={historyIndex >= history.length - 1} className="w-8 h-8" title="Rétablir (Ctrl+Shift+Z)">
            <Redo2 className="w-4 h-4" />
          </Button>
          <div className="w-px h-6 bg-border mx-1" />
          <div className="flex border border-border rounded-lg overflow-hidden">
            {([
              { mode: "desktop" as const, icon: Monitor },
              { mode: "tablet" as const, icon: Tablet },
              { mode: "mobile" as const, icon: Smartphone },
            ]).map(({ mode, icon: Icon }) => (
              <button key={mode} onClick={() => setPreviewMode(mode)} className={`px-2 py-1 ${previewMode === mode ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}>
                <Icon className="w-4 h-4" />
              </button>
            ))}
          </div>
          <div className="w-px h-6 bg-border mx-1" />
          <Button size="sm" variant="ghost" onClick={() => setShowRevisions(!showRevisions)} title="Historique">
            <History className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={() => setShowAiDesign(true)} className="gap-1.5 text-violet-600 border-violet-300 hover:bg-violet-50 dark:hover:bg-violet-950">
            <Wand2 className="w-4 h-4" /> Design IA
          </Button>
          <Button size="sm" variant="outline" onClick={() => setShowAiOptimize(true)} className="gap-1.5 text-primary border-primary/30 hover:bg-primary/5">
            <Sparkles className="w-4 h-4" /> Copywriting IA
          </Button>
          <Button size="sm" variant="outline" onClick={() => setShowFullPreview(true)} title="Preview plein écran">
            <Maximize2 className="w-4 h-4 mr-1" /> Preview
          </Button>
          {landing?.slug && (
            <Button size="sm" variant="ghost" asChild title="Ouvrir dans un nouvel onglet">
              <a href={`/lp/${landing.slug}`} target="_blank" rel="noopener noreferrer"><Eye className="w-4 h-4" /></a>
            </Button>
          )}
          <Button size="sm" onClick={() => handleSave(false)} disabled={saving}>
            <Save className="w-4 h-4 mr-1" /> {saving ? "..." : "Sauvegarder"}
          </Button>
        </div>
      </div>

      {/* Subpages Tabs Bar */}
      {subpages.length > 0 && (
        <div className="h-10 border-b border-border bg-muted/30 flex items-center px-4 gap-1 shrink-0 overflow-x-auto">
          <FileText className="w-3.5 h-3.5 text-muted-foreground mr-1 shrink-0" />
          {subpages.map(sp => (
            <button
              key={sp.id}
              onClick={() => switchSubpage(sp.id)}
              onDoubleClick={() => {
                const newTitle = window.prompt("Nom de la page:", sp.title);
                if (newTitle) renameSubpage(sp.id, newTitle);
              }}
              className={`group relative px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeSubpageId === sp.id
                  ? "bg-background text-foreground shadow-sm border border-border"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
              }`}
            >
              {sp.title}
              {sp.is_home && <span className="ml-1 text-[9px] opacity-50">●</span>}
              {!sp.is_home && subpages.length > 1 && (
                <button
                  onClick={(e) => { e.stopPropagation(); deleteSubpage(sp.id); }}
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-white text-[9px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ✕
                </button>
              )}
            </button>
          ))}
          <button onClick={addSubpage} className="px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-background/50 rounded-md transition-colors flex items-center gap-1">
            <Plus className="w-3 h-3" /> Page
          </button>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden relative">
        {/* === LEFT SIDEBAR: Blocks Library + Layers === */}
        <div className="w-64 border-r border-border bg-card flex flex-col shrink-0">
          <div className="flex border-b border-border shrink-0">
            <button onClick={() => setLeftTab("blocks")} className={`flex-1 py-2.5 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${leftTab === "blocks" ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}>
              <Plus className="w-3.5 h-3.5" /> Blocs
            </button>
            <button onClick={() => setLeftTab("layers")} className={`flex-1 py-2.5 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${leftTab === "layers" ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}>
              <Layers className="w-3.5 h-3.5" /> Calques ({sections.length})
            </button>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-3 space-y-3">
              {leftTab === "blocks" && (
                <>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-muted-foreground" />
                    <Input value={blockSearch} onChange={e => setBlockSearch(e.target.value)} placeholder="Rechercher..." className="h-7 text-xs pl-8" />
                  </div>
                  {BLOCK_CATEGORIES.map(cat => {
                    const blocks = filteredBlocks.filter(b => b.category === cat.key);
                    if (blocks.length === 0) return null;
                    return (
                      <div key={cat.key}>
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">{cat.label}</p>
                        <div className="grid grid-cols-2 gap-1.5">
                          {blocks.map(b => (
                            <button
                              key={b.type}
                              onClick={() => addSection(b.type)}
                              className="text-[11px] p-2 rounded-lg border border-border hover:border-primary/40 hover:bg-primary/5 text-left transition-all flex flex-col gap-1"
                            >
                              <span className="text-base">{b.icon}</span>
                              <span className="font-medium text-foreground">{b.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </>
              )}

              {leftTab === "layers" && (
                <DndContext sensors={layerSensors} collisionDetection={closestCenter} onDragEnd={handleLayerDragEnd}>
                  <SortableContext items={sections.map(s => s.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-1.5">
                      {sections.map(s => (
                        <SortableLayerItem
                          key={s.id}
                          section={s}
                          isSelected={selectedSectionId === s.id}
                          onSelect={() => setSelectedSectionId(s.id)}
                          onRemove={() => removeSection(s.id)}
                          onToggleVisibility={() => toggleSectionVisibility(s.id)}
                          onDuplicate={() => duplicateSection(s.id)}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* === CENTER: Visual Builder Canvas === */}
        <BuilderCanvas
          sections={sections}
          theme={canvasTheme}
          previewMode={previewMode}
          selectedSectionId={selectedSectionId}
          onSelectSection={setSelectedSectionId}
          onUpdateSections={updateSections}
          onRemoveSection={removeSection}
          onDuplicateSection={duplicateSection}
          onToggleVisibility={toggleSectionVisibility}
          onInsertSection={insertSectionAt}
          showInsertMenu={showInsertMenu}
          onShowInsertMenu={setShowInsertMenu}
        />

        {/* === RIGHT SIDEBAR: Properties Panel === */}
        <div className="w-72 border-l border-border bg-card flex flex-col shrink-0">
          {selectedSection ? (
            <>
              <div className="p-3 border-b border-border shrink-0">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <span>{getBlockDefinition(selectedSection.type)?.icon}</span>
                    {getBlockDefinition(selectedSection.type)?.label}
                  </h3>
                  <Button size="icon" variant="ghost" className="w-6 h-6" onClick={() => setSelectedSectionId(null)}>✕</Button>
                </div>
                {/* Content / Style tabs */}
                <div className="flex border border-border rounded-lg overflow-hidden">
                  <button
                    onClick={() => setRightTab("content")}
                    className={`flex-1 py-1.5 text-[10px] font-medium flex items-center justify-center gap-1 transition-colors ${
                      rightTab === "content" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <FileText className="w-3 h-3" /> Contenu
                  </button>
                  <button
                    onClick={() => setRightTab("style")}
                    className={`flex-1 py-1.5 text-[10px] font-medium flex items-center justify-center gap-1 transition-colors ${
                      rightTab === "style" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Brush className="w-3 h-3" /> Style
                  </button>
                </div>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-3">
                  {rightTab === "content" ? (
                    <SectionDataEditor
                      section={selectedSection}
                      onChange={(d) => updateSectionData(selectedSection.id, d)}
                      onAiImage={(field) => {
                        setAiImageTargetField({ sectionId: selectedSection.id, field });
                        setShowAiImage(true);
                      }}
                    />
                  ) : (
                    <SectionStyleEditor
                      section={selectedSection}
                      onChange={(style) => updateSectionStyle(selectedSection.id, style)}
                    />
                  )}
                </div>
              </ScrollArea>
            </>
          ) : (
            <>
              <div className="flex border-b border-border shrink-0">
                {[
                  { key: "theme", icon: <Palette className="w-3.5 h-3.5" />, label: "Style" },
                  { key: "seo", icon: <Search className="w-3.5 h-3.5" />, label: "SEO" },
                ].map(tab => (
                  <button key={tab.key} className="flex-1 py-2.5 text-xs font-medium flex items-center justify-center gap-1.5 text-muted-foreground hover:text-foreground">
                    {tab.icon} {tab.label}
                  </button>
                ))}
              </div>
              <ScrollArea className="flex-1">
                <div className="p-3 space-y-4">
                  <LandingThemePresets
                    currentTheme={theme}
                    onApply={(newTheme) => { setTheme(prev => ({ ...prev, ...newTheme })); setPreviewTheme(null); setIsDirty(true); }}
                    onPreview={(t) => setPreviewTheme(t ? { ...theme, ...t } : null)}
                  />
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Couleurs</p>
                    {([
                      { label: "Principale", key: "primaryColor" as const },
                      { label: "Fond", key: "bgColor" as const },
                      { label: "Texte", key: "textColor" as const },
                    ]).map(c => (
                      <div key={c.key} className="flex items-center gap-2 mb-2">
                        <input type="color" value={theme[c.key]} onChange={e => { setTheme({ ...theme, [c.key]: e.target.value }); setIsDirty(true); }} className="w-7 h-7 rounded cursor-pointer border-0" />
                        <Label className="text-xs flex-1">{c.label}</Label>
                        <Input value={theme[c.key]} onChange={e => { setTheme({ ...theme, [c.key]: e.target.value }); setIsDirty(true); }} className="h-6 text-[10px] w-20" />
                      </div>
                    ))}
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Typographie</p>
                    <div className="space-y-2">
                      <div>
                        <Label className="text-[10px]">Titres</Label>
                        <Input value={theme.fontHeading} onChange={e => { setTheme({ ...theme, fontHeading: e.target.value }); setIsDirty(true); }} className="h-7 text-xs mt-0.5" />
                      </div>
                      <div>
                        <Label className="text-[10px]">Corps</Label>
                        <Input value={theme.fontBody} onChange={e => { setTheme({ ...theme, fontBody: e.target.value }); setIsDirty(true); }} className="h-7 text-xs mt-0.5" />
                      </div>
                      <div>
                        <Label className="text-[10px]">Radius</Label>
                        <Input value={theme.radius} onChange={e => { setTheme({ ...theme, radius: e.target.value }); setIsDirty(true); }} className="h-7 text-xs mt-0.5" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">SEO</p>
                    <div className="space-y-2">
                      <div>
                        <Label className="text-[10px]">Meta Title</Label>
                        <Input value={seoTitle} onChange={e => { setSeoTitle(e.target.value); setIsDirty(true); }} className="h-7 text-xs mt-0.5" maxLength={60} />
                        <p className="text-[9px] text-muted-foreground mt-0.5">{seoTitle.length}/60</p>
                      </div>
                      <div>
                        <Label className="text-[10px]">Meta Description</Label>
                        <Textarea value={seoDesc} onChange={e => { setSeoDesc(e.target.value); setIsDirty(true); }} className="text-xs mt-0.5" maxLength={160} rows={2} />
                        <p className="text-[9px] text-muted-foreground mt-0.5">{seoDesc.length}/160</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={abEnabled} onCheckedChange={(v) => { setAbEnabled(v); setIsDirty(true); }} />
                    <Label className="text-xs">A/B Testing</Label>
                  </div>
                </div>
              </ScrollArea>
            </>
          )}
        </div>

        {/* Revisions Panel */}
        {showRevisions && (
          <div className="absolute right-0 top-0 w-64 bg-card border-l border-border shadow-xl z-50 h-full overflow-y-auto">
            <div className="p-3 border-b border-border flex items-center justify-between">
              <h3 className="text-sm font-semibold">Historique</h3>
              <Button size="icon" variant="ghost" className="w-6 h-6" onClick={() => setShowRevisions(false)}>✕</Button>
            </div>
            <div className="p-3 space-y-2">
              {revisions.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">Aucune révision</p>
              ) : (
                revisions.map(r => (
                  <div key={r.id} className="p-2.5 rounded-lg border border-border text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{r.label || "Révision"}</span>
                      <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2" onClick={() => handleRestoreRevision(r.id)}>Restaurer</Button>
                    </div>
                    <p className="text-muted-foreground text-[10px]">{new Date(r.created_at).toLocaleString()}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Fullscreen Preview Modal */}
      {showFullPreview && (
        <div className="fixed inset-0 z-[100] bg-background flex flex-col">
          <div className="h-12 border-b border-border bg-card flex items-center justify-between px-4 shrink-0">
            <span className="text-sm font-semibold text-foreground">{landing?.title} — Preview</span>
            <div className="flex items-center gap-2">
              <div className="flex border border-border rounded-lg overflow-hidden">
                {([
                  { mode: "desktop" as const, icon: Monitor },
                  { mode: "tablet" as const, icon: Tablet },
                  { mode: "mobile" as const, icon: Smartphone },
                ]).map(({ mode, icon: Icon }) => (
                  <button key={mode} onClick={() => setPreviewMode(mode)} className={`px-2.5 py-1.5 ${previewMode === mode ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                    <Icon className="w-4 h-4" />
                  </button>
                ))}
              </div>
              <Button size="sm" variant="outline" onClick={() => setShowFullPreview(false)}>
                <X className="w-4 h-4 mr-1" /> Fermer
              </Button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto flex justify-center bg-muted/30 p-4">
            <div
              className={`bg-white shadow-xl rounded-lg overflow-hidden transition-all ${previewMode === "mobile" ? "w-[390px]" : previewMode === "tablet" ? "w-[768px]" : "w-full max-w-5xl"}`}
              style={{ backgroundColor: theme.bgColor, fontFamily: `"${theme.fontBody}", sans-serif` }}
            >
              {sections.filter(s => s.visible).map(s => (
                <div key={s.id}>
                  <div style={(() => {
                    const st = s.data?._style || {};
                    const r: React.CSSProperties = {};
                    if (st.backgroundColor) r.backgroundColor = st.backgroundColor;
                    if (st.paddingY !== undefined) { r.paddingTop = `${st.paddingY}px`; r.paddingBottom = `${st.paddingY}px`; }
                    if (st.paddingX !== undefined) { r.paddingLeft = `${st.paddingX}px`; r.paddingRight = `${st.paddingX}px`; }
                    return r;
                  })()}>
                    <LandingSectionRenderer section={s} theme={theme} onCtaClick={() => {}} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* AI Dialogs */}
      <AiOptimizeDialog
        open={showAiOptimize} onOpenChange={setShowAiOptimize}
        sections={sections} seoTitle={seoTitle} seoDescription={seoDesc} storeName={landing?.title}
        onApply={(newSections, newSeoTitle, newSeoDesc) => { updateSections(newSections); setSeoTitle(newSeoTitle); setSeoDesc(newSeoDesc); setIsDirty(true); }}
      />
      <AiDesignDialog
        open={showAiDesign} onOpenChange={setShowAiDesign}
        sections={sections} currentTheme={theme} storeName={landing?.title} storeId={landing?.store_id || ""}
        onApply={(newSections, newTheme, newSeoTitle, newSeoDesc) => {
          updateSections(newSections); setTheme(prev => ({ ...prev, ...newTheme })); setPreviewTheme(null);
          if (newSeoTitle) setSeoTitle(newSeoTitle); if (newSeoDesc) setSeoDesc(newSeoDesc); setIsDirty(true);
        }}
        onPreview={(t) => setPreviewTheme(t ? { ...theme, ...t } : null)}
      />
      <AiImageDialog
        open={showAiImage} onOpenChange={setShowAiImage}
        storeId={landing?.store_id || ""} context={landing?.title}
        onImageGenerated={(url) => {
          if (aiImageTargetField && selectedSectionId) {
            const section = sections.find(s => s.id === selectedSectionId);
            if (section) updateSectionData(selectedSectionId, { ...section.data, [aiImageTargetField.field]: url });
          }
          setAiImageTargetField(null);
        }}
      />
    </div>
  );
}
