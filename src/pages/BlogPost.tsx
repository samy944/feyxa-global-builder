import { useParams, Link } from "react-router-dom";
import { MarketLayout } from "@/components/market/MarketLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, User, BookOpen, ShoppingBag } from "lucide-react";
import { useSeoHead } from "@/hooks/useSeoHead";
import { BLOG_POSTS } from "./BlogIndex";

// Mock full content per slug
const BLOG_CONTENT: Record<string, string[]> = {
  "guide-demarrer-boutique-en-ligne": [
    "Lancer une boutique en ligne en Afrique n'a jamais été aussi accessible. Avec l'explosion du mobile money et l'augmentation constante de la connectivité, le e-commerce africain connaît une croissance exceptionnelle.",
    "## 1. Choisissez votre niche avec soin",
    "Avant de créer votre boutique, identifiez un segment de marché précis. Les vendeurs qui se concentrent sur une catégorie spécifique (mode traditionnelle, cosmétiques naturels, alimentation artisanale) performent mieux que les généralistes.",
    "## 2. Créez un catalogue attractif",
    "Vos photos produits sont votre vitrine. Investissez du temps dans la photographie : lumière naturelle, fond neutre, plusieurs angles. Une bonne photo peut multiplier vos ventes par 3.",
    "## 3. Fixez vos prix intelligemment",
    "Analysez la concurrence, calculez vos marges et n'oubliez pas d'intégrer les frais de livraison dans votre réflexion. Un prix trop bas peut nuire à votre image de marque.",
    "## 4. Configurez la livraison",
    "La logistique est souvent le maillon faible du e-commerce en Afrique. Proposez plusieurs options : livraison à domicile, points relais, retrait en boutique. Plus vous offrez de flexibilité, plus vous convertirez.",
    "## 5. Lancez et itérez",
    "Ne cherchez pas la perfection au lancement. Commencez avec quelques produits, récoltez les retours clients et améliorez votre offre progressivement. Le plus important est de commencer.",
  ],
  "tendances-mode-africaine-2026": [
    "La mode africaine ne cesse de se réinventer, mêlant traditions ancestrales et créativité contemporaine. En 2026, plusieurs tendances se démarquent sur les marketplaces du continent.",
    "## Le Wax revisité",
    "Le tissu wax reste une valeur sûre, mais les créateurs le réinventent avec des coupes modernes, des associations inattendues et des motifs minimalistes qui plaisent à une clientèle plus large.",
    "## Le Bogolan contemporain",
    "Ce textile malien traditionnel fait un retour en force. Teint à la boue et aux plantes, il séduit les consommateurs soucieux de durabilité et d'authenticité.",
    "## Les accessoires artisanaux",
    "Bijoux en bronze, sacs en raphia, sandales en cuir tanné… L'artisanat africain s'impose comme une alternative luxueuse et éthique à la fast fashion.",
    "## La mode unisexe",
    "Les frontières de genre s'estompent dans la mode africaine. Les créateurs proposent des pièces fluides et inclusives qui transcendent les catégories traditionnelles.",
  ],
};

// Default content for posts without specific content
const DEFAULT_CONTENT = [
  "Cet article explore en profondeur un sujet essentiel pour tout entrepreneur du e-commerce africain. Les tendances évoluent rapidement et il est crucial de rester informé.",
  "## Contexte et enjeux",
  "Le marché du commerce en ligne en Afrique représente une opportunité de plusieurs milliards de dollars. Avec une population jeune et connectée, le potentiel de croissance est immense.",
  "## Les bonnes pratiques",
  "Pour réussir, il faut combiner une exécution irréprochable avec une compréhension fine des habitudes de consommation locales. Chaque marché a ses spécificités.",
  "## Conclusion",
  "L'avenir du e-commerce africain est prometteur. En adoptant les bonnes stratégies et en restant à l'écoute de vos clients, vous pouvez bâtir un business durable et rentable.",
];

