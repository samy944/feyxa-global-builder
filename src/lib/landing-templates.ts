// ---- Landing Page Template System ----

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
  | "waitlist";

export interface LandingTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  sections: LandingSection[];
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export const LANDING_TEMPLATES: LandingTemplate[] = [
  {
    id: "one-product",
    name: "One Product",
    description: "Hero + bénéfices + preuves + FAQ + CTA sticky. Idéal pour un seul produit.",
    icon: "🎯",
    category: "Produit",
    sections: [
      { id: uid(), type: "hero", visible: true, data: { title: "Le produit qui change tout", subtitle: "Découvrez pourquoi des milliers de clients nous font confiance.", ctaText: "Commander maintenant", imageUrl: "" } },
      { id: uid(), type: "benefits", visible: true, data: { title: "Pourquoi nous choisir ?", items: [{ icon: "✨", title: "Qualité premium", desc: "Des matériaux soigneusement sélectionnés." }, { icon: "🚀", title: "Livraison rapide", desc: "Recevez votre commande en 48h." }, { icon: "💎", title: "Garantie satisfait", desc: "Remboursement sous 30 jours." }] } },
      { id: uid(), type: "social-proof", visible: true, data: { title: "Ils nous font confiance", stats: [{ value: "2,500+", label: "Clients satisfaits" }, { value: "4.8/5", label: "Note moyenne" }, { value: "98%", label: "Recommandent" }], testimonials: [{ name: "Aminata K.", text: "Produit incroyable, je recommande à 100% !", rating: 5 }] } },
      { id: uid(), type: "faq", visible: true, data: { title: "Questions fréquentes", items: [{ q: "Quels sont les délais de livraison ?", a: "La livraison est effectuée sous 2 à 5 jours ouvrés." }, { q: "Puis-je retourner le produit ?", a: "Oui, vous avez 30 jours pour effectuer un retour." }] } },
      { id: uid(), type: "cta", visible: true, data: { title: "Prêt à commander ?", subtitle: "Profitez de notre offre exclusive dès maintenant.", ctaText: "Acheter maintenant" } },
    ],
  },
  {
    id: "bundle-offer",
    name: "Bundle Offer",
    description: "Packs + économie + upsell. Parfait pour les offres groupées.",
    icon: "📦",
    category: "Offre",
    sections: [
      { id: uid(), type: "hero", visible: true, data: { title: "Pack Exclusif — Économisez 30%", subtitle: "Combinez et économisez sur nos meilleurs produits.", ctaText: "Voir les packs", imageUrl: "" } },
      { id: uid(), type: "pricing", visible: true, data: { title: "Choisissez votre pack", items: [{ name: "Essentiel", price: 15000, originalPrice: 20000, features: ["1 produit", "Livraison gratuite"], highlight: false }, { name: "Premium", price: 25000, originalPrice: 40000, features: ["3 produits", "Livraison gratuite", "Cadeau surprise"], highlight: true }, { name: "VIP", price: 45000, originalPrice: 70000, features: ["5 produits", "Livraison express", "Cadeau surprise", "Support prioritaire"], highlight: false }] } },
      { id: uid(), type: "benefits", visible: true, data: { title: "Pourquoi acheter en pack ?", items: [{ icon: "💰", title: "Économies", desc: "Jusqu'à 35% de réduction." }, { icon: "🎁", title: "Cadeaux inclus", desc: "Recevez des bonus exclusifs." }, { icon: "📦", title: "Tout en un", desc: "Un seul envoi, zéro tracas." }] } },
      { id: uid(), type: "guarantee", visible: true, data: { title: "Garantie 100% Satisfaction", text: "Si vous n'êtes pas satisfait, nous vous remboursons intégralement sous 30 jours. Sans conditions.", icon: "🛡️" } },
      { id: uid(), type: "cta", visible: true, data: { title: "Ne ratez pas cette offre", subtitle: "Stocks limités — commandez maintenant.", ctaText: "Commander le pack" } },
    ],
  },
  {
    id: "promo-flash",
    name: "Promo Flash",
    description: "Compte à rebours + urgence. Créez l'urgence pour vos ventes flash.",
    icon: "⚡",
    category: "Promo",
    sections: [
      { id: uid(), type: "hero", visible: true, data: { title: "🔥 Vente Flash — 48h seulement", subtitle: "-50% sur tout le catalogue. L'offre expire bientôt.", ctaText: "Profiter de l'offre", imageUrl: "" } },
      { id: uid(), type: "countdown", visible: true, data: { title: "L'offre expire dans", endDate: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString() } },
      { id: uid(), type: "product-highlights", visible: true, data: { title: "Produits en promo", items: [{ name: "Produit A", price: 5000, originalPrice: 10000, imageUrl: "" }, { name: "Produit B", price: 7500, originalPrice: 15000, imageUrl: "" }] } },
      { id: uid(), type: "social-proof", visible: true, data: { title: "Déjà 350 commandes aujourd'hui", stats: [{ value: "350+", label: "Commandes" }, { value: "⭐ 4.9", label: "Satisfaction" }], testimonials: [] } },
      { id: uid(), type: "cta", visible: true, data: { title: "Dernière chance", subtitle: "Stocks très limités.", ctaText: "Commander maintenant" } },
    ],
  },
  {
    id: "lead-capture",
    name: "Lead Capture",
    description: "Collecte WhatsApp/Email. Construisez votre audience.",
    icon: "📧",
    category: "Lead",
    sections: [
      { id: uid(), type: "hero", visible: true, data: { title: "Recevez nos offres exclusives", subtitle: "Inscrivez-vous et recevez 10% de réduction sur votre première commande.", ctaText: "S'inscrire", imageUrl: "" } },
      { id: uid(), type: "lead-capture", visible: true, data: { title: "Rejoignez +5,000 abonnés", placeholder: "Votre numéro WhatsApp ou email", buttonText: "S'inscrire gratuitement", incentive: "🎁 -10% sur votre première commande" } },
      { id: uid(), type: "benefits", visible: true, data: { title: "Ce que vous recevrez", items: [{ icon: "🔔", title: "Alertes promo", desc: "Soyez le premier informé." }, { icon: "🎁", title: "Offres exclusives", desc: "Réservées aux abonnés." }, { icon: "📱", title: "Via WhatsApp", desc: "Direct sur votre téléphone." }] } },
      { id: uid(), type: "social-proof", visible: true, data: { title: "Ils ont rejoint la communauté", stats: [{ value: "5,000+", label: "Abonnés" }, { value: "98%", label: "Satisfaits" }], testimonials: [{ name: "Fatou D.", text: "Les offres sont vraiment exclusives !", rating: 5 }] } },
    ],
  },
  {
    id: "collection-landing",
    name: "Collection Landing",
    description: "Produits + filtres + CTA. Présentez toute une collection.",
    icon: "🛍️",
    category: "Collection",
    sections: [
      { id: uid(), type: "hero", visible: true, data: { title: "Nouvelle Collection Été 2025", subtitle: "Des pièces uniques, pensées pour vous.", ctaText: "Découvrir", imageUrl: "" } },
      { id: uid(), type: "collection-grid", visible: true, data: { title: "Nos pièces phares", columns: 3 } },
      { id: uid(), type: "benefits", visible: true, data: { title: "L'engagement qualité", items: [{ icon: "🧵", title: "Fait main", desc: "Chaque pièce est unique." }, { icon: "🌍", title: "Made in Africa", desc: "Fierté locale, qualité mondiale." }, { icon: "♻️", title: "Éco-responsable", desc: "Matériaux durables." }] } },
      { id: uid(), type: "cta", visible: true, data: { title: "Explorez la collection complète", subtitle: "Livraison gratuite dès 25,000 FCFA d'achat.", ctaText: "Voir la boutique" } },
    ],
  },
  {
    id: "waitlist",
    name: "Waitlist / Webinar",
    description: "Inscription + preuve + CTA. Lancez un produit ou un événement.",
    icon: "🚀",
    category: "Lancement",
    sections: [
      { id: uid(), type: "hero", visible: true, data: { title: "Quelque chose d'incroyable arrive…", subtitle: "Soyez parmi les premiers à découvrir notre nouveau produit.", ctaText: "Rejoindre la waitlist", imageUrl: "" } },
      { id: uid(), type: "waitlist", visible: true, data: { title: "Inscrivez-vous à la liste d'attente", placeholder: "Votre email", buttonText: "Me notifier", spotsText: "🔥 Plus que 47 places" } },
      { id: uid(), type: "benefits", visible: true, data: { title: "Ce qui vous attend", items: [{ icon: "🎯", title: "Accès prioritaire", desc: "Commandez avant tout le monde." }, { icon: "💸", title: "Prix de lancement", desc: "-20% pour les premiers." }, { icon: "🎁", title: "Bonus exclusif", desc: "Un cadeau réservé aux early adopters." }] } },
      { id: uid(), type: "social-proof", visible: true, data: { title: "Déjà sur la liste", stats: [{ value: "1,200+", label: "Inscrits" }, { value: "23", label: "Pays" }], testimonials: [] } },
      { id: uid(), type: "cta", visible: true, data: { title: "Ne manquez pas le lancement", subtitle: "Inscription gratuite, sans engagement.", ctaText: "Rejoindre maintenant" } },
    ],
  },
];

export function getTemplateById(id: string): LandingTemplate | undefined {
  return LANDING_TEMPLATES.find((t) => t.id === id);
}

export function getDefaultSectionsForTemplate(templateId: string): LandingSection[] {
  const t = getTemplateById(templateId);
  if (!t) return LANDING_TEMPLATES[0].sections;
  // Deep clone to avoid mutations
  return JSON.parse(JSON.stringify(t.sections));
}
