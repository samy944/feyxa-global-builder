// ---- Landing Page Template System (Advanced) ----

export interface LandingSection {
  id: string;
  type: SectionType;
  data: Record<string, any>;
  visible: boolean;
}

export type SectionType =
  | "hero"
  | "benefits"
  | "social-proof"
  | "product-highlights"
  | "pricing"
  | "countdown"
  | "faq"
  | "guarantee"
  | "cta"
  | "collection-grid"
  | "lead-capture"
  | "waitlist"
  // New advanced blocks
  | "image"
  | "video"
  | "rich-text"
  | "columns"
  | "testimonials-grid"
  | "stats"
  | "comparison-table"
  | "tabs"
  | "trust-badges"
  | "announcement-bar"
  | "whatsapp-button"
  | "sticky-cta"
  | "before-after"
  | "gallery"
  // Layout blocks
  | "header"
  | "footer";

export interface LandingTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  sections: LandingSection[];
}

// Block definitions for the editor library
export interface BlockDefinition {
  type: SectionType;
  label: string;
  icon: string;
  category: "essential" | "content" | "conversion" | "social" | "advanced" | "ecommerce";
  defaultData: Record<string, any>;
}

export const BLOCK_LIBRARY: BlockDefinition[] = [
  // Essential
  { type: "header", label: "En-tête", icon: "🔝", category: "essential", defaultData: { logo: "", storeName: "Ma Boutique", links: [{ label: "Accueil", href: "#" }, { label: "Produits", href: "#products" }, { label: "Contact", href: "#contact" }], ctaText: "Commander", ctaHref: "#cta" } },
  { type: "hero", label: "Hero", icon: "🎯", category: "essential", defaultData: { title: "Titre principal", subtitle: "Sous-titre accrocheur", ctaText: "Commander", imageUrl: "" } },
  { type: "rich-text", label: "Texte riche", icon: "📝", category: "essential", defaultData: { content: "Votre texte ici. **Gras**, *italique* supportés." } },
  { type: "image", label: "Image", icon: "🖼️", category: "essential", defaultData: { url: "", alt: "Image", caption: "" } },
  { type: "video", label: "Vidéo", icon: "🎬", category: "essential", defaultData: { url: "", poster: "", autoplay: false } },
  { type: "columns", label: "Colonnes", icon: "▥", category: "essential", defaultData: { title: "", cols: 3, items: [{ title: "Colonne 1", content: "Contenu" }, { title: "Colonne 2", content: "Contenu" }, { title: "Colonne 3", content: "Contenu" }] } },
  { type: "gallery", label: "Galerie", icon: "🖼", category: "essential", defaultData: { title: "Galerie", images: [] } },

  // Content
  { type: "benefits", label: "Avantages", icon: "✨", category: "content", defaultData: { title: "Nos avantages", items: [{ icon: "✨", title: "Avantage", desc: "Description" }] } },
  { type: "faq", label: "FAQ", icon: "❓", category: "content", defaultData: { title: "Questions fréquentes", items: [{ q: "Question ?", a: "Réponse." }] } },
  { type: "tabs", label: "Onglets", icon: "📑", category: "content", defaultData: { items: [{ label: "Onglet 1", content: "Contenu 1" }, { label: "Onglet 2", content: "Contenu 2" }] } },
  { type: "comparison-table", label: "Comparaison", icon: "⚖️", category: "content", defaultData: { title: "Comparaison", headers: ["Critère", "Nous", "Autres"], rows: [["Qualité", "✅ Premium", "❌ Standard"], ["Livraison", "✅ 48h", "❌ 7 jours"]] } },

  // Conversion
  { type: "cta", label: "CTA Final", icon: "🚀", category: "conversion", defaultData: { title: "Prêt à commander ?", subtitle: "Ne ratez pas cette offre.", ctaText: "Commander" } },
  { type: "pricing", label: "Tarifs / Offre", icon: "💰", category: "conversion", defaultData: { title: "Nos offres", items: [{ name: "Standard", price: 10000, features: ["Feature 1"], highlight: false }] } },
  { type: "countdown", label: "Compte à rebours", icon: "⏰", category: "conversion", defaultData: { title: "Offre limitée", endDate: new Date(Date.now() + 86400000).toISOString() } },
  { type: "lead-capture", label: "Capture Lead", icon: "📧", category: "conversion", defaultData: { title: "Restez informé", placeholder: "Votre email ou WhatsApp", buttonText: "S'inscrire", incentive: "🎁 -10% offert" } },
  { type: "waitlist", label: "Waitlist", icon: "📋", category: "conversion", defaultData: { title: "Rejoignez la waitlist", placeholder: "Votre email", buttonText: "Me notifier", spotsText: "Places limitées" } },
  { type: "sticky-cta", label: "CTA Sticky", icon: "📌", category: "conversion", defaultData: { text: "Commander maintenant", ctaText: "Acheter", price: "" } },
  { type: "guarantee", label: "Garantie", icon: "🛡️", category: "conversion", defaultData: { title: "Garantie satisfait ou remboursé", text: "Remboursement sous 30 jours.", icon: "🛡️" } },

  // Social
  { type: "social-proof", label: "Preuve sociale", icon: "⭐", category: "social", defaultData: { title: "Ils nous font confiance", stats: [{ value: "1,000+", label: "Clients" }], testimonials: [] } },
  { type: "testimonials-grid", label: "Témoignages Grid", icon: "💬", category: "social", defaultData: { title: "Avis clients", items: [{ name: "Client A", text: "Super produit !", rating: 5, avatar: "" }] } },
  { type: "stats", label: "Statistiques", icon: "📊", category: "social", defaultData: { items: [{ value: "10K+", label: "Clients" }, { value: "4.9", label: "Note" }, { value: "98%", label: "Satisfaits" }] } },
  { type: "trust-badges", label: "Badges confiance", icon: "🏅", category: "social", defaultData: { items: [{ icon: "🔒", label: "Paiement sécurisé" }, { icon: "🚚", label: "Livraison rapide" }, { icon: "↩️", label: "Retours gratuits" }] } },

  // E-commerce
  { type: "product-highlights", label: "Produits", icon: "📦", category: "ecommerce", defaultData: { title: "Nos produits", items: [] } },
  { type: "collection-grid", label: "Collection", icon: "🛍️", category: "ecommerce", defaultData: { title: "Notre collection", columns: 3 } },

  // Advanced
  { type: "announcement-bar", label: "Bandeau annonce", icon: "📢", category: "advanced", defaultData: { text: "🔥 Livraison gratuite dès 25 000 FCFA", bgColor: "" } },
  { type: "whatsapp-button", label: "WhatsApp", icon: "💬", category: "advanced", defaultData: { phone: "", message: "Bonjour, je suis intéressé(e) !", label: "Nous contacter" } },
  { type: "before-after", label: "Avant / Après", icon: "🔄", category: "advanced", defaultData: { title: "Résultats", beforeImage: "", afterImage: "", beforeLabel: "Avant", afterLabel: "Après" } },
  { type: "footer", label: "Pied de page", icon: "🔚", category: "essential", defaultData: { storeName: "Ma Boutique", description: "Votre boutique en ligne de confiance.", links: [{ label: "Mentions légales", href: "#" }, { label: "Politique de confidentialité", href: "#" }], phone: "", email: "", socials: { instagram: "", facebook: "", tiktok: "" } } },
];

