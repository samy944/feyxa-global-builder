import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ShoppingBag, Heart } from "lucide-react";
import type { ProductData } from "../types";
import type { StorefrontTheme } from "@/lib/storefront-themes";

interface Props {
  product: ProductData;
  theme: StorefrontTheme;
  formatPrice: (p: number) => string;
  index: number;
  templateId: string;
}

export function SFProductCard({ product, theme, formatPrice, index, templateId }: Props) {
  const discount = product.compare_at_price && product.compare_at_price > product.price
    ? Math.round((1 - product.price / product.compare_at_price) * 100) : null;

  const img = product.images && Array.isArray(product.images) && (product.images as string[]).length > 0
    ? (product.images as string[])[0] : null;

  const imgRatio = theme.style.productImageRatio === "portrait" ? "aspect-[3/4]"
    : theme.style.productImageRatio === "landscape" ? "aspect-[4/3]" : "aspect-square";

  if (templateId === "minimal") {
    return (
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ delay: index * 0.03, duration: 0.4 }}
        className="group cursor-pointer"
      >
        <div className={`${imgRatio} relative overflow-hidden bg-neutral-50 dark:bg-neutral-900`}>
          {img ? (
            <img src={img} alt={product.name} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700" loading="lazy" />
          ) : (
            <div className="h-full flex items-center justify-center"><ShoppingBag size={24} style={{ color: `hsl(${theme.colors.mutedForeground})` }} /></div>
          )}
        </div>
        <div className="mt-3 space-y-1">
          <h3 className="text-sm font-medium line-clamp-1" style={{ color: `hsl(${theme.colors.foreground})` }}>{product.name}</h3>
          <div className="flex items-center gap-2">
            <span className="text-sm" style={{ color: `hsl(${theme.colors.foreground})` }}>{formatPrice(product.price)}</span>
            {product.compare_at_price && product.compare_at_price > product.price && (
              <span className="text-xs line-through" style={{ color: `hsl(${theme.colors.mutedForeground})` }}>{formatPrice(product.compare_at_price)}</span>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  if (templateId === "tech") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.04, duration: 0.3 }}
        className="group rounded-lg border overflow-hidden transition-all hover:shadow-[0_0_20px_rgba(99,102,241,0.12)]"
        style={{ backgroundColor: `hsl(${theme.colors.card})`, borderColor: `hsl(${theme.colors.border})` }}
      >
        <div className={`${imgRatio} relative overflow-hidden`} style={{ backgroundColor: `hsl(${theme.colors.muted})` }}>
          {img ? (
            <img src={img} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
          ) : (
            <div className="h-full flex items-center justify-center"><ShoppingBag size={24} style={{ color: `hsl(${theme.colors.mutedForeground})` }} /></div>
          )}
          {discount && (
            <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded" style={{ backgroundColor: `hsl(${theme.colors.primary})`, color: `hsl(${theme.colors.primaryForeground})` }}>
              -{discount}%
            </span>
          )}
        </div>
        <div className="p-3">
          {product.category && <p className="text-[9px] uppercase tracking-widest mb-1" style={{ color: `hsl(${theme.colors.primary})` }}>{product.category}</p>}
          <h3 className="text-xs font-medium line-clamp-2" style={{ color: `hsl(${theme.colors.cardForeground})` }}>{product.name}</h3>
          <p className="text-sm font-bold mt-1.5" style={{ color: `hsl(${theme.colors.primary})` }}>{formatPrice(product.price)}</p>
        </div>
      </motion.div>
    );
  }

  if (templateId === "fashion") {
    return (
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ delay: index * 0.05, duration: 0.5 }}
        className="group cursor-pointer"
      >
        <div className="aspect-[3/4] relative overflow-hidden" style={{ backgroundColor: `hsl(${theme.colors.muted})` }}>
          {img ? (
            <img src={img} alt={product.name} className="w-full h-full object-cover group-hover:scale-[1.08] transition-transform duration-[800ms]" loading="lazy" />
          ) : (
            <div className="h-full flex items-center justify-center"><ShoppingBag size={28} style={{ color: `hsl(${theme.colors.mutedForeground})` }} /></div>
          )}
          <button className="absolute bottom-3 right-3 h-9 w-9 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all" style={{ backgroundColor: `hsl(${theme.colors.card} / 0.9)` }}>
            <Heart size={16} style={{ color: `hsl(${theme.colors.foreground})` }} />
          </button>
        </div>
        <div className="mt-3">
          <h3 className="text-xs uppercase tracking-wider font-medium" style={{ color: `hsl(${theme.colors.foreground})`, fontFamily: `"${theme.fonts.heading}", serif` }}>{product.name}</h3>
          <div className="flex gap-2 mt-1">
            <span className="text-sm" style={{ color: `hsl(${theme.colors.foreground})` }}>{formatPrice(product.price)}</span>
            {product.compare_at_price && product.compare_at_price > product.price && (
              <span className="text-xs line-through" style={{ color: `hsl(${theme.colors.mutedForeground})` }}>{formatPrice(product.compare_at_price)}</span>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  // marketplace (default)
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      transition={{ delay: index * 0.02 }}
      className="group rounded-md border overflow-hidden hover:shadow-md transition-shadow"
      style={{ backgroundColor: `hsl(${theme.colors.card})`, borderColor: `hsl(${theme.colors.border})` }}
    >
      <div className="aspect-square relative overflow-hidden" style={{ backgroundColor: `hsl(${theme.colors.muted})` }}>
        {img ? (
          <img src={img} alt={product.name} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="h-full flex items-center justify-center"><ShoppingBag size={24} style={{ color: `hsl(${theme.colors.mutedForeground})` }} /></div>
        )}
        {discount && (
          <span className="absolute top-1 left-1 text-[10px] font-bold px-1.5 py-0.5 rounded-sm bg-red-500 text-white">
            -{discount}%
          </span>
        )}
      </div>
      <div className="p-2.5">
        <h3 className="text-xs line-clamp-2 leading-snug" style={{ color: `hsl(${theme.colors.cardForeground})` }}>{product.name}</h3>
        <p className="text-sm font-bold mt-1" style={{ color: `hsl(${theme.colors.primary})` }}>{formatPrice(product.price)}</p>
        {product.compare_at_price && product.compare_at_price > product.price && (
          <span className="text-[10px] line-through" style={{ color: `hsl(${theme.colors.mutedForeground})` }}>{formatPrice(product.compare_at_price)}</span>
        )}
        {product.stock_quantity <= 5 && product.stock_quantity > 0 && (
          <p className="text-[10px] text-orange-500 mt-0.5">Plus que {product.stock_quantity} en stock</p>
        )}
      </div>
    </motion.div>
  );
}
