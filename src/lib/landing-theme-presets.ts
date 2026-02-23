/**
 * Landing Page Theme Presets — predefined + custom saved styles
 */

export interface LandingThemePreset {
  id: string;
  name: string;
  description: string;
  icon: string;
  theme: {
    primaryColor: string;
    bgColor: string;
    textColor: string;
    radius: string;
    fontHeading: string;
    fontBody: string;
  };
  isCustom?: boolean;
}

export const LANDING_THEME_PRESETS: LandingThemePreset[] = [
  {
    id: "default",
    name: "Feyxa Classic",
    description: "Vert Feyxa, polices signatures",
    icon: "🟢",
    theme: {
      primaryColor: "#47d21e",
      bgColor: "#ffffff",
      textColor: "#1c1c1c",
      radius: "0.75rem",
      fontHeading: "Clash Display",
      fontBody: "Manrope",
    },
  },
  {
    id: "luxe-noir",
    name: "Luxe Noir & Or",
    description: "Élégant, premium, doré",
    icon: "✨",
    theme: {
      primaryColor: "#d4a853",
      bgColor: "#0a0a0a",
      textColor: "#f5f5f5",
      radius: "0rem",
      fontHeading: "Playfair Display",
      fontBody: "Lato",
    },
  },
  {
    id: "ocean-blue",
    name: "Océan",
    description: "Bleu apaisant, moderne",
    icon: "🌊",
    theme: {
      primaryColor: "#0284c7",
      bgColor: "#f0f9ff",
      textColor: "#0c4a6e",
      radius: "1rem",
      fontHeading: "Plus Jakarta Sans",
      fontBody: "Plus Jakarta Sans",
    },
  },
  {
    id: "rose-poudre",
    name: "Rose Poudré",
    description: "Féminin, doux, élégant",
    icon: "🌸",
    theme: {
      primaryColor: "#e11d48",
      bgColor: "#fff1f2",
      textColor: "#4c0519",
      radius: "0.75rem",
      fontHeading: "Cormorant Garamond",
      fontBody: "Lato",
    },
  },
  {
    id: "sunset",
    name: "Coucher de Soleil",
    description: "Tons chauds, vibrant",
    icon: "🌅",
    theme: {
      primaryColor: "#ea580c",
      bgColor: "#fffbf5",
      textColor: "#431407",
      radius: "0.75rem",
      fontHeading: "Poppins",
      fontBody: "Poppins",
    },
  },
  {
    id: "afro-bold",
    name: "Afro Bold",
    description: "Audacieux, africain moderne",
    icon: "🌍",
    theme: {
      primaryColor: "#f59e0b",
      bgColor: "#1a0a2e",
      textColor: "#fef3c7",
      radius: "0.75rem",
      fontHeading: "Clash Display",
      fontBody: "Manrope",
    },
  },
  {
    id: "minimal-bw",
    name: "Minimaliste",
    description: "Noir & blanc, ultra-épuré",
    icon: "⬛",
    theme: {
      primaryColor: "#171717",
      bgColor: "#fafafa",
      textColor: "#171717",
      radius: "0.25rem",
      fontHeading: "Space Grotesk",
      fontBody: "Inter",
    },
  },
  {
    id: "nature-bio",
    name: "Nature & Bio",
    description: "Vert naturel, organique",
    icon: "🌿",
    theme: {
      primaryColor: "#16a34a",
      bgColor: "#f0fdf4",
      textColor: "#14532d",
      radius: "1rem",
      fontHeading: "DM Sans",
      fontBody: "DM Sans",
    },
  },
  {
    id: "tech-purple",
    name: "Tech Startup",
    description: "Violet futuriste, moderne",
    icon: "🚀",
    theme: {
      primaryColor: "#7c3aed",
      bgColor: "#faf5ff",
      textColor: "#3b0764",
      radius: "0.75rem",
      fontHeading: "Space Grotesk",
      fontBody: "Inter",
    },
  },
  {
    id: "streetwear",
    name: "Streetwear",
    description: "Urbain, contrastes forts",
    icon: "🔥",
    theme: {
      primaryColor: "#ef4444",
      bgColor: "#18181b",
      textColor: "#fafafa",
      radius: "0.5rem",
      fontHeading: "Oswald",
      fontBody: "Inter",
    },
  },
  {
    id: "chretien",
    name: "Inspiration",
    description: "Doux, inspirant, spirituel",
    icon: "✝️",
    theme: {
      primaryColor: "#6366f1",
      bgColor: "#f8f7ff",
      textColor: "#312e81",
      radius: "1rem",
      fontHeading: "Cormorant Garamond",
      fontBody: "Lato",
    },
  },
  {
    id: "candy",
    name: "Candy Pop",
    description: "Coloré, jeune, dynamique",
    icon: "🍬",
    theme: {
      primaryColor: "#ec4899",
      bgColor: "#fdf2f8",
      textColor: "#831843",
      radius: "1.5rem",
      fontHeading: "Poppins",
      fontBody: "DM Sans",
    },
  },
];

const STORAGE_KEY = "feyxa_custom_theme_presets";

export function getCustomPresets(): LandingThemePreset[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as LandingThemePreset[];
  } catch {
    return [];
  }
}

export function saveCustomPreset(preset: LandingThemePreset): void {
  const existing = getCustomPresets();
  const updated = [...existing.filter(p => p.id !== preset.id), { ...preset, isCustom: true }];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function deleteCustomPreset(id: string): void {
  const existing = getCustomPresets();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing.filter(p => p.id !== id)));
}