export function getBlockDefinition(type: SectionType): BlockDefinition | undefined {
  return BLOCK_LIBRARY.find(b => b.type === type);
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

const defaultHeader = (): LandingSection => ({ id: uid(), type: "header", visible: true, data: { logo: "", storeName: "Ma Boutique", links: [{ label: "Accueil", href: "#" }, { label: "Produits", href: "#products" }, { label: "FAQ", href: "#faq" }, { label: "Contact", href: "#contact" }], ctaText: "Commander", ctaHref: "#cta" } });
const defaultFooter = (): LandingSection => ({ id: uid(), type: "footer", visible: true, data: { storeName: "Ma Boutique", description: "Votre boutique en ligne de confiance.", links: [{ label: "Mentions légales", href: "#" }, { label: "Politique de confidentialité", href: "#" }, { label: "CGV", href: "#" }], phone: "", email: "", socials: { instagram: "", facebook: "", tiktok: "" } } });

export const LANDING_TEMPLATES: LandingTemplate[] = [
  {
    id: "one-product",
    name: "One Product",
    description: "Hero + bénéfices + preuves + FAQ + CTA sticky. Idéal pour un seul produit.",
    icon: "🎯",
    category: "Produit",
    sections: [
      defaultHeader(),
      { id: uid(), type: "hero", visible: true, data: { title: "Le produit qui change tout", subtitle: "Découvrez pourquoi des milliers de clients nous font confiance.", ctaText: "Commander maintenant", imageUrl: "" } },
      { id: uid(), type: "trust-badges", visible: true, data: { items: [{ icon: "🔒", label: "Paiement sécurisé" }, { icon: "🚚", label: "Livraison rapide" }, { icon: "↩️", label: "Retours gratuits" }, { icon: "💎", label: "Qualité premium" }] } },
      { id: uid(), type: "benefits", visible: true, data: { title: "Pourquoi nous choisir ?", items: [{ icon: "✨", title: "Qualité premium", desc: "Des matériaux soigneusement sélectionnés." }, { icon: "🚀", title: "Livraison rapide", desc: "Recevez votre commande en 48h." }, { icon: "💎", title: "Garantie satisfait", desc: "Remboursement sous 30 jours." }] } },
      { id: uid(), type: "social-proof", visible: true, data: { title: "Ils nous font confiance", stats: [{ value: "2,500+", label: "Clients satisfaits" }, { value: "4.8/5", label: "Note moyenne" }, { value: "98%", label: "Recommandent" }], testimonials: [{ name: "Aminata K.", text: "Produit incroyable, je recommande à 100% !", rating: 5 }] } },
      { id: uid(), type: "faq", visible: true, data: { title: "Questions fréquentes", items: [{ q: "Quels sont les délais de livraison ?", a: "La livraison est effectuée sous 2 à 5 jours ouvrés." }, { q: "Puis-je retourner le produit ?", a: "Oui, vous avez 30 jours pour effectuer un retour." }] } },
      { id: uid(), type: "cta", visible: true, data: { title: "Prêt à commander ?", subtitle: "Profitez de notre offre exclusive dès maintenant.", ctaText: "Acheter maintenant" } },
      defaultFooter(),
    ],
  },
  {
    id: "bundle-offer",
    name: "Bundle Offer",
    description: "Packs + économie + upsell. Parfait pour les offres groupées.",
    icon: "📦",
    category: "Offre",
    sections: [
      defaultHeader(),
      { id: uid(), type: "hero", visible: true, data: { title: "Pack Exclusif — Économisez 30%", subtitle: "Combinez et économisez sur nos meilleurs produits.", ctaText: "Voir les packs", imageUrl: "" } },
      { id: uid(), type: "pricing", visible: true, data: { title: "Choisissez votre pack", items: [{ name: "Essentiel", price: 15000, originalPrice: 20000, features: ["1 produit", "Livraison gratuite"], highlight: false }, { name: "Premium", price: 25000, originalPrice: 40000, features: ["3 produits", "Livraison gratuite", "Cadeau surprise"], highlight: true }, { name: "VIP", price: 45000, originalPrice: 70000, features: ["5 produits", "Livraison express", "Cadeau surprise", "Support prioritaire"], highlight: false }] } },
      { id: uid(), type: "benefits", visible: true, data: { title: "Pourquoi acheter en pack ?", items: [{ icon: "💰", title: "Économies", desc: "Jusqu'à 35% de réduction." }, { icon: "🎁", title: "Cadeaux inclus", desc: "Recevez des bonus exclusifs." }, { icon: "📦", title: "Tout en un", desc: "Un seul envoi, zéro tracas." }] } },
      { id: uid(), type: "guarantee", visible: true, data: { title: "Garantie 100% Satisfaction", text: "Si vous n'êtes pas satisfait, nous vous remboursons intégralement sous 30 jours. Sans conditions.", icon: "🛡️" } },
      { id: uid(), type: "cta", visible: true, data: { title: "Ne ratez pas cette offre", subtitle: "Stocks limités — commandez maintenant.", ctaText: "Commander le pack" } },
      defaultFooter(),
    ],
  },
  {
    id: "promo-flash",
    name: "Promo Flash",
    description: "Compte à rebours + urgence. Créez l'urgence pour vos ventes flash.",
    icon: "⚡",
    category: "Promo",
    sections: [
      defaultHeader(),
      { id: uid(), type: "announcement-bar", visible: true, data: { text: "🔥 Offre limitée — Ne manquez pas cette promo !" } },
      { id: uid(), type: "hero", visible: true, data: { title: "Vente Flash — 48h seulement", subtitle: "-50% sur tout le catalogue. L'offre expire bientôt.", ctaText: "Profiter de l'offre", imageUrl: "" } },
      { id: uid(), type: "countdown", visible: true, data: { title: "L'offre expire dans", endDate: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString() } },
      { id: uid(), type: "product-highlights", visible: true, data: { title: "Produits en promo", items: [] } },
      { id: uid(), type: "social-proof", visible: true, data: { title: "Déjà 350 commandes aujourd'hui", stats: [{ value: "350+", label: "Commandes" }, { value: "⭐ 4.9", label: "Satisfaction" }], testimonials: [] } },
      { id: uid(), type: "cta", visible: true, data: { title: "Dernière chance", subtitle: "Stocks très limités.", ctaText: "Commander maintenant" } },
      defaultFooter(),
    ],
  },
  {
    id: "lead-capture",
    name: "Lead Capture",
    description: "Collecte WhatsApp/Email. Construisez votre audience.",
    icon: "📧",
    category: "Lead",
    sections: [
      defaultHeader(),
      { id: uid(), type: "hero", visible: true, data: { title: "Recevez nos offres exclusives", subtitle: "Inscrivez-vous et recevez 10% de réduction sur votre première commande.", ctaText: "S'inscrire", imageUrl: "" } },
      { id: uid(), type: "lead-capture", visible: true, data: { title: "Rejoignez +5,000 abonnés", placeholder: "Votre numéro WhatsApp ou email", buttonText: "S'inscrire gratuitement", incentive: "🎁 -10% sur votre première commande" } },
      { id: uid(), type: "benefits", visible: true, data: { title: "Ce que vous recevrez", items: [{ icon: "🔔", title: "Alertes promo", desc: "Soyez le premier informé." }, { icon: "🎁", title: "Offres exclusives", desc: "Réservées aux abonnés." }, { icon: "📱", title: "Via WhatsApp", desc: "Direct sur votre téléphone." }] } },
      { id: uid(), type: "social-proof", visible: true, data: { title: "Ils ont rejoint la communauté", stats: [{ value: "5,000+", label: "Abonnés" }, { value: "98%", label: "Satisfaits" }], testimonials: [{ name: "Fatou D.", text: "Les offres sont vraiment exclusives !", rating: 5 }] } },
      defaultFooter(),
    ],
  },
  {
    id: "collection-landing",
    name: "Collection Landing",
    description: "Produits + filtres + CTA. Présentez toute une collection.",
    icon: "🛍️",
    category: "Collection",
    sections: [
      defaultHeader(),
      { id: uid(), type: "hero", visible: true, data: { title: "Nouvelle Collection Été 2026", subtitle: "Des pièces uniques, pensées pour vous.", ctaText: "Découvrir", imageUrl: "" } },
      { id: uid(), type: "collection-grid", visible: true, data: { title: "Nos pièces phares", columns: 3 } },
      { id: uid(), type: "benefits", visible: true, data: { title: "L'engagement qualité", items: [{ icon: "🧵", title: "Fait main", desc: "Chaque pièce est unique." }, { icon: "🌍", title: "Made in Africa", desc: "Fierté locale, qualité mondiale." }, { icon: "♻️", title: "Éco-responsable", desc: "Matériaux durables." }] } },
      { id: uid(), type: "cta", visible: true, data: { title: "Explorez la collection complète", subtitle: "Livraison gratuite dès 25,000 FCFA d'achat.", ctaText: "Voir la boutique" } },
      defaultFooter(),
    ],
  },
  {
    id: "waitlist",
    name: "Waitlist / Webinar",
    description: "Inscription + preuve + CTA. Lancez un produit ou un événement.",
    icon: "🚀",
    category: "Lancement",
    sections: [
      defaultHeader(),
      { id: uid(), type: "hero", visible: true, data: { title: "Quelque chose d'incroyable arrive…", subtitle: "Soyez parmi les premiers à découvrir notre nouveau produit.", ctaText: "Rejoindre la waitlist", imageUrl: "" } },
      { id: uid(), type: "waitlist", visible: true, data: { title: "Inscrivez-vous à la liste d'attente", placeholder: "Votre email", buttonText: "Me notifier", spotsText: "🔥 Plus que 47 places" } },
      { id: uid(), type: "benefits", visible: true, data: { title: "Ce qui vous attend", items: [{ icon: "🎯", title: "Accès prioritaire", desc: "Commandez avant tout le monde." }, { icon: "💸", title: "Prix de lancement", desc: "-20% pour les premiers." }, { icon: "🎁", title: "Bonus exclusif", desc: "Un cadeau réservé aux early adopters." }] } },
      { id: uid(), type: "social-proof", visible: true, data: { title: "Déjà sur la liste", stats: [{ value: "1,200+", label: "Inscrits" }, { value: "23", label: "Pays" }], testimonials: [] } },
      { id: uid(), type: "cta", visible: true, data: { title: "Ne manquez pas le lancement", subtitle: "Inscription gratuite, sans engagement.", ctaText: "Rejoindre maintenant" } },
      defaultFooter(),
    ],
  },
  {
    id: "local-delivery",
    name: "Livraison Locale",
    description: "Focus livraison locale avec zones, délais et confiance.",
    icon: "🏠",
    category: "Local",
    sections: [
      defaultHeader(),
      { id: uid(), type: "announcement-bar", visible: true, data: { text: "🚚 Livraison gratuite à Douala et Yaoundé !" } },
      { id: uid(), type: "hero", visible: true, data: { title: "Livré chez vous en 24h", subtitle: "Commandez maintenant, recevez demain. Simple, rapide, fiable.", ctaText: "Commander", imageUrl: "" } },
      { id: uid(), type: "trust-badges", visible: true, data: { items: [{ icon: "🚚", label: "Livraison 24h" }, { icon: "💳", label: "Paiement à la livraison" }, { icon: "🔒", label: "100% Sécurisé" }, { icon: "↩️", label: "Retour gratuit" }] } },
      { id: uid(), type: "product-highlights", visible: true, data: { title: "Nos best-sellers", items: [] } },
      { id: uid(), type: "stats", visible: true, data: { items: [{ value: "5,000+", label: "Livraisons" }, { value: "24h", label: "Délai moyen" }, { value: "4.9/5", label: "Satisfaction" }] } },
      { id: uid(), type: "faq", visible: true, data: { title: "Questions livraison", items: [{ q: "Dans quelles villes livrez-vous ?", a: "Douala, Yaoundé, et les principales villes du Cameroun." }, { q: "Quel est le délai ?", a: "24-48h selon votre localisation." }] } },
      { id: uid(), type: "cta", visible: true, data: { title: "Commandez maintenant", subtitle: "Livraison rapide et paiement à la livraison.", ctaText: "Commander" } },
      defaultFooter(),
    ],
  },
  {
    id: "seller-spotlight",
    name: "Seller Spotlight",
    description: "Page vitrine vendeur marketplace avec produits et avis.",
    icon: "🌟",
    category: "Marketplace",
    sections: [
      defaultHeader(),
      { id: uid(), type: "hero", visible: true, data: { title: "Bienvenue dans notre boutique", subtitle: "Découvrez nos produits artisanaux de qualité, fabriqués avec passion.", ctaText: "Voir nos produits", imageUrl: "" } },
      { id: uid(), type: "stats", visible: true, data: { items: [{ value: "500+", label: "Produits vendus" }, { value: "4.8/5", label: "Avis clients" }, { value: "2 ans", label: "Sur Feyxa" }] } },
      { id: uid(), type: "product-highlights", visible: true, data: { title: "Nos produits vedettes", items: [] } },
      { id: uid(), type: "testimonials-grid", visible: true, data: { title: "Ce que disent nos clients", items: [{ name: "Marie L.", text: "Qualité exceptionnelle et service impeccable.", rating: 5, avatar: "" }, { name: "Paul K.", text: "Livraison rapide et produit conforme.", rating: 5, avatar: "" }] } },
      { id: uid(), type: "guarantee", visible: true, data: { title: "Notre engagement qualité", text: "Chaque produit est vérifié et garanti. Satisfaction assurée ou remboursé.", icon: "🛡️" } },
      { id: uid(), type: "whatsapp-button", visible: true, data: { phone: "", message: "Bonjour ! J'ai une question.", label: "Nous contacter sur WhatsApp" } },
      defaultFooter(),
    ],
  },
];

export function getTemplateById(id: string): LandingTemplate | undefined {
  return LANDING_TEMPLATES.find((t) => t.id === id);
}

export function getDefaultSectionsForTemplate(templateId: string): LandingSection[] {
  const t = getTemplateById(templateId);
  if (!t) return LANDING_TEMPLATES[0].sections;
  return JSON.parse(JSON.stringify(t.sections));
}
