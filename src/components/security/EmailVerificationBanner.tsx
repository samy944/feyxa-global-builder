import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, Mail, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function EmailVerificationBanner() {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [sending, setSending] = useState(false);

  if (!user || user.email_confirmed_at || dismissed) return null;

  const handleResend = async () => {
    setSending(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: user.email!,
      options: { emailRedirectTo: window.location.origin },
    });
    setSending(false);

    if (error) {
      toast.error("Erreur lors de l'envoi");
    } else {
      toast.success("Email de vérification renvoyé");
    }
  };

  return (
    <div className="relative flex items-center gap-3 px-4 py-3 text-sm border-b"
      style={{
        background: "rgba(251, 191, 36, 0.08)",
        borderColor: "rgba(251, 191, 36, 0.15)",
        color: "hsl(var(--foreground))",
      }}
    >
      <AlertTriangle size={16} className="text-amber-500 shrink-0" />
      <p className="flex-1">
        <span className="font-medium">Email non vérifié.</span>{" "}
        Certaines fonctionnalités sont limitées.
      </p>
      <button
        onClick={handleResend}
        disabled={sending}
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-opacity hover:opacity-80 disabled:opacity-50"
        style={{
          background: "rgba(251, 191, 36, 0.15)",
          color: "hsl(var(--foreground))",
        }}
      >
        {sending ? <Loader2 size={12} className="animate-spin" /> : <Mail size={12} />}
        Renvoyer
      </button>
      <button onClick={() => setDismissed(true)} className="text-muted-foreground hover:text-foreground transition-colors">
        <X size={14} />
      </button>
    </div>
  );
}
