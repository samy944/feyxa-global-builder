// Grid Builder type definitions

// ---- Widget catalogue ----
export type WidgetType =
  | "heading" | "text" | "image" | "button" | "spacer"
  | "video" | "icon" | "divider" | "html" | "product-card"
  | "form" | "countdown" | "testimonial" | "price" | "badge";

export interface WidgetDef {
  type: WidgetType;
  label: string;
  icon: string;
  category: "basic" | "media" | "commerce" | "layout";
  defaultData: Record<string, any>;
}

export const WIDGET_CATALOGUE: WidgetDef[] = [
  { type: "heading", label: "Titre", icon: "🔤", category: "basic", defaultData: { text: "Votre titre ici", level: "h2", align: "left" } },
  { type: "text", label: "Texte", icon: "📝", category: "basic", defaultData: { text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.", align: "left" } },
  { type: "image", label: "Image", icon: "🖼️", category: "media", defaultData: { src: "/placeholder.svg", alt: "Image", fit: "cover" } },
  { type: "button", label: "Bouton", icon: "🔘", category: "basic", defaultData: { text: "Cliquez ici", url: "#", variant: "primary", size: "md" } },
  { type: "spacer", label: "Espacement", icon: "↕️", category: "layout", defaultData: { height: 40 } },
  { type: "video", label: "Vidéo", icon: "🎬", category: "media", defaultData: { url: "", autoplay: false } },
  { type: "icon", label: "Icône", icon: "⭐", category: "basic", defaultData: { name: "star", size: 48, color: "" } },
  { type: "divider", label: "Séparateur", icon: "➖", category: "layout", defaultData: { style: "solid", color: "", thickness: 1 } },
  { type: "product-card", label: "Produit", icon: "🛍️", category: "commerce", defaultData: { productId: null } },
  { type: "countdown", label: "Compte à rebours", icon: "⏳", category: "commerce", defaultData: { targetDate: "", label: "Offre se termine dans" } },
  { type: "testimonial", label: "Témoignage", icon: "💬", category: "commerce", defaultData: { quote: "Excellent produit !", author: "Client satisfait", avatar: "" } },
  { type: "price", label: "Prix", icon: "💰", category: "commerce", defaultData: { amount: "9 900", currency: "FCFA", period: "", oldPrice: "" } },
  { type: "badge", label: "Badge", icon: "🏷️", category: "basic", defaultData: { text: "Nouveau", color: "primary" } },
];

// ---- Data model ----
export interface GridWidget {
  id: string;
  type: WidgetType;
  data: Record<string, any>;
  style?: Record<string, any>;
}

export interface GridColumn {
  id: string;
  width: number; // fraction of 12 (1-12)
  widgets: GridWidget[];
  style?: Record<string, any>;
}

export interface GridRow {
  id: string;
  columns: GridColumn[];
  style?: Record<string, any>;
  layout?: string; // predefined layout like "full", "1/2-1/2", "1/3-2/3", etc.
}

export interface GridPage {
  rows: GridRow[];
  globalStyle?: Record<string, any>;
}

// ---- Factories ----
export function createRow(layoutPreset = "full"): GridRow {
  const layouts: Record<string, number[]> = {
    "full": [12],
    "1/2-1/2": [6, 6],
    "1/3-2/3": [4, 8],
    "2/3-1/3": [8, 4],
    "1/3-1/3-1/3": [4, 4, 4],
    "1/4-1/4-1/4-1/4": [3, 3, 3, 3],
    "1/4-3/4": [3, 9],
    "3/4-1/4": [9, 3],
  };
  const widths = layouts[layoutPreset] || [12];
  return {
    id: nanoid(),
    columns: widths.map(w => ({ id: nanoid(), width: w, widgets: [] })),
    layout: layoutPreset,
  };
}

export function createWidget(type: WidgetType): GridWidget {
  const def = WIDGET_CATALOGUE.find(w => w.type === type);
  return {
    id: nanoid(),
    type,
    data: { ...(def?.defaultData || {}) },
  };
}

// nanoid polyfill
function nanoid(): string {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}
