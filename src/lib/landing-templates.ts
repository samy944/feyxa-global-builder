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
  preview?: string; // preview color hint
  sections: LandingSection[];
  suggestedTheme?: {
    primaryColor: string;
    bgColor: string;
    textColor: string;
    radius: string;
    fontHeading: string;
    fontBody: string;
  };
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
  { type: "lead-capture", label: "Capture Lead", icon: "📧", category: "conversion", defaultData: { title: "Restez informé", placeholder: "Votre email", buttonText: "S'inscrire", incentive: "🎁 -10% offert" } },
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
  
  { type: "before-after", label: "Avant / Après", icon: "🔄", category: "advanced", defaultData: { title: "Résultats", beforeImage: "", afterImage: "", beforeLabel: "Avant", afterLabel: "Après" } },
  { type: "footer", label: "Pied de page", icon: "🔚", category: "essential", defaultData: { storeName: "Ma Boutique", description: "Votre boutique en ligne de confiance.", links: [{ label: "Mentions légales", href: "#" }, { label: "Politique de confidentialité", href: "#" }], phone: "", email: "", socials: { instagram: "", facebook: "", tiktok: "" } } },
];

export function getBlockDefinition(type: SectionType): BlockDefinition | undefined {
  return BLOCK_LIBRARY.find(b => b.type === type);
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

// =====================================================
// PREMIUM TEMPLATE HELPERS
// =====================================================

const makeHeader = (storeName: string, links: { label: string; href: string }[], ctaText = "Commander"): LandingSection => ({
  id: uid(), type: "header", visible: true,
  data: { logo: "", storeName, links, ctaText, ctaHref: "#cta" },
});

const makeFooter = (storeName: string, desc: string): LandingSection => ({
  id: uid(), type: "footer", visible: true,
  data: {
    storeName, description: desc,
    links: [{ label: "Mentions légales", href: "#" }, { label: "Confidentialité", href: "#" }, { label: "CGV", href: "#" }],
    phone: "", email: "", socials: { instagram: "", facebook: "", tiktok: "" },
  },
});

// =====================================================
// PREMIUM TEMPLATES
// =====================================================

export const LANDING_TEMPLATES: LandingTemplate[] = [
  // ─────────────────────────────────────────────
  // 1. LUXE NOIR — Produit premium, minimaliste
  // ─────────────────────────────────────────────
  {
    id: "luxe-noir",
    name: "Luxe Noir",
    description: "Design noir & or premium. Idéal pour produits haut de gamme, cosmétiques, bijoux.",
    icon: "✨",
    category: "Premium",
    preview: "#0a0a0a",
    suggestedTheme: {
      primaryColor: "#d4a853", bgColor: "#0a0a0a", textColor: "#f5f5f5",
      radius: "0rem", fontHeading: "Playfair Display", fontBody: "Lato",
    },
    sections: [
      makeHeader("MAISON ÉLITE", [
        { label: "Collection", href: "#products" }, { label: "Notre histoire", href: "#story" },
        { label: "Avis", href: "#reviews" }, { label: "Contact", href: "#contact" },
      ], "Découvrir"),
      {
        id: uid(), type: "hero", visible: true,
        data: {
          title: "L'élégance à l'état pur",
          subtitle: "Des pièces d'exception conçues pour ceux qui n'acceptent que le meilleur. Artisanat raffiné, matériaux nobles.",
          ctaText: "Découvrir la collection",
          imageUrl: "",
          _style: { paddingY: "120px", animation: "fadeIn", animDuration: 1.2 },
        },
      },
      {
        id: uid(), type: "stats", visible: true,
        data: {
          items: [
            { value: "10,000+", label: "Clients dans 23 pays" },
            { value: "4.9/5", label: "Note moyenne" },
            { value: "100%", label: "Artisanal" },
          ],
          _style: { paddingY: "60px" },
        },
      },
      {
        id: uid(), type: "benefits", visible: true,
        data: {
          title: "Pourquoi nous choisir",
          items: [
            { icon: "💎", title: "Matériaux nobles", desc: "Or 18 carats, cuir pleine fleur, pierres naturelles certifiées." },
            { icon: "✋", title: "Fait main", desc: "Chaque pièce est façonnée à la main par nos artisans experts." },
            { icon: "🌍", title: "Livraison monde entier", desc: "Expédition sécurisée et assurée dans plus de 50 pays." },
            { icon: "🔒", title: "Certificat d'authenticité", desc: "Chaque achat accompagné de son certificat numéroté." },
          ],
          _style: { paddingY: "80px", animation: "slideUp", animDuration: 0.8 },
        },
      },
      {
        id: uid(), type: "product-highlights", visible: true,
        data: { title: "Pièces iconiques", items: [], _style: { paddingY: "80px" } },
      },
      {
        id: uid(), type: "testimonials-grid", visible: true,
        data: {
          title: "Ce qu'en disent nos clients",
          items: [
            { name: "Sophie M.", text: "Un bijou extraordinaire. La finition est irréprochable, c'est au-delà de mes attentes.", rating: 5, avatar: "" },
            { name: "Karim B.", text: "Emballage luxueux, livraison rapide. L'expérience client est vraiment premium.", rating: 5, avatar: "" },
            { name: "Claire D.", text: "J'ai commandé 3 fois déjà. La qualité est constante et le service après-vente impeccable.", rating: 5, avatar: "" },
            { name: "Amadou T.", text: "Offert à ma femme pour notre anniversaire. Elle était émue. Merci !", rating: 5, avatar: "" },
          ],
          _style: { paddingY: "80px" },
        },
      },
      {
        id: uid(), type: "guarantee", visible: true,
        data: {
          title: "Garantie 2 ans", text: "Chaque création est garantie 2 ans. Réparation ou remplacement sans frais.",
          icon: "🛡️", _style: { paddingY: "60px" },
        },
      },
      {
        id: uid(), type: "cta", visible: true,
        data: {
          title: "Prêt à vivre l'excellence ?",
          subtitle: "Rejoignez les milliers de clients qui nous font confiance.",
          ctaText: "Découvrir maintenant",
          _style: { paddingY: "100px", animation: "fadeIn" },
        },
      },
      makeFooter("MAISON ÉLITE", "Luxe artisanal, livré dans le monde entier."),
    ],
  },

  // ─────────────────────────────────────────────
  // 2. TECH PRODUCT — Style Apple/Stripe
  // ─────────────────────────────────────────────
  {
    id: "tech-product",
    name: "Tech Product",
    description: "Style Apple/Stripe épuré. Parfait pour gadgets, SaaS, applications tech.",
    icon: "🚀",
    category: "Tech",
    preview: "#faf5ff",
    suggestedTheme: {
      primaryColor: "#7c3aed", bgColor: "#faf5ff", textColor: "#1e1b4b",
      radius: "0.75rem", fontHeading: "Space Grotesk", fontBody: "Inter",
    },
    sections: [
      makeHeader("TECHFLOW", [
        { label: "Fonctionnalités", href: "#features" }, { label: "Tarifs", href: "#pricing" },
        { label: "FAQ", href: "#faq" },
      ], "Essayer gratuitement"),
      {
        id: uid(), type: "announcement-bar", visible: true,
        data: { text: "🎉 Nouveau — Version 3.0 disponible avec l'IA intégrée !", _style: {} },
      },
      {
        id: uid(), type: "hero", visible: true,
        data: {
          title: "Automatisez votre business.\nFocalisez-vous sur l'essentiel.",
          subtitle: "L'outil tout-en-un qui gère vos ventes, votre marketing et votre logistique pendant que vous dormez.",
          ctaText: "Commencer gratuitement",
          imageUrl: "",
          _style: { paddingY: "100px", animation: "fadeIn", animDuration: 1 },
        },
      },
      {
        id: uid(), type: "trust-badges", visible: true,
        data: {
          items: [
            { icon: "⚡", label: "Setup en 5 min" },
            { icon: "🔒", label: "SSL inclus" },
            { icon: "📊", label: "Analytics temps réel" },
            { icon: "🤖", label: "IA intégrée" },
          ],
          _style: { paddingY: "40px" },
        },
      },
      {
        id: uid(), type: "benefits", visible: true,
        data: {
          title: "Tout ce dont vous avez besoin",
          items: [
            { icon: "📦", title: "Gestion des stocks", desc: "Suivi en temps réel, alertes de stock bas, synchronisation multi-canaux." },
            { icon: "📈", title: "Analytics puissants", desc: "Tableaux de bord clairs, métriques de conversion, attribution marketing." },
            { icon: "🤖", title: "IA pour vendre plus", desc: "Recommandations personnalisées, descriptions auto-générées, pricing dynamique." },
            { icon: "🚚", title: "Logistique intégrée", desc: "Suivi des colis, estimation de livraison, notifications clients automatiques." },
            { icon: "💳", title: "Paiements multi-devises", desc: "Mobile Money, carte bancaire, PayPal. Plus de 15 moyens de paiement." },
            { icon: "🎯", title: "Marketing automation", desc: "Emails, SMS, WhatsApp automatisés selon le comportement client." },
          ],
          _style: { paddingY: "80px", animation: "slideUp" },
        },
      },
      {
        id: uid(), type: "comparison-table", visible: true,
        data: {
          title: "Pourquoi nous, pas les autres ?",
          headers: ["Fonctionnalité", "TechFlow", "Concurrent A", "Concurrent B"],
          rows: [
            ["IA intégrée", "✅ Inclus", "❌ Addon payant", "❌ Non disponible"],
            ["Mobile Money", "✅ Natif", "❌ Non", "⚠️ Via plugin"],
            ["Landing pages", "✅ Illimitées", "⚠️ 3 max", "❌ Non"],
            ["Support 24/7", "✅ Oui", "⚠️ Email seul", "⚠️ Horaires limités"],
            ["Prix de départ", "✅ Gratuit", "💰 29€/mois", "💰 49€/mois"],
          ],
          _style: { paddingY: "60px" },
        },
      },
      {
        id: uid(), type: "pricing", visible: true,
        data: {
          title: "Des prix simples et transparents",
          items: [
            { name: "Starter", price: 0, features: ["100 produits", "Landing pages illimitées", "Analytics de base", "Support communautaire"], highlight: false },
            { name: "Pro", price: 19900, features: ["Produits illimités", "IA intégrée", "Analytics avancés", "Support prioritaire", "Domaine personnalisé", "Marketing automation"], highlight: true },
            { name: "Enterprise", price: 49900, features: ["Tout de Pro", "API complète", "Manager dédié", "SLA garanti", "Formation équipe", "Intégrations sur mesure"], highlight: false },
          ],
          _style: { paddingY: "80px" },
        },
      },
      {
        id: uid(), type: "social-proof", visible: true,
        data: {
          title: "Ils ont choisi TechFlow",
          stats: [
            { value: "12,000+", label: "Boutiques actives" },
            { value: "2.5M", label: "Commandes traitées" },
            { value: "32", label: "Pays" },
          ],
          testimonials: [
            { name: "Fatou N.", text: "On est passé de 0 à 500 ventes/mois en 3 mois. L'outil est incroyable.", rating: 5 },
            { name: "Jean-Marc K.", text: "L'IA génère mes descriptions produits mieux que moi. Gain de temps énorme.", rating: 5 },
          ],
          _style: { paddingY: "80px" },
        },
      },
      {
        id: uid(), type: "faq", visible: true,
        data: {
          title: "Questions fréquentes",
          items: [
            { q: "Puis-je essayer gratuitement ?", a: "Oui ! Le plan Starter est 100% gratuit, sans carte bancaire requise. Vous pouvez upgrader à tout moment." },
            { q: "Comment fonctionne le paiement Mobile Money ?", a: "Nous supportons Orange Money, MTN Mobile Money, Wave et bien d'autres. L'intégration est automatique." },
            { q: "Puis-je migrer depuis une autre plateforme ?", a: "Absolument. Notre outil d'import supporte CSV, Shopify, WooCommerce. Migration assistée gratuite pour les plans Pro." },
            { q: "Y a-t-il une commission sur les ventes ?", a: "Non. Vous gardez 100% de vos revenus. Nous facturons uniquement l'abonnement mensuel." },
          ],
          _style: { paddingY: "80px" },
        },
      },
      {
        id: uid(), type: "cta", visible: true,
        data: {
          title: "Lancez votre boutique en 5 minutes",
          subtitle: "Rejoignez 12,000+ entrepreneurs qui scalent avec TechFlow.",
          ctaText: "Créer mon compte gratuit",
          _style: { paddingY: "100px", animation: "fadeIn" },
        },
      },
      makeFooter("TECHFLOW", "L'outil #1 pour les entrepreneurs ambitieux."),
    ],
  },

  // ─────────────────────────────────────────────
  // 3. FASHION DROP — Streetwear / Mode
  // ─────────────────────────────────────────────
  {
    id: "fashion-drop",
    name: "Fashion Drop",
    description: "Design urbain et contrasté. Idéal pour lancement de collection, streetwear, sneakers.",
    icon: "🔥",
    category: "Mode",
    preview: "#18181b",
    suggestedTheme: {
      primaryColor: "#ef4444", bgColor: "#18181b", textColor: "#fafafa",
      radius: "0.5rem", fontHeading: "Oswald", fontBody: "Inter",
    },
    sections: [
      makeHeader("URBAN DRIP", [
        { label: "Collection", href: "#collection" }, { label: "Lookbook", href: "#gallery" },
        { label: "Avis", href: "#reviews" },
      ], "Shop now"),
      {
        id: uid(), type: "announcement-bar", visible: true,
        data: { text: "🔥 DROP EXCLUSIF — STOCKS ULTRA-LIMITÉS 🔥" },
      },
      {
        id: uid(), type: "hero", visible: true,
        data: {
          title: "DROP 07.\nNE DORMEZ PAS DESSUS.",
          subtitle: "Collection capsule limitée à 200 pièces. Quand c'est parti, c'est parti.",
          ctaText: "SHOPPER MAINTENANT",
          imageUrl: "",
          _style: { paddingY: "120px", animation: "fadeIn", animDuration: 0.8 },
        },
      },
      {
        id: uid(), type: "countdown", visible: true,
        data: {
          title: "Le drop ferme dans",
          endDate: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
          _style: { paddingY: "40px" },
        },
      },
      {
        id: uid(), type: "product-highlights", visible: true,
        data: { title: "PIÈCES DU DROP", items: [], _style: { paddingY: "60px" } },
      },
      {
        id: uid(), type: "gallery", visible: true,
        data: { title: "LOOKBOOK", images: [], _style: { paddingY: "60px" } },
      },
      {
        id: uid(), type: "stats", visible: true,
        data: {
          items: [
            { value: "200", label: "Pièces produites" },
            { value: "87%", label: "Déjà vendues" },
            { value: "0", label: "Réassort prévu" },
          ],
          _style: { paddingY: "60px" },
        },
      },
      {
        id: uid(), type: "testimonials-grid", visible: true,
        data: {
          title: "ILS PORTENT URBAN DRIP",
          items: [
            { name: "Yves K.", text: "La qualité des tissus est insane. Les coupes sont parfaites.", rating: 5, avatar: "" },
            { name: "Awa S.", text: "J'ai reçu plein de compliments dès le premier jour. Les gens veulent savoir d'où ça vient.", rating: 5, avatar: "" },
            { name: "Marcus J.", text: "Le hoodie oversize est devenu mon daily. Tissu épais, coupe clean. 10/10.", rating: 5, avatar: "" },
          ],
          _style: { paddingY: "60px" },
        },
      },
      {
        id: uid(), type: "trust-badges", visible: true,
        data: {
          items: [
            { icon: "📦", label: "Livraison express 48h" },
            { icon: "🔄", label: "Retours gratuits 14j" },
            { icon: "🧵", label: "100% Coton Premium" },
            { icon: "🏷️", label: "Édition limitée" },
          ],
          _style: { paddingY: "40px" },
        },
      },
      {
        id: uid(), type: "cta", visible: true,
        data: {
          title: "LAST CALL.",
          subtitle: "Stocks quasi épuisés. Ne regrettez pas.",
          ctaText: "COMMANDER MAINTENANT",
          _style: { paddingY: "100px", animation: "zoom" },
        },
      },
      makeFooter("URBAN DRIP", "Streetwear premium. Éditions limitées."),
    ],
  },

  // ─────────────────────────────────────────────
  // 4. BEAUTY & WELLNESS — Rose / Cosmétiques
  // ─────────────────────────────────────────────
  {
    id: "beauty-glow",
    name: "Beauty Glow",
    description: "Esthétique douce et féminine. Parfait pour cosmétiques, soins, beauté naturelle.",
    icon: "🌸",
    category: "Beauté",
    preview: "#fff1f2",
    suggestedTheme: {
      primaryColor: "#e11d48", bgColor: "#fff1f2", textColor: "#4c0519",
      radius: "1rem", fontHeading: "Cormorant Garamond", fontBody: "Lato",
    },
    sections: [
      makeHeader("GLOW STUDIO", [
        { label: "Nos soins", href: "#products" }, { label: "Avant/Après", href: "#results" },
        { label: "Témoignages", href: "#reviews" }, { label: "FAQ", href: "#faq" },
      ], "Commander"),
      {
        id: uid(), type: "hero", visible: true,
        data: {
          title: "Révélez votre éclat naturel",
          subtitle: "Des soins formulés avec des ingrédients 100% naturels, testés dermatologiquement. Votre peau mérite le meilleur.",
          ctaText: "Découvrir nos soins",
          imageUrl: "",
          _style: { paddingY: "100px", animation: "fadeIn", animDuration: 1.2 },
        },
      },
      {
        id: uid(), type: "trust-badges", visible: true,
        data: {
          items: [
            { icon: "🌿", label: "100% Naturel" },
            { icon: "🐰", label: "Cruelty Free" },
            { icon: "🧪", label: "Testé dermato" },
            { icon: "♻️", label: "Packaging recyclé" },
          ],
          _style: { paddingY: "40px" },
        },
      },
      {
        id: uid(), type: "benefits", visible: true,
        data: {
          title: "La science au service de votre beauté",
          items: [
            { icon: "🌺", title: "Ingrédients actifs", desc: "Acide hyaluronique, vitamine C, beurre de karité bio. Chaque formule est pensée pour des résultats visibles." },
            { icon: "✨", title: "Résultats en 14 jours", desc: "93% de nos clientes observent une amélioration visible de leur peau en seulement 2 semaines." },
            { icon: "💧", title: "Hydratation intense", desc: "Notre technologie brevetée retient l'hydratation 3x plus longtemps que les crèmes classiques." },
          ],
          _style: { paddingY: "80px", animation: "slideUp" },
        },
      },
      {
        id: uid(), type: "before-after", visible: true,
        data: {
          title: "Résultats réels, clients réels",
          beforeImage: "", afterImage: "",
          beforeLabel: "Jour 1", afterLabel: "Jour 30",
          _style: { paddingY: "60px" },
        },
      },
      {
        id: uid(), type: "product-highlights", visible: true,
        data: { title: "Nos best-sellers", items: [], _style: { paddingY: "80px" } },
      },
      {
        id: uid(), type: "social-proof", visible: true,
        data: {
          title: "Elles adorent Glow Studio",
          stats: [
            { value: "15,000+", label: "Clientes satisfaites" },
            { value: "4.9/5", label: "Note Trustpilot" },
            { value: "93%", label: "Rachètent" },
          ],
          testimonials: [
            { name: "Aïcha M.", text: "Ma peau n'a jamais été aussi douce. Je ne jure plus que par cette marque.", rating: 5 },
            { name: "Isabelle R.", text: "Le sérum vitamine C a transformé mon teint. Mes amies me demandent mon secret !", rating: 5 },
            { name: "Nadège K.", text: "Enfin des produits naturels qui fonctionnent VRAIMENT. Et le packaging est magnifique.", rating: 5 },
          ],
          _style: { paddingY: "80px" },
        },
      },
      {
        id: uid(), type: "faq", visible: true,
        data: {
          title: "Vos questions",
          items: [
            { q: "Les produits conviennent-ils aux peaux sensibles ?", a: "Oui ! Tous nos soins sont testés dermatologiquement et hypoallergéniques. Sans parabènes, sans sulfates." },
            { q: "Quel est le délai de livraison ?", a: "Livraison sous 48h en zone urbaine, 3-5 jours pour le reste du pays. Livraison gratuite dès 20 000 FCFA." },
            { q: "Proposez-vous des échantillons ?", a: "Oui ! Un kit découverte est disponible à 5 000 FCFA avec 4 mini-soins pour tester avant de commander." },
          ],
          _style: { paddingY: "60px" },
        },
      },
      {
        id: uid(), type: "lead-capture", visible: true,
        data: {
          title: "Recevez -15% sur votre première commande",
          placeholder: "Votre email",
          buttonText: "Je m'inscris",
          incentive: "🎁 + Un guide beauté offert",
          _style: { paddingY: "60px" },
        },
      },
      {
        id: uid(), type: "cta", visible: true,
        data: {
          title: "Votre routine beauté commence ici",
          subtitle: "Livraison gratuite • Satisfaite ou remboursée • 100% Naturel",
          ctaText: "Commander maintenant",
          _style: { paddingY: "80px", animation: "fadeIn" },
        },
      },
      makeFooter("GLOW STUDIO", "Beauté naturelle, résultats prouvés."),
    ],
  },

  // ─────────────────────────────────────────────
  // 5. FOOD & DELIVERY — Alimentation / Resto
  // ─────────────────────────────────────────────
  {
    id: "food-delivery",
    name: "Food & Delivery",
    description: "Chaleureux et appétissant. Pour restaurants, traiteurs, épiceries en ligne.",
    icon: "🍽️",
    category: "Food",
    preview: "#fffbf5",
    suggestedTheme: {
      primaryColor: "#ea580c", bgColor: "#fffbf5", textColor: "#431407",
      radius: "0.75rem", fontHeading: "DM Sans", fontBody: "DM Sans",
    },
    sections: [
      makeHeader("SAVEURS D'ICI", [
        { label: "Menu", href: "#products" }, { label: "Avis", href: "#reviews" },
        { label: "Livraison", href: "#delivery" }, { label: "Contact", href: "#contact" },
      ], "Commander"),
      {
        id: uid(), type: "hero", visible: true,
        data: {
          title: "Des plats faits maison,\nlivrés chez vous",
          subtitle: "Cuisinés chaque jour avec des ingrédients frais et locaux. Commandez avant 11h, mangez à midi.",
          ctaText: "Voir le menu du jour",
          imageUrl: "",
          _style: { paddingY: "100px", animation: "fadeIn" },
        },
      },
      {
        id: uid(), type: "trust-badges", visible: true,
        data: {
          items: [
            { icon: "🕐", label: "Livraison en 30 min" },
            { icon: "🌿", label: "Ingrédients frais" },
            { icon: "👨‍🍳", label: "Chef expérimenté" },
            { icon: "💳", label: "Paiement à la livraison" },
          ],
        },
      },
      {
        id: uid(), type: "product-highlights", visible: true,
        data: { title: "Les favoris de nos clients", items: [], _style: { paddingY: "60px" } },
      },
      {
        id: uid(), type: "columns", visible: true,
        data: {
          title: "Comment ça marche",
          cols: 3,
          items: [
            { title: "1. Choisissez", content: "Parcourez notre menu et sélectionnez vos plats préférés." },
            { title: "2. Commandez", content: "Validez via WhatsApp ou directement sur le site. Paiement sécurisé." },
            { title: "3. Savourez", content: "Livraison rapide à domicile ou au bureau. Bon appétit !" },
          ],
          _style: { paddingY: "60px", animation: "slideUp" },
        },
      },
      {
        id: uid(), type: "social-proof", visible: true,
        data: {
          title: "Ce qu'ils en disent",
          stats: [
            { value: "5,000+", label: "Repas livrés/mois" },
            { value: "4.8/5", label: "Satisfaction" },
            { value: "25 min", label: "Livraison moyenne" },
          ],
          testimonials: [
            { name: "Franck O.", text: "Le meilleur ndolé que j'ai mangé hors de chez ma mère. Sérieusement.", rating: 5 },
            { name: "Linda A.", text: "Je commande tous les midis au bureau. C'est devenu notre cantine !", rating: 5 },
          ],
          _style: { paddingY: "60px" },
        },
      },
      {
        id: uid(), type: "faq", visible: true,
        data: {
          title: "Questions fréquentes",
          items: [
            { q: "Quelles sont vos zones de livraison ?", a: "Nous livrons dans toute la ville et ses environs. Vérifiez votre éligibilité lors de la commande." },
            { q: "Acceptez-vous le paiement à la livraison ?", a: "Oui ! Cash, Mobile Money (Orange, MTN, Wave) et carte bancaire acceptés." },
            { q: "Le menu change-t-il chaque jour ?", a: "Oui, notre chef compose un menu frais chaque matin avec les meilleurs ingrédients du marché." },
          ],
        },
      },
      {
        id: uid(), type: "cta", visible: true,
        data: {
          title: "Faim ? On s'en occupe.",
          subtitle: "Commandez maintenant et recevez votre repas en 30 minutes.",
          ctaText: "Commander maintenant",
          _style: { paddingY: "80px" },
        },
      },
      makeFooter("SAVEURS D'ICI", "Cuisine authentique livrée à votre porte."),
    ],
  },

  // ─────────────────────────────────────────────
  // 6. AFRO BOLD — Marque africaine audacieuse
  // ─────────────────────────────────────────────
  {
    id: "afro-bold",
    name: "Afro Bold",
    description: "Audacieux et vibrant. Pour marques africaines fières, artisanat, culture.",
    icon: "🌍",
    category: "Culture",
    preview: "#1a0a2e",
    suggestedTheme: {
      primaryColor: "#f59e0b", bgColor: "#1a0a2e", textColor: "#fef3c7",
      radius: "0.75rem", fontHeading: "Clash Display", fontBody: "Manrope",
    },
    sections: [
      makeHeader("ROOTS & CRAFT", [
        { label: "Nos créations", href: "#products" }, { label: "Notre histoire", href: "#story" },
        { label: "Avis", href: "#reviews" },
      ], "Découvrir"),
      {
        id: uid(), type: "hero", visible: true,
        data: {
          title: "L'Afrique crée.\nLe monde s'inspire.",
          subtitle: "Artisanat d'exception, design contemporain, fierté locale. Chaque pièce raconte une histoire.",
          ctaText: "Explorer nos créations",
          imageUrl: "",
          _style: { paddingY: "120px", animation: "fadeIn", animDuration: 1.2 },
        },
      },
      {
        id: uid(), type: "stats", visible: true,
        data: {
          items: [
            { value: "500+", label: "Artisans partenaires" },
            { value: "12", label: "Pays représentés" },
            { value: "100%", label: "Commerce équitable" },
          ],
        },
      },
      {
        id: uid(), type: "benefits", visible: true,
        data: {
          title: "Notre philosophie",
          items: [
            { icon: "🤝", title: "Commerce équitable", desc: "Chaque artisan est rémunéré justement. Transparence totale sur la chaîne de production." },
            { icon: "🎨", title: "Design unique", desc: "Fusion entre savoir-faire ancestral et esthétique contemporaine. Aucune pièce identique." },
            { icon: "🌍", title: "Impact positif", desc: "10% des revenus financent l'éducation dans les communautés d'artisans." },
          ],
          _style: { paddingY: "80px", animation: "slideUp" },
        },
      },
      {
        id: uid(), type: "product-highlights", visible: true,
        data: { title: "Créations phares", items: [], _style: { paddingY: "80px" } },
      },
      {
        id: uid(), type: "gallery", visible: true,
        data: { title: "Nos artisans en action", images: [], _style: { paddingY: "60px" } },
      },
      {
        id: uid(), type: "testimonials-grid", visible: true,
        data: {
          title: "La communauté en parle",
          items: [
            { name: "Chimamanda A.", text: "Porter ces créations, c'est porter un héritage. La qualité est extraordinaire.", rating: 5, avatar: "" },
            { name: "Omar S.", text: "J'ai offert un sac à ma sœur à Paris. Elle reçoit des compliments tous les jours.", rating: 5, avatar: "" },
          ],
          _style: { paddingY: "60px" },
        },
      },
      {
        id: uid(), type: "cta", visible: true,
        data: {
          title: "Portez l'Afrique avec fierté",
          subtitle: "Livraison internationale • Commerce équitable • Pièces uniques",
          ctaText: "Découvrir la collection",
          _style: { paddingY: "100px", animation: "fadeIn" },
        },
      },
      makeFooter("ROOTS & CRAFT", "Artisanat africain d'excellence."),
    ],
  },

  // ─────────────────────────────────────────────
  // 7. PROMO FLASH — Urgence maximale
  // ─────────────────────────────────────────────
  {
    id: "promo-flash",
    name: "Promo Flash",
    description: "Urgence et rareté. Parfait pour ventes flash, Black Friday, liquidation.",
    icon: "⚡",
    category: "Promo",
    preview: "#fef2f2",
    suggestedTheme: {
      primaryColor: "#dc2626", bgColor: "#fef2f2", textColor: "#1c1917",
      radius: "0.75rem", fontHeading: "Plus Jakarta Sans", fontBody: "Plus Jakarta Sans",
    },
    sections: [
      makeHeader("MEGA DEAL", [
        { label: "Offres", href: "#products" }, { label: "Avis", href: "#reviews" },
      ], "PROFITER -50%"),
      {
        id: uid(), type: "announcement-bar", visible: true,
        data: { text: "⚡ VENTE FLASH — Jusqu'à -50% pendant 48h seulement ⚡" },
      },
      {
        id: uid(), type: "hero", visible: true,
        data: {
          title: "VENTE FLASH\n-50% SUR TOUT",
          subtitle: "48 heures. Pas de réassort. Quand c'est fini, c'est fini.",
          ctaText: "VOIR LES OFFRES",
          imageUrl: "",
          _style: { paddingY: "80px", animation: "zoom", animDuration: 0.6 },
        },
      },
      {
        id: uid(), type: "countdown", visible: true,
        data: {
          title: "L'offre se termine dans",
          endDate: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
          _style: { paddingY: "40px" },
        },
      },
      {
        id: uid(), type: "product-highlights", visible: true,
        data: { title: "En promo maintenant", items: [], _style: { paddingY: "60px" } },
      },
      {
        id: uid(), type: "stats", visible: true,
        data: {
          items: [
            { value: "847", label: "Articles vendus aujourd'hui" },
            { value: "-50%", label: "Réduction max" },
            { value: "48h", label: "Temps restant" },
          ],
        },
      },
      {
        id: uid(), type: "social-proof", visible: true,
        data: {
          title: "Ils ont profité de nos promos",
          stats: [], testimonials: [
            { name: "Moussa D.", text: "J'ai économisé 35 000 FCFA sur ma commande. Les prix sont vraiment cassés !", rating: 5 },
            { name: "Grace T.", text: "Livraison ultra rapide et les produits sont exactement comme décrits.", rating: 5 },
          ],
          _style: { paddingY: "60px" },
        },
      },
      {
        id: uid(), type: "guarantee", visible: true,
        data: {
          title: "Satisfait ou remboursé",
          text: "Même en promo, notre garantie reste valable. Retour gratuit sous 14 jours.",
          icon: "🛡️",
        },
      },
      {
        id: uid(), type: "sticky-cta", visible: true,
        data: { text: "⚡ Promo Flash -50%", ctaText: "J'en profite", price: "" },
      },
      {
        id: uid(), type: "cta", visible: true,
        data: {
          title: "NE RATEZ PAS ÇA.",
          subtitle: "Stocks limités. Prix jamais vus. C'est maintenant ou jamais.",
          ctaText: "COMMANDER MAINTENANT",
          _style: { paddingY: "80px", animation: "bounce" },
        },
      },
      makeFooter("MEGA DEAL", "Les meilleures offres, les meilleurs prix."),
    ],
  },

  // ─────────────────────────────────────────────
  // 8. MINIMALIST — Ultra-épuré
  // ─────────────────────────────────────────────
  {
    id: "minimalist-pure",
    name: "Minimalist Pure",
    description: "Ultra-épuré, noir & blanc. Pour marques design, portfolio, produits lifestyle.",
    icon: "⬛",
    category: "Design",
    preview: "#fafafa",
    suggestedTheme: {
      primaryColor: "#171717", bgColor: "#fafafa", textColor: "#171717",
      radius: "0.25rem", fontHeading: "Space Grotesk", fontBody: "Inter",
    },
    sections: [
      makeHeader("STUDIO", [
        { label: "Produits", href: "#products" }, { label: "À propos", href: "#about" },
      ], "Commander"),
      {
        id: uid(), type: "hero", visible: true,
        data: {
          title: "Less is more.",
          subtitle: "Des objets essentiels, pensés pour durer. Design intemporel, qualité sans compromis.",
          ctaText: "Explorer",
          imageUrl: "",
          _style: { paddingY: "140px", animation: "fadeIn", animDuration: 1.5 },
        },
      },
      {
        id: uid(), type: "product-highlights", visible: true,
        data: { title: "", items: [], _style: { paddingY: "80px" } },
      },
      {
        id: uid(), type: "columns", visible: true,
        data: {
          title: "Philosophie",
          cols: 2,
          items: [
            { title: "Design intentionnel", content: "Chaque produit naît d'un besoin réel. Pas de superflu, pas de tendances éphémères. Juste l'essentiel, magnifié." },
            { title: "Durabilité", content: "Matériaux premium, finitions impeccables. Nos produits sont conçus pour traverser le temps sans vieillir." },
          ],
          _style: { paddingY: "80px" },
        },
      },
      {
        id: uid(), type: "testimonials-grid", visible: true,
        data: {
          title: "",
          items: [
            { name: "Thomas R.", text: "L'attention aux détails est remarquable. On sent le soin apporté à chaque finition.", rating: 5, avatar: "" },
            { name: "Nadia F.", text: "Simple, beau, fonctionnel. Exactement ce que je cherchais.", rating: 5, avatar: "" },
          ],
          _style: { paddingY: "60px" },
        },
      },
      {
        id: uid(), type: "cta", visible: true,
        data: {
          title: "Commencer.",
          subtitle: "",
          ctaText: "Découvrir",
          _style: { paddingY: "120px" },
        },
      },
      makeFooter("STUDIO", "Design essentiel."),
    ],
  },

  // ─────────────────────────────────────────────
  // 9. LEAD CAPTURE — Capture de contacts
  // ─────────────────────────────────────────────
  {
    id: "lead-capture",
    name: "Lead Capture",
    description: "Collecte d'emails/WhatsApp optimisée. Pour pré-lancements, newsletters, communautés.",
    icon: "📧",
    category: "Lead",
    preview: "#f0f9ff",
    suggestedTheme: {
      primaryColor: "#0284c7", bgColor: "#f0f9ff", textColor: "#0c4a6e",
      radius: "1rem", fontHeading: "Plus Jakarta Sans", fontBody: "Plus Jakarta Sans",
    },
    sections: [
      makeHeader("EARLY ACCESS", [
        { label: "Avantages", href: "#benefits" }, { label: "Communauté", href: "#community" },
      ], "S'inscrire"),
      {
        id: uid(), type: "hero", visible: true,
        data: {
          title: "Soyez les premiers\nà découvrir l'avenir",
          subtitle: "Inscrivez-vous maintenant pour un accès prioritaire et -20% sur votre première commande.",
          ctaText: "Rejoindre la waitlist",
          imageUrl: "",
          _style: { paddingY: "100px", animation: "fadeIn" },
        },
      },
      {
        id: uid(), type: "lead-capture", visible: true,
        data: {
          title: "+8,000 personnes ont déjà rejoint",
          placeholder: "Votre email ou numéro WhatsApp",
          buttonText: "M'inscrire gratuitement",
          incentive: "🎁 -20% offert + accès VIP",
          _style: { paddingY: "40px" },
        },
      },
      {
        id: uid(), type: "benefits", visible: true,
        data: {
          title: "Ce que vous recevrez",
          items: [
            { icon: "🔔", title: "Accès anticipé", desc: "Soyez informé avant tout le monde des nouveaux produits et collections." },
            { icon: "💰", title: "Prix exclusifs", desc: "Des réductions réservées uniquement aux membres de la communauté." },
            { icon: "📱", title: "Contenu VIP", desc: "Coulisses, conseils d'experts et contenus exclusifs chaque semaine." },
          ],
          _style: { paddingY: "60px", animation: "slideUp" },
        },
      },
      {
        id: uid(), type: "social-proof", visible: true,
        data: {
          title: "Ils ont rejoint la communauté",
          stats: [
            { value: "8,200+", label: "Inscrits" },
            { value: "98%", label: "Taux d'ouverture" },
            { value: "45", label: "Pays" },
          ],
          testimonials: [
            { name: "Fatou D.", text: "Les offres early access sont incroyables. J'ai économisé plus de 40 000 FCFA !", rating: 5 },
          ],
          _style: { paddingY: "60px" },
        },
      },
      {
        id: uid(), type: "cta", visible: true,
        data: {
          title: "Rejoignez le mouvement",
          subtitle: "Gratuit. Sans engagement. Désinscription en 1 clic.",
          ctaText: "Je m'inscris maintenant",
          _style: { paddingY: "80px" },
        },
      },
      makeFooter("EARLY ACCESS", "Votre communauté avant tout."),
    ],
  },

  // ─────────────────────────────────────────────
  // 10. ONE PRODUCT — Focus mono-produit
  // ─────────────────────────────────────────────
  {
    id: "one-product",
    name: "One Product",
    description: "Mono-produit optimisé conversion. Structure de vente éprouvée avec preuves sociales.",
    icon: "🎯",
    category: "Produit",
    preview: "#ffffff",
    suggestedTheme: {
      primaryColor: "#3b82f6", bgColor: "#ffffff", textColor: "#0f172a",
      radius: "0.75rem", fontHeading: "Plus Jakarta Sans", fontBody: "Plus Jakarta Sans",
    },
    sections: [
      makeHeader("MA BOUTIQUE", [
        { label: "Avantages", href: "#benefits" }, { label: "Avis", href: "#reviews" },
        { label: "FAQ", href: "#faq" },
      ], "Commander"),
      {
        id: uid(), type: "hero", visible: true,
        data: {
          title: "Le produit qui va\nchanger votre quotidien",
          subtitle: "Rejoignez les 5 000+ clients qui ont déjà transformé leur vie avec notre produit phare.",
          ctaText: "Commander maintenant",
          imageUrl: "",
          _style: { paddingY: "100px", animation: "fadeIn" },
        },
      },
      {
        id: uid(), type: "trust-badges", visible: true,
        data: {
          items: [
            { icon: "🔒", label: "Paiement sécurisé" },
            { icon: "🚚", label: "Livraison 48h" },
            { icon: "↩️", label: "Retour gratuit 30j" },
            { icon: "💎", label: "Qualité certifiée" },
          ],
        },
      },
      {
        id: uid(), type: "benefits", visible: true,
        data: {
          title: "Pourquoi ce produit est différent",
          items: [
            { icon: "⚡", title: "Résultats immédiats", desc: "Conçu pour un impact visible dès la première utilisation." },
            { icon: "🏆", title: "N°1 des ventes", desc: "Le produit le plus vendu de sa catégorie depuis 18 mois consécutifs." },
            { icon: "🌟", title: "5,000+ avis positifs", desc: "Une communauté de clients satisfaits qui ne cesse de grandir." },
          ],
          _style: { paddingY: "80px", animation: "slideUp" },
        },
      },
      {
        id: uid(), type: "social-proof", visible: true,
        data: {
          title: "Ce que disent nos clients",
          stats: [
            { value: "5,200+", label: "Clients satisfaits" },
            { value: "4.9/5", label: "Note moyenne" },
            { value: "97%", label: "Recommandent" },
          ],
          testimonials: [
            { name: "Aminata K.", text: "Honnêtement sceptique au début, mais le résultat est bluffant. Je recommande à 100%.", rating: 5 },
            { name: "Pierre M.", text: "Commande lundi, reçu mercredi. Qualité conforme à la description. Parfait.", rating: 5 },
          ],
          _style: { paddingY: "80px" },
        },
      },
      {
        id: uid(), type: "faq", visible: true,
        data: {
          title: "Questions fréquentes",
          items: [
            { q: "Quels sont les délais de livraison ?", a: "Livraison sous 48h en zone urbaine, 3-5 jours ouvrés pour les autres régions." },
            { q: "Puis-je retourner le produit ?", a: "Oui, vous bénéficiez de 30 jours pour retourner le produit si vous n'êtes pas satisfait. Remboursement intégral." },
            { q: "Le paiement est-il sécurisé ?", a: "Absolument. Nous acceptons Mobile Money, carte bancaire et paiement à la livraison." },
            { q: "Proposez-vous des réductions pour les commandes groupées ?", a: "Oui ! Contactez-nous sur WhatsApp pour des tarifs préférentiels à partir de 5 unités." },
          ],
          _style: { paddingY: "60px" },
        },
      },
      {
        id: uid(), type: "guarantee", visible: true,
        data: {
          title: "Garantie satisfait ou remboursé",
          text: "Nous croyons tellement en notre produit que nous vous offrons 30 jours pour le tester. Pas satisfait ? Remboursement intégral, sans questions.",
          icon: "🛡️",
          _style: { paddingY: "60px" },
        },
      },
      {
        id: uid(), type: "cta", visible: true,
        data: {
          title: "Prêt à essayer ?",
          subtitle: "Commandez maintenant et recevez votre produit sous 48h.",
          ctaText: "Commander maintenant",
          _style: { paddingY: "80px", animation: "fadeIn" },
        },
      },
      makeFooter("MA BOUTIQUE", "Votre satisfaction est notre priorité."),
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
