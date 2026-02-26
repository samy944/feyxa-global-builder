/**
 * Storefront Template System
 * Each template defines a unique layout structure with different sections
 */

export type SFSectionType =
  | "header"
  | "hero"
  | "trust"
  | "categories"
  | "featured"
  | "on-sale"
  | "new-arrivals"
  | "all-products"
  | "testimonials"
  | "newsletter"
  | "footer";

export interface SFSectionDef {
  type: SFSectionType;
  label: string;
  required?: boolean; // can't be removed (header, footer)
  defaultVisible: boolean;
}

export interface StorefrontTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  defaultThemeId: string; // links to storefront-themes.ts color palette
  sections: SFSectionDef[];
  tags: string[];
}

export interface SFSectionConfig {
  type: SFSectionType;
  visible: boolean;
  settings?: Record<string, any>;
}

// ─── Template Definitions ───

const SHARED_SECTIONS: SFSectionDef[] = [
  { type: "header", label: "En-tête", required: true, defaultVisible: true },
  { type: "hero", label: "Bannière", defaultVisible: true },
  { type: "trust", label: "Confiance", defaultVisible: true },
  { type: "categories", label: "Catégories", defaultVisible: true },
  { type: "featured", label: "Produits vedettes", defaultVisible: true },
  { type: "on-sale", label: "Promotions", defaultVisible: true },
  { type: "new-arrivals", label: "Nouveautés", defaultVisible: true },
  { type: "testimonials", label: "Témoignages", defaultVisible: true },
  { type: "newsletter", label: "Newsletter", defaultVisible: true },
  { type: "footer", label: "Pied de page", required: true, defaultVisible: true },
];

export const STOREFRONT_TEMPLATES: StorefrontTemplate[] = [
  {
    id: "minimal",
    name: "Minimaliste",
    description: "Design épuré, espace blanc, typographie élégante, focus produit",
    icon: "◻️",
    defaultThemeId: "minimal",
    tags: ["Épuré", "Clean"],
    sections: [
      { type: "header", label: "En-tête minimal", required: true, defaultVisible: true },
      { type: "hero", label: "Hero centré", defaultVisible: true },
      { type: "featured", label: "Sélection", defaultVisible: true },
      { type: "categories", label: "Catégories", defaultVisible: true },
      { type: "new-arrivals", label: "Nouveautés", defaultVisible: true },
      { type: "newsletter", label: "Newsletter", defaultVisible: true },
      { type: "footer", label: "Footer minimal", required: true, defaultVisible: true },
    ],
  },
  {
    id: "tech",
    name: "Tech Moderne",
    description: "Style fintech, blocs structurés, icônes modernes, sections dynamiques",
    icon: "⚡",
    defaultThemeId: "tech",
    tags: ["Fintech", "Dark"],
    sections: SHARED_SECTIONS,
  },
  {
    id: "fashion",
    name: "Fashion Premium",
    description: "Images larges, look magazine, bannière dominante, animations fluides",
    icon: "👗",
    defaultThemeId: "fashion",
    tags: ["Visuel", "Magazine"],
    sections: [
      { type: "header", label: "En-tête transparent", required: true, defaultVisible: true },
      { type: "hero", label: "Hero plein écran", defaultVisible: true },
      { type: "featured", label: "Collection vedette", defaultVisible: true },
      { type: "categories", label: "Univers", defaultVisible: true },
      { type: "on-sale", label: "Offres", defaultVisible: true },
      { type: "testimonials", label: "Avis", defaultVisible: true },
      { type: "newsletter", label: "Inscription", defaultVisible: true },
      { type: "footer", label: "Footer éditorial", required: true, defaultVisible: true },
    ],
  },
  {
    id: "marketplace",
    name: "Marketplace Pro",
    description: "Layout dense, grille produits, multi-sections, inspiré Amazon",
    icon: "🏪",
    defaultThemeId: "marketplace",
    tags: ["Dense", "Pro"],
    sections: [
      { type: "header", label: "Header marketplace", required: true, defaultVisible: true },
      { type: "hero", label: "Bannière deals", defaultVisible: true },
      { type: "categories", label: "Catégories", defaultVisible: true },
      { type: "featured", label: "Meilleures ventes", defaultVisible: true },
      { type: "on-sale", label: "Flash deals", defaultVisible: true },
      { type: "new-arrivals", label: "Just in", defaultVisible: true },
      { type: "all-products", label: "Tous les produits", defaultVisible: true },
      { type: "trust", label: "Garanties", defaultVisible: true },
      { type: "footer", label: "Footer complet", required: true, defaultVisible: true },
    ],
  },
];

export function getTemplateById(id: string): StorefrontTemplate {
  return STOREFRONT_TEMPLATES.find((t) => t.id === id) || STOREFRONT_TEMPLATES[0];
}

export function getDefaultSectionsConfig(template: StorefrontTemplate): SFSectionConfig[] {
  return template.sections.map((s) => ({ type: s.type, visible: s.defaultVisible }));
}

/** Merge saved config with template defaults (handles new sections added to template) */
export function mergeSectionsConfig(
  saved: SFSectionConfig[] | null | undefined,
  template: StorefrontTemplate
): SFSectionConfig[] {
  if (!saved || saved.length === 0) return getDefaultSectionsConfig(template);
  const savedMap = new Map(saved.map((s) => [s.type, s]));
  const result: SFSectionConfig[] = [];
  // Keep saved order for existing sections
  for (const s of saved) {
    if (template.sections.some((ts) => ts.type === s.type)) {
      result.push(s);
    }
  }
  // Add new template sections not in saved
  for (const ts of template.sections) {
    if (!savedMap.has(ts.type)) {
      result.push({ type: ts.type, visible: ts.defaultVisible });
    }
  }
  return result;
}
