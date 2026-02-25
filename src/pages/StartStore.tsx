import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";
import { useOAuthCallback } from "@/hooks/useOAuthCallback";
import { motion } from "framer-motion";
import { ArrowRight, Store, Loader2, RefreshCw, Mail, Sparkles, ShieldCheck, Globe } from "lucide-react";
import { toast } from "sonner";
import { translateAuthError } from "@/lib/translate-auth-error";
import { useTranslation } from "@/lib/i18n";
import { useEffect } from "react";

const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

function parseOAuthError(error: any): string {
  const msg = error?.message || String(error);
  if (msg.includes("popup")) return "popupBlocked";
  if (msg.includes("cancel") || msg.includes("denied")) return "cancelled";
  if (msg.includes("redirect")) return "redirectError";
  if (msg.includes("disabled") || msg.includes("provider")) return "providerDisabled";
  return "generic";
}

export default function StartStore() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  useOAuthCallback();

  const [oauthLoading, setOauthLoading] = useState<"google" | "apple" | null>(null);
  const [oauthError, setOauthError] = useState<{ provider: string; message: string } | null>(null);
  const showAppleFirst = useMemo(() => isIOS(), []);

  // If user is already logged in, check if they have a store and redirect accordingly
  useEffect(() => {
    if (authLoading || !user) return;

    const checkAndRedirect = async () => {
      // Ensure vendor role
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      const hasVendorRole = roles?.some((r) => r.role === "vendor");
      if (!hasVendorRole) {
        await supabase.from("user_roles").insert({ user_id: user.id, role: "vendor" });
      }

      const { data: store } = await supabase
        .from("stores")
        .select("id")
        .eq("owner_id", user.id)
        .limit(1)
        .maybeSingle();

      navigate(store ? "/dashboard" : "/onboarding", { replace: true });
    };

    checkAndRedirect();
  }, [user, authLoading, navigate]);

  const handleOAuth = async (provider: "google" | "apple") => {
    // Store intent for post-auth redirect
    localStorage.setItem("post_auth_redirect", "/onboarding");
    setOauthLoading(provider);
    setOauthError(null);
    try {
      const { error } = await lovable.auth.signInWithOAuth(provider, { redirect_uri: window.location.origin });
      if (error) {
        const errType = parseOAuthError(error);
        const errMessages: Record<string, string> = {
          popupBlocked: t.auth.oauthPopupBlocked,
          cancelled: t.auth.oauthCancelled,
          redirectError: t.auth.oauthRedirectError,
          providerDisabled: t.auth.oauthProviderDisabled,
          generic: t.auth.oauthGenericError,
        };
        setOauthError({ provider, message: errMessages[errType] || errMessages.generic });
        setOauthLoading(null);
      }
    } catch {
      setOauthError({ provider, message: t.auth.oauthGenericError });
      setOauthLoading(null);
    }
  };

  const handleEmailSignup = () => {
    localStorage.setItem("post_auth_redirect", "/onboarding");
    navigate("/signup?intent=vendor");
  };

  // Show loader while checking auth state
  if (authLoading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0E0E11" }}>
        <Loader2 className="animate-spin text-primary" size={24} />
      </div>
    );
  }

  const googleIcon = (
    <svg viewBox="0 0 24 24" className="h-5 w-5">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );

  const appleIcon = (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
    </svg>
  );

  const benefits = [
    { icon: <Sparkles size={16} />, text: "Boutique en ligne en 5 minutes" },
    { icon: <Globe size={16} />, text: "Marketplace pan-africaine" },
    { icon: <ShieldCheck size={16} />, text: "Paiements sécurisés & escrow" },
  ];

  const OAuthButton = ({ provider, icon, label, badge }: { provider: "google" | "apple"; icon: React.ReactNode; label: string; badge?: string }) => {
    const isLoading = oauthLoading === provider;
    const hasError = oauthError?.provider === provider;
    return (
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => handleOAuth(provider)}
          disabled={oauthLoading !== null}
          className="w-full h-13 flex items-center justify-center gap-3 text-sm font-medium transition-all duration-200 rounded-xl border hover:opacity-90 disabled:opacity-50 relative"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: hasError ? "1px solid rgba(239,68,68,0.4)" : "1px solid rgba(255,255,255,0.08)",
            color: "#FFFFFF",
          }}
        >
          {isLoading ? <Loader2 size={18} className="animate-spin text-muted-foreground" /> : icon}
          {isLoading ? t.auth.oauthLoading : label}
          {badge && !isLoading && (
            <span className="absolute right-3 text-[10px] px-1.5 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.08)", color: "#9CA3AF" }}>
              {badge}
            </span>
          )}
        </button>
        {hasError && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)" }}>
            <p className="text-xs flex-1" style={{ color: "#FCA5A5" }}>{oauthError!.message}</p>
            <button
              onClick={() => { setOauthError(null); handleOAuth(provider); }}
              className="flex items-center gap-1 text-xs px-2 py-1 rounded transition-opacity hover:opacity-80"
              style={{ color: "#FFFFFF", background: "rgba(255,255,255,0.08)" }}
            >
              <RefreshCw size={12} /> {t.auth.oauthRetry}
            </button>
          </div>
        )}
      </div>
    );
  };

  const oauthButtons = showAppleFirst
    ? [
        <OAuthButton key="apple" provider="apple" icon={appleIcon} label="Continuer avec Apple" badge="Recommandé" />,
        <OAuthButton key="google" provider="google" icon={googleIcon} label="Continuer avec Google" />,
      ]
    : [
        <OAuthButton key="google" provider="google" icon={googleIcon} label="Continuer avec Google" />,
        <OAuthButton key="apple" provider="apple" icon={appleIcon} label="Continuer avec Apple" />,
      ];

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: "#0E0E11" }}>
      <div className="absolute inset-0 grid-pattern opacity-15" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[180px] opacity-[0.06]" style={{ background: "hsl(var(--primary))" }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md z-10"
      >
        {/* Logo */}
        <div className="flex justify-center mb-10">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: "hsl(var(--primary))" }}>
              <span className="text-sm font-bold" style={{ color: "#0E0E11" }}>F</span>
            </div>
            <span className="text-xl tracking-wide font-semibold" style={{ color: "#FFFFFF" }}>Feyxa</span>
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl mb-5" style={{ background: "rgba(71,210,30,0.1)" }}>
            <Store size={24} style={{ color: "hsl(var(--primary))" }} />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight" style={{ color: "#FFFFFF", lineHeight: 1.1 }}>
            Créez votre boutique
          </h1>
          <p className="mt-3 text-base" style={{ color: "#9CA3AF" }}>
            Lancez votre e-commerce en quelques minutes. Gratuit pour commencer.
          </p>
        </div>

        {/* Benefits */}
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {benefits.map((b) => (
            <div key={b.text} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", color: "#D1D5DB" }}>
              <span style={{ color: "hsl(var(--primary))" }}>{b.icon}</span>
              {b.text}
            </div>
          ))}
        </div>

        {/* Auth card */}
        <div className="p-7 rounded-2xl" style={{ background: "#141419", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="space-y-3">
            {oauthButtons}
          </div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }} />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 text-xs" style={{ background: "#141419", color: "#6B7280" }}>ou</span>
            </div>
          </div>

          {/* Email button */}
          <button
            type="button"
            onClick={handleEmailSignup}
            className="w-full h-13 flex items-center justify-center gap-3 text-sm font-medium transition-all duration-200 rounded-xl hover:opacity-90"
            style={{
              background: "hsl(var(--primary))",
              color: "#0E0E11",
              border: "none",
            }}
          >
            <Mail size={18} />
            Continuer avec email
            <ArrowRight size={16} />
          </button>
        </div>

        {/* Login link */}
        <p className="text-center mt-7 text-sm" style={{ color: "#6B7280" }}>
          Vous avez déjà un compte ?{" "}
          <Link to="/login" className="transition-colors hover:opacity-80" style={{ color: "#FFFFFF", fontWeight: 500 }}>
            Se connecter
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
