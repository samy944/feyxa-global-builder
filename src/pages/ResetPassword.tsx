import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Eye, EyeOff, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { translateAuthError } from "@/lib/translate-auth-error";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [validSession, setValidSession] = useState(false);

  useEffect(() => {
    // Check if we have a recovery session from the URL hash
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setValidSession(true);
    }
    // Also listen for auth state changes (recovery event)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setValidSession(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (password !== confirm) {
      toast.error("Les mots de passe ne correspondent pas.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error(translateAuthError(error.message));
      return;
    }
    setDone(true);
    setTimeout(() => navigate("/login"), 3000);
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
            Nouveau mot de passe
          </h1>
        </div>

        <div className="p-8" style={{ background: "#141419", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "1rem" }}>
          {done ? (
            <div className="text-center space-y-4">
              <div className="h-14 w-14 rounded-full mx-auto flex items-center justify-center" style={{ background: "hsl(var(--primary) / 0.15)" }}>
                <CheckCircle size={24} style={{ color: "hsl(var(--primary))" }} />
              </div>
              <p style={{ color: "#FFFFFF", fontWeight: 500 }}>Mot de passe mis à jour !</p>
              <p style={{ color: "#9CA3AF", fontSize: "0.875rem" }}>Redirection vers la connexion...</p>
            </div>
          ) : !validSession ? (
            <div className="text-center space-y-4">
              <p style={{ color: "#9CA3AF", fontSize: "0.875rem" }}>Lien invalide ou expiré.</p>
              <Link to="/forgot-password" className="text-sm" style={{ color: "hsl(var(--primary))" }}>Demander un nouveau lien</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block mb-2 text-xs" style={{ color: "#9CA3AF", fontWeight: 500, letterSpacing: "0.04em", textTransform: "uppercase" }}>Nouveau mot de passe</label>
                <div className="relative">
                  <input type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} placeholder="Min. 8 caractères" className="w-full h-12 px-4 pr-11 text-sm focus:outline-none" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "0.625rem", color: "#FFFFFF" }} />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2" style={{ color: "#6B7280" }}>
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block mb-2 text-xs" style={{ color: "#9CA3AF", fontWeight: 500, letterSpacing: "0.04em", textTransform: "uppercase" }}>Confirmer</label>
                <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required placeholder="Répétez le mot de passe" className="w-full h-12 px-4 text-sm focus:outline-none" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "0.625rem", color: "#FFFFFF" }} />
              </div>
              <button type="submit" disabled={loading} className="w-full h-12 flex items-center justify-center gap-2 text-sm hover:opacity-90 disabled:opacity-50" style={{ background: "hsl(var(--primary))", color: "#0E0E11", borderRadius: "0.625rem", fontWeight: 600, border: "none" }}>
                {loading ? "Mise à jour…" : "Mettre à jour le mot de passe"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
