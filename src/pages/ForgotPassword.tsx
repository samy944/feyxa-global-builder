import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Mail } from "lucide-react";
import { toast } from "sonner";
import { translateAuthError } from "@/lib/translate-auth-error";
import { useTranslation } from "@/lib/i18n";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
    setLoading(false);
    if (error) { toast.error(translateAuthError(error.message)); return; }
    setSent(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#0E0E11" }}>
      <div className="w-full" style={{ maxWidth: "400px" }}>
        <div className="flex justify-center mb-16">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: "hsl(var(--primary))" }}>
              <span className="text-sm font-bold" style={{ color: "#0E0E11" }}>F</span>
            </div>
            <span className="text-lg tracking-wide" style={{ color: "#FFFFFF", fontWeight: 600 }}>Feyxa</span>
          </Link>
        </div>

        <div className="text-center mb-12">
          <h1 style={{ color: "#FFFFFF", fontSize: "clamp(1.8rem, 4vw, 2.5rem)", fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.1 }}>
            {t.auth.forgotPasswordTitle}
          </h1>
          <p className="mt-3" style={{ color: "#9CA3AF", fontSize: "0.95rem" }}>
            {t.auth.forgotPasswordSubtitle}
          </p>
        </div>

        <div className="p-8" style={{ background: "#141419", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "1rem" }}>
          {sent ? (
            <div className="text-center space-y-4">
              <div className="h-14 w-14 rounded-full mx-auto flex items-center justify-center" style={{ background: "hsl(var(--primary) / 0.15)" }}>
                <Mail size={24} style={{ color: "hsl(var(--primary))" }} />
              </div>
              <p style={{ color: "#FFFFFF", fontWeight: 500, fontSize: "1rem" }}>{t.auth.resetLinkSent}</p>
              <p style={{ color: "#9CA3AF", fontSize: "0.875rem", lineHeight: 1.6 }}>
                <strong style={{ color: "#FFFFFF" }}>{email}</strong>
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block mb-2 text-xs" style={{ color: "#9CA3AF", fontWeight: 500, letterSpacing: "0.04em", textTransform: "uppercase" }}>{t.auth.email}</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="vous@exemple.com" className="w-full h-12 px-4 text-sm transition-colors duration-200 focus:outline-none" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "0.625rem", color: "#FFFFFF" }} onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)"; }} onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }} />
              </div>
              <button type="submit" disabled={loading} className="w-full h-12 flex items-center justify-center gap-2 text-sm transition-opacity duration-200 hover:opacity-90 disabled:opacity-50" style={{ background: "hsl(var(--primary))", color: "#0E0E11", borderRadius: "0.625rem", fontWeight: 600, border: "none" }}>
                {loading ? t.auth.sending : t.auth.sendResetLink}
              </button>
            </form>
          )}
        </div>

        <p className="text-center mt-8">
          <Link to="/login" className="inline-flex items-center gap-1.5 text-sm transition-opacity hover:opacity-80" style={{ color: "#9CA3AF" }}>
            <ArrowLeft size={14} />
            {t.auth.backToLogin}
          </Link>
        </p>
      </div>
    </div>
  );
}
