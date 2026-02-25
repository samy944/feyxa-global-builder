import { useState, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { lovable } from "@/integrations/lovable/index";
import { useOAuthCallback } from "@/hooks/useOAuthCallback";
import { motion } from "framer-motion";
import { Eye, EyeOff, ArrowRight, ShoppingBag, Store, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { translateAuthError } from "@/lib/translate-auth-error";
import { useTranslation } from "@/lib/i18n";

const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

function parseOAuthError(error: any): string {
  const msg = error?.message || String(error);
  if (msg.includes("popup")) return "popupBlocked";
  if (msg.includes("cancel") || msg.includes("denied")) return "cancelled";
  if (msg.includes("redirect")) return "redirectError";
  if (msg.includes("disabled") || msg.includes("provider")) return "providerDisabled";
  return "generic";
}

export default function Signup() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Handle OAuth callback routing
  useOAuthCallback();

  const [searchParams] = useSearchParams();
  const intentVendor = searchParams.get("intent") === "vendor";

  const [accountType, setAccountType] = useState<"client" | "vendor">(intentVendor ? "vendor" : "client");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"google" | "apple" | null>(null);
  const [oauthError, setOauthError] = useState<{ provider: string; message: string } | null>(null);

  const showAppleFirst = useMemo(() => isIOS(), []);

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
    } catch {
      setOauthError({ provider, message: t.auth.oauthGenericError });
      setOauthLoading(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { toast.error(t.auth.passwordMin8); return; }
    setLoading(true);
    const { error } = await signUp(email, password, fullName, accountType);
    setLoading(false);
    if (error) { toast.error(translateAuthError(error.message)); } else {
      toast.success(t.auth.accountCreated);
      const postRedirect = localStorage.getItem("post_auth_redirect");
      if (postRedirect) {
        localStorage.removeItem("post_auth_redirect");
        navigate(postRedirect);
      } else {
        navigate(accountType === "vendor" ? "/dashboard" : "/account");
      }
    }
  };

  const OAuthButton = ({ provider, icon, label, badge }: { provider: "google" | "apple"; icon: React.ReactNode; label: string; badge?: string }) => {
    const isLoading = oauthLoading === provider;
    const hasError = oauthError?.provider === provider;

    return (
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => handleOAuth(provider)}
          disabled={oauthLoading !== null}
          className={`w-full h-11 flex items-center justify-center gap-2 text-sm transition-all duration-200 rounded-lg border hover:opacity-90 disabled:opacity-50 relative ${
            hasError ? "border-destructive/40" : "border-border"
          } bg-background text-foreground`}
        >
          {isLoading ? (
            <Loader2 size={18} className="animate-spin text-muted-foreground" />
          ) : (
            icon
          )}
          {isLoading ? t.auth.oauthLoading : label}
          {badge && !isLoading && (
            <span className="absolute right-3 text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
              {badge}
            </span>
          )}
        </button>
        {hasError && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20">
            <p className="text-xs flex-1 text-destructive">{oauthError!.message}</p>
            <button
              onClick={() => { setOauthError(null); handleOAuth(provider); }}
              className="flex items-center gap-1 text-xs px-2 py-1 rounded transition-opacity hover:opacity-80 bg-secondary text-foreground"
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
    <div className="min-h-screen bg-hero flex items-center justify-center p-4">
      <div className="absolute inset-0 grid-pattern opacity-30" />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold">F</span>
            </div>
            <span className="font-bold text-xl tracking-tight text-foreground">Feyxa</span>
          </Link>
          <h1 className="text-2xl font-bold text-foreground">{t.auth.joinFeyxa}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t.auth.createInSeconds}</p>
        </div>

        <div className="space-y-5 rounded-2xl border border-border bg-card p-8">
          {/* OAuth buttons — above email form */}
          <div className="space-y-3">
            {oauthButtons}
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-xs"><span className="bg-card px-2 text-muted-foreground">{t.auth.orByEmail}</span></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">{t.auth.accountType}</label>
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => setAccountType("client")} className={`relative flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${accountType === "client" ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:border-primary/40"}`}>
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${accountType === "client" ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"}`}>
                    <ShoppingBag size={20} />
                  </div>
                  <span className="text-sm font-semibold text-foreground">{t.auth.client}</span>
                  <span className="text-[11px] text-muted-foreground text-center leading-tight">{t.auth.clientDesc}</span>
                </button>
                <button type="button" onClick={() => setAccountType("vendor")} className={`relative flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${accountType === "vendor" ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:border-primary/40"}`}>
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${accountType === "vendor" ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"}`}>
                    <Store size={20} />
                  </div>
                  <span className="text-sm font-semibold text-foreground">{t.auth.vendor}</span>
                  <span className="text-[11px] text-muted-foreground text-center leading-tight">{t.auth.vendorDesc}</span>
                </button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">{t.auth.fullName}</label>
              <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Jean Kouassi" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">{t.auth.email}</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" placeholder="vous@exemple.com" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">{t.auth.password}</label>
              <div className="relative">
                <input type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} className="w-full h-10 rounded-lg border border-border bg-background px-3 pr-10 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" placeholder={t.auth.minChars} />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <Button variant="hero" className="w-full" disabled={loading}>
              {loading ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
              {loading ? t.auth.creating : accountType === "vendor" ? t.auth.createMyStore : t.auth.createMyAccount}
              {!loading && <ArrowRight size={16} />}
            </Button>
            <p className="text-xs text-muted-foreground text-center">{t.auth.termsNotice}</p>
          </form>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          {t.auth.hasAccount}{" "}
          <Link to="/login" className="text-primary hover:underline font-medium">{t.auth.loginHere}</Link>
        </p>
      </motion.div>
    </div>
  );
}
