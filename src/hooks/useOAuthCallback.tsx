import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Hook that listens for OAuth SIGNED_IN events and handles:
 * - Profile creation (full_name from provider, Apple relay email detection)
 * - Role-based routing (vendor → dashboard/onboarding, client → /account)
 * - Apple name handling (only sent on first login)
 */
export function useOAuthCallback() {
  const navigate = useNavigate();
  const handled = useRef(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event !== "SIGNED_IN" || !session?.user || handled.current) return;

      const user = session.user;
      const provider = user.app_metadata?.provider;

      // Only handle OAuth providers (not email/password)
      if (!provider || provider === "email") return;

      handled.current = true;

      try {
        // Ensure profile exists
        const { data: existingProfile } = await supabase
          .from("profiles")
          .select("id, full_name")
          .eq("id", user.id)
          .maybeSingle();

        if (existingProfile && !existingProfile.full_name) {
          // Update with name from provider (Apple only sends name on first auth)
          const fullName =
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            [user.user_metadata?.first_name, user.user_metadata?.last_name].filter(Boolean).join(" ") ||
            null;

          if (fullName) {
            await supabase
              .from("profiles")
              .update({ full_name: fullName })
              .eq("id", user.id);
          }
        }

        // Ensure user has a role
        const { data: roles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id);

        if (!roles || roles.length === 0) {
          // New OAuth user — default to client
          await supabase.from("user_roles").insert({ user_id: user.id, role: "client" });
          navigate("/account");
          return;
        }

        // Check for stored post-auth redirect intent
        const postAuthRedirect = localStorage.getItem("post_auth_redirect");
        if (postAuthRedirect) {
          localStorage.removeItem("post_auth_redirect");
          // If redirecting to onboarding, ensure user has vendor role
          if (postAuthRedirect === "/onboarding") {
            const hasVendorRole = roles.some((r) => r.role === "vendor");
            if (!hasVendorRole) {
              await supabase.from("user_roles").insert({ user_id: user.id, role: "vendor" });
            }
          }
          navigate(postAuthRedirect);
          return;
        }

        const isVendor = roles.some((r) => r.role === "vendor");

        if (isVendor) {
          const { data: store } = await supabase
            .from("stores")
            .select("id")
            .eq("owner_id", user.id)
            .limit(1)
            .maybeSingle();
          navigate(store ? "/dashboard" : "/onboarding");
        } else {
          navigate("/account");
        }
      } catch (err) {
        console.error("OAuth callback error:", err);
        toast.error("An error occurred after sign in");
        navigate("/market");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);
}
