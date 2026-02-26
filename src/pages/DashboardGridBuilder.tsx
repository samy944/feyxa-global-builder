import { useState, useCallback } from "react";
import { 
  GridPage, GridRow, GridColumn, GridWidget, WidgetType,
  createRow, createWidget, WIDGET_CATALOGUE, WidgetDef 
} from "@/components/builder/GridBuilderTypes";
import { GridWidgetRenderer } from "@/components/builder/GridWidgetRenderer";
import { GridWidgetEditor } from "@/components/builder/GridWidgetEditor";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  Plus, Trash2, Copy, GripVertical, Eye, Save, Undo2, Redo2,
  Columns2, Columns3, Monitor, Tablet, Smartphone, ChevronDown,
  PanelLeftOpen, PanelRightOpen, Layout,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const LAYOUT_PRESETS = [
  { id: "full", label: "1 colonne", icon: "█", cols: [12] },
  { id: "1/2-1/2", label: "2 colonnes", icon: "▌▐", cols: [6, 6] },
  { id: "1/3-2/3", label: "1/3 + 2/3", icon: "▍▊", cols: [4, 8] },
  { id: "2/3-1/3", label: "2/3 + 1/3", icon: "▊▍", cols: [8, 4] },
  { id: "1/3-1/3-1/3", label: "3 colonnes", icon: "▎▎▎", cols: [4, 4, 4] },
  { id: "1/4-1/4-1/4-1/4", label: "4 colonnes", icon: "▏▏▏▏", cols: [3, 3, 3, 3] },
  { id: "1/4-3/4", label: "1/4 + 3/4", icon: "▏▉", cols: [3, 9] },
  { id: "3/4-1/4", label: "3/4 + 1/4", icon: "▉▏", cols: [9, 3] },
];

const WIDGET_CATEGORIES = [
  { key: "basic", label: "Base" },
  { key: "media", label: "Médias" },
  { key: "commerce", label: "Commerce" },
  { key: "layout", label: "Mise en page" },
];

