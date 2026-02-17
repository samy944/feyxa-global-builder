import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useStore } from "@/hooks/useStore";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { hasStore, loading: storeLoading } = useStore();
  const location = useLocation();

  if (authLoading || storeLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground text-sm">Chargement...</div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  // If user has no store and isn't on onboarding, redirect there
  const isOnboarding = location.pathname === "/onboarding";
  if (!hasStore && !isOnboarding) return <Navigate to="/onboarding" replace />;
  if (hasStore && isOnboarding) return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
}