export default function BlogPost() {
  const { slug } = useParams();
  const post = BLOG_POSTS.find((p) => p.slug === slug);

  useSeoHead({
    title: post ? `${post.title} — Blog Feyxa` : "Article introuvable — Blog Feyxa",
    description: post?.excerpt || "Article du blog Feyxa",
  });

  if (!post) {
    return (
      <MarketLayout>
        <section className="py-20">
          <div className="container max-w-lg text-center space-y-6">
            <BookOpen size={48} className="mx-auto text-muted-foreground/30" />
            <h1 className="font-heading text-2xl">ARTICLE INTROUVABLE</h1>
            <Button variant="outline" asChild>
              <Link to="/blog"><ArrowLeft size={14} className="mr-1" /> Retour au blog</Link>
            </Button>
          </div>
        </section>
      </MarketLayout>
    );
  }

  const content = BLOG_CONTENT[post.slug] || DEFAULT_CONTENT;
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

  // Related posts (exclude current)
  const related = BLOG_POSTS.filter((p) => p.slug !== slug).slice(0, 3);

  return (
    <MarketLayout>
      <article className="py-12">
        <div className="container max-w-4xl">
          {/* Back */}
          <Link
            to="/blog"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
          >
            <ArrowLeft size={14} /> Retour au blog
          </Link>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            {/* Header */}
            <div className="space-y-4">
              <Badge variant="secondary">{post.category}</Badge>
              <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl leading-tight text-foreground tracking-wide">
                {post.title}
              </h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <User size={14} /> {post.author}
                </span>
                <span>{formatDate(post.date)}</span>
                <span className="flex items-center gap-1">
                  <Clock size={14} /> {post.readTime} min de lecture
                </span>
              </div>
            </div>

            {/* Hero image */}
            <div className="rounded-2xl overflow-hidden aspect-[21/9] bg-secondary">
              <img
                src={post.image}
                alt={post.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Content */}
            <div className="max-w-prose mx-auto space-y-6 py-8">
              {content.map((block, i) => {
                if (block.startsWith("## ")) {
                  return (
                    <h2 key={i} className="font-heading text-xl sm:text-2xl text-foreground tracking-wide mt-10 mb-4">
                      {block.replace("## ", "")}
                    </h2>
                  );
                }
                return (
                  <p key={i} className="text-base leading-relaxed text-muted-foreground">
                    {block}
                  </p>
                );
              })}
            </div>

            {/* CTA */}
            <div className="max-w-prose mx-auto bg-primary/5 border border-primary/20 rounded-2xl p-8 text-center space-y-3">
              <ShoppingBag size={28} className="mx-auto text-primary" />
              <h3 className="font-heading text-lg text-foreground">Prêt à vous lancer ?</h3>
              <p className="text-sm text-muted-foreground">
                Créez votre boutique en ligne gratuitement sur Feyxa et commencez à vendre dès aujourd'hui.
              </p>
              <Button variant="hero" size="sm" asChild>
                <Link to="/start">Créer ma boutique</Link>
              </Button>
            </div>

            {/* Related articles */}
            {related.length > 0 && (
              <div className="pt-12 border-t border-border space-y-6">
                <h3 className="font-heading text-xl text-foreground tracking-wide text-center">
                  ARTICLES SIMILAIRES
                </h3>
                <div className="grid sm:grid-cols-3 gap-6">
                  {related.map((r) => (
                    <Link
                      key={r.slug}
                      to={`/blog/${r.slug}`}
                      className="group block"
                    >
                      <div className="aspect-video rounded-xl overflow-hidden bg-secondary mb-3">
                        <img
                          src={r.image}
                          alt={r.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                      </div>
                      <Badge variant="secondary" className="text-xs mb-1.5">{r.category}</Badge>
                      <h4 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2">
                        {r.title}
                      </h4>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </article>
    </MarketLayout>
  );
}
