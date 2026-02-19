import { Link } from "react-router-dom";
import { motion } from "framer-motion";

import modeVetements from "@/assets/categories/mode-vetements.jpg";
import electronique from "@/assets/categories/electronique.jpg";
import maisonDeco from "@/assets/categories/maison-deco.jpg";
import beauteSante from "@/assets/categories/beaute-sante.jpg";
import alimentation from "@/assets/categories/alimentation.jpg";
import sportsLoisirs from "@/assets/categories/sports-loisirs.jpg";
import autoMoto from "@/assets/categories/auto-moto.jpg";
import bebeEnfants from "@/assets/categories/bebe-enfants.jpg";

const categoryImages: Record<string, string> = {
  "mode-vetements": modeVetements,
  "electronique": electronique,
  "maison-deco": maisonDeco,
  "beaute-sante": beauteSante,
  "alimentation": alimentation,
  "sports-loisirs": sportsLoisirs,
  "auto-moto": autoMoto,
  "bebe-enfants": bebeEnfants,
};

interface MarketCategoryCardProps {
  name: string;
  slug: string;
  image_url?: string | null;
  productCount?: number;
  index?: number;
}

export function MarketCategoryCard({ name, slug, image_url, productCount, index = 0 }: MarketCategoryCardProps) {
  const imgSrc = image_url || categoryImages[slug];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
    >
      <Link
        to={`/market/category/${slug}`}
        className="group block rounded-xl border border-border bg-card p-4 text-center hover:border-primary/30 hover:shadow-glow transition-all duration-300"
      >
        <div className="mb-3 mx-auto h-16 w-16 rounded-xl overflow-hidden bg-secondary flex items-center justify-center">
          {imgSrc ? (
            <img src={imgSrc} alt={name} className="h-full w-full object-cover" />
          ) : (
            <span className="font-heading text-lg text-primary">{name.charAt(0).toUpperCase()}</span>
          )}
        </div>
        <h3 className="font-semibold text-foreground text-sm">{name}</h3>
        {productCount !== undefined && (
          <p className="text-xs text-muted-foreground mt-1">{productCount} {productCount <= 1 ? "produit" : "produits"}</p>
        )}
      </Link>
    </motion.div>
  );
}
