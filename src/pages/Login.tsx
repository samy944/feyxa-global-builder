import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) {
      setLoading(false);
      toast.error(error.message);
      return;
    }
    // Check if user has a store
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (authUser) {
      const { data: store } = await supabase
        .from("stores")
        .select("id")
        .eq("owner_id", authUser.id)
        .limit(1)
        .maybeSingle();
      setLoading(false);
      navigate(store ? "/dashboard" : "/onboarding");
    } else {
      setLoading(false);
      navigate("/dashboard");
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
          <h1 className="text-2xl font-bold text-foreground">Bon retour parmi nous</h1>
          <p className="text-sm text-muted-foreground mt-1">Connectez-vous à votre compte vendeur</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-border bg-card p-8">
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
                className="w-full h-10 rounded-lg border border-border bg-background px-3 pr-10 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="••••••••"
              />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <Button variant="hero" className="w-full" disabled={loading}>
            {loading ? "Connexion..." : "Se connecter"}
            <ArrowRight size={16} />
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Pas encore de compte ?{" "}
          <Link to="/signup" className="text-primary hover:underline font-medium">
            Créer mon compte
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
