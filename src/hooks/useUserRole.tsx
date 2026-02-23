import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type AccountType = "client" | "vendor" | null;

export function useUserRole() {
  const { user } = useAuth();
  const [role, setRole] = useState<AccountType>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRole(null);
      setLoading(false);
      return;
    }

    const fetchRole = async () => {
      setLoading(true);
      
      // Check user_roles table for client or vendor role
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .in("role", ["client", "vendor"]);

      if (data && data.length > 0) {
        // Prefer vendor if both exist
        const hasVendor = data.some((r) => r.role === "vendor");
        setRole(hasVendor ? "vendor" : "client");
      } else {
        // Fallback: check if user has a store (legacy users)
        const { data: store } = await supabase
          .from("stores")
          .select("id")
          .eq("owner_id", user.id)
          .limit(1)
          .maybeSingle();

        if (store) {
          // Legacy vendor - assign role
          await supabase.from("user_roles").insert({
            user_id: user.id,
            role: "vendor" as any,
          });
          setRole("vendor");
        } else {
          // Default to client
          setRole("client");
        }
      }
      
      setLoading(false);
    };

    fetchRole();
  }, [user]);

  return { role, loading, isVendor: role === "vendor", isClient: role === "client" };
}
