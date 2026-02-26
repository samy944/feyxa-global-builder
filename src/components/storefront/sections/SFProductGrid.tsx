import { useState, useMemo } from "react";
import { Search, ShoppingBag, SlidersHorizontal } from "lucide-react";
import type { SFSectionProps } from "../types";
import { SFProductCard } from "../shared/SFProductCard";

export function SFProductGrid({ templateId, store, theme, products, formatPrice, variant = "featured" }: SFSectionProps & { variant?: "featured" | "on-sale" | "new-arrivals" | "all-products" }) {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "price-asc" | "price-desc">("newest");

  const { title, subtitle, items } = useMemo(() => {
    const sorted = [...products].sort((a, b) => b.created_at.localeCompare(a.created_at));
    const onSale = products.filter(p => p.compare_at_price && p.compare_at_price > p.price);
    switch (variant) {
      case "on-sale": return { title: "🔥 Promotions", subtitle: "Offres à ne pas manquer", items: onSale.slice(0, 8) };
      case "new-arrivals": return { title: "✨ Nouveautés", subtitle: "Fraîchement arrivés", items: sorted.slice(0, 8) };
      case "all-products": return { title: "Tous les produits", subtitle: `${products.length} produit${products.length > 1 ? "s" : ""} disponible${products.length > 1 ? "s" : ""}`, items: products };
      default: return { title: "Nos coups de cœur", subtitle: "Sélection du moment", items: products.slice(0, 8) };
    }
  }, [products, variant]);

  if (items.length === 0) return null;

  let filtered = search ? items.filter(p => p.name.toLowerCase().includes(search.toLowerCase())) : items;
  
  // Sort
  if (sortBy === "price-asc") filtered = [...filtered].sort((a, b) => a.price - b.price);
  else if (sortBy === "price-desc") filtered = [...filtered].sort((a, b) => b.price - a.price);

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
    <section id={variant === "featured" ? "produits" : undefined} className={variant === "on-sale" ? "py-10 sm:py-16" : "container py-10 sm:py-16"} style={sectionBg}>
      <div className={variant === "on-sale" ? "container" : ""}>
        {/* Title */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold" style={{ fontFamily: `"${theme.fonts.heading}", sans-serif`, color: `hsl(${theme.colors.foreground})` }}>{title}</h2>
            {subtitle && <p className="text-sm mt-1.5" style={{ color: `hsl(${theme.colors.mutedForeground})` }}>{subtitle}</p>}
          </div>
          {variant === "all-products" && (
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="text-xs h-9 rounded-lg border px-3 appearance-none cursor-pointer"
              style={{ backgroundColor: `hsl(${theme.colors.card})`, borderColor: `hsl(${theme.colors.border})`, color: `hsl(${theme.colors.foreground})` }}
            >
              <option value="newest">Plus récents</option>
              <option value="price-asc">Prix croissant</option>
              <option value="price-desc">Prix décroissant</option>
            </select>
          )}
        </div>

        {/* Search */}
        {showSearch && (
          <div className="relative max-w-md mb-8">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: `hsl(${theme.colors.mutedForeground})` }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un produit..." className="w-full h-11 rounded-xl border pl-10 pr-4 text-sm focus:outline-none focus:ring-2 transition-all" style={{ backgroundColor: `hsl(${theme.colors.card})`, borderColor: `hsl(${theme.colors.border})`, color: `hsl(${theme.colors.foreground})` }} />
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingBag size={48} style={{ color: `hsl(${theme.colors.mutedForeground})` }} className="mx-auto mb-4" />
            <p className="text-lg font-medium" style={{ color: `hsl(${theme.colors.foreground})` }}>Aucun produit trouvé</p>
            <p className="text-sm mt-1" style={{ color: `hsl(${theme.colors.mutedForeground})` }}>Essayez avec d'autres termes de recherche</p>
          </div>
        ) : (
          <div className={`grid ${gridCols} gap-4 sm:gap-5`}>
            {filtered.map((product, i) => (
              <SFProductCard
                key={product.id}
                product={product}
                theme={theme}
                formatPrice={formatPrice}
                index={i}
                templateId={templateId}
                storeSlug={store.slug}
                storeName={store.name}
                storeId={store.id}
                currency={store.currency}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
