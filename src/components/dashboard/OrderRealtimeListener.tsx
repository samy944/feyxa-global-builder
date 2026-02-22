import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/hooks/useStore";
import { toast } from "sonner";
import { ShoppingCart } from "lucide-react";

/**
 * Listens for new orders via Realtime and shows a toast + creates a notification.
 * Mount this once inside the DashboardLayout.
 */
export function OrderRealtimeListener() {
  const { store } = useStore();

  useEffect(() => {
    if (!store?.id) return;

    const channel = supabase
      .channel("new-orders-" + store.id)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
          filter: `store_id=eq.${store.id}`,
        },
        async (payload) => {
          const order = payload.new as {
            id: string;
            order_number: string;
            total: number;
            currency: string;
            shipping_city: string | null;
          };

          // Show toast notification
          toast(`🛒 Nouvelle commande ${order.order_number}`, {
            description: `${order.total.toLocaleString("fr-FR")} ${order.currency}${order.shipping_city ? ` · ${order.shipping_city}` : ""}`,
            duration: 8000,
          });

          // Insert a persistent notification in the bell
          await supabase.from("notifications").insert({
            store_id: store.id,
            type: "new_order",
            title: `🛒 Nouvelle commande ${order.order_number}`,
            body: `Montant: ${order.total.toLocaleString("fr-FR")} ${order.currency}${order.shipping_city ? ` · Ville: ${order.shipping_city}` : ""}`,
            metadata: {
              order_id: order.id,
              order_number: order.order_number,
              total: order.total,
              currency: order.currency,
            },
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [store?.id]);

  return null; // Renderless component
}
