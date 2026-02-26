import { useCart } from "@/hooks/useCart";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Minus, Plus, Trash2, ShoppingBag, Store } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "@/lib/i18n";
import { toast } from "sonner";

export function CartDrawer() {
  const { items, itemsByStore, totalPrice, totalItems, isOpen, setIsOpen, updateQuantity, removeItem } = useCart();
  const { t } = useTranslation();

  const formatPrice = (p: number, currency: string) =>
    currency === "XOF" ? `${p.toLocaleString("fr-FR")} FCFA` : `€${p.toFixed(2)}`;

  const mainCurrency = items[0]?.currency ?? "XOF";

  const handleExpressPay = (provider: string) => {
    toast.info(`${provider} sera bientôt disponible.`, {
      description: "Cette fonctionnalité est en cours d'intégration.",
    });
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle className="font-heading tracking-wide">{t.market.cart.toUpperCase()} ({totalItems})</SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-muted-foreground">
            <ShoppingBag size={48} className="opacity-30" />
            <p className="text-sm">{t.market.emptyCart}</p>
            <Button variant="outline" size="sm" onClick={() => setIsOpen(false)} asChild>
              <Link to="/market">{t.market.exploreMarket}</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto space-y-6 py-4">
              {Object.entries(itemsByStore).map(([storeId, storeItems]) => (
                <div key={storeId} className="space-y-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium uppercase tracking-wider">
                    <Store size={12} />
                    {storeItems[0].storeName}
                  </div>
                  {storeItems.map((item) => (
                    <div key={item.productId} className="flex gap-3 items-start">
                      <div className="h-16 w-16 rounded-lg bg-secondary overflow-hidden shrink-0">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground/30"><ShoppingBag size={20} /></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link to={`/market/product/${item.slug}`} className="text-sm font-medium text-foreground line-clamp-1 hover:text-primary transition-colors" onClick={() => setIsOpen(false)}>{item.name}</Link>
                        <p className="text-sm font-bold text-foreground mt-0.5">{formatPrice(item.price * item.quantity, item.currency)}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <button onClick={() => updateQuantity(item.productId, item.quantity - 1)} className="h-7 w-7 rounded-md border border-border flex items-center justify-center hover:bg-secondary transition-colors"><Minus size={12} /></button>
                          <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.productId, item.quantity + 1)} disabled={item.quantity >= item.maxStock} className="h-7 w-7 rounded-md border border-border flex items-center justify-center hover:bg-secondary transition-colors disabled:opacity-30"><Plus size={12} /></button>
                          <button onClick={() => removeItem(item.productId)} className="ml-auto text-muted-foreground hover:text-destructive transition-colors"><Trash2 size={14} /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <div className="border-t border-border pt-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t.common.total}</span>
                <span className="text-lg font-bold text-foreground">{formatPrice(totalPrice, mainCurrency)}</span>
              </div>

              {/* Express Checkout in drawer */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    className="bg-foreground text-background hover:bg-foreground/90 h-11 font-medium text-xs rounded-xl"
                    onClick={() => handleExpressPay("Apple Pay")}
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4 mr-1 fill-current" aria-hidden="true">
                      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.08-.5-2.06-.51-3.2 0-1.42.64-2.17.45-3.02-.4C3.79 16.17 4.36 9.02 8.93 8.76c1.28.07 2.17.72 2.91.76.98-.2 1.92-.77 2.97-.7 1.26.1 2.2.58 2.83 1.47-2.59 1.53-1.97 4.89.59 5.82-.47 1.22-.7 1.77-1.31 2.82l.13 1.35zM12.03 8.67c-.14-2.33 1.86-4.35 4.07-4.55.3 2.55-2.31 4.7-4.07 4.55z" />
                    </svg>
                    Pay
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 font-medium text-xs rounded-xl border-2"
                    onClick={() => handleExpressPay("Google Pay")}
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4 mr-1" aria-hidden="true">
                      <path d="M12.24 10.29v3.35h4.74c-.19 1.22-.77 2.25-1.64 2.94l2.65 2.06c1.54-1.42 2.43-3.52 2.43-6.01 0-.58-.05-1.14-.15-1.68H12.24v-.66z" fill="#4285F4" />
                      <path d="M5.3 14.15l-.6.46-2.12 1.65C4.35 19.66 7.9 22 12 22c2.7 0 4.96-.89 6.62-2.42l-2.65-2.06c-.89.6-2.03.95-3.97.95-3.04 0-5.62-2.05-6.54-4.82l-.16.5z" fill="#34A853" />
                      <path d="M2.58 16.26A9.96 9.96 0 0 1 2 12c0-1.49.35-2.9.97-4.15l2.72 2.11A5.96 5.96 0 0 0 5.37 12c0 .73.12 1.43.32 2.08L2.58 16.26z" fill="#FBBC05" />
                      <path d="M12 6.53c1.52 0 2.88.52 3.96 1.55l2.96-2.97C17.04 3.33 14.7 2 12 2 7.9 2 4.35 4.33 2.58 7.85l2.72 2.11C6.38 7.59 8.96 6.53 12 6.53z" fill="#EA4335" />
                    </svg>
                    Pay
                  </Button>
                </div>

                <div className="flex items-center gap-3">
                  <Separator className="flex-1" />
                  <span className="text-xs text-muted-foreground font-medium uppercase">ou</span>
                  <Separator className="flex-1" />
                </div>
              </div>

              <Button variant="hero" size="lg" className="w-full font-heading tracking-wide" onClick={() => setIsOpen(false)} asChild>
                <Link to="/checkout">{t.market.proceedToCheckout.toUpperCase()}</Link>
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