export default function DashboardGridBuilder() {
  const [page, setPage] = useState<GridPage>({ rows: [createRow("full")] });
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null);
  const [preview, setPreview] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [leftPanel, setLeftPanel] = useState(true);
  const [rightPanel, setRightPanel] = useState(true);
  const [history, setHistory] = useState<GridPage[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [dragWidget, setDragWidget] = useState<WidgetType | null>(null);

  // Helper: push to history
  const pushHistory = useCallback((newPage: GridPage) => {
    setHistory(prev => [...prev.slice(0, historyIndex + 1), newPage]);
    setHistoryIndex(prev => prev + 1);
    setPage(newPage);
  }, [historyIndex]);

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1);
      setPage(history[historyIndex - 1]);
    }
  };
  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(prev => prev + 1);
      setPage(history[historyIndex + 1]);
    }
  };

  // ---- Row operations ----
  const addRow = (layoutPreset: string, afterIndex?: number) => {
    const newRow = createRow(layoutPreset);
    const rows = [...page.rows];
    const idx = afterIndex !== undefined ? afterIndex + 1 : rows.length;
    rows.splice(idx, 0, newRow);
    pushHistory({ ...page, rows });
  };

  const removeRow = (rowId: string) => {
    pushHistory({ ...page, rows: page.rows.filter(r => r.id !== rowId) });
  };

  const duplicateRow = (rowId: string) => {
    const idx = page.rows.findIndex(r => r.id === rowId);
    if (idx === -1) return;
    const original = page.rows[idx];
    const clone: GridRow = {
      ...original,
      id: Math.random().toString(36).substring(2, 10) + Date.now().toString(36),
      columns: original.columns.map(c => ({
        ...c,
        id: Math.random().toString(36).substring(2, 10) + Date.now().toString(36),
        widgets: c.widgets.map(w => ({
          ...w,
          id: Math.random().toString(36).substring(2, 10) + Date.now().toString(36),
        })),
      })),
    };
    const rows = [...page.rows];
    rows.splice(idx + 1, 0, clone);
    pushHistory({ ...page, rows });
  };

  const moveRow = (rowId: string, dir: -1 | 1) => {
    const idx = page.rows.findIndex(r => r.id === rowId);
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= page.rows.length) return;
    const rows = [...page.rows];
    [rows[idx], rows[newIdx]] = [rows[newIdx], rows[idx]];
    pushHistory({ ...page, rows });
  };

  // ---- Widget operations ----
  const addWidgetToColumn = (rowId: string, colId: string, widgetType: WidgetType) => {
    const rows = page.rows.map(r => {
      if (r.id !== rowId) return r;
      return {
        ...r,
        columns: r.columns.map(c => {
          if (c.id !== colId) return c;
          return { ...c, widgets: [...c.widgets, createWidget(widgetType)] };
        }),
      };
    });
    pushHistory({ ...page, rows });
  };

  const removeWidget = (rowId: string, colId: string, widgetId: string) => {
    const rows = page.rows.map(r => {
      if (r.id !== rowId) return r;
      return {
        ...r,
        columns: r.columns.map(c => {
          if (c.id !== colId) return c;
          return { ...c, widgets: c.widgets.filter(w => w.id !== widgetId) };
        }),
      };
    });
    if (selectedWidgetId === widgetId) setSelectedWidgetId(null);
    pushHistory({ ...page, rows });
  };

  const updateWidgetData = (widgetId: string, data: Record<string, any>) => {
    const rows = page.rows.map(r => ({
      ...r,
      columns: r.columns.map(c => ({
        ...c,
        widgets: c.widgets.map(w => w.id === widgetId ? { ...w, data } : w),
      })),
    }));
    setPage({ ...page, rows });
  };

  // Find selected widget
  const findWidget = (id: string): GridWidget | null => {
    for (const r of page.rows)
      for (const c of r.columns)
        for (const w of c.widgets)
          if (w.id === id) return w;
    return null;
  };

  const selectedWidget = selectedWidgetId ? findWidget(selectedWidgetId) : null;

  const previewWidth = preview === "mobile" ? "max-w-[390px]" : preview === "tablet" ? "max-w-[768px]" : "max-w-[1200px]";

  // Drag from catalogue
  const handleDrop = (e: React.DragEvent, rowId: string, colId: string) => {
    e.preventDefault();
    const widgetType = e.dataTransfer.getData("widget-type") as WidgetType;
    if (widgetType) addWidgetToColumn(rowId, colId, widgetType);
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-background">
      {/* Top bar */}
      <div className="h-12 border-b border-border bg-card flex items-center justify-between px-3 shrink-0">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setLeftPanel(!leftPanel)} className="h-8 w-8 p-0">
            <PanelLeftOpen size={16} className={leftPanel ? "text-primary" : "text-muted-foreground"} />
          </Button>
          <div className="h-5 w-px bg-border" />
          <Button variant="ghost" size="sm" onClick={undo} disabled={historyIndex <= 0} className="h-8 w-8 p-0">
            <Undo2 size={15} />
          </Button>
          <Button variant="ghost" size="sm" onClick={redo} disabled={historyIndex >= history.length - 1} className="h-8 w-8 p-0">
            <Redo2 size={15} />
          </Button>
        </div>

        <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
          {([["desktop", Monitor], ["tablet", Tablet], ["mobile", Smartphone]] as const).map(([mode, Icon]) => (
            <button key={mode} onClick={() => setPreview(mode)} className={`h-7 px-2.5 rounded-md flex items-center gap-1 text-xs transition-colors ${preview === mode ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              <Icon size={14} />
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setRightPanel(!rightPanel)} className="h-8 w-8 p-0">
            <PanelRightOpen size={16} className={rightPanel ? "text-primary" : "text-muted-foreground"} />
          </Button>
          <Button size="sm" onClick={() => toast.success("Page sauvegardée !")} className="h-8">
            <Save size={14} className="mr-1" /> Sauvegarder
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PANEL: Widget catalogue */}
        <AnimatePresence>
          {leftPanel && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 240, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-r border-border bg-card shrink-0 overflow-hidden"
            >
              <ScrollArea className="h-full">
                <div className="p-3 space-y-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Widgets</p>
                  {WIDGET_CATEGORIES.map(cat => {
                    const widgets = WIDGET_CATALOGUE.filter(w => w.category === cat.key);
                    return (
                      <div key={cat.key}>
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1.5">{cat.label}</p>
                        <div className="grid grid-cols-2 gap-1.5">
                          {widgets.map(w => (
                            <div
                              key={w.type}
                              draggable
                              onDragStart={(e) => {
                                e.dataTransfer.setData("widget-type", w.type);
                                setDragWidget(w.type);
                              }}
                              onDragEnd={() => setDragWidget(null)}
                              className="flex flex-col items-center gap-1 p-2 rounded-lg border border-border hover:border-primary/40 hover:bg-primary/5 cursor-grab active:cursor-grabbing transition-all text-center"
                            >
                              <span className="text-lg">{w.icon}</span>
                              <span className="text-[10px] font-medium text-foreground leading-tight">{w.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}

                  <div className="pt-2 border-t border-border">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Rangées</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {LAYOUT_PRESETS.map(lp => (
                        <button
                          key={lp.id}
                          onClick={() => addRow(lp.id)}
                          className="flex flex-col items-center gap-1 p-2 rounded-lg border border-border hover:border-primary/40 hover:bg-primary/5 transition-all"
                        >
                          <div className="flex gap-0.5 w-full">
                            {lp.cols.map((c, i) => (
                              <div key={i} className="h-4 bg-primary/20 rounded-sm" style={{ flex: c }} />
                            ))}
                          </div>
                          <span className="text-[9px] text-muted-foreground">{lp.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CENTER: Canvas */}
        <div className="flex-1 overflow-auto bg-muted/30 p-6 flex justify-center" onClick={() => setSelectedWidgetId(null)}>
          <div className={`${previewWidth} w-full transition-all duration-300`}>
            {page.rows.map((row, rowIdx) => (
              <div key={row.id} className="group/row relative mb-2">
                {/* Row toolbar */}
                <div className="absolute -left-10 top-1/2 -translate-y-1/2 flex flex-col gap-0.5 opacity-0 group-hover/row:opacity-100 transition-opacity z-10">
                  <button onClick={() => moveRow(row.id, -1)} disabled={rowIdx === 0} className="h-6 w-6 rounded bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 text-[10px]">↑</button>
                  <button className="h-6 w-6 rounded bg-card border border-border flex items-center justify-center text-muted-foreground cursor-grab text-[10px]">
                    <GripVertical size={12} />
                  </button>
                  <button onClick={() => moveRow(row.id, 1)} disabled={rowIdx === page.rows.length - 1} className="h-6 w-6 rounded bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 text-[10px]">↓</button>
                </div>

                {/* Row actions */}
                <div className="absolute -right-10 top-1 flex flex-col gap-0.5 opacity-0 group-hover/row:opacity-100 transition-opacity z-10">
                  <button onClick={() => duplicateRow(row.id)} className="h-6 w-6 rounded bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-primary">
                    <Copy size={11} />
                  </button>
                  <button onClick={() => removeRow(row.id)} className="h-6 w-6 rounded bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-destructive">
                    <Trash2 size={11} />
                  </button>
                </div>

                {/* Row content: columns */}
                <div
                  className="grid gap-3 min-h-[60px] rounded-lg border-2 border-dashed border-transparent group-hover/row:border-border/60 transition-colors p-1"
                  style={{ gridTemplateColumns: row.columns.map(c => `${c.width}fr`).join(" ") }}
                >
                  {row.columns.map(col => (
                    <div
                      key={col.id}
                      className={`relative rounded-lg min-h-[50px] transition-all ${
                        dragWidget ? "border-2 border-dashed border-primary/40 bg-primary/5" : "border border-dashed border-border/40"
                      } ${col.widgets.length === 0 ? "flex items-center justify-center" : "p-2 space-y-2"}`}
                      onDragOver={e => e.preventDefault()}
                      onDrop={e => handleDrop(e, row.id, col.id)}
                    >
                      {col.widgets.length === 0 ? (
                        <div className="text-center py-4">
                          <Plus size={16} className="mx-auto text-muted-foreground/40 mb-1" />
                          <p className="text-[10px] text-muted-foreground/60">Glissez un widget ici</p>
                        </div>
                      ) : (
                        col.widgets.map(widget => (
                          <div key={widget.id} className="relative group/widget">
                            <GridWidgetRenderer
                              widget={widget}
                              isSelected={selectedWidgetId === widget.id}
                              onClick={() => setSelectedWidgetId(widget.id)}
                            />
                            {/* Delete button on hover */}
                            <button
                              onClick={(e) => { e.stopPropagation(); removeWidget(row.id, col.id, widget.id); }}
                              className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center opacity-0 group-hover/widget:opacity-100 transition-opacity shadow-sm z-10"
                            >
                              ✕
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  ))}
                </div>

                {/* Insert row button */}
                <div className="absolute left-1/2 -translate-x-1/2 -bottom-3 opacity-0 group-hover/row:opacity-100 transition-opacity z-10">
                  <AddRowButton onSelect={(layout) => addRow(layout, rowIdx)} />
                </div>
              </div>
            ))}

            {/* Empty state / Add first row */}
            {page.rows.length === 0 && (
              <div className="py-20 text-center">
                <Layout size={40} className="mx-auto text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground mb-4">Commencez par ajouter une rangée</p>
                <AddRowButton onSelect={(layout) => addRow(layout)} />
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL: Widget editor */}
        <AnimatePresence>
          {rightPanel && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-l border-border bg-card shrink-0 overflow-hidden"
            >
              <ScrollArea className="h-full">
                {selectedWidget ? (
                  <GridWidgetEditor
                    widget={selectedWidget}
                    onChange={(data) => updateWidgetData(selectedWidget.id, data)}
                    onClose={() => setSelectedWidgetId(null)}
                  />
                ) : (
                  <div className="p-6 text-center text-muted-foreground">
                    <Layout size={32} className="mx-auto mb-3 opacity-30" />
                    <p className="text-sm font-medium">Aucun widget sélectionné</p>
                    <p className="text-xs mt-1">Cliquez sur un widget dans le canvas pour le modifier</p>
                  </div>
                )}
              </ScrollArea>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Small component: Add row dropdown
function AddRowButton({ onSelect }: { onSelect: (layout: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative inline-block">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-medium shadow-sm hover:bg-primary/90 transition-colors"
      >
        <Plus size={12} /> Rangée
        <ChevronDown size={10} />
      </button>
      {open && (
        <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 z-50 bg-card border border-border rounded-lg shadow-xl p-2 w-48" onClick={e => e.stopPropagation()}>
          {LAYOUT_PRESETS.map(lp => (
            <button
              key={lp.id}
              onClick={() => { onSelect(lp.id); setOpen(false); }}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted transition-colors text-left"
            >
              <div className="flex gap-0.5 w-10 shrink-0">
                {lp.cols.map((c, i) => (
                  <div key={i} className="h-3 bg-primary/25 rounded-sm" style={{ flex: c }} />
                ))}
              </div>
              <span className="text-xs text-foreground">{lp.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
