import { useState, useCallback } from "react";
import { LandingSection, SectionType, BLOCK_LIBRARY, getBlockDefinition } from "@/lib/landing-templates";
import { LandingSectionRenderer } from "@/components/landing/LandingSectionRenderer";
import { SectionOverlay, InsertPoint } from "./SectionOverlay";
import { Plus } from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
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

interface BuilderCanvasProps {
  sections: LandingSection[];
  theme: any;
  previewMode: "desktop" | "tablet" | "mobile";
  selectedSectionId: string | null;
  onSelectSection: (id: string | null) => void;
  onUpdateSections: (sections: LandingSection[]) => void;
  onRemoveSection: (id: string) => void;
  onDuplicateSection: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onInsertSection: (type: SectionType, atIndex: number) => void;
  showInsertMenu: number | null;
  onShowInsertMenu: (index: number | null) => void;
}

function SortableCanvasSection({
  section,
  theme,
  isSelected,
  isHovered,
  isFirst,
  isLast,
  onSelect,
  onRemove,
  onDuplicate,
  onToggleVisibility,
  onMoveUp,
  onMoveDown,
  onInsertBefore,
  onHover,
  onLeave,
}: {
  section: LandingSection;
  theme: any;
  isSelected: boolean;
  isHovered: boolean;
  isFirst: boolean;
  isLast: boolean;
  onSelect: () => void;
  onRemove: () => void;
  onDuplicate: () => void;
  onToggleVisibility: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onInsertBefore: () => void;
  onHover: () => void;
  onLeave: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    position: "relative" as const,
  };

  // Apply section custom styles
  const sectionStyle = section.data?._style || {};
  const wrapperStyle: React.CSSProperties = {};
  if (sectionStyle.backgroundColor) wrapperStyle.backgroundColor = sectionStyle.backgroundColor;
  if (sectionStyle.backgroundImage) {
    wrapperStyle.backgroundImage = `url(${sectionStyle.backgroundImage})`;
    wrapperStyle.backgroundSize = "cover";
    wrapperStyle.backgroundPosition = "center";
  }
  if (sectionStyle.paddingY !== undefined) {
    wrapperStyle.paddingTop = `${sectionStyle.paddingY}px`;
    wrapperStyle.paddingBottom = `${sectionStyle.paddingY}px`;
  }
  if (sectionStyle.paddingX !== undefined) {
    wrapperStyle.paddingLeft = `${sectionStyle.paddingX}px`;
    wrapperStyle.paddingRight = `${sectionStyle.paddingX}px`;
  }
  if (sectionStyle.borderRadius) wrapperStyle.borderRadius = `${sectionStyle.borderRadius}px`;
  if (sectionStyle.textColor) wrapperStyle.color = sectionStyle.textColor;

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={(e) => { e.stopPropagation(); onSelect(); }}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      className={`relative group ${sectionStyle.customClass || ""}`}
    >
      <div style={wrapperStyle}>
        <LandingSectionRenderer section={section} theme={theme} onCtaClick={() => {}} />
      </div>
      <SectionOverlay
        section={section}
        isSelected={isSelected}
        isHovered={isHovered}
        isFirst={isFirst}
        isLast={isLast}
        onSelect={onSelect}
        onRemove={onRemove}
        onDuplicate={onDuplicate}
        onToggleVisibility={onToggleVisibility}
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
        onInsertBefore={onInsertBefore}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}

