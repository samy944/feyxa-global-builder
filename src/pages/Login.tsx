import { useState, useEffect, useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Eye, EyeOff, ArrowRight, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { OtpVerifyDialog } from "@/components/security/OtpVerifyDialog";
import { translateAuthError } from "@/lib/translate-auth-error";
import { useTranslation } from "@/lib/i18n";
import { useOAuthCallback } from "@/hooks/useOAuthCallback";

const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

function parseOAuthError(error: any): string {
  const msg = error?.message || String(error);
  if (msg.includes("popup")) return "popupBlocked";
  if (msg.includes("cancel") || msg.includes("denied")) return "cancelled";
  if (msg.includes("redirect")) return "redirectError";
  if (msg.includes("disabled") || msg.includes("provider")) return "providerDisabled";
  return "generic";
}

export default function Login() {
  const { user, loading: authLoading, signIn } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [show2fa, setShow2fa] = useState(false);
  const [pendingUser, setPendingUser] = useState<{ id: string; email: string } | null>(null);
  const [oauthLoading, setOauthLoading] = useState<"google" | "apple" | null>(null);
  const [oauthError, setOauthError] = useState<{ provider: string; message: string } | null>(null);
  const [is2faPending, setIs2faPending] = useState(false);
  const skip2faCheckRef = useRef(false);
  const isSubmittingRef = useRef(false);

  // Handle OAuth callback routing
  useOAuthCallback();

  const showAppleFirst = useMemo(() => isIOS(), []);

  // Redirect already-authenticated users away from login (skip if 2FA pending or submitting)
  useEffect(() => {
    if (authLoading || !user || is2faPending || isSubmittingRef.current) return;
    redirectByRole(user.id);
  }, [user, authLoading, is2faPending]);

  const logLoginActivity = async (userId: string, success: boolean, failureReason?: string) => {
    try {
      await supabase.functions.invoke("otp", {
        body: { action: "log_login", user_id: userId, ip_address: null, user_agent: navigator.userAgent, success, failure_reason: failureReason },
      });
    } catch {}
  };

  const redirectByRole = async (userId: string) => {
    // Check for post-auth redirect intent first
    const postAuthRedirect = localStorage.getItem("post_auth_redirect");
    if (postAuthRedirect) {
      localStorage.removeItem("post_auth_redirect");
      navigate(postAuthRedirect, { replace: true });
      return;
    }

    // Check admin role
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "marketplace_admin" as any });
    if (isAdmin) {
      navigate("/admin", { replace: true });
      return;
    }

    // Check vendor role
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId).in("role", ["client", "vendor"]);
    const isVendor = roles?.some((r) => r.role === "vendor");
    if (isVendor) {
      const { data: store } = await supabase.from("stores").select("id").eq("owner_id", userId).limit(1).maybeSingle();
      navigate(store ? "/dashboard" : "/onboarding", { replace: true });
    } else {
      navigate("/account", { replace: true });
    }
  };

  const proceedAfterAuth = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) { navigate("/market"); return; }
    await logLoginActivity(authUser.id, true);
    await redirectByRole(authUser.id);
  };

  const handleOAuth = async (provider: "google" | "apple") => {
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
    } catch (err) {
      setOauthError({ provider, message: t.auth.oauthGenericError });
      setOauthLoading(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    isSubmittingRef.current = true;
    const { error } = await signIn(email, password);
    if (error) {
      setLoading(false);
      isSubmittingRef.current = false;
      toast.error(translateAuthError(error.message));
      return;
    }
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) { setLoading(false); isSubmittingRef.current = false; navigate("/market"); return; }

    // Skip 2FA check if we just completed OTP verification
    if (!skip2faCheckRef.current) {
      const { data: securitySettings } = await supabase.from("user_security_settings").select("two_factor_enabled").eq("user_id", authUser.id).maybeSingle();
      if (securitySettings?.two_factor_enabled) {
        setIs2faPending(true);
        // Sign out to prevent the active session from bypassing 2FA
        await supabase.auth.signOut();
        setPendingUser({ id: authUser.id, email: authUser.email! });
        setShow2fa(true);
        setLoading(false);
        isSubmittingRef.current = false;
        return;
      }
    }
    skip2faCheckRef.current = false;
    isSubmittingRef.current = false;
    await proceedAfterAuth();
    setLoading(false);
  };

  // Don't render form if already authenticated (avoid flash)
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0E0E11" }}>
        <Loader2 className="animate-spin text-primary" size={24} />
      </div>
    );
  }
  if (user && !is2faPending) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0E0E11" }}>
        <Loader2 className="animate-spin text-primary" size={24} />
      </div>
    );
  }

  const OAuthButton = ({ provider, icon, label, badge }: { provider: "google" | "apple"; icon: React.ReactNode; label: string; badge?: string }) => {
    const isLoading = oauthLoading === provider;
    const hasError = oauthError?.provider === provider;

    return (
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => handleOAuth(provider)}
          disabled={oauthLoading !== null}
          className="w-full h-12 flex items-center justify-center gap-2.5 text-sm transition-all duration-200 hover:opacity-90 disabled:opacity-50 relative"
          style={{
            background: "rgba(255,255,255,0.06)",
            border: hasError ? "1px solid rgba(239,68,68,0.4)" : "1px solid rgba(255,255,255,0.08)",
            borderRadius: "0.625rem",
            color: "#FFFFFF",
            fontWeight: 500,
          }}
        >
          {isLoading ? (
            <Loader2 size={18} className="animate-spin" style={{ color: "#9CA3AF" }} />
          ) : (
            icon
          )}
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
              <RefreshCw size={12} />
              {t.auth.oauthRetry}
            </button>
          </div>
        )}
      </div>
    );
  };

  const googleIcon = (
    <svg viewBox="0 0 24 24" style={{ width: 18, height: 18 }}>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );

  const appleIcon = (
    <svg viewBox="0 0 24 24" style={{ width: 18, height: 18 }} fill="currentColor">
      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
    </svg>
  );

  const oauthButtons = showAppleFirst
    ? [
        <OAuthButton key="apple" provider="apple" icon={appleIcon} label={t.auth.continueWithApple} badge={t.auth.recommendedOnIos} />,
        <OAuthButton key="google" provider="google" icon={googleIcon} label={t.auth.continueWithGoogle} />,
      ]
    : [
        <OAuthButton key="google" provider="google" icon={googleIcon} label={t.auth.continueWithGoogle} />,
        <OAuthButton key="apple" provider="apple" icon={appleIcon} label={t.auth.continueWithApple} />,
      ];

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#0E0E11" }}>
      <div className="w-full" style={{ maxWidth: "400px" }}>
        {/* Logo */}
        <div className="flex justify-center mb-16">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: "hsl(var(--primary))" }}>
              <span className="text-sm font-bold" style={{ color: "#0E0E11" }}>F</span>
            </div>
            <span className="text-lg tracking-wide" style={{ color: "#FFFFFF", fontWeight: 600 }}>Feyxa</span>
          </Link>
        </div>

        <div className="text-center mb-12">
          <h1 style={{ color: "#FFFFFF", fontSize: "clamp(2.5rem, 5vw, 3.5rem)", fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.05 }}>
            {t.auth.welcome}
          </h1>
          <p className="mt-3" style={{ color: "#9CA3AF", fontSize: "1rem", fontWeight: 400 }}>
            {t.auth.welcomeBack}
          </p>
        </div>

        <div className="p-8" style={{ background: "#141419", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "1rem" }}>
          {/* OAuth buttons */}
          <div className="space-y-3">
            {oauthButtons}
          </div>

          {/* Divider */}
          <div className="relative my-7">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }} />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 text-xs" style={{ background: "#141419", color: "#6B7280" }}>{t.auth.or}</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block mb-2 text-xs" style={{ color: "#9CA3AF", fontWeight: 500, letterSpacing: "0.04em", textTransform: "uppercase" }}>{t.auth.email}</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="vous@exemple.com" className="w-full h-12 px-4 text-sm transition-colors duration-200 focus:outline-none" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "0.625rem", color: "#FFFFFF", fontWeight: 400 }} onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)"; }} onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }} />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs" style={{ color: "#9CA3AF", fontWeight: 500, letterSpacing: "0.04em", textTransform: "uppercase" }}>{t.auth.password}</label>
                <Link to="/forgot-password" className="text-xs transition-opacity hover:opacity-80" style={{ color: "hsl(var(--primary))", fontWeight: 500 }}>{t.auth.forgotPassword}</Link>
              </div>
              <div className="relative">
                <input type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" className="w-full h-12 px-4 pr-11 text-sm transition-colors duration-200 focus:outline-none" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "0.625rem", color: "#FFFFFF", fontWeight: 400 }} onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)"; }} onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }} />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-opacity duration-200 hover:opacity-70" style={{ color: "#6B7280" }}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full h-12 flex items-center justify-center gap-2 text-sm transition-opacity duration-200 hover:opacity-90 disabled:opacity-50" style={{ background: "hsl(var(--primary))", color: "#0E0E11", borderRadius: "0.625rem", fontWeight: 600, border: "none", marginTop: "1.75rem" }}>
              {loading ? <Loader2 size={16} className="animate-spin" /> : null}
              {loading ? t.auth.connecting : t.auth.login}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>
        </div>

        <p className="text-center mt-8" style={{ color: "#6B7280", fontSize: "0.875rem" }}>
          {t.auth.noAccount}{" "}
          <Link to="/signup" className="transition-colors duration-200 hover:opacity-80" style={{ color: "#FFFFFF", fontWeight: 500 }}>{t.auth.createAccount}</Link>
        </p>
      </div>

      {pendingUser && (
        <OtpVerifyDialog
          open={show2fa}
          onOpenChange={(open) => {
            if (!open) {
              setPendingUser(null);
              setIs2faPending(false);
            }
            setShow2fa(open);
          }}
          userId={pendingUser.id}
          email={pendingUser.email}
          purpose="login_2fa"
          onVerified={async () => {
            // Re-authenticate after successful OTP — skip 2FA check this time
            skip2faCheckRef.current = true;
            setIs2faPending(false);
            setPendingUser(null);
            const { error } = await signIn(email, password);
            if (error) {
              toast.error(translateAuthError(error.message));
              return;
            }
            await proceedAfterAuth();
          }}
        />
      )}
    </div>
  );
}
