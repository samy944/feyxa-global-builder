import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

type BrandingConfig = {
  platform_name: string;
  logo_url: string | null;
  logo_dark_url: string | null;
  favicon_url: string | null;
  primary_color: string;
  secondary_color: string;
  button_color: string;
  button_text_color: string;
  font_family: string;
  font_heading: string;
  default_image_url: string | null;
  footer_text: string | null;
  footer_links: Array<{ label: string; url: string }>;
  meta_description: string | null;
  custom_css: string | null;
};

const DEFAULT_BRANDING: BrandingConfig = {
  platform_name: "Feyxa",
  logo_url: null,
  logo_dark_url: null,
  favicon_url: null,
  primary_color: "#E5FB26",
  secondary_color: "#0E0E11",
  button_color: "#E5FB26",
  button_text_color: "#0E0E11",
  font_family: "Inter",
  font_heading: "Clash Display",
  default_image_url: null,
  footer_text: "© 2026 Feyxa. Tous droits réservés.",
  footer_links: [],
  meta_description: null,
  custom_css: null,
};

const BrandingContext = createContext<BrandingConfig>(DEFAULT_BRANDING);

export function useBranding() {
  return useContext(BrandingContext);
}

function hexToHsl(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export function BrandingProvider({ children }: { children: ReactNode }) {
  const [branding, setBranding] = useState<BrandingConfig>(DEFAULT_BRANDING);

  useEffect(() => {
    supabase
      .from("platform_branding")
      .select("*")
      .limit(1)
      .single()
      .then(({ data }) => {
        if (data) {
          setBranding({
            ...DEFAULT_BRANDING,
            ...(data as any),
          });
        }
      });
  }, []);

  // Apply dynamic CSS variables
  useEffect(() => {
    const root = document.documentElement;

    if (branding.primary_color && branding.primary_color !== DEFAULT_BRANDING.primary_color) {
      root.style.setProperty("--brand-primary", branding.primary_color);
      root.style.setProperty("--brand-primary-hsl", hexToHsl(branding.primary_color));
    }
    if (branding.secondary_color && branding.secondary_color !== DEFAULT_BRANDING.secondary_color) {
      root.style.setProperty("--brand-secondary", branding.secondary_color);
    }
    if (branding.button_color) {
      root.style.setProperty("--brand-button", branding.button_color);
      root.style.setProperty("--brand-button-text", branding.button_text_color);
    }

    // Apply favicon
    if (branding.favicon_url) {
      let link = document.querySelector("link[rel='icon']") as HTMLLinkElement;
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      link.href = branding.favicon_url;
    }

    // Apply title
    if (branding.platform_name && branding.platform_name !== "Feyxa") {
      document.title = branding.platform_name;
    }

    // Apply custom CSS
    if (branding.custom_css) {
      let style = document.getElementById("branding-custom-css");
      if (!style) {
        style = document.createElement("style");
        style.id = "branding-custom-css";
        document.head.appendChild(style);
      }
      style.textContent = branding.custom_css;
    }

    return () => {
      root.style.removeProperty("--brand-primary");
      root.style.removeProperty("--brand-primary-hsl");
      root.style.removeProperty("--brand-secondary");
      root.style.removeProperty("--brand-button");
      root.style.removeProperty("--brand-button-text");
      const style = document.getElementById("branding-custom-css");
      if (style) style.remove();
    };
  }, [branding]);

  return (
    <BrandingContext.Provider value={branding}>
      {children}
    </BrandingContext.Provider>
  );
}
