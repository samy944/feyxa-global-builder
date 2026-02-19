import { useState, useMemo, useEffect } from "react";
import { cn } from "@/lib/utils";

interface Variant {
  id: string;
  name: string;
  price: number;
  stock_quantity: number;
  sku: string | null;
  options: Record<string, string>;
}

interface VariantSelectorProps {
  variants: Variant[];
  onVariantChange: (variant: Variant | null) => void;
}

export function VariantSelector({ variants, onVariantChange }: VariantSelectorProps) {
  // Extract unique option types and their values
  const optionTypes = useMemo(() => {
    const map: Record<string, string[]> = {};
    variants.forEach((v) => {
      if (v.options && typeof v.options === "object") {
        Object.entries(v.options).forEach(([key, value]) => {
          if (!map[key]) map[key] = [];
          if (!map[key].includes(value)) map[key].push(value);
        });
      }
    });
    return map;
  }, [variants]);

  const optionKeys = Object.keys(optionTypes);

  const [selected, setSelected] = useState<Record<string, string>>(() => {
    // Default: select first value for each option
    const init: Record<string, string> = {};
    optionKeys.forEach((key) => {
      if (optionTypes[key]?.length) init[key] = optionTypes[key][0];
    });
    return init;
  });

  // Find matching variant
  const matchedVariant = useMemo(() => {
    return variants.find((v) => {
      if (!v.options) return false;
      return optionKeys.every((key) => v.options[key] === selected[key]);
    }) ?? null;
  }, [variants, selected, optionKeys]);

  useEffect(() => {
    onVariantChange(matchedVariant);
  }, [matchedVariant, onVariantChange]);

  const handleSelect = (optionKey: string, value: string) => {
    setSelected((prev) => ({ ...prev, [optionKey]: value }));
  };

  // Check if a specific option value is available (has stock in at least one combination)
  const isValueAvailable = (optionKey: string, value: string) => {
    return variants.some((v) => {
      if (!v.options || v.options[optionKey] !== value) return false;
      // Check with all other currently selected options
      return optionKeys.every((k) => {
        if (k === optionKey) return true;
        return v.options[k] === selected[k];
      }) && v.stock_quantity > 0;
    });
  };

  if (optionKeys.length === 0) return null;

  return (
    <div className="space-y-4">
      {optionKeys.map((optionKey) => (
        <div key={optionKey}>
          <p className="text-sm font-medium text-foreground mb-2">
            {optionKey}
            {selected[optionKey] && (
              <span className="text-muted-foreground font-normal ml-2">— {selected[optionKey]}</span>
            )}
          </p>
          <div className="flex flex-wrap gap-2">
            {optionTypes[optionKey].map((value) => {
              const isActive = selected[optionKey] === value;
              const available = isValueAvailable(optionKey, value);
              return (
                <button
                  key={value}
                  onClick={() => handleSelect(optionKey, value)}
                  disabled={!available}
                  className={cn(
                    "px-3.5 py-1.5 rounded-md text-sm border transition-all",
                    isActive
                      ? "border-primary bg-primary/10 text-foreground font-medium"
                      : available
                        ? "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
                        : "border-border/50 text-muted-foreground/40 line-through cursor-not-allowed"
                  )}
                >
                  {value}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
