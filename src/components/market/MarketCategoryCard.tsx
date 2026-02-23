import { Link } from "react-router-dom";

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

export function MarketCategoryCard({ name, slug, image_url, index = 0 }: MarketCategoryCardProps) {
  const imgSrc = image_url || categoryImages[slug];

  return (
    <Link
      to={`/market/category/${slug}`}
      className="group flex flex-col items-center gap-3 py-4 px-2 rounded-xl transition-colors duration-200"
      style={{ background: "transparent" }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
    >
      <div className="h-20 w-20 rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={name}
            className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <span className="font-heading text-xl text-foreground">{name.charAt(0)}</span>
          </div>
        )}
      </div>
      <span className="text-sm text-center" style={{ color: "#E5E7EB", fontWeight: 500 }}>
        {name}
      </span>
    </Link>
  );
}
