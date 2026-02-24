import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Shield, CheckCircle, AlertTriangle } from "lucide-react";

export default function AcceptAdminInvite() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [status, setStatus] = useState<"loading" | "success" | "error" | "login">("loading");
  const [message, setMessage] = useState("");

  const token = params.get("token");

  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      setStatus("error");
      setMessage("Lien d'invitation invalide.");
      return;
    }
    if (!user) {
      // Save token and redirect to login
      localStorage.setItem("feyxa_pending_admin_invite", token);
      setStatus("login");
      return;
    }
    acceptInvite();
  }, [user, authLoading, token]);

  const acceptInvite = async () => {
    if (!token || !user) return;

    // Hash the token
    const encoder = new TextEncoder();
    const data = encoder.encode(token);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const tokenHash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

    const { data: result, error } = await supabase.rpc("accept_admin_invitation", {
      _token_hash: tokenHash,
      _user_id: user.id,
    });

    if (error) {
      setStatus("error");
      setMessage(error.message);
    } else if (result && (result as any).success) {
      setStatus("success");
      localStorage.removeItem("feyxa_pending_admin_invite");
    } else {
      setStatus("error");
      setMessage((result as any)?.error || "Erreur inconnue");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Shield size={24} className="text-primary" />
          </div>
          <CardTitle>Invitation Super Admin</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {status === "loading" && (
            <Loader2 className="animate-spin text-primary mx-auto" size={24} />
          )}
          {status === "success" && (
            <>
              <CheckCircle size={36} className="text-primary mx-auto" />
              <p className="text-sm text-muted-foreground">
                Vous êtes maintenant Super Admin !
              </p>
              <Button onClick={() => navigate("/admin")}>Accéder au dashboard admin</Button>
            </>
          )}
          {status === "error" && (
            <>
              <AlertTriangle size={36} className="text-destructive mx-auto" />
              <p className="text-sm text-muted-foreground">{message}</p>
              <Button variant="outline" onClick={() => navigate("/")}>
                Retour à l'accueil
              </Button>
            </>
          )}
          {status === "login" && (
            <>
              <p className="text-sm text-muted-foreground">
                Connectez-vous pour accepter l'invitation.
              </p>
              <Button onClick={() => navigate("/login")}>Se connecter</Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
