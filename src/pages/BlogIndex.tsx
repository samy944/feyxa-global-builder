import { Link } from "react-router-dom";
import { MarketLayout } from "@/components/market/MarketLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { BookOpen, Clock, ArrowRight } from "lucide-react";
import { useSeoHead } from "@/hooks/useSeoHead";

const BLOG_POSTS = [
  {
    slug: "guide-demarrer-boutique-en-ligne",
    title: "Le guide ultime pour démarrer votre boutique en ligne en Afrique",
    excerpt: "Découvrez les étapes essentielles pour lancer votre e-commerce, de la création du catalogue à la première vente.",
    category: "Guide",
    image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=450&fit=crop",
    date: "2026-02-20",
    readTime: 8,
    author: "Équipe Feyxa",
  },
  {
    slug: "tendances-mode-africaine-2026",
    title: "Tendances mode africaine : ce qui va cartonner en 2026",
    excerpt: "Wax, bogolan, tie-dye moderne… Les tendances textiles africaines qui conquièrent le monde cette année.",
    category: "Mode",
    image: "https://images.unsplash.com/photo-1523381294911-8d3cead13475?w=800&h=450&fit=crop",
    date: "2026-02-15",
    readTime: 5,
    author: "Aïcha N.",
  },
  {
    slug: "optimiser-taux-conversion-marketplace",
    title: "5 astuces pour booster votre taux de conversion sur une marketplace",
    excerpt: "Améliorez vos fiches produits, photos et descriptions pour transformer plus de visiteurs en acheteurs.",
    category: "Marketing",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=450&fit=crop",
    date: "2026-02-10",
    readTime: 6,
    author: "Koffi D.",
  },
  {
    slug: "livraison-derniere-mile-afrique",
    title: "Logistique du dernier kilomètre : les solutions innovantes en Afrique",
    excerpt: "Points relais, drones, livreurs indépendants… Comment résoudre le défi de la livraison sur le continent.",
    category: "Logistique",
    image: "https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=800&h=450&fit=crop",
    date: "2026-02-05",
    readTime: 7,
    author: "Moussa K.",
  },
  {
    slug: "mobile-money-revolution-ecommerce",
    title: "Mobile Money : la révolution du paiement e-commerce en Afrique",
    excerpt: "Comment les portefeuilles mobiles transforment le commerce en ligne et rendent le paiement accessible à tous.",
    category: "Paiement",
    image: "https://images.unsplash.com/photo-1556742393-d75f468bfcb0?w=800&h=450&fit=crop",
    date: "2026-01-28",
    readTime: 6,
    author: "Fatou S.",
  },
  {
    slug: "photographie-produit-smartphone",
    title: "Photographiez vos produits comme un pro avec votre smartphone",
    excerpt: "Lumière, composition, retouche : tous les secrets pour des photos produits qui vendent, sans matériel coûteux.",
    category: "Guide",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=450&fit=crop",
    date: "2026-01-20",
    readTime: 5,
    author: "Équipe Feyxa",
  },
];

export { BLOG_POSTS };

export default function BlogIndex() {
  useSeoHead({
    title: "Blog & Conseils — Feyxa",
    description: "Conseils e-commerce, tendances mode africaine, astuces marketing. Le blog pour réussir votre boutique en ligne.",
  });

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

  return (
    <MarketLayout>
      <section className="py-20">
        <div className="container max-w-5xl">
          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16 space-y-4"
          >
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <BookOpen size={24} className="text-primary" />
            </div>
            <h1 className="font-heading text-4xl sm:text-5xl tracking-wide text-foreground">
              BLOG & CONSEILS
            </h1>
            <p className="text-muted-foreground max-w-lg mx-auto leading-relaxed">
              Ressources, guides pratiques et tendances pour développer votre activité e-commerce.
            </p>
          </motion.div>

          {/* Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {BLOG_POSTS.map((post, i) => (
              <motion.div
                key={post.slug}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <Link to={`/blog/${post.slug}`} className="group block h-full">
                  <Card className="overflow-hidden border-border bg-card hover:shadow-lg transition-shadow h-full flex flex-col">
                    <div className="aspect-video overflow-hidden bg-secondary">
                      <img
                        src={post.image}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    </div>
                    <div className="p-5 flex flex-col flex-1">
                      <Badge variant="secondary" className="w-fit mb-3 text-xs">
                        {post.category}
                      </Badge>
                      <h2 className="font-semibold text-foreground leading-snug mb-2 group-hover:text-primary transition-colors line-clamp-2">
                        {post.title}
                      </h2>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">
                        {post.excerpt}
                      </p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground mt-auto pt-3 border-t border-border/50">
                        <span>{formatDate(post.date)}</span>
                        <span className="flex items-center gap-1">
                          <Clock size={12} /> {post.readTime} min
                        </span>
                      </div>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </MarketLayout>
  );
}
