import { useState, useCallback } from "react";
import {
  GridPage, GridRow, GridColumn, GridWidget, WidgetType,
  createRow, createWidget, WIDGET_CATALOGUE,
} from "@/components/builder/GridBuilderTypes";
import { GridWidgetRenderer } from "@/components/builder/GridWidgetRenderer";
import { GridWidgetEditor } from "@/components/builder/GridWidgetEditor";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Trash2, Copy, GripVertical, ChevronDown } from "lucide-react";

const LAYOUT_PRESETS = [
  { id: "full", label: "1 col", cols: [12] },
  { id: "1/2-1/2", label: "2 col", cols: [6, 6] },
  { id: "1/3-2/3", label: "1/3+2/3", cols: [4, 8] },
  { id: "2/3-1/3", label: "2/3+1/3", cols: [8, 4] },
  { id: "1/3-1/3-1/3", label: "3 col", cols: [4, 4, 4] },
  { id: "1/4-1/4-1/4-1/4", label: "4 col", cols: [3, 3, 3, 3] },
];

const WIDGET_CATEGORIES = [
  { key: "basic", label: "Base" },
  { key: "media", label: "Médias" },
  { key: "commerce", label: "Commerce" },
  { key: "layout", label: "Mise en page" },
];

interface Props {
  page: GridPage;
  onChange: (page: GridPage) => void;
}

