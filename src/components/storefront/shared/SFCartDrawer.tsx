import { useCart } from "@/hooks/useCart";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Minus, Plus, Trash2, ShoppingBag, Check, ArrowRight, X } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import type { StorefrontTheme } from "@/lib/storefront-themes";

interface Props {
  theme: StorefrontTheme;
  storeName: string;
  storeSlug: string;
  currency: string;
}

/**
 * Branded cart drawer for individual storefronts.
 * Uses the vendor's theme colors instead of global marketplace styling.
 */
export function SFCartDrawer({ theme, storeName, storeSlug, currency }: Props) {
  const { items, totalPrice, totalItems, isOpen, setIsOpen, updateQuantity, removeItem } = useCart();

  // Only show items from this store
  const storeItems = items.filter(i => i.storeSlug === storeSlug);
  const storeTotal = storeItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const storeCount = storeItems.reduce((s, i) => s + i.quantity, 0);

  const formatPrice = (p: number) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency, maximumFractionDigits: 0 }).format(p);

  const c = theme.colors;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent
        className="w-full sm:max-w-md flex flex-col p-0 border-0"
        style={{
          backgroundColor: `hsl(${c.background})`,
          color: `hsl(${c.foreground})`,
          fontFamily: `"${theme.fonts.body}", system-ui, sans-serif`,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 h-16 border-b" style={{ borderColor: `hsl(${c.border})` }}>
          <h2 className="text-sm font-bold uppercase tracking-widest" style={{ fontFamily: `"${theme.fonts.heading}", sans-serif` }}>
            Panier ({storeCount})
          </h2>
          <button onClick={() => setIsOpen(false)} className="h-8 w-8 rounded-full flex items-center justify-center hover:opacity-70 transition-opacity" style={{ backgroundColor: `hsl(${c.muted})` }}>
            <X size={14} />
          </button>
        </div>

        {storeItems.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6">
            <div className="h-20 w-20 rounded-full flex items-center justify-center" style={{ backgroundColor: `hsl(${c.muted})` }}>
              <ShoppingBag size={32} style={{ color: `hsl(${c.mutedForeground})` }} />
            </div>
            <p className="text-sm font-medium" style={{ color: `hsl(${c.mutedForeground})` }}>Votre panier est vide</p>
            <button
              onClick={() => setIsOpen(false)}
              className="h-10 px-6 rounded-full text-xs font-semibold uppercase tracking-wider transition-all hover:brightness-110"
              style={{ backgroundColor: `hsl(${c.primary})`, color: `hsl(${c.primaryForeground})` }}
            >
              Continuer vos achats
            </button>
          </div>
        ) : (
          <>
            {/* Items */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              <AnimatePresence>
                {storeItems.map((item) => (
                  <motion.div
                    key={item.productId}
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20, height: 0 }}
                    className="flex gap-4"
                  >
                    {/* Image */}
                    <Link
                      to={`/store/${storeSlug}/product/${item.slug}`}
                      onClick={() => setIsOpen(false)}
                      className="shrink-0 h-20 w-20 rounded-xl overflow-hidden"
                      style={{ backgroundColor: `hsl(${c.muted})` }}
                    >
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag size={18} style={{ color: `hsl(${c.mutedForeground})` }} />
                        </div>
                      )}
                    </Link>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/store/${storeSlug}/product/${item.slug}`}
                        onClick={() => setIsOpen(false)}
                        className="text-sm font-medium line-clamp-1 hover:underline"
                        style={{ color: `hsl(${c.foreground})` }}
                      >
                        {item.name}
                      </Link>
                      <p className="text-sm font-bold mt-1" style={{ color: `hsl(${c.primary})` }}>
                        {formatPrice(item.price * item.quantity)}
                      </p>

                      <div className="flex items-center gap-3 mt-2">
                        {/* Quantity */}
                        <div className="flex items-center rounded-full border overflow-hidden" style={{ borderColor: `hsl(${c.border})` }}>
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            className="h-7 w-7 flex items-center justify-center hover:opacity-70 transition-opacity"
                            style={{ backgroundColor: `hsl(${c.muted})` }}
                          >
                            <Minus size={10} />
                          </button>
                          <span className="text-xs font-semibold w-7 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            disabled={item.quantity >= item.maxStock}
                            className="h-7 w-7 flex items-center justify-center hover:opacity-70 transition-opacity disabled:opacity-30"
                            style={{ backgroundColor: `hsl(${c.muted})` }}
                          >
                            <Plus size={10} />
                          </button>
                        </div>

                        {/* Remove */}
                        <button
                          onClick={() => removeItem(item.productId)}
                          className="ml-auto h-7 w-7 rounded-full flex items-center justify-center hover:opacity-70 transition-opacity"
                          style={{ color: `hsl(${c.mutedForeground})` }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="border-t px-6 py-5 space-y-4" style={{ borderColor: `hsl(${c.border})` }}>
              {/* Subtotal */}
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider" style={{ color: `hsl(${c.mutedForeground})` }}>Sous-total</span>
                <span className="text-lg font-bold" style={{ fontFamily: `"${theme.fonts.heading}", sans-serif` }}>
                  {formatPrice(storeTotal)}
                </span>
              </div>
              <p className="text-[10px]" style={{ color: `hsl(${c.mutedForeground})` }}>
                Frais de livraison calculés à l'étape suivante
              </p>

              {/* CTA */}
              <Link
                to="/checkout"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-center gap-2 w-full h-12 rounded-xl text-sm font-bold uppercase tracking-wider transition-all hover:brightness-110"
                style={{ backgroundColor: `hsl(${c.primary})`, color: `hsl(${c.primaryForeground})` }}
              >
                Commander <ArrowRight size={14} />
              </Link>

              <button
                onClick={() => setIsOpen(false)}
                className="w-full text-center text-xs font-medium underline underline-offset-4 hover:opacity-70 transition-opacity"
                style={{ color: `hsl(${c.mutedForeground})` }}
              >
                Continuer mes achats
              </button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
