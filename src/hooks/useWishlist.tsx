import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export function useWishlist() {
  const { user } = useAuth();
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setWishlistIds(new Set());
      return;
    }
    setLoading(true);
    supabase
      .from("wishlists")
      .select("product_id")
      .eq("user_id", user.id)
      .then(({ data }) => {
        if (data) setWishlistIds(new Set(data.map((w) => w.product_id)));
        setLoading(false);
      });
  }, [user]);

  const toggle = useCallback(
    async (productId: string) => {
      if (!user) {
        toast.error("Connectez-vous pour ajouter aux favoris");
        return;
      }
      const isIn = wishlistIds.has(productId);
      if (isIn) {
        setWishlistIds((prev) => {
          const next = new Set(prev);
          next.delete(productId);
          return next;
        });
        await supabase
          .from("wishlists")
          .delete()
          .eq("user_id", user.id)
          .eq("product_id", productId);
        toast.success("Retiré des favoris");
      } else {
        setWishlistIds((prev) => new Set(prev).add(productId));
        await supabase
          .from("wishlists")
          .insert({ user_id: user.id, product_id: productId });
        toast.success("Ajouté aux favoris");
      }
    },
    [user, wishlistIds]
  );

  const isInWishlist = useCallback(
    (productId: string) => wishlistIds.has(productId),
    [wishlistIds]
  );

  return { wishlistIds, toggle, isInWishlist, loading, count: wishlistIds.size };
}
