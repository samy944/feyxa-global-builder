import { useCart } from "@/hooks/useCart";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2, ShoppingBag, Store } from "lucide-react";
import { Link } from "react-router-dom";

export function CartDrawer() {
  const { items, itemsByStore, totalPrice, totalItems, isOpen, setIsOpen, updateQuantity, removeItem } = useCart();

  const formatPrice = (p: number, currency: string) =>
    currency === "XOF" ? `${p.toLocaleString("fr-FR")} FCFA` : `€${p.toFixed(2)}`;

  // Use first item currency for total (multi-currency edge case simplified)
  const mainCurrency = items[0]?.currency ?? "XOF";

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle className="font-heading tracking-wide">PANIER ({totalItems})</SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-muted-foreground">
            <ShoppingBag size={48} className="opacity-30" />
            <p className="text-sm">Votre panier est vide</p>
            <Button variant="outline" size="sm" onClick={() => setIsOpen(false)} asChild>
              <Link to="/market">Explorer le Market</Link>
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
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                            <ShoppingBag size={20} />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link
                          to={`/market/product/${item.slug}`}
                          className="text-sm font-medium text-foreground line-clamp-1 hover:text-primary transition-colors"
                          onClick={() => setIsOpen(false)}
                        >
                          {item.name}
                        </Link>
                        <p className="text-sm font-bold text-foreground mt-0.5">
                          {formatPrice(item.price * item.quantity, item.currency)}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            className="h-7 w-7 rounded-md border border-border flex items-center justify-center hover:bg-secondary transition-colors"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            disabled={item.quantity >= item.maxStock}
                            className="h-7 w-7 rounded-md border border-border flex items-center justify-center hover:bg-secondary transition-colors disabled:opacity-30"
                          >
                            <Plus size={12} />
                          </button>
                          <button
                            onClick={() => removeItem(item.productId)}
                            className="ml-auto text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <div className="border-t border-border pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total</span>
                <span className="text-lg font-bold text-foreground">
                  {formatPrice(totalPrice, mainCurrency)}
                </span>
              </div>
              <Button
                variant="hero"
                size="lg"
                className="w-full font-heading tracking-wide"
                onClick={() => setIsOpen(false)}
                asChild
              >
                <Link to="/checkout">PASSER LA COMMANDE</Link>
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
