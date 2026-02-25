/**
 * Predefined storefront themes — Shopify-style system
 * Each theme defines colors, typography, layout and style options
 */

export interface StorefrontTheme {
  id: string;
  name: string;
  description: string;
  preview: {
    bg: string;
    accent: string;
    card: string;
    text: string;
  };
  colors: {
    primary: string;        // HSL string e.g. "106 75% 47%"
    primaryForeground: string;
    background: string;
    foreground: string;
    card: string;
    cardForeground: string;
    border: string;
    muted: string;
    mutedForeground: string;
    accent: string;
    accentForeground: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
  layout: "grid" | "list" | "masonry";
  style: {
    borderRadius: string;   // Tailwind class
    cardShadow: string;     // CSS shadow
    headerStyle: "solid" | "transparent" | "gradient";
    productImageRatio: "square" | "portrait" | "landscape";
    showBadges: boolean;
    animateCards: boolean;
  };
}

export const STOREFRONT_THEMES: StorefrontTheme[] = [
  {
    id: "classic",
    name: "Classique",
    description: "Design épuré et professionnel, parfait pour toutes les boutiques",
    preview: { bg: "#ffffff", accent: "#3b82f6", card: "#f8fafc", text: "#0f172a" },
    colors: {
      primary: "217 91% 60%",
      primaryForeground: "0 0% 100%",
      background: "210 40% 98%",
      foreground: "222 84% 5%",
      card: "0 0% 100%",
      cardForeground: "222 84% 5%",
      border: "214 32% 91%",
      muted: "210 40% 96%",
      mutedForeground: "215 16% 47%",
      accent: "217 91% 60%",
      accentForeground: "0 0% 100%",
    },
    fonts: { heading: "Inter", body: "Inter" },
    layout: "grid",
    style: {
      borderRadius: "rounded-xl",
      cardShadow: "0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)",
      headerStyle: "solid",
      productImageRatio: "square",
      showBadges: true,
      animateCards: true,
    },
  },
  {
    id: "luxe",
    name: "Luxe Noir",
    description: "Élégant et premium avec des accents dorés, idéal pour le haut de gamme",
    preview: { bg: "#0a0a0a", accent: "#d4a853", card: "#141414", text: "#f5f5f5" },
    colors: {
      primary: "40 60% 58%",
      primaryForeground: "0 0% 5%",
      background: "0 0% 4%",
      foreground: "0 0% 96%",
      card: "0 0% 8%",
      cardForeground: "0 0% 96%",
      border: "0 0% 14%",
      muted: "0 0% 12%",
      mutedForeground: "0 0% 55%",
      accent: "40 60% 58%",
      accentForeground: "0 0% 5%",
    },
    fonts: { heading: "Playfair Display", body: "Lato" },
    layout: "grid",
    style: {
      borderRadius: "rounded-none",
      cardShadow: "0 2px 8px rgba(0,0,0,0.3)",
      headerStyle: "transparent",
      productImageRatio: "portrait",
      showBadges: true,
      animateCards: true,
    },
  },
  {
    id: "fresh",
    name: "Fresh & Vert",
    description: "Look naturel et frais, parfait pour bio, beauté et alimentation",
    preview: { bg: "#f0fdf4", accent: "#16a34a", card: "#ffffff", text: "#14532d" },
    colors: {
      primary: "142 72% 29%",
      primaryForeground: "0 0% 100%",
      background: "138 76% 97%",
      foreground: "143 64% 24%",
      card: "0 0% 100%",
      cardForeground: "143 64% 24%",
      border: "142 30% 88%",
      muted: "138 40% 93%",
      mutedForeground: "143 20% 45%",
      accent: "142 72% 29%",
      accentForeground: "0 0% 100%",
    },
    fonts: { heading: "DM Sans", body: "DM Sans" },
    layout: "grid",
    style: {
      borderRadius: "rounded-2xl",
      cardShadow: "0 2px 8px rgba(22,163,74,0.06)",
      headerStyle: "solid",
      productImageRatio: "square",
      showBadges: true,
      animateCards: true,
    },
  },
  {
    id: "sunset",
    name: "Coucher de Soleil",
    description: "Tons chauds et accueillants, pour la mode et le lifestyle",
    preview: { bg: "#fffbf5", accent: "#ea580c", card: "#ffffff", text: "#431407" },
    colors: {
      primary: "21 90% 48%",
      primaryForeground: "0 0% 100%",
      background: "33 100% 98%",
      foreground: "17 96% 15%",
      card: "0 0% 100%",
      cardForeground: "17 96% 15%",
      border: "30 30% 90%",
      muted: "33 40% 94%",
      mutedForeground: "17 20% 45%",
      accent: "21 90% 48%",
      accentForeground: "0 0% 100%",
    },
    fonts: { heading: "Poppins", body: "Poppins" },
    layout: "grid",
    style: {
      borderRadius: "rounded-xl",
      cardShadow: "0 1px 4px rgba(234,88,12,0.06)",
      headerStyle: "gradient",
      productImageRatio: "square",
      showBadges: true,
      animateCards: true,
    },
  },
  {
    id: "minimal",
    name: "Minimaliste",
    description: "Ultra-épuré, mise en valeur des produits sans distraction",
    preview: { bg: "#fafafa", accent: "#171717", card: "#ffffff", text: "#171717" },
    colors: {
      primary: "0 0% 9%",
      primaryForeground: "0 0% 100%",
      background: "0 0% 98%",
      foreground: "0 0% 9%",
      card: "0 0% 100%",
      cardForeground: "0 0% 9%",
      border: "0 0% 90%",
      muted: "0 0% 95%",
      mutedForeground: "0 0% 45%",
      accent: "0 0% 9%",
      accentForeground: "0 0% 100%",
    },
    fonts: { heading: "Space Grotesk", body: "Inter" },
    layout: "grid",
    style: {
      borderRadius: "rounded-sm",
      cardShadow: "none",
      headerStyle: "solid",
      productImageRatio: "portrait",
      showBadges: false,
      animateCards: false,
    },
  },
  {
    id: "afro",
    name: "Afro Bold",
    description: "Couleurs vibrantes et motifs audacieux, esprit Afrique contemporaine",
    preview: { bg: "#1a0a2e", accent: "#f59e0b", card: "#241445", text: "#fef3c7" },
    colors: {
      primary: "38 92% 50%",
      primaryForeground: "0 0% 5%",
      background: "264 55% 11%",
      foreground: "48 96% 89%",
      card: "264 55% 16%",
      cardForeground: "48 96% 89%",
      border: "264 30% 22%",
      muted: "264 30% 18%",
      mutedForeground: "264 15% 55%",
      accent: "38 92% 50%",
      accentForeground: "0 0% 5%",
    },
    fonts: { heading: "Clash Display", body: "Manrope" },
    layout: "grid",
    style: {
      borderRadius: "rounded-xl",
      cardShadow: "0 4px 16px rgba(245,158,11,0.08)",
      headerStyle: "gradient",
      productImageRatio: "square",
      showBadges: true,
      animateCards: true,
    },
  },
  {
    id: "ocean",
    name: "Océan",
    description: "Teintes bleues apaisantes, parfait pour tech et services",
    preview: { bg: "#f0f9ff", accent: "#0284c7", card: "#ffffff", text: "#0c4a6e" },
    colors: {
      primary: "199 89% 48%",
      primaryForeground: "0 0% 100%",
      background: "204 100% 97%",
      foreground: "201 85% 24%",
      card: "0 0% 100%",
      cardForeground: "201 85% 24%",
      border: "200 30% 88%",
      muted: "204 40% 94%",
      mutedForeground: "200 15% 46%",
      accent: "199 89% 48%",
      accentForeground: "0 0% 100%",
    },
    fonts: { heading: "Plus Jakarta Sans", body: "Plus Jakarta Sans" },
    layout: "grid",
    style: {
      borderRadius: "rounded-2xl",
      cardShadow: "0 1px 3px rgba(2,132,199,0.05), 0 6px 20px rgba(2,132,199,0.04)",
      headerStyle: "solid",
      productImageRatio: "square",
      showBadges: true,
      animateCards: true,
    },
  },
  {
    id: "rose",
    name: "Rose Poudré",
    description: "Doux et féminin, idéal pour beauté, bijoux et mode féminine",
    preview: { bg: "#fff1f2", accent: "#e11d48", card: "#ffffff", text: "#4c0519" },
    colors: {
      primary: "347 77% 50%",
      primaryForeground: "0 0% 100%",
      background: "356 100% 97%",
      foreground: "343 88% 16%",
      card: "0 0% 100%",
      cardForeground: "343 88% 16%",
      border: "350 30% 90%",
      muted: "356 40% 95%",
      mutedForeground: "343 15% 50%",
      accent: "347 77% 50%",
      accentForeground: "0 0% 100%",
    },
    fonts: { heading: "Cormorant Garamond", body: "Lato" },
    layout: "grid",
    style: {
      borderRadius: "rounded-xl",
      cardShadow: "0 1px 4px rgba(225,29,72,0.05)",
      headerStyle: "solid",
      productImageRatio: "portrait",
      showBadges: true,
      animateCards: true,
    },
  },
  {
    id: "tech",
    name: "Tech Store",
    description: "Style fintech/électronique avec un look high-tech moderne et dynamique",
    preview: { bg: "#0c0c1d", accent: "#6366f1", card: "#13132d", text: "#e0e7ff" },
    colors: {
      primary: "239 84% 67%",
      primaryForeground: "0 0% 100%",
      background: "240 38% 8%",
      foreground: "226 100% 94%",
      card: "240 38% 12%",
      cardForeground: "226 100% 94%",
      border: "240 20% 18%",
      muted: "240 20% 14%",
      mutedForeground: "240 10% 55%",
      accent: "239 84% 67%",
      accentForeground: "0 0% 100%",
    },
    fonts: { heading: "Space Grotesk", body: "Inter" },
    layout: "grid",
    style: {
      borderRadius: "rounded-lg",
      cardShadow: "0 2px 12px rgba(99,102,241,0.08)",
      headerStyle: "transparent",
      productImageRatio: "square",
      showBadges: true,
      animateCards: true,
    },
  },
  {
    id: "fashion",
    name: "Fashion",
    description: "Visuel fort et image dominante, idéal pour la mode et les créateurs",
    preview: { bg: "#faf7f5", accent: "#b45309", card: "#ffffff", text: "#292524" },
    colors: {
      primary: "28 80% 37%",
      primaryForeground: "0 0% 100%",
      background: "30 33% 97%",
      foreground: "24 10% 15%",
      card: "0 0% 100%",
      cardForeground: "24 10% 15%",
      border: "30 15% 90%",
      muted: "30 20% 94%",
      mutedForeground: "24 8% 50%",
      accent: "28 80% 37%",
      accentForeground: "0 0% 100%",
    },
    fonts: { heading: "Cormorant Garamond", body: "Montserrat" },
    layout: "masonry",
    style: {
      borderRadius: "rounded-none",
      cardShadow: "none",
      headerStyle: "transparent",
      productImageRatio: "portrait",
      showBadges: false,
      animateCards: true,
    },
  },
  {
    id: "marketplace",
    name: "Marketplace Pro",
    description: "Style Amazon/marketplace professionnel avec focus sur la densité produit",
    preview: { bg: "#f9fafb", accent: "#f59e0b", card: "#ffffff", text: "#111827" },
    colors: {
      primary: "38 92% 50%",
      primaryForeground: "0 0% 5%",
      background: "210 20% 98%",
      foreground: "221 39% 11%",
      card: "0 0% 100%",
      cardForeground: "221 39% 11%",
      border: "220 13% 91%",
      muted: "220 14% 96%",
      mutedForeground: "220 9% 46%",
      accent: "38 92% 50%",
      accentForeground: "0 0% 5%",
    },
    fonts: { heading: "Inter", body: "Inter" },
    layout: "grid",
    style: {
      borderRadius: "rounded-md",
      cardShadow: "0 1px 2px rgba(0,0,0,0.06)",
      headerStyle: "solid",
      productImageRatio: "square",
      showBadges: true,
      animateCards: false,
    },
  },
];

export function getThemeById(id: string): StorefrontTheme {
  return STOREFRONT_THEMES.find((t) => t.id === id) || STOREFRONT_THEMES[0];
}

export function getThemeCSSVars(theme: StorefrontTheme): Record<string, string> {
  return {
    "--sf-primary": theme.colors.primary,
    "--sf-primary-foreground": theme.colors.primaryForeground,
    "--sf-background": theme.colors.background,
    "--sf-foreground": theme.colors.foreground,
    "--sf-card": theme.colors.card,
    "--sf-card-foreground": theme.colors.cardForeground,
    "--sf-border": theme.colors.border,
    "--sf-muted": theme.colors.muted,
    "--sf-muted-foreground": theme.colors.mutedForeground,
    "--sf-accent": theme.colors.accent,
    "--sf-accent-foreground": theme.colors.accentForeground,
    "--sf-card-shadow": theme.style.cardShadow,
  };
}
