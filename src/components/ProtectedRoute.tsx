import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useStore } from "@/hooks/useStore";
import { useUserRole } from "@/hooks/useUserRole";

/** Route that requires authentication only (for clients and vendors) */
export function AuthRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground text-sm">Chargement...</div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return <>{children}</>;
}

/** Route that requires vendor role + store (for dashboard) */
export function VendorRoute({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { hasStore, loading: storeLoading } = useStore();
  const { role, loading: roleLoading } = useUserRole();
  const location = useLocation();

  if (authLoading || storeLoading || roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground text-sm">Chargement...</div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  // If user is a client (not vendor), redirect to marketplace
  if (role === "client") return <Navigate to="/market" replace />;

  // If vendor has no store and isn't on onboarding, redirect there
  const isOnboarding = location.pathname === "/onboarding";
  if (!hasStore && !isOnboarding) return <Navigate to="/onboarding" replace />;
  if (hasStore && isOnboarding) return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
}

/** Legacy alias - kept for backward compatibility */
export const ProtectedRoute = VendorRoute;
