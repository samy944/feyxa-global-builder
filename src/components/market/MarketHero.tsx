import { MarketSearch } from "./MarketSearch";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "@/lib/i18n";

import modeVetements from "@/assets/categories/mode-vetements.jpg";
import electronique from "@/assets/categories/electronique.jpg";
import maisonDeco from "@/assets/categories/maison-deco.jpg";
import beauteSante from "@/assets/categories/beaute-sante.jpg";
import alimentation from "@/assets/categories/alimentation.jpg";
import sportsLoisirs from "@/assets/categories/sports-loisirs.jpg";
import autoMoto from "@/assets/categories/auto-moto.jpg";
import bebeEnfants from "@/assets/categories/bebe-enfants.jpg";

const quickCategories = [
  { label: "Électronique", slug: "electronique", img: electronique },
  { label: "Mode", slug: "mode-vetements", img: modeVetements },
  { label: "Maison", slug: "maison-deco", img: maisonDeco },
  { label: "Beauté", slug: "beaute-sante", img: beauteSante },
  { label: "Alimentation", slug: "alimentation", img: alimentation },
  { label: "Sports", slug: "sports-loisirs", img: sportsLoisirs },
  { label: "Auto & Moto", slug: "auto-moto", img: autoMoto },
  { label: "Bébé", slug: "bebe-enfants", img: bebeEnfants },
];

export function MarketHero() {
  const { t } = useTranslation();

  return (
    <section className="relative overflow-hidden" style={{ background: "#0a0e13" }}>
      {/* Subtle radial glow */}
      <div className="absolute inset-0" style={{
        background: "radial-gradient(ellipse 70% 50% at 50% 0%, hsla(106,75%,47%,0.04) 0%, transparent 70%)",
      }} />

      <div className="relative z-10 container pt-12 pb-8 md:pt-16 md:pb-10">
        {/* Title + Search */}
        <motion.div
          className="text-center max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight" style={{ color: "#FFFFFF", lineHeight: 1.1 }}>
            {t.market.heroTitle1}{" "}
            <span className="text-gradient">{t.market.heroTitle2}</span>
          </h1>
          <p className="mt-4 text-sm md:text-base" style={{ color: "rgba(255,255,255,0.45)", maxWidth: 420, margin: "1rem auto 0" }}>
            {t.market.heroSubtitle}
          </p>
          <div className="mt-8 max-w-xl mx-auto">
            <MarketSearch />
          </div>
        </motion.div>

        {/* Quick category pills */}
        <motion.div
          className="mt-10 flex gap-3 overflow-x-auto scrollbar-hide pb-2 justify-start md:justify-center"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          {quickCategories.map((cat) => (
            <Link
              key={cat.slug}
              to={`/market/category/${cat.slug}`}
              className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-all duration-200 hover:scale-[1.03]"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.07)",
                color: "rgba(255,255,255,0.7)",
              }}
            >
              <img src={cat.img} alt={cat.label} className="h-5 w-5 rounded-full object-cover" />
              {cat.label}
            </Link>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
