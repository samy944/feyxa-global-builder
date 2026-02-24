import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

const ACTIVE_STORE_KEY = "feyxa_active_store_id";
const ADMIN_IMPERSONATE_KEY = "feyxa_admin_impersonate";

export function useStore() {
  const { user } = useAuth();
  const [store, setStore] = useState<any>(null);
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isImpersonating, setIsImpersonating] = useState(false);

  const refetch = useCallback(() => setRefreshKey((k) => k + 1), []);

  const switchStore = useCallback((storeId: string) => {
    localStorage.setItem(ACTIVE_STORE_KEY, storeId);
    // Clear impersonation when switching to own store
    const found = stores.find((s) => s.id === storeId);
    if (found) {
      setStore(found);
      localStorage.removeItem(ADMIN_IMPERSONATE_KEY);
      setIsImpersonating(false);
    } else {
      refetch();
    }
  }, [stores, refetch]);

  // Admin impersonation: access any store's dashboard
  const impersonateStore = useCallback(async (storeId: string) => {
    const { data } = await supabase
      .from("stores")
      .select("*")
      .eq("id", storeId)
      .single();
    if (data) {
      localStorage.setItem(ACTIVE_STORE_KEY, storeId);
      localStorage.setItem(ADMIN_IMPERSONATE_KEY, storeId);
      setStore(data);
      setIsImpersonating(true);
    }
  }, []);

  const stopImpersonating = useCallback(() => {
    localStorage.removeItem(ADMIN_IMPERSONATE_KEY);
    setIsImpersonating(false);
    refetch();
  }, [refetch]);

  useEffect(() => {
    if (!user) {
      setStore(null);
      setStores([]);
      setLoading(false);
      setIsImpersonating(false);
      return;
    }

    setLoading(true);
    const fetchStores = async () => {
      // Check if admin is impersonating
      const impersonateId = localStorage.getItem(ADMIN_IMPERSONATE_KEY);

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

      // If impersonating, load that store
      if (impersonateId) {
        const { data: impStore } = await supabase
          .from("stores")
          .select("*")
          .eq("id", impersonateId)
          .single();
        if (impStore) {
          setStore(impStore);
          setIsImpersonating(true);
          setLoading(false);
          return;
        }
        // Impersonated store not found, clear
        localStorage.removeItem(ADMIN_IMPERSONATE_KEY);
      }

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
      setIsImpersonating(false);
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
    impersonateStore,
    stopImpersonating,
    isImpersonating,
  };
}
