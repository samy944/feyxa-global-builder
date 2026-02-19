import { useState } from "react";
import { Star, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface FilterValues {
  minPrice: number | null;
  maxPrice: number | null;
  minRating: number | null;
  sortBy: "recent" | "price_asc" | "price_desc" | "rating";
}

const defaultFilters: FilterValues = {
  minPrice: null,
  maxPrice: null,
  minRating: null,
  sortBy: "recent",
};

interface MarketFiltersProps {
  filters: FilterValues;
  onChange: (filters: FilterValues) => void;
  resultCount: number;
  currency?: string;
}

const sortOptions = [
  { value: "recent" as const, label: "Plus récents" },
  { value: "price_asc" as const, label: "Prix croissant" },
  { value: "price_desc" as const, label: "Prix décroissant" },
  { value: "rating" as const, label: "Mieux notés" },
];

export { defaultFilters };

export function MarketFilters({ filters, onChange, resultCount, currency = "XOF" }: MarketFiltersProps) {
  const [open, setOpen] = useState(false);

  const hasActiveFilters =
    filters.minPrice !== null ||
    filters.maxPrice !== null ||
    filters.minRating !== null;

  const clearFilters = () => onChange({ ...defaultFilters, sortBy: filters.sortBy });

  const update = (patch: Partial<FilterValues>) => onChange({ ...filters, ...patch });

  return (
    <div className="space-y-4">
      {/* Top bar: toggle + sort + count */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setOpen(!open)}
          className={cn(
            "gap-1.5",
            hasActiveFilters && "border-primary text-primary"
          )}
        >
          <SlidersHorizontal size={14} />
          Filtres
          {hasActiveFilters && (
            <span className="ml-1 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center">
              {[filters.minPrice, filters.maxPrice, filters.minRating].filter(Boolean).length}
            </span>
          )}
        </Button>

        <div className="flex gap-1.5 overflow-x-auto">
          {sortOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => update({ sortBy: opt.value })}
              className={cn(
                "text-xs px-3 py-1.5 rounded-full border whitespace-nowrap transition-all",
                filters.sortBy === opt.value
                  ? "border-primary bg-primary/10 text-foreground font-medium"
                  : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <span className="text-xs text-muted-foreground ml-auto">
          {resultCount} produit{resultCount !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Expandable filter panel */}
      {open && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-5 animate-in slide-in-from-top-2 duration-200">
          {/* Price range */}
          <div>
            <p className="text-sm font-medium text-foreground mb-2">
              Fourchette de prix {currency === "XOF" ? "(FCFA)" : "(€)"}
            </p>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                placeholder="Min"
                value={filters.minPrice ?? ""}
                onChange={(e) =>
                  update({ minPrice: e.target.value ? Number(e.target.value) : null })
                }
                className="w-28 h-9 text-sm"
              />
              <span className="text-muted-foreground text-sm">—</span>
              <Input
                type="number"
                placeholder="Max"
                value={filters.maxPrice ?? ""}
                onChange={(e) =>
                  update({ maxPrice: e.target.value ? Number(e.target.value) : null })
                }
                className="w-28 h-9 text-sm"
              />
            </div>
          </div>

          {/* Rating filter */}
          <div>
            <p className="text-sm font-medium text-foreground mb-2">Note minimum</p>
            <div className="flex gap-2">
              {[null, 4, 3, 2, 1].map((rating) => (
                <button
                  key={rating ?? "all"}
                  onClick={() => update({ minRating: rating })}
                  className={cn(
                    "flex items-center gap-1 text-xs px-3 py-1.5 rounded-full border transition-all",
                    filters.minRating === rating
                      ? "border-primary bg-primary/10 text-foreground font-medium"
                      : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
                  )}
                >
                  {rating === null ? (
                    "Toutes"
                  ) : (
                    <>
                      <Star size={11} className="fill-primary text-primary" />
                      {rating}+
                    </>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Clear */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              <X size={12} />
              Réinitialiser les filtres
            </button>
          )}
        </div>
      )}
    </div>
  );
}
