import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { Eye, EyeOff, ArrowRight, ShoppingBag, Store } from "lucide-react";
import { toast } from "sonner";

export default function Signup() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [accountType, setAccountType] = useState<"client" | "vendor">("client");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Le mot de passe doit contenir au moins 8 caractères");
      return;
    }
    setLoading(true);
    const { error } = await signUp(email, password, fullName, accountType);
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Compte créé avec succès !");
      navigate(accountType === "vendor" ? "/onboarding" : "/market");
    }
  };

  return (
    <div className="min-h-screen bg-hero flex items-center justify-center p-4">
      <div className="absolute inset-0 grid-pattern opacity-30" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold">F</span>
            </div>
            <span className="font-bold text-xl tracking-tight text-foreground">Feyxa</span>
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Rejoignez Feyxa</h1>
          <p className="text-sm text-muted-foreground mt-1">Créez votre compte en quelques secondes</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-border bg-card p-8">
          {/* Account type selector */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Type de compte</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setAccountType("client")}
                className={`relative flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${
                  accountType === "client"
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border hover:border-primary/40"
                }`}
              >
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                  accountType === "client" ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"
                }`}>
                  <ShoppingBag size={20} />
                </div>
                <span className="text-sm font-semibold text-foreground">Client</span>
                <span className="text-[11px] text-muted-foreground text-center leading-tight">Acheter sur la marketplace</span>
              </button>
              <button
                type="button"
                onClick={() => setAccountType("vendor")}
                className={`relative flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${
                  accountType === "vendor"
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border hover:border-primary/40"
                }`}
              >
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                  accountType === "vendor" ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"
                }`}>
                  <Store size={20} />
                </div>
                <span className="text-sm font-semibold text-foreground">Vendeur</span>
                <span className="text-[11px] text-muted-foreground text-center leading-tight">Créer ma boutique en ligne</span>
              </button>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Nom complet</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Jean Kouassi"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="vous@exemple.com"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Mot de passe</label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full h-10 rounded-lg border border-border bg-background px-3 pr-10 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Min. 8 caractères"
              />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <Button variant="hero" className="w-full" disabled={loading}>
            {loading ? "Création..." : accountType === "vendor" ? "Créer ma boutique" : "Créer mon compte"}
            <ArrowRight size={16} />
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            En créant un compte, vous acceptez nos CGU et notre politique de confidentialité.
          </p>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Déjà un compte ?{" "}
          <Link to="/login" className="text-primary hover:underline font-medium">
            Se connecter
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
