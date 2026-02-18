import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  currency: string;
  quantity: number;
  image: string | null;
  storeId: string;
  storeName: string;
  storeSlug: string;
  slug: string;
  maxStock: number;
}

interface CartCtx {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">, qty?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, qty: number) => void;
  clearCart: () => void;
  clearStore: (storeId: string) => void;
  totalItems: number;
  totalPrice: number;
  itemsByStore: Record<string, CartItem[]>;
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
}

const CartContext = createContext<CartCtx | undefined>(undefined);

const STORAGE_KEY = "feyxa_cart";

function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadCart);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = useCallback((item: Omit<CartItem, "quantity">, qty = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === item.productId);
      if (existing) {
        return prev.map((i) =>
          i.productId === item.productId
            ? { ...i, quantity: Math.min(i.quantity + qty, i.maxStock) }
            : i
        );
      }
      return [...prev, { ...item, quantity: Math.min(qty, item.maxStock) }];
    });
    setIsOpen(true);
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, qty: number) => {
    if (qty <= 0) {
      setItems((prev) => prev.filter((i) => i.productId !== productId));
      return;
    }
    setItems((prev) =>
      prev.map((i) =>
        i.productId === productId ? { ...i, quantity: Math.min(qty, i.maxStock) } : i
      )
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);
  const clearStore = useCallback(
    (storeId: string) => setItems((prev) => prev.filter((i) => i.storeId !== storeId)),
    []
  );

  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const totalPrice = items.reduce((s, i) => s + i.price * i.quantity, 0);

  const itemsByStore: Record<string, CartItem[]> = {};
  items.forEach((item) => {
    if (!itemsByStore[item.storeId]) itemsByStore[item.storeId] = [];
    itemsByStore[item.storeId].push(item);
  });

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, clearCart, clearStore, totalItems, totalPrice, itemsByStore, isOpen, setIsOpen }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
