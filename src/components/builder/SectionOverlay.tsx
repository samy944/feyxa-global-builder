import { GripVertical, Copy, Trash2, Eye, EyeOff, ChevronUp, ChevronDown, Plus, Settings2 } from "lucide-react";
import { getBlockDefinition, LandingSection, SectionType } from "@/lib/landing-templates";

interface SectionOverlayProps {
  section: LandingSection;
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
  dragHandleProps?: any;
}

export function SectionOverlay({
  section,
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
  dragHandleProps,
}: SectionOverlayProps) {
  const block = getBlockDefinition(section.type);
  const showActions = isHovered || isSelected;

  return (
    <>
      {/* Top border indicator */}
      {showActions && (
        <div
          className="absolute top-0 left-0 right-0 h-[2px] z-20"
          style={{ backgroundColor: isSelected ? "hsl(var(--primary))" : "hsl(var(--primary) / 0.4)" }}
        />
      )}

      {/* Bottom border */}
      {showActions && (
        <div
          className="absolute bottom-0 left-0 right-0 h-[2px] z-20"
          style={{ backgroundColor: isSelected ? "hsl(var(--primary))" : "hsl(var(--primary) / 0.4)" }}
        />
      )}

      {/* Left + Right borders */}
      {showActions && (
        <>
          <div
            className="absolute top-0 bottom-0 left-0 w-[2px] z-20"
            style={{ backgroundColor: isSelected ? "hsl(var(--primary))" : "hsl(var(--primary) / 0.4)" }}
          />
          <div
            className="absolute top-0 bottom-0 right-0 w-[2px] z-20"
            style={{ backgroundColor: isSelected ? "hsl(var(--primary))" : "hsl(var(--primary) / 0.4)" }}
          />
        </>
      )}

      {/* Section label badge */}
      {showActions && (
        <div
          className="absolute top-2 left-2 z-30 flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-semibold text-white shadow-md"
          style={{ backgroundColor: "hsl(var(--primary))" }}
        >
          <span>{block?.icon}</span>
          <span>{block?.label || section.type}</span>
        </div>
      )}

      {/* Floating toolbar (top-right) */}
      {showActions && (
        <div className="absolute top-2 right-2 z-30 flex items-center gap-0.5 bg-card border border-border rounded-lg shadow-lg px-1 py-0.5">
          {dragHandleProps && (
            <button
              {...dragHandleProps}
              className="p-1.5 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing rounded hover:bg-muted transition-colors"
              title="Déplacer"
            >
              <GripVertical className="w-3.5 h-3.5" />
            </button>
          )}
          {!isFirst && (
            <button
              onClick={(e) => { e.stopPropagation(); onMoveUp(); }}
              className="p-1.5 text-muted-foreground hover:text-foreground rounded hover:bg-muted transition-colors"
              title="Monter"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
          )}
          {!isLast && (
            <button
              onClick={(e) => { e.stopPropagation(); onMoveDown(); }}
              className="p-1.5 text-muted-foreground hover:text-foreground rounded hover:bg-muted transition-colors"
              title="Descendre"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          )}
          <div className="w-px h-4 bg-border mx-0.5" />
          <button
            onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
            className="p-1.5 text-muted-foreground hover:text-foreground rounded hover:bg-muted transition-colors"
            title="Dupliquer"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onToggleVisibility(); }}
            className="p-1.5 text-muted-foreground hover:text-foreground rounded hover:bg-muted transition-colors"
            title="Visibilité"
          >
            {section.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onSelect(); }}
            className="p-1.5 text-muted-foreground hover:text-foreground rounded hover:bg-muted transition-colors"
            title="Paramètres"
          >
            <Settings2 className="w-3.5 h-3.5" />
          </button>
          <div className="w-px h-4 bg-border mx-0.5" />
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            className="p-1.5 text-destructive hover:bg-destructive/10 rounded transition-colors"
            title="Supprimer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </>
  );
}

// Insert point between sections
export function InsertPoint({ onInsert }: { onInsert: () => void }) {
  return (
    <div className="relative h-6 group z-10 -my-3">
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[2px] bg-primary/0 group-hover:bg-primary/30 transition-colors" />
      <button
        onClick={onInsert}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110 active:scale-95"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}