export function StorefrontGridEditor({ page, onChange }: Props) {
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null);
  const [dragWidget, setDragWidget] = useState<WidgetType | null>(null);

  const pushChange = useCallback((newPage: GridPage) => {
    onChange(newPage);
  }, [onChange]);

  // Row ops
  const addRow = (layoutPreset: string, afterIndex?: number) => {
    const newRow = createRow(layoutPreset);
    const rows = [...page.rows];
    const idx = afterIndex !== undefined ? afterIndex + 1 : rows.length;
    rows.splice(idx, 0, newRow);
    pushChange({ ...page, rows });
  };

  const removeRow = (rowId: string) => {
    pushChange({ ...page, rows: page.rows.filter(r => r.id !== rowId) });
  };

  const duplicateRow = (rowId: string) => {
    const idx = page.rows.findIndex(r => r.id === rowId);
    if (idx === -1) return;
    const original = page.rows[idx];
    const uid = () => Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
    const clone: GridRow = {
      ...original, id: uid(),
      columns: original.columns.map(c => ({
        ...c, id: uid(),
        widgets: c.widgets.map(w => ({ ...w, id: uid() })),
      })),
    };
    const rows = [...page.rows];
    rows.splice(idx + 1, 0, clone);
    pushChange({ ...page, rows });
  };

  const moveRow = (rowId: string, dir: -1 | 1) => {
    const idx = page.rows.findIndex(r => r.id === rowId);
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= page.rows.length) return;
    const rows = [...page.rows];
    [rows[idx], rows[newIdx]] = [rows[newIdx], rows[idx]];
    pushChange({ ...page, rows });
  };

  // Widget ops
  const addWidgetToColumn = (rowId: string, colId: string, widgetType: WidgetType) => {
    const rows = page.rows.map(r => {
      if (r.id !== rowId) return r;
      return { ...r, columns: r.columns.map(c => {
        if (c.id !== colId) return c;
        return { ...c, widgets: [...c.widgets, createWidget(widgetType)] };
      }) };
    });
    pushChange({ ...page, rows });
  };

  const removeWidget = (rowId: string, colId: string, widgetId: string) => {
    const rows = page.rows.map(r => {
      if (r.id !== rowId) return r;
      return { ...r, columns: r.columns.map(c => {
        if (c.id !== colId) return c;
        return { ...c, widgets: c.widgets.filter(w => w.id !== widgetId) };
      }) };
    });
    if (selectedWidgetId === widgetId) setSelectedWidgetId(null);
    pushChange({ ...page, rows });
  };

  const updateWidgetData = (widgetId: string, data: Record<string, any>) => {
    const rows = page.rows.map(r => ({
      ...r, columns: r.columns.map(c => ({
        ...c, widgets: c.widgets.map(w => w.id === widgetId ? { ...w, data } : w),
      })),
    }));
    onChange({ ...page, rows }); // no history push for live edits
  };

  const findWidget = (id: string): GridWidget | null => {
    for (const r of page.rows)
      for (const c of r.columns)
        for (const w of c.widgets)
          if (w.id === id) return w;
    return null;
  };

  const selectedWidget = selectedWidgetId ? findWidget(selectedWidgetId) : null;

  const handleDrop = (e: React.DragEvent, rowId: string, colId: string) => {
    e.preventDefault();
    const widgetType = e.dataTransfer.getData("widget-type") as WidgetType;
    if (widgetType) addWidgetToColumn(rowId, colId, widgetType);
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left: Widget catalogue */}
      <div className="w-full overflow-y-auto space-y-3">
        {/* Widget catalogue */}
        <div>
          <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Widgets — glisser vers le canvas</p>
          {WIDGET_CATEGORIES.map(cat => {
            const widgets = WIDGET_CATALOGUE.filter(w => w.category === cat.key);
            return (
              <div key={cat.key} className="mb-2">
                <p className="text-[9px] font-semibold text-muted-foreground uppercase mb-1">{cat.label}</p>
                <div className="grid grid-cols-3 gap-1">
                  {widgets.map(w => (
                    <div
                      key={w.type}
                      draggable
                      onDragStart={(e) => { e.dataTransfer.setData("widget-type", w.type); setDragWidget(w.type); }}
                      onDragEnd={() => setDragWidget(null)}
                      className="flex flex-col items-center gap-0.5 p-1.5 rounded-md border border-border hover:border-primary/40 hover:bg-primary/5 cursor-grab active:cursor-grabbing transition-all text-center"
                    >
                      <span className="text-sm">{w.icon}</span>
                      <span className="text-[8px] font-medium text-foreground leading-tight">{w.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Row presets */}
        <div>
          <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Ajouter une rangée</p>
          <div className="grid grid-cols-3 gap-1">
            {LAYOUT_PRESETS.map(lp => (
              <button
                key={lp.id}
                onClick={() => addRow(lp.id)}
                className="flex flex-col items-center gap-0.5 p-1.5 rounded-md border border-border hover:border-primary/40 hover:bg-primary/5 transition-all"
              >
                <div className="flex gap-0.5 w-full">
                  {lp.cols.map((c, i) => (
                    <div key={i} className="h-3 bg-primary/20 rounded-sm" style={{ flex: c }} />
                  ))}
                </div>
                <span className="text-[8px] text-muted-foreground">{lp.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Widget editor */}
        {selectedWidget && (
          <div className="border-t border-border pt-2">
            <GridWidgetEditor
              widget={selectedWidget}
              onChange={(data) => updateWidgetData(selectedWidget.id, data)}
              onClose={() => setSelectedWidgetId(null)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

/** Canvas to be rendered in the preview area */
export function StorefrontGridCanvas({ page, selectedWidgetId, onSelectWidget, onAddWidget, onRemoveWidget, onRemoveRow, onDuplicateRow, onMoveRow, dragWidget }: {
  page: GridPage;
  selectedWidgetId: string | null;
  onSelectWidget: (id: string | null) => void;
  onAddWidget: (rowId: string, colId: string, type: WidgetType) => void;
  onRemoveWidget: (rowId: string, colId: string, widgetId: string) => void;
  onRemoveRow: (rowId: string) => void;
  onDuplicateRow: (rowId: string) => void;
  onMoveRow: (rowId: string, dir: -1 | 1) => void;
  dragWidget: WidgetType | null;
}) {
  return (
    <div className="space-y-2">
      {page.rows.map((row, rowIdx) => (
        <div key={row.id} className="group/row relative">
          {/* Row actions */}
          <div className="absolute -right-8 top-1 flex flex-col gap-0.5 opacity-0 group-hover/row:opacity-100 transition-opacity z-10">
            <button onClick={() => onMoveRow(row.id, -1)} disabled={rowIdx === 0} className="h-5 w-5 rounded bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 text-[9px]">↑</button>
            <button onClick={() => onDuplicateRow(row.id)} className="h-5 w-5 rounded bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-primary text-[9px]"><Copy size={10} /></button>
            <button onClick={() => onMoveRow(row.id, 1)} disabled={rowIdx === page.rows.length - 1} className="h-5 w-5 rounded bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 text-[9px]">↓</button>
            <button onClick={() => onRemoveRow(row.id)} className="h-5 w-5 rounded bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-destructive text-[9px]"><Trash2 size={10} /></button>
          </div>

          <div
            className="grid gap-2 min-h-[50px] rounded-lg border border-dashed border-border/50 group-hover/row:border-border transition-colors p-1"
            style={{ gridTemplateColumns: row.columns.map(c => `${c.width}fr`).join(" ") }}
          >
            {row.columns.map(col => (
              <div
                key={col.id}
                className={`relative rounded min-h-[40px] transition-all ${
                  dragWidget ? "border-2 border-dashed border-primary/40 bg-primary/5" : "border border-dashed border-border/30"
                } ${col.widgets.length === 0 ? "flex items-center justify-center" : "p-1.5 space-y-1.5"}`}
                onDragOver={e => e.preventDefault()}
                onDrop={e => {
                  e.preventDefault();
                  const wt = e.dataTransfer.getData("widget-type") as WidgetType;
                  if (wt) onAddWidget(row.id, col.id, wt);
                }}
              >
                {col.widgets.length === 0 ? (
                  <p className="text-[9px] text-muted-foreground/50">Glissez un widget</p>
                ) : (
                  col.widgets.map(widget => (
                    <div key={widget.id} className="relative group/widget">
                      <GridWidgetRenderer
                        widget={widget}
                        isSelected={selectedWidgetId === widget.id}
                        onClick={() => onSelectWidget(widget.id)}
                      />
                      <button
                        onClick={(e) => { e.stopPropagation(); onRemoveWidget(row.id, col.id, widget.id); }}
                        className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[8px] flex items-center justify-center opacity-0 group-hover/widget:opacity-100 transition-opacity shadow-sm z-10"
                      >✕</button>
                    </div>
                  ))
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
