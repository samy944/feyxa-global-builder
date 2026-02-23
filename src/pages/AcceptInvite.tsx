import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, CheckCircle2, XCircle, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AcceptInvite() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const rawToken = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error" | "need_login">("loading");
  const [message, setMessage] = useState("");
  const [storeId, setStoreId] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setStatus("need_login");
      // Store token in localStorage for post-login acceptance
      if (rawToken) localStorage.setItem("feyxa_pending_invite", rawToken);
      return;
    }

    if (!rawToken) {
      setStatus("error");
      setMessage("Lien d'invitation invalide");
      return;
    }

    acceptInvite();
  }, [user, authLoading, rawToken]);

  async function acceptInvite() {
    setStatus("loading");
    const { data, error } = await supabase.functions.invoke("team-invite", {
      body: { action: "accept", token_hash: rawToken },
    });

    if (error || !data?.success) {
      setStatus("error");
      setMessage(data?.error || "Erreur lors de l'acceptation");
    } else {
      setStatus("success");
      setStoreId(data.store_id);
      setMessage(data.message || "Invitation acceptée !");
      localStorage.removeItem("feyxa_pending_invite");
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "#0E0E11" }}
    >
      <div
        className="w-full max-w-sm mx-4 p-8 text-center space-y-5"
        style={{
          background: "#141419",
          borderRadius: "1rem",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {status === "loading" && (
          <>
            <Loader2 size={32} className="animate-spin mx-auto" style={{ color: "hsl(var(--primary))" }} />
            <p className="text-sm" style={{ color: "#9CA3AF" }}>
              Validation de l'invitation…
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle2 size={40} className="mx-auto" style={{ color: "hsl(106 75% 47%)" }} />
            <h2 className="text-lg font-semibold" style={{ color: "#FFFFFF" }}>
              Bienvenue dans l'équipe !
            </h2>
            <p className="text-sm" style={{ color: "#9CA3AF" }}>{message}</p>
            <Button
              onClick={() => navigate(storeId ? "/dashboard" : "/dashboard")}
              className="w-full"
            >
              Accéder au dashboard
            </Button>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle size={40} className="mx-auto text-destructive" />
            <h2 className="text-lg font-semibold" style={{ color: "#FFFFFF" }}>
              Invitation invalide
            </h2>
            <p className="text-sm" style={{ color: "#9CA3AF" }}>{message}</p>
            <Link to="/market">
              <Button variant="outline" className="w-full mt-2">
                Retour à l'accueil
              </Button>
            </Link>
          </>
        )}

        {status === "need_login" && (
          <>
            <LogIn size={36} className="mx-auto" style={{ color: "hsl(var(--primary))" }} />
            <h2 className="text-lg font-semibold" style={{ color: "#FFFFFF" }}>
              Connectez-vous pour accepter
            </h2>
            <p className="text-sm" style={{ color: "#9CA3AF" }}>
              Vous devez être connecté pour rejoindre l'équipe.
            </p>
            <div className="flex flex-col gap-2">
              <Link to={`/login?redirect=/invite/accept?token=${rawToken}`}>
                <Button className="w-full">Se connecter</Button>
              </Link>
              <Link to={`/signup?redirect=/invite/accept?token=${rawToken}`}>
                <Button variant="outline" className="w-full">
                  Créer un compte
                </Button>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
