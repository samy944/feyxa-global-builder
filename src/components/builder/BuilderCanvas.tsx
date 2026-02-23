import { useState, useCallback, useEffect, useRef } from "react";
import { LandingSection, SectionType, BLOCK_LIBRARY, getBlockDefinition } from "@/lib/landing-templates";
import { LandingSectionRenderer } from "@/components/landing/LandingSectionRenderer";
import { SectionOverlay, InsertPoint } from "./SectionOverlay";
import { Plus } from "lucide-react";
import { motion, useInView } from "framer-motion";
import {
  DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors, DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy,
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

// Build the animation variant from the style config
function getAnimationVariant(animation?: string) {
  if (!animation || animation === "none") return null;
  const map: Record<string, { initial: any; animate: any }> = {
    fadeIn: { initial: { opacity: 0 }, animate: { opacity: 1 } },
    fadeInUp: { initial: { opacity: 0, y: 40 }, animate: { opacity: 1, y: 0 } },
    fadeInDown: { initial: { opacity: 0, y: -40 }, animate: { opacity: 1, y: 0 } },
    fadeInLeft: { initial: { opacity: 0, x: -40 }, animate: { opacity: 1, x: 0 } },
    fadeInRight: { initial: { opacity: 0, x: 40 }, animate: { opacity: 1, x: 0 } },
    zoomIn: { initial: { opacity: 0, scale: 0.85 }, animate: { opacity: 1, scale: 1 } },
    zoomOut: { initial: { opacity: 0, scale: 1.15 }, animate: { opacity: 1, scale: 1 } },
    slideUp: { initial: { y: 60 }, animate: { y: 0 } },
    slideDown: { initial: { y: -60 }, animate: { y: 0 } },
    bounceIn: { initial: { opacity: 0, scale: 0.3 }, animate: { opacity: 1, scale: 1 } },
    flipIn: { initial: { opacity: 0, rotateX: 90 }, animate: { opacity: 1, rotateX: 0 } },
    rotateIn: { initial: { opacity: 0, rotate: -180 }, animate: { opacity: 1, rotate: 0 } },
  };
  return map[animation] || null;
}

// Get box shadow CSS from style config
function getShadowCSS(style: any): string | undefined {
  if (!style.shadow || style.shadow === "none") return undefined;
  const presets: Record<string, string> = {
    sm: "0 1px 2px 0 rgba(0,0,0,0.05)",
    md: "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)",
    lg: "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)",
    xl: "0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)",
    "2xl": "0 25px 50px -12px rgba(0,0,0,0.25)",
    inner: "inset 0 2px 4px 0 rgba(0,0,0,0.05)",
  };
  if (style.shadow === "custom") {
    return `${style.shadowX ?? 0}px ${style.shadowY ?? 4}px ${style.shadowBlur ?? 12}px ${style.shadowSpread ?? 0}px ${style.shadowColor || "rgba(0,0,0,0.15)"}`;
  }
  return presets[style.shadow];
}

// Get gradient CSS from style config
function getGradientCSS(gradient: any): string | undefined {
  if (!gradient) return undefined;
  const colors = gradient.via
    ? `${gradient.from}, ${gradient.via}, ${gradient.to}`
    : `${gradient.from}, ${gradient.to}`;
  if (gradient.type === "radial") return `radial-gradient(circle, ${colors})`;
  if (gradient.type === "conic") return `conic-gradient(from ${gradient.angle ?? 0}deg, ${colors})`;
  return `linear-gradient(${gradient.angle ?? 135}deg, ${colors})`;
}

// Get filter CSS
function getFilterCSS(style: any): string | undefined {
  const parts: string[] = [];
  if (style.blur) parts.push(`blur(${style.blur}px)`);
  if (style.filter === "grayscale") parts.push("grayscale(100%)");
  else if (style.filter === "sepia") parts.push("sepia(100%)");
  else if (style.filter === "saturate") parts.push("saturate(200%)");
  else if (style.filter === "brightness") parts.push("brightness(130%)");
  else if (style.filter === "contrast") parts.push("contrast(130%)");
  return parts.length ? parts.join(" ") : undefined;
}

// Get hover class from style config
function getHoverClass(hoverEffect?: string): string {
  if (!hoverEffect || hoverEffect === "none") return "";
  const map: Record<string, string> = {
    lift: "hover:-translate-y-1 hover:shadow-xl",
    glow: "hover:shadow-[0_0_30px_rgba(59,130,246,0.3)]",
    scale: "hover:scale-[1.02]",
    darken: "hover:brightness-90",
    brighten: "hover:brightness-110",
    "border-glow": "hover:ring-2 hover:ring-primary/40",
  };
  return map[hoverEffect] || "";
}

// Build complete wrapper style from section style config
function buildWrapperStyle(sectionStyle: any): React.CSSProperties {
  const css: React.CSSProperties = {};
  if (sectionStyle.backgroundColor) css.backgroundColor = sectionStyle.backgroundColor;
  if (sectionStyle.gradient) {
    const grad = getGradientCSS(sectionStyle.gradient);
    if (grad) {
      css.backgroundImage = grad;
    }
  } else if (sectionStyle.backgroundImage) {
    css.backgroundImage = `url(${sectionStyle.backgroundImage})`;
    css.backgroundSize = sectionStyle.backgroundSize || "cover";
    css.backgroundPosition = sectionStyle.backgroundPosition || "center";
    css.backgroundRepeat = sectionStyle.backgroundRepeat || "no-repeat";
    if (sectionStyle.backgroundFixed) css.backgroundAttachment = "fixed";
    if (sectionStyle.blendMode) css.backgroundBlendMode = sectionStyle.blendMode as any;
  }

  // Padding (granular first, fallback to combined)
  css.paddingTop = `${sectionStyle.paddingTop ?? sectionStyle.paddingY ?? 80}px`;
  css.paddingBottom = `${sectionStyle.paddingBottom ?? sectionStyle.paddingY ?? 80}px`;
  css.paddingLeft = `${sectionStyle.paddingLeft ?? sectionStyle.paddingX ?? 24}px`;
  css.paddingRight = `${sectionStyle.paddingRight ?? sectionStyle.paddingX ?? 24}px`;

  // Margin
  if (sectionStyle.marginTop) css.marginTop = `${sectionStyle.marginTop}px`;
  if (sectionStyle.marginBottom) css.marginBottom = `${sectionStyle.marginBottom}px`;

  // Dimensions
  if (sectionStyle.maxWidth) css.maxWidth = sectionStyle.maxWidth;
  if (sectionStyle.minHeight && sectionStyle.minHeight !== "auto") {
    css.minHeight = sectionStyle.minHeight;
    css.display = "flex";
    css.flexDirection = "column";
    css.justifyContent = sectionStyle.verticalAlign === "center" ? "center" : sectionStyle.verticalAlign === "end" ? "flex-end" : "flex-start";
  }

  // Typography
  if (sectionStyle.textColor) css.color = sectionStyle.textColor;
  if (sectionStyle.textAlign) css.textAlign = sectionStyle.textAlign;
  if (sectionStyle.fontFamily) css.fontFamily = `"${sectionStyle.fontFamily}", sans-serif`;
  if (sectionStyle.letterSpacing) css.letterSpacing = `${sectionStyle.letterSpacing}px`;

  // Borders
  if (sectionStyle.borderRadius) css.borderRadius = `${sectionStyle.borderRadius}px`;
  if (sectionStyle.borderStyle && sectionStyle.borderStyle !== "none") {
    css.borderStyle = sectionStyle.borderStyle;
    css.borderWidth = `${sectionStyle.borderWidth ?? 1}px`;
    css.borderColor = sectionStyle.borderColor || "currentColor";
  }

  // Shadow
  const shadow = getShadowCSS(sectionStyle);
  if (shadow) css.boxShadow = shadow;

  // Effects
  if (sectionStyle.opacity !== undefined && sectionStyle.opacity !== 100) css.opacity = sectionStyle.opacity / 100;
  const filter = getFilterCSS(sectionStyle);
  if (filter) css.filter = filter;
  if (sectionStyle.overflow) css.overflow = sectionStyle.overflow;

  // Position
  if (sectionStyle.position === "sticky") { css.position = "sticky"; css.top = 0; }
  if (sectionStyle.zIndex) css.zIndex = sectionStyle.zIndex;

  // Hover transition
  css.transition = `all ${sectionStyle.hoverTransition ?? 300}ms ease`;

  return css;
}

function AnimatedSection({ children, style: sectionStyle }: { children: React.ReactNode; style: any }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const variant = getAnimationVariant(sectionStyle?.animation);

  if (!variant) return <div ref={ref}>{children}</div>;

  const duration = (sectionStyle?.animationDuration ?? 600) / 1000;
  const delay = (sectionStyle?.animationDelay ?? 0) / 1000;
  const easing = sectionStyle?.animationEasing || "easeOut";

  const transition: any = { duration, delay };
  if (easing === "spring") {
    transition.type = "spring";
    transition.stiffness = 100;
    transition.damping = 15;
  } else {
    transition.ease = easing;
  }

  return (
    <motion.div
      ref={ref}
      initial={variant.initial}
      animate={isInView ? variant.animate : variant.initial}
      transition={transition}
    >
      {children}
    </motion.div>
  );
}

function SortableCanvasSection({
  section, theme, isSelected, isHovered, isFirst, isLast,
  onSelect, onRemove, onDuplicate, onToggleVisibility, onMoveUp, onMoveDown, onInsertBefore, onHover, onLeave,
}: {
  section: LandingSection; theme: any; isSelected: boolean; isHovered: boolean; isFirst: boolean; isLast: boolean;
  onSelect: () => void; onRemove: () => void; onDuplicate: () => void; onToggleVisibility: () => void;
  onMoveUp: () => void; onMoveDown: () => void; onInsertBefore: () => void; onHover: () => void; onLeave: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id });
  const dragStyle: React.CSSProperties = {
    transform: CSS.Transform.toString(transform), transition,
    opacity: isDragging ? 0.4 : 1, position: "relative" as const,
  };

  const sectionStyle = section.data?._style || {};
  const wrapperStyle = buildWrapperStyle(sectionStyle);
  const hoverClass = getHoverClass(sectionStyle.hoverEffect);

  // Overlay layer
  const overlayStyle: React.CSSProperties | null = sectionStyle.overlay ? {
    position: "absolute", inset: 0,
    backgroundColor: sectionStyle.overlay.color || "#000",
    opacity: (sectionStyle.overlay.opacity ?? 40) / 100,
    pointerEvents: "none",
    borderRadius: sectionStyle.borderRadius ? `${sectionStyle.borderRadius}px` : undefined,
  } : null;

  return (
    <div
      ref={setNodeRef}
      style={dragStyle}
      onClick={(e) => { e.stopPropagation(); onSelect(); }}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      className={`relative group ${sectionStyle.customClass || ""} ${hoverClass}`}
      id={sectionStyle.htmlId || undefined}
    >
      <div style={wrapperStyle} className="relative">
        {overlayStyle && <div style={overlayStyle} />}
        <AnimatedSection style={sectionStyle}>
          <LandingSectionRenderer section={section} theme={theme} onCtaClick={() => {}} />
        </AnimatedSection>
      </div>
      <SectionOverlay
        section={section} isSelected={isSelected} isHovered={isHovered} isFirst={isFirst} isLast={isLast}
        onSelect={onSelect} onRemove={onRemove} onDuplicate={onDuplicate} onToggleVisibility={onToggleVisibility}
        onMoveUp={onMoveUp} onMoveDown={onMoveDown} onInsertBefore={onInsertBefore}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}

// Quick insert menu
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
    <div className="absolute left-1/2 -translate-x-1/2 z-50 w-[360px] max-h-[320px] bg-card border border-border rounded-xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
      <div className="p-2 border-b border-border flex items-center gap-2">
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un bloc..." className="flex-1 h-7 px-2 text-xs bg-transparent border-0 outline-none text-foreground" autoFocus />
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
                  <button key={b.type} onClick={() => { onSelect(b.type); onClose(); }}
                    className="text-[10px] p-2 rounded-lg border border-border hover:border-primary/40 hover:bg-primary/5 text-left transition-all flex flex-col gap-0.5">
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
  sections, theme, previewMode, selectedSectionId, onSelectSection, onUpdateSections,
  onRemoveSection, onDuplicateSection, onToggleVisibility, onInsertSection, showInsertMenu, onShowInsertMenu,
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
    <div className="flex-1 bg-muted/30 overflow-y-auto flex justify-center p-4" onClick={() => { onSelectSection(null); onShowInsertMenu(null); }}>
      <div
        className={`bg-white shadow-xl rounded-lg overflow-visible transition-all duration-300 ${previewWidth} relative`}
        style={{ backgroundColor: theme.bgColor, fontFamily: `"${theme.fontBody}", sans-serif` }}
      >
        {visibleSections.length === 0 ? (
          <div className="py-32 text-center text-muted-foreground relative">
            <Plus className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg mb-2">Aucune section</p>
            <p className="text-sm mb-4">Ajoutez des blocs depuis le panneau de gauche ou cliquez ci-dessous</p>
            <button onClick={(e) => { e.stopPropagation(); onShowInsertMenu(0); }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
              <Plus className="w-4 h-4" /> Ajouter une section
            </button>
            {showInsertMenu === 0 && (
              <div className="mt-4">
                <QuickInsertMenu onSelect={(type) => onInsertSection(type, 0)} onClose={() => onShowInsertMenu(null)} />
              </div>
            )}
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={visibleSections.map(s => s.id)} strategy={verticalListSortingStrategy}>
              {visibleSections.map((section, idx) => (
                <div key={section.id} className="relative">
                  {idx === 0 && (
                    <div className="relative">
                      <InsertPoint onInsert={() => onShowInsertMenu(0)} />
                      {showInsertMenu === 0 && (
                        <QuickInsertMenu onSelect={(type) => onInsertSection(type, 0)} onClose={() => onShowInsertMenu(null)} />
                      )}
                    </div>
                  )}
                  <SortableCanvasSection
                    section={section} theme={theme}
                    isSelected={selectedSectionId === section.id}
                    isHovered={hoveredSectionId === section.id}
                    isFirst={idx === 0} isLast={idx === visibleSections.length - 1}
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
                  <div className="relative">
                    <InsertPoint onInsert={() => onShowInsertMenu(idx + 1)} />
                    {showInsertMenu === idx + 1 && (
                      <QuickInsertMenu onSelect={(type) => onInsertSection(type, idx + 1)} onClose={() => onShowInsertMenu(null)} />
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