// Quick insert menu (compact block picker)
function QuickInsertMenu({ onSelect, onClose }: { onSelect: (type: SectionType) => void; onClose: () => void }) {
  const [search, setSearch] = useState("");
  const filtered = search
    ? BLOCK_LIBRARY.filter(b => b.label.toLowerCase().includes(search.toLowerCase()))
    : BLOCK_LIBRARY;

  const categories = [
    { key: "essential", label: "Essentiels" },
    { key: "content", label: "Contenu" },
    { key: "conversion", label: "Conversion" },
    { key: "social", label: "Social" },
    { key: "ecommerce", label: "E-commerce" },
    { key: "advanced", label: "Avancé" },
  ];

  return (
    <div
      className="absolute left-1/2 -translate-x-1/2 z-50 w-[360px] max-h-[320px] bg-card border border-border rounded-xl shadow-2xl overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="p-2 border-b border-border flex items-center gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un bloc..."
          className="flex-1 h-7 px-2 text-xs bg-transparent border-0 outline-none text-foreground"
          autoFocus
        />
        <button onClick={onClose} className="text-xs text-muted-foreground hover:text-foreground p-1">✕</button>
      </div>
      <div className="overflow-y-auto max-h-[260px] p-2 space-y-2">
        {categories.map(cat => {
          const blocks = filtered.filter(b => b.category === cat.key);
          if (blocks.length === 0) return null;
          return (
            <div key={cat.key}>
              <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">{cat.label}</p>
              <div className="grid grid-cols-3 gap-1">
                {blocks.map(b => (
                  <button
                    key={b.type}
                    onClick={() => { onSelect(b.type); onClose(); }}
                    className="text-[10px] p-2 rounded-lg border border-border hover:border-primary/40 hover:bg-primary/5 text-left transition-all flex flex-col gap-0.5"
                  >
                    <span className="text-sm">{b.icon}</span>
                    <span className="font-medium text-foreground truncate">{b.label}</span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function BuilderCanvas({
  sections,
  theme,
  previewMode,
  selectedSectionId,
  onSelectSection,
  onUpdateSections,
  onRemoveSection,
  onDuplicateSection,
  onToggleVisibility,
  onInsertSection,
  showInsertMenu,
  onShowInsertMenu,
}: BuilderCanvasProps) {
  const [hoveredSectionId, setHoveredSectionId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = sections.findIndex(s => s.id === active.id);
      const newIndex = sections.findIndex(s => s.id === over.id);
      onUpdateSections(arrayMove(sections, oldIndex, newIndex));
    }
  };

  const moveSection = useCallback((sectionId: string, direction: -1 | 1) => {
    const idx = sections.findIndex(s => s.id === sectionId);
    if (idx === -1) return;
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= sections.length) return;
    onUpdateSections(arrayMove(sections, idx, newIdx));
  }, [sections, onUpdateSections]);

  const previewWidth = previewMode === "mobile" ? "w-[390px]" : previewMode === "tablet" ? "w-[768px]" : "w-full max-w-5xl";
  const visibleSections = sections.filter(s => s.visible);

  return (
    <div
      className="flex-1 bg-muted/30 overflow-y-auto flex justify-center p-4"
      onClick={() => { onSelectSection(null); onShowInsertMenu(null); }}
    >
      <div
        className={`bg-white shadow-xl rounded-lg overflow-visible transition-all duration-300 ${previewWidth} relative`}
        style={{ backgroundColor: theme.bgColor, fontFamily: `"${theme.fontBody}", sans-serif` }}
      >
        {visibleSections.length === 0 ? (
          <div className="py-32 text-center text-muted-foreground relative">
            <Plus className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg mb-2">Aucune section</p>
            <p className="text-sm mb-4">Ajoutez des blocs depuis le panneau de gauche ou cliquez ci-dessous</p>
            <button
              onClick={(e) => { e.stopPropagation(); onShowInsertMenu(0); }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" /> Ajouter une section
            </button>
            {showInsertMenu === 0 && (
              <div className="mt-4">
                <QuickInsertMenu
                  onSelect={(type) => onInsertSection(type, 0)}
                  onClose={() => onShowInsertMenu(null)}
                />
              </div>
            )}
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={visibleSections.map(s => s.id)} strategy={verticalListSortingStrategy}>
              {visibleSections.map((section, idx) => (
                <div key={section.id} className="relative">
                  {/* Insert point before */}
                  {idx === 0 && (
                    <div className="relative">
                      <InsertPoint onInsert={() => onShowInsertMenu(0)} />
                      {showInsertMenu === 0 && (
                        <QuickInsertMenu
                          onSelect={(type) => onInsertSection(type, 0)}
                          onClose={() => onShowInsertMenu(null)}
                        />
                      )}
                    </div>
                  )}

                  <SortableCanvasSection
                    section={section}
                    theme={theme}
                    isSelected={selectedSectionId === section.id}
                    isHovered={hoveredSectionId === section.id}
                    isFirst={idx === 0}
                    isLast={idx === visibleSections.length - 1}
                    onSelect={() => onSelectSection(section.id)}
                    onRemove={() => onRemoveSection(section.id)}
                    onDuplicate={() => onDuplicateSection(section.id)}
                    onToggleVisibility={() => onToggleVisibility(section.id)}
                    onMoveUp={() => moveSection(section.id, -1)}
                    onMoveDown={() => moveSection(section.id, 1)}
                    onInsertBefore={() => onShowInsertMenu(idx)}
                    onHover={() => setHoveredSectionId(section.id)}
                    onLeave={() => setHoveredSectionId(null)}
                  />

                  {/* Insert point after */}
                  <div className="relative">
                    <InsertPoint onInsert={() => onShowInsertMenu(idx + 1)} />
                    {showInsertMenu === idx + 1 && (
                      <QuickInsertMenu
                        onSelect={(type) => onInsertSection(type, idx + 1)}
                        onClose={() => onShowInsertMenu(null)}
                      />
                    )}
                  </div>
                </div>
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
}
