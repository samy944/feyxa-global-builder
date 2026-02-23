import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

const ACTIVE_STORE_KEY = "feyxa_active_store_id";

export function useStore() {
  const { user } = useAuth();
  const [store, setStore] = useState<any>(null);
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const refetch = useCallback(() => setRefreshKey((k) => k + 1), []);

  const switchStore = useCallback((storeId: string) => {
    localStorage.setItem(ACTIVE_STORE_KEY, storeId);
    const found = stores.find((s) => s.id === storeId);
    if (found) setStore(found);
    else refetch();
  }, [stores, refetch]);

  useEffect(() => {
    if (!user) {
      setStore(null);
      setStores([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const fetchStores = async () => {
      // Get all stores user owns or is member of
      const { data: ownedStores } = await supabase
        .from("stores")
        .select("*")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: true });

      const { data: memberStores } = await supabase
        .from("store_members")
        .select("store_id")
        .eq("user_id", user.id);

      const memberStoreIds = (memberStores || [])
        .map((m) => m.store_id)
        .filter((id) => !(ownedStores || []).some((s) => s.id === id));

      let allStores = [...(ownedStores || [])];

      if (memberStoreIds.length > 0) {
        const { data: extraStores } = await supabase
          .from("stores")
          .select("*")
          .in("id", memberStoreIds);
        allStores = [...allStores, ...(extraStores || [])];
      }

      setStores(allStores);

      // Pick active store
      const savedId = localStorage.getItem(ACTIVE_STORE_KEY);
      const active =
        allStores.find((s) => s.id === savedId) ||
        allStores[0] ||
        null;

      if (active) {
        localStorage.setItem(ACTIVE_STORE_KEY, active.id);
      }
      setStore(active);
      setLoading(false);
    };

    fetchStores();
  }, [user, refreshKey]);

  return {
    store,
    stores,
    loading,
    hasStore: !!store,
    refetch,
    switchStore,
  };
}
