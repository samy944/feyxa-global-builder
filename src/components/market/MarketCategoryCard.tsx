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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.05, 0.3), duration: 0.4 }}
    >
      <Link
        to={`/market/category/${slug}`}
        className="group block rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg relative"
        style={{ border: "1px solid rgba(255,255,255,0.06)", aspectRatio: "4/3" }}
      >
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={name}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center" style={{ background: "#1A1A1F" }}>
            <span className="text-2xl font-bold" style={{ color: "hsl(var(--primary))" }}>{name.charAt(0)}</span>
          </div>
        )}
        {/* Overlay */}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.1) 60%, transparent 100%)" }} />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="text-sm font-semibold" style={{ color: "#FFFFFF" }}>{name}</h3>
          {productCount !== undefined && productCount > 0 && (
            <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>
              {productCount} produit{productCount !== 1 ? "s" : ""}
            </p>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
