import { Link } from "react-router-dom";
import { motion } from "framer-motion";

interface MarketCategoryCardProps {
  name: string;
  slug: string;
  image_url?: string | null;
  productCount?: number;
  index?: number;
}

export function MarketCategoryCard({ name, slug, image_url, productCount, index = 0 }: MarketCategoryCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
    >
      <Link
        to={`/market/category/${slug}`}
        className="group block rounded-xl border border-border bg-card p-6 text-center hover:border-primary/30 hover:shadow-glow transition-all duration-300"
      >
        <div className="mb-3 mx-auto h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary/20 transition-colors">
          <span className="font-heading text-lg">{name.charAt(0).toUpperCase()}</span>
        </div>
        <h3 className="font-semibold text-foreground text-sm">{name}</h3>
        {productCount !== undefined && (
          <p className="text-xs text-muted-foreground mt-1">{productCount} produits</p>
        )}
      </Link>
    </motion.div>
  );
}
