import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { OtpVerifyDialog } from "@/components/security/OtpVerifyDialog";
import { translateAuthError } from "@/lib/translate-auth-error";

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [show2fa, setShow2fa] = useState(false);
  const [pendingUser, setPendingUser] = useState<{ id: string; email: string } | null>(null);

  const logLoginActivity = async (userId: string, success: boolean, failureReason?: string) => {
    try {
      await supabase.functions.invoke("otp", {
        body: {
          action: "log_login",
          user_id: userId,
          ip_address: null, // Can't reliably get from client
          user_agent: navigator.userAgent,
          success,
          failure_reason: failureReason,
        },
      });
    } catch {}
  };

  const proceedAfterAuth = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      navigate("/market");
      return;
    }

    await logLoginActivity(authUser.id, true);

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", authUser.id)
      .in("role", ["client", "vendor"]);

    const isVendor = roles?.some((r) => r.role === "vendor");

    if (isVendor) {
      const { data: store } = await supabase
        .from("stores")
        .select("id")
        .eq("owner_id", authUser.id)
        .limit(1)
        .maybeSingle();
      navigate(store ? "/dashboard" : "/onboarding");
    } else {
      navigate("/account");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) {
      setLoading(false);
      toast.error(translateAuthError(error.message));
      return;
    }

    // Check if 2FA is enabled
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      setLoading(false);
      navigate("/market");
      return;
    }

    const { data: securitySettings } = await supabase
      .from("user_security_settings")
      .select("two_factor_enabled")
      .eq("user_id", authUser.id)
      .maybeSingle();

    if (securitySettings?.two_factor_enabled) {
      // Show 2FA dialog
      setPendingUser({ id: authUser.id, email: authUser.email! });
      setShow2fa(true);
      setLoading(false);
      return;
    }

    // No 2FA, proceed directly
    await proceedAfterAuth();
    setLoading(false);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "#0E0E11" }}
    >
      <div className="w-full" style={{ maxWidth: "400px" }}>
        {/* Logo */}
        <div className="flex justify-center mb-16">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <div
              className="h-8 w-8 rounded-lg flex items-center justify-center"
              style={{ background: "hsl(var(--primary))" }}
            >
              <span className="text-sm font-bold" style={{ color: "#0E0E11" }}>F</span>
            </div>
            <span
              className="text-lg tracking-wide"
              style={{ color: "#FFFFFF", fontWeight: 600 }}
            >
              Feyxa
            </span>
          </Link>
        </div>

        {/* Headline */}
        <div className="text-center mb-12">
          <h1
            style={{
              color: "#FFFFFF",
              fontSize: "clamp(2.5rem, 5vw, 3.5rem)",
              fontWeight: 600,
              letterSpacing: "-0.02em",
              lineHeight: 1.05,
            }}
          >
            Bienvenue.
          </h1>
          <p
            className="mt-3"
            style={{ color: "#9CA3AF", fontSize: "1rem", fontWeight: 400 }}
          >
            Connectez-vous à votre espace
          </p>
        </div>

        {/* Card */}
        <div
          className="p-8"
          style={{
            background: "#141419",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: "1rem",
          }}
        >
          {/* Google */}
          <button
            type="button"
            onClick={async () => {
              const { error } = await lovable.auth.signInWithOAuth("google", {
                redirect_uri: window.location.origin,
              });
              if (error) toast.error("Erreur Google : " + (error as any).message);
            }}
            className="w-full h-12 flex items-center justify-center gap-2.5 text-sm transition-opacity duration-200 hover:opacity-90"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "0.625rem",
              color: "#FFFFFF",
              fontWeight: 500,
            }}
          >
            <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" style={{ width: 18, height: 18 }}>
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continuer avec Google
          </button>

          {/* Divider */}
          <div className="relative my-7">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }} />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 text-xs" style={{ background: "#141419", color: "#6B7280" }}>ou</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block mb-2 text-xs" style={{ color: "#9CA3AF", fontWeight: 500, letterSpacing: "0.04em", textTransform: "uppercase" }}>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="vous@exemple.com" className="w-full h-12 px-4 text-sm transition-colors duration-200 focus:outline-none" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "0.625rem", color: "#FFFFFF", fontWeight: 400 }} onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)"; }} onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }} />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs" style={{ color: "#9CA3AF", fontWeight: 500, letterSpacing: "0.04em", textTransform: "uppercase" }}>Mot de passe</label>
                <Link to="/forgot-password" className="text-xs transition-opacity hover:opacity-80" style={{ color: "hsl(var(--primary))", fontWeight: 500 }}>Mot de passe oublié ?</Link>
              </div>
              <div className="relative">
                <input type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" className="w-full h-12 px-4 pr-11 text-sm transition-colors duration-200 focus:outline-none" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "0.625rem", color: "#FFFFFF", fontWeight: 400 }} onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)"; }} onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }} />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-opacity duration-200 hover:opacity-70" style={{ color: "#6B7280" }}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full h-12 flex items-center justify-center gap-2 text-sm transition-opacity duration-200 hover:opacity-90 disabled:opacity-50" style={{ background: "hsl(var(--primary))", color: "#0E0E11", borderRadius: "0.625rem", fontWeight: 600, border: "none", marginTop: "1.75rem" }}>
              {loading ? "Connexion…" : "Se connecter"}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>
        </div>

        {/* Footer link */}
        <p className="text-center mt-8" style={{ color: "#6B7280", fontSize: "0.875rem" }}>
          Pas encore de compte ?{" "}
          <Link to="/signup" className="transition-colors duration-200 hover:opacity-80" style={{ color: "#FFFFFF", fontWeight: 500 }}>Créer un compte</Link>
        </p>
      </div>

      {/* 2FA OTP Dialog */}
      {pendingUser && (
        <OtpVerifyDialog
          open={show2fa}
          onOpenChange={(open) => {
            if (!open) {
              // User cancelled 2FA - sign out
              supabase.auth.signOut();
              setPendingUser(null);
            }
            setShow2fa(open);
          }}
          userId={pendingUser.id}
          email={pendingUser.email}
          purpose="login_2fa"
          onVerified={async () => {
            setPendingUser(null);
            await proceedAfterAuth();
          }}
        />
      )}
    </div>
  );
}
