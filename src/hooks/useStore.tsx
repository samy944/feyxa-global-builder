import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export function useStore() {
  const { user } = useAuth();
  const [store, setStore] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const refetch = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    if (!user) {
      setStore(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const fetchStore = async () => {
      const { data } = await supabase
        .from("stores")
        .select("*")
        .eq("owner_id", user.id)
        .limit(1)
        .maybeSingle();

      setStore(data);
      setLoading(false);
    };

    fetchStore();
  }, [user, refreshKey]);

  return { store, loading, hasStore: !!store, refetch };
}
