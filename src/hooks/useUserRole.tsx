import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type AccountType = "client" | "vendor" | null;

export function useUserRole() {
  const { user } = useAuth();
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const userId = user?.id;

  useEffect(() => {
    if (!userId) {
      setRoles([]);
      setLoading(false);
      return;
    }

    const fetchRoles = async () => {
      setLoading(true);

      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .in("role", ["client", "vendor"]);

      if (data && data.length > 0) {
        setRoles(data.map((r) => r.role));
      } else {
        // Fallback: check if user has a store (legacy users)
        const { data: store } = await supabase
          .from("stores")
          .select("id")
          .eq("owner_id", userId)
          .limit(1)
          .maybeSingle();

        if (store) {
          await supabase.from("user_roles").insert({
            user_id: userId,
            role: "vendor" as any,
          });
          setRoles(["vendor"]);
        } else {
          setRoles(["client"]);
        }
      }

      setLoading(false);
    };

    fetchRoles();
  }, [userId]);

  const isVendor = roles.includes("vendor");
  const isClient = roles.includes("client");
  // Primary role for routing: vendor takes priority
  const role: AccountType = isVendor ? "vendor" : isClient ? "client" : null;

  return { role, roles, loading, isVendor, isClient, hasDualRole: isVendor && isClient };
}
