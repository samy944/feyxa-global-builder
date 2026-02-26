import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Mail, Lock, User, Eye, EyeOff, ArrowLeft, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import type { StorefrontTheme } from "@/lib/storefront-themes";
import type { StoreData } from "../types";

interface Props {
  theme: StorefrontTheme;
  store: StoreData;
}

/**
 * Store-branded auth page — customers sign up "chez NomDuVendeur", not Feyxa.
 */
export function SFAuthPage({ theme, store }: Props) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const c = theme.colors;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName, account_type: "client" },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast.success("Vérifiez votre email pour confirmer votre inscription.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Connexion réussie !");
      }
    } catch (err: any) {
      toast.error(err.message || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    backgroundColor: `hsl(${c.card})`,
    borderColor: `hsl(${c.border})`,
    color: `hsl(${c.foreground})`,
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundColor: `hsl(${c.background})`,
        color: `hsl(${c.foreground})`,
        fontFamily: `"${theme.fonts.body}", system-ui, sans-serif`,
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Store branding */}
        <div className="text-center mb-8">
          {store.logo_url ? (
            <img src={store.logo_url} alt={store.name} className="h-14 w-14 rounded-2xl object-cover mx-auto mb-4" />
          ) : (
            <div
              className="h-14 w-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
              style={{ backgroundColor: `hsl(${c.primary})`, color: `hsl(${c.primaryForeground})` }}
            >
              <ShoppingBag size={24} />
            </div>
          )}
          <h1
            className="text-2xl font-bold"
            style={{ fontFamily: `"${theme.fonts.heading}", sans-serif` }}
          >
            {mode === "login" ? "Bienvenue" : `Rejoignez ${store.name}`}
          </h1>
          <p className="text-sm mt-2" style={{ color: `hsl(${c.mutedForeground})` }}>
            {mode === "login"
              ? `Connectez-vous à votre compte ${store.name}`
              : "Créez votre compte pour une expérience personnalisée"}
          </p>
        </div>

        {/* Form Card */}
        <div
          className="rounded-2xl border p-6 sm:p-8"
          style={{ backgroundColor: `hsl(${c.card})`, borderColor: `hsl(${c.border})` }}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: `hsl(${c.mutedForeground})` }}>
                  Nom complet
                </label>
                <div className="relative">
                  <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: `hsl(${c.mutedForeground})` }} />
                  <input
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="Votre nom"
                    required
                    className="w-full h-11 rounded-xl border pl-10 pr-4 text-sm focus:outline-none focus:ring-2 transition-all"
                    style={{ ...inputStyle, '--tw-ring-color': `hsl(${c.primary})` } as any}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: `hsl(${c.mutedForeground})` }}>
                Email
              </label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: `hsl(${c.mutedForeground})` }} />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  required
                  className="w-full h-11 rounded-xl border pl-10 pr-4 text-sm focus:outline-none focus:ring-2 transition-all"
                  style={{ ...inputStyle, '--tw-ring-color': `hsl(${c.primary})` } as any}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: `hsl(${c.mutedForeground})` }}>
                Mot de passe
              </label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: `hsl(${c.mutedForeground})` }} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full h-11 rounded-xl border pl-10 pr-10 text-sm focus:outline-none focus:ring-2 transition-all"
                  style={{ ...inputStyle, '--tw-ring-color': `hsl(${c.primary})` } as any}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 hover:opacity-70"
                  style={{ color: `hsl(${c.mutedForeground})` }}
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl text-sm font-bold uppercase tracking-wider transition-all hover:brightness-110 disabled:opacity-50"
              style={{ backgroundColor: `hsl(${c.primary})`, color: `hsl(${c.primaryForeground})` }}
            >
              {loading ? "..." : mode === "login" ? "Se connecter" : "Créer mon compte"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setMode(mode === "login" ? "signup" : "login")}
              className="text-xs font-medium hover:underline transition-all"
              style={{ color: `hsl(${c.primary})` }}
            >
              {mode === "login" ? "Pas encore de compte ? S'inscrire" : "Déjà un compte ? Se connecter"}
            </button>
          </div>
        </div>

        {/* Back to store */}
        <div className="text-center mt-6">
          <Link
            to={`/store/${store.slug}`}
            className="inline-flex items-center gap-1.5 text-xs hover:underline transition-all"
            style={{ color: `hsl(${c.mutedForeground})` }}
          >
            <ArrowLeft size={12} /> Retour à la boutique
          </Link>
        </div>

        {/* Powered by */}
        <p className="text-center text-[10px] mt-8" style={{ color: `hsl(${c.mutedForeground})` }}>
          Propulsé par <Link to="/" className="hover:underline font-medium" style={{ color: `hsl(${c.primary})` }}>Feyxa</Link>
        </p>
      </motion.div>
    </div>
  );
}
