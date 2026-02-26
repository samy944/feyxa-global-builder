import { useState, useMemo } from "react";
import { Search, ShoppingBag, ChevronRight } from "lucide-react";
import type { SFSectionProps } from "../types";
import { SFProductCard } from "../shared/SFProductCard";

export function SFProductGrid({ templateId, store, theme, products, formatPrice, variant = "featured" }: SFSectionProps & { variant?: "featured" | "on-sale" | "new-arrivals" | "all-products" }) {
  const [search, setSearch] = useState("");

  const { title, subtitle, items } = useMemo(() => {
    const sorted = [...products].sort((a, b) => b.created_at.localeCompare(a.created_at));
    const onSale = products.filter(p => p.compare_at_price && p.compare_at_price > p.price);
    switch (variant) {
      case "on-sale": return { title: "🔥 Promotions", subtitle: "Meilleures offres", items: onSale.slice(0, 8) };
      case "new-arrivals": return { title: "Nouveautés", subtitle: "Derniers ajouts", items: sorted.slice(0, 8) };
      case "all-products": return { title: "Tous les produits", subtitle: `${products.length} produit${products.length > 1 ? "s" : ""}`, items: products };
      default: return { title: "Produits vedettes", subtitle: `${products.length} disponible${products.length > 1 ? "s" : ""}`, items: products.slice(0, 8) };
    }
  }, [products, variant]);

  if (items.length === 0) return null;

  const filtered = search ? items.filter(p => p.name.toLowerCase().includes(search.toLowerCase())) : items;
  const showSearch = variant === "featured" || variant === "all-products";

  const gridCols = templateId === "marketplace"
    ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5"
    : templateId === "fashion"
      ? "grid-cols-2 sm:grid-cols-3"
      : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4";

  const sectionBg = variant === "on-sale"
    ? { backgroundColor: `hsl(${theme.colors.primary} / 0.04)` }
    : {};

  return (
    <section id={variant === "featured" ? "produits" : undefined} className={variant === "on-sale" ? "py-10 sm:py-14" : "container py-10 sm:py-14"} style={sectionBg}>
      <div className={variant === "on-sale" ? "container" : ""}>
        {/* Title */}
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold" style={{ fontFamily: `"${theme.fonts.heading}", sans-serif`, color: `hsl(${theme.colors.foreground})` }}>{title}</h2>
            {subtitle && <p className="text-sm mt-1" style={{ color: `hsl(${theme.colors.mutedForeground})` }}>{subtitle}</p>}
          </div>
        </div>

        {/* Search */}
        {showSearch && (
          <div className="relative max-w-md mb-6">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: `hsl(${theme.colors.mutedForeground})` }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." className="w-full h-10 rounded-lg border pl-9 pr-4 text-sm focus:outline-none focus:ring-2" style={{ backgroundColor: `hsl(${theme.colors.card})`, borderColor: `hsl(${theme.colors.border})`, color: `hsl(${theme.colors.foreground})` }} />
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingBag size={40} style={{ color: `hsl(${theme.colors.mutedForeground})` }} className="mx-auto mb-3" />
            <p style={{ color: `hsl(${theme.colors.mutedForeground})` }}>Aucun produit trouvé</p>
          </div>
        ) : (
          <div className={`grid ${gridCols} gap-3 sm:gap-4`}>
            {filtered.map((product, i) => (
              <SFProductCard key={product.id} product={product} theme={theme} formatPrice={formatPrice} index={i} templateId={templateId} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
