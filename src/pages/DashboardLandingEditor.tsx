import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LandingSectionRenderer } from "@/components/landing/LandingSectionRenderer";
import { LandingSection, SectionType, BLOCK_LIBRARY, BlockDefinition, getBlockDefinition } from "@/lib/landing-templates";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowLeft, Eye, Save, Plus, Trash2, GripVertical, Monitor, Smartphone, Tablet,
  Settings2, Palette, Search, Copy, EyeOff, Undo2, Redo2, History, Layers, Maximize2, X,
} from "lucide-react";
import { toast } from "sonner";
import { ImageUploader } from "@/components/landing/ImageUploader";

const BLOCK_CATEGORIES = [
  { key: "essential", label: "Essentiels" },
  { key: "content", label: "Contenu" },
  { key: "conversion", label: "Conversion" },
  { key: "social", label: "Social" },
  { key: "ecommerce", label: "E-commerce" },
  { key: "advanced", label: "Avancé" },
] as const;

// Sortable layer item
function SortableLayerItem({
  section,
  isSelected,
  onSelect,
  onRemove,
  onToggleVisibility,
  onDuplicate,
}: {
  section: LandingSection;
  isSelected: boolean;
  onSelect: () => void;
  onRemove: () => void;
  onToggleVisibility: () => void;
  onDuplicate: () => void;
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
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [previewMode, setPreviewMode] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [leftTab, setLeftTab] = useState<"blocks" | "layers">("layers");
  const [blockSearch, setBlockSearch] = useState("");
  const [revisions, setRevisions] = useState<any[]>([]);
  const [showRevisions, setShowRevisions] = useState(false);
  const [showFullPreview, setShowFullPreview] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const autosaveRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sectionsRef = useRef(sections);
  const themeRef = useRef(theme);
  const seoTitleRef = useRef(seoTitle);
  const seoDescRef = useRef(seoDesc);
  const abEnabledRef = useRef(abEnabled);

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
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undo, redo, selectedSectionId]);

  // DnD sensors
  const sensors = useSensors(
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
      .then(({ data }) => {
        if (!data) return navigate("/dashboard/landings");
        setLanding(data);
        const s = (data.sections as unknown as LandingSection[]) || [];
        setSections(s);
        pushHistory(s);
        if (data.theme) setTheme(prev => ({ ...prev, ...(data.theme as any) }));
        setSeoTitle(data.seo_title || "");
        setSeoDesc(data.seo_description || "");
        setAbEnabled(data.ab_enabled || false);
      });
  }, [id]);

  // Fetch revisions
  useEffect(() => {
    if (!id) return;
    supabase
      .from("landing_revisions")
      .select("id, created_at, label")
      .eq("landing_page_id", id)
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => setRevisions(data || []));
  }, [id, lastSaved]);

  const handleSave = async (silent = false) => {
    if (!id) return;
    setSaving(true);

    // Save revision only on manual save
    if (!silent) {
      await supabase.from("landing_revisions").insert({
        landing_page_id: id,
        sections: sectionsRef.current as any,
        theme: themeRef.current as any,
        label: `v${revisions.length + 1}`,
      });
    }

    const { error } = await supabase
      .from("landing_pages")
      .update({
        sections: sectionsRef.current as any,
        theme: themeRef.current as any,
        seo_title: seoTitleRef.current,
        seo_description: seoDescRef.current,
        ab_enabled: abEnabledRef.current,
      })
      .eq("id", id);

    setSaving(false);
    setIsDirty(false);
    if (error) {
      if (!silent) toast.error(error.message);
    } else {
      setLastSaved(new Date());
      if (!silent) toast.success("Sauvegardé !");
    }
  };

  // Autosave every 30s when dirty
  useEffect(() => {
    autosaveRef.current = setInterval(() => {
      if (isDirty && id) {
        handleSave(true);
      }
    }, 30000);
    return () => {
      if (autosaveRef.current) clearInterval(autosaveRef.current);
    };
  }, [isDirty, id]);

  const handleRestoreRevision = async (revisionId: string) => {
    const { data } = await supabase
      .from("landing_revisions")
      .select("sections, theme")
      .eq("id", revisionId)
      .single();
    if (data) {
      const s = (data.sections as unknown as LandingSection[]) || [];
      setSections(s);
      pushHistory(s);
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
      type,
      visible: true,
      data: JSON.parse(JSON.stringify(block?.defaultData || {})),
    };
    updateSections([...sections, newSection]);
    setSelectedSectionId(newSection.id);
    setLeftTab("layers");
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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = sections.findIndex(s => s.id === active.id);
      const newIndex = sections.findIndex(s => s.id === over.id);
      updateSections(arrayMove(sections, oldIndex, newIndex));
    }
  };

  const selectedSection = sections.find(s => s.id === selectedSectionId);

  const filteredBlocks = useMemo(() => {
    if (!blockSearch) return BLOCK_LIBRARY;
    const q = blockSearch.toLowerCase();
    return BLOCK_LIBRARY.filter(b => b.label.toLowerCase().includes(q) || b.type.toLowerCase().includes(q));
  }, [blockSearch]);

  const previewWidth = previewMode === "mobile" ? "w-[390px]" : previewMode === "tablet" ? "w-[768px]" : "w-full max-w-5xl";

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
          {/* Undo/Redo */}
          <Button size="icon" variant="ghost" onClick={undo} disabled={historyIndex <= 0} className="w-8 h-8" title="Annuler (Ctrl+Z)">
            <Undo2 className="w-4 h-4" />
          </Button>
          <Button size="icon" variant="ghost" onClick={redo} disabled={historyIndex >= history.length - 1} className="w-8 h-8" title="Rétablir (Ctrl+Shift+Z)">
            <Redo2 className="w-4 h-4" />
          </Button>
          <div className="w-px h-6 bg-border mx-1" />
          {/* Viewport switcher */}
          <div className="flex border border-border rounded-lg overflow-hidden">
            {[
              { mode: "desktop" as const, icon: Monitor },
              { mode: "tablet" as const, icon: Tablet },
              { mode: "mobile" as const, icon: Smartphone },
            ].map(({ mode, icon: Icon }) => (
              <button key={mode} onClick={() => setPreviewMode(mode)} className={`px-2 py-1 ${previewMode === mode ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}>
                <Icon className="w-4 h-4" />
              </button>
            ))}
          </div>
          <div className="w-px h-6 bg-border mx-1" />
          {/* Revisions */}
          <Button size="sm" variant="ghost" onClick={() => setShowRevisions(!showRevisions)} title="Historique">
            <History className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={() => setShowFullPreview(true)} title="Preview plein écran">
            <Maximize2 className="w-4 h-4 mr-1" /> Preview
          </Button>
          {landing?.slug && (
            <Button size="sm" variant="ghost" asChild title="Ouvrir dans un nouvel onglet">
              <a href={`/lp/${landing.slug}`} target="_blank" rel="noopener noreferrer">
                <Eye className="w-4 h-4" />
              </a>
            </Button>
          )}
          <Button size="sm" onClick={() => handleSave(false)} disabled={saving}>
            <Save className="w-4 h-4 mr-1" /> {saving ? "..." : "Sauvegarder"}
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
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
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
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

        {/* === CENTER: Canvas Preview === */}
        <div className="flex-1 bg-muted/30 overflow-y-auto flex justify-center p-4">
          <div className={`bg-white shadow-xl rounded-lg overflow-hidden transition-all ${previewWidth}`} style={{ backgroundColor: theme.bgColor }}>
            {sections.filter(s => s.visible).length === 0 ? (
              <div className="py-32 text-center text-muted-foreground">
                <Plus className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p className="text-lg mb-2">Aucune section</p>
                <p className="text-sm">Ajoutez des blocs depuis le panneau de gauche</p>
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

        {/* === RIGHT SIDEBAR: Properties Panel === */}
        <div className="w-72 border-l border-border bg-card flex flex-col shrink-0">
          {selectedSection ? (
            <>
              <div className="p-3 border-b border-border shrink-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <span>{getBlockDefinition(selectedSection.type)?.icon}</span>
                    {getBlockDefinition(selectedSection.type)?.label}
                  </h3>
                  <Button size="icon" variant="ghost" className="w-6 h-6" onClick={() => setSelectedSectionId(null)}>
                    ✕
                  </Button>
                </div>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-3">
                  <SectionDataEditor section={selectedSection} onChange={(d) => updateSectionData(selectedSection.id, d)} />
                </div>
              </ScrollArea>
            </>
          ) : (
            <>
              {/* Theme / SEO panel when nothing selected */}
              <div className="flex border-b border-border shrink-0">
                {[
                  { key: "theme", icon: <Palette className="w-3.5 h-3.5" />, label: "Style" },
                  { key: "seo", icon: <Search className="w-3.5 h-3.5" />, label: "SEO" },
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => {}}
                    className="flex-1 py-2.5 text-xs font-medium flex items-center justify-center gap-1.5 text-muted-foreground hover:text-foreground"
                  >
                    {tab.icon} {tab.label}
                  </button>
                ))}
              </div>
              <ScrollArea className="flex-1">
                <div className="p-3 space-y-4">
                  {/* Theme controls */}
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Couleurs</p>
                    {[
                      { label: "Principale", key: "primaryColor" as const },
                      { label: "Fond", key: "bgColor" as const },
                      { label: "Texte", key: "textColor" as const },
                    ].map(c => (
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

        {/* Revisions Panel (overlay) */}
        {showRevisions && (
          <div className="absolute right-0 top-12 w-64 bg-card border-l border-border shadow-xl z-50 h-[calc(100vh-3.5rem-3rem)] overflow-y-auto">
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
                      <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2" onClick={() => handleRestoreRevision(r.id)}>
                        Restaurer
                      </Button>
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
                {[
                  { mode: "desktop" as const, icon: Monitor, label: "Desktop" },
                  { mode: "tablet" as const, icon: Tablet, label: "Tablet" },
                  { mode: "mobile" as const, icon: Smartphone, label: "Mobile" },
                ].map(({ mode, icon: Icon }) => (
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
              className={`bg-white shadow-xl rounded-lg overflow-hidden transition-all ${previewWidth}`}
              style={{ backgroundColor: theme.bgColor, fontFamily: `"${theme.fontBody}", sans-serif` }}
            >
              {sections.filter(s => s.visible).map(s => (
                <LandingSectionRenderer key={s.id} section={s} theme={theme} onCtaClick={() => {}} />
              ))}
            </div>
          </div>
        </div>
      )}
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
          <Label className="text-[10px]">Titre</Label>
          <Input value={data.title} onChange={e => set("title", e.target.value)} className="h-7 text-xs mt-0.5" />
        </div>
      )}
      {data.subtitle !== undefined && (
        <div>
          <Label className="text-[10px]">Sous-titre</Label>
          <Input value={data.subtitle} onChange={e => set("subtitle", e.target.value)} className="h-7 text-xs mt-0.5" />
        </div>
      )}
      {data.ctaText !== undefined && (
        <div>
          <Label className="text-[10px]">Texte CTA</Label>
          <Input value={data.ctaText} onChange={e => set("ctaText", e.target.value)} className="h-7 text-xs mt-0.5" />
        </div>
      )}
      {data.text !== undefined && (
        <div>
          <Label className="text-[10px]">Texte</Label>
          <Textarea value={data.text} onChange={e => set("text", e.target.value)} className="text-xs mt-0.5" rows={3} />
        </div>
      )}
      {data.content !== undefined && (
        <div>
          <Label className="text-[10px]">Contenu</Label>
          <Textarea value={data.content} onChange={e => set("content", e.target.value)} className="text-xs mt-0.5" rows={4} />
        </div>
      )}
      {data.imageUrl !== undefined && (
        <ImageUploader value={data.imageUrl} onChange={(v) => set("imageUrl", v)} label="Image" />
      )}
      {data.url !== undefined && section.type === "image" && (
        <ImageUploader value={data.url} onChange={(v) => set("url", v)} label="Image" />
      )}
      {data.url !== undefined && section.type !== "image" && (
        <div>
          <Label className="text-[10px]">URL</Label>
          <Input value={data.url} onChange={e => set("url", e.target.value)} className="h-7 text-xs mt-0.5" placeholder="https://..." />
        </div>
      )}
      {data.beforeImage !== undefined && (
        <ImageUploader value={data.beforeImage} onChange={(v) => set("beforeImage", v)} label="Image Avant" />
      )}
      {data.afterImage !== undefined && (
        <ImageUploader value={data.afterImage} onChange={(v) => set("afterImage", v)} label="Image Après" />
      )}
      {data.poster !== undefined && (
        <ImageUploader value={data.poster} onChange={(v) => set("poster", v)} label="Poster vidéo" />
      )}
      {data.placeholder !== undefined && (
        <div>
          <Label className="text-[10px]">Placeholder</Label>
          <Input value={data.placeholder} onChange={e => set("placeholder", e.target.value)} className="h-7 text-xs mt-0.5" />
        </div>
      )}
      {data.buttonText !== undefined && (
        <div>
          <Label className="text-[10px]">Texte bouton</Label>
          <Input value={data.buttonText} onChange={e => set("buttonText", e.target.value)} className="h-7 text-xs mt-0.5" />
        </div>
      )}
      {data.phone !== undefined && (
        <div>
          <Label className="text-[10px]">Téléphone WhatsApp</Label>
          <Input value={data.phone} onChange={e => set("phone", e.target.value)} className="h-7 text-xs mt-0.5" placeholder="+237..." />
        </div>
      )}
      {data.message !== undefined && (
        <div>
          <Label className="text-[10px]">Message par défaut</Label>
          <Input value={data.message} onChange={e => set("message", e.target.value)} className="h-7 text-xs mt-0.5" />
        </div>
      )}
      {data.label !== undefined && (
        <div>
          <Label className="text-[10px]">Label</Label>
          <Input value={data.label} onChange={e => set("label", e.target.value)} className="h-7 text-xs mt-0.5" />
        </div>
      )}
      {data.endDate !== undefined && (
        <div>
          <Label className="text-[10px]">Date de fin</Label>
          <Input type="datetime-local" value={data.endDate?.slice(0, 16)} onChange={e => set("endDate", new Date(e.target.value).toISOString())} className="h-7 text-xs mt-0.5" />
        </div>
      )}
      {data.price !== undefined && typeof data.price === "string" && (
        <div>
          <Label className="text-[10px]">Prix affiché</Label>
          <Input value={data.price} onChange={e => set("price", e.target.value)} className="h-7 text-xs mt-0.5" />
        </div>
      )}
      {/* Headers for comparison table */}
      {data.headers && Array.isArray(data.headers) && (
        <div>
          <Label className="text-[10px] mb-1 block">En-têtes</Label>
          {data.headers.map((h: string, i: number) => (
            <Input key={i} value={h} onChange={e => { const headers = [...data.headers]; headers[i] = e.target.value; set("headers", headers); }} className="h-6 text-[11px] mb-1" />
          ))}
        </div>
      )}
      {/* Rows for comparison table */}
      {data.rows && Array.isArray(data.rows) && (
        <div>
          <Label className="text-[10px] mb-1 block">Lignes ({data.rows.length})</Label>
          {data.rows.map((row: string[], ri: number) => (
            <div key={ri} className="flex gap-1 mb-1">
              {row.map((cell: string, ci: number) => (
                <Input key={ci} value={cell} onChange={e => { const rows = data.rows.map((r: string[]) => [...r]); rows[ri][ci] = e.target.value; set("rows", rows); }} className="h-6 text-[10px]" />
              ))}
              <button onClick={() => { const rows = data.rows.filter((_: any, j: number) => j !== ri); set("rows", rows); }} className="text-[10px] text-destructive shrink-0">✕</button>
            </div>
          ))}
          <Button size="sm" variant="outline" className="w-full h-6 text-[10px]" onClick={() => set("rows", [...data.rows, data.headers.map(() => "")])}>
            <Plus className="w-3 h-3 mr-1" /> Ligne
          </Button>
        </div>
      )}
      {/* Items array editor */}
      {data.items && Array.isArray(data.items) && (
        <div>
          <Label className="text-[10px] mb-1 block">{section.type === "faq" ? "Questions" : "Éléments"} ({data.items.length})</Label>
          {data.items.map((item: any, i: number) => (
            <div key={i} className="p-2 border border-border rounded mb-1.5 space-y-1">
              {item.title !== undefined && <Input value={item.title} onChange={e => { const items = [...data.items]; items[i] = { ...items[i], title: e.target.value }; set("items", items); }} className="h-6 text-[10px]" placeholder="Titre" />}
              {item.name !== undefined && <Input value={item.name} onChange={e => { const items = [...data.items]; items[i] = { ...items[i], name: e.target.value }; set("items", items); }} className="h-6 text-[10px]" placeholder="Nom" />}
              {item.desc !== undefined && <Input value={item.desc} onChange={e => { const items = [...data.items]; items[i] = { ...items[i], desc: e.target.value }; set("items", items); }} className="h-6 text-[10px]" placeholder="Description" />}
              {item.content !== undefined && <Input value={item.content} onChange={e => { const items = [...data.items]; items[i] = { ...items[i], content: e.target.value }; set("items", items); }} className="h-6 text-[10px]" placeholder="Contenu" />}
              {item.label !== undefined && <Input value={item.label} onChange={e => { const items = [...data.items]; items[i] = { ...items[i], label: e.target.value }; set("items", items); }} className="h-6 text-[10px]" placeholder="Label" />}
              {item.value !== undefined && <Input value={item.value} onChange={e => { const items = [...data.items]; items[i] = { ...items[i], value: e.target.value }; set("items", items); }} className="h-6 text-[10px]" placeholder="Valeur" />}
              {item.text !== undefined && <Input value={item.text} onChange={e => { const items = [...data.items]; items[i] = { ...items[i], text: e.target.value }; set("items", items); }} className="h-6 text-[10px]" placeholder="Texte" />}
              {item.q !== undefined && <Input value={item.q} onChange={e => { const items = [...data.items]; items[i] = { ...items[i], q: e.target.value }; set("items", items); }} className="h-6 text-[10px]" placeholder="Question" />}
              {item.a !== undefined && <Input value={item.a} onChange={e => { const items = [...data.items]; items[i] = { ...items[i], a: e.target.value }; set("items", items); }} className="h-6 text-[10px]" placeholder="Réponse" />}
              {item.icon !== undefined && <Input value={item.icon} onChange={e => { const items = [...data.items]; items[i] = { ...items[i], icon: e.target.value }; set("items", items); }} className="h-6 text-[10px]" placeholder="Icône (emoji)" />}
              <button onClick={() => set("items", data.items.filter((_: any, j: number) => j !== i))} className="text-[9px] text-destructive">Supprimer</button>
            </div>
          ))}
          <Button size="sm" variant="outline" className="w-full h-6 text-[10px]" onClick={() => {
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
