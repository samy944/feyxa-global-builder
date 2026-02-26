/**
 * Section-level settings definitions for the Deep Customizer.
 * Each section type has a schema of editable fields.
 */

export type SettingFieldType = "text" | "textarea" | "image" | "color" | "select" | "toggle";

export interface SettingFieldDef {
  key: string;
  label: string;
  type: SettingFieldType;
  placeholder?: string;
  options?: { value: string; label: string }[];
  defaultValue?: string | boolean;
}

export type SectionSettingsSchema = Record<string, SettingFieldDef[]>;

export const SECTION_SETTINGS_SCHEMA: SectionSettingsSchema = {
  hero: [
    { key: "title", label: "Titre principal", type: "text", placeholder: "Bienvenue sur notre boutique", defaultValue: "" },
    { key: "subtitle", label: "Sous-titre", type: "textarea", placeholder: "Découvrez nos produits uniques", defaultValue: "" },
    { key: "buttonText", label: "Texte du bouton", type: "text", placeholder: "Découvrir", defaultValue: "Découvrir" },
    { key: "buttonUrl", label: "Lien du bouton", type: "text", placeholder: "#produits", defaultValue: "#produits" },
    { key: "backgroundImage", label: "Image de fond", type: "image", defaultValue: "" },
    { key: "showProducts", label: "Afficher aperçu produits", type: "toggle", defaultValue: true },
    { key: "layout", label: "Disposition", type: "select", options: [
      { value: "centered", label: "Centré" },
      { value: "left", label: "Aligné à gauche" },
      { value: "split", label: "Divisé (texte + image)" },
    ], defaultValue: "centered" },
  ],
  trust: [
    { key: "showDelivery", label: "Livraison rapide", type: "toggle", defaultValue: true },
    { key: "showPayment", label: "Paiement sécurisé", type: "toggle", defaultValue: true },
    { key: "showReturns", label: "Retours faciles", type: "toggle", defaultValue: true },
    { key: "showSupport", label: "Support réactif", type: "toggle", defaultValue: true },
    { key: "customBadge1", label: "Badge personnalisé 1", type: "text", placeholder: "", defaultValue: "" },
    { key: "customBadge2", label: "Badge personnalisé 2", type: "text", placeholder: "", defaultValue: "" },
  ],
  categories: [
    { key: "title", label: "Titre", type: "text", placeholder: "Nos univers", defaultValue: "" },
    { key: "maxCategories", label: "Nombre max", type: "select", options: [
      { value: "4", label: "4" }, { value: "6", label: "6" }, { value: "8", label: "8" },
    ], defaultValue: "8" },
  ],
  featured: [
    { key: "title", label: "Titre", type: "text", placeholder: "Nos coups de cœur", defaultValue: "" },
    { key: "subtitle", label: "Sous-titre", type: "text", placeholder: "Sélection du moment", defaultValue: "" },
    { key: "maxProducts", label: "Nombre de produits", type: "select", options: [
      { value: "4", label: "4" }, { value: "6", label: "6" }, { value: "8", label: "8" }, { value: "12", label: "12" },
    ], defaultValue: "8" },
    { key: "showSearch", label: "Afficher la recherche", type: "toggle", defaultValue: true },
  ],
  "on-sale": [
    { key: "title", label: "Titre", type: "text", placeholder: "🔥 Promotions", defaultValue: "" },
    { key: "subtitle", label: "Sous-titre", type: "text", placeholder: "Offres à ne pas manquer", defaultValue: "" },
  ],
  "new-arrivals": [
    { key: "title", label: "Titre", type: "text", placeholder: "✨ Nouveautés", defaultValue: "" },
    { key: "subtitle", label: "Sous-titre", type: "text", placeholder: "Fraîchement arrivés", defaultValue: "" },
  ],
  "all-products": [
    { key: "title", label: "Titre", type: "text", placeholder: "Tous les produits", defaultValue: "" },
    { key: "showSort", label: "Afficher le tri", type: "toggle", defaultValue: true },
    { key: "showSearch", label: "Afficher la recherche", type: "toggle", defaultValue: true },
  ],
  testimonials: [
    { key: "title", label: "Titre", type: "text", placeholder: "Ce que disent nos clients", defaultValue: "" },
    { key: "testimonial1Name", label: "Nom client 1", type: "text", placeholder: "Aminata K.", defaultValue: "" },
    { key: "testimonial1Text", label: "Avis client 1", type: "textarea", placeholder: "Produits de qualité...", defaultValue: "" },
    { key: "testimonial2Name", label: "Nom client 2", type: "text", placeholder: "Jean-Paul M.", defaultValue: "" },
    { key: "testimonial2Text", label: "Avis client 2", type: "textarea", placeholder: "Service client au top...", defaultValue: "" },
    { key: "testimonial3Name", label: "Nom client 3", type: "text", placeholder: "Fatou D.", defaultValue: "" },
    { key: "testimonial3Text", label: "Avis client 3", type: "textarea", placeholder: "Ma boutique préférée...", defaultValue: "" },
  ],
  newsletter: [
    { key: "title", label: "Titre", type: "text", placeholder: "Ne manquez rien", defaultValue: "" },
    { key: "subtitle", label: "Sous-titre", type: "textarea", placeholder: "Inscrivez-vous pour recevoir nos offres...", defaultValue: "" },
    { key: "buttonText", label: "Texte du bouton", type: "text", placeholder: "S'inscrire", defaultValue: "S'inscrire" },
  ],
  header: [
    { key: "showSearch", label: "Afficher la recherche", type: "toggle", defaultValue: true },
    { key: "showWishlist", label: "Afficher les favoris", type: "toggle", defaultValue: true },
    { key: "showAccount", label: "Afficher Mon compte", type: "toggle", defaultValue: true },
    { key: "announcement", label: "Bandeau d'annonce", type: "text", placeholder: "Livraison gratuite dès 25 000 FCFA", defaultValue: "" },
  ],
  footer: [
    { key: "showSocial", label: "Afficher les réseaux", type: "toggle", defaultValue: true },
    { key: "showNavigation", label: "Afficher la navigation", type: "toggle", defaultValue: true },
    { key: "instagramUrl", label: "Instagram URL", type: "text", placeholder: "https://instagram.com/...", defaultValue: "" },
    { key: "facebookUrl", label: "Facebook URL", type: "text", placeholder: "https://facebook.com/...", defaultValue: "" },
    { key: "customText", label: "Texte personnalisé", type: "textarea", placeholder: "", defaultValue: "" },
  ],
};

export function getDefaultSettings(sectionType: string): Record<string, any> {
  const schema = SECTION_SETTINGS_SCHEMA[sectionType];
  if (!schema) return {};
  const defaults: Record<string, any> = {};
  for (const field of schema) {
    defaults[field.key] = field.defaultValue ?? "";
  }
  return defaults;
}
