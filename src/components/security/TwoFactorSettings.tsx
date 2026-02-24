import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Mail, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function TwoFactorSettings() {
  const { user } = useAuth();
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("user_security_settings")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setEnabled(data.two_factor_enabled);
        }
        setLoading(false);
      });
  }, [user?.id]);

  const toggleTwoFactor = async (checked: boolean) => {
    if (!user) return;
    setSaving(true);

    const { error } = await supabase
      .from("user_security_settings")
      .upsert(
        {
          user_id: user.id,
          two_factor_enabled: checked,
          two_factor_method: "email",
        },
        { onConflict: "user_id" }
      );

    setSaving(false);
    if (error) {
      toast.error("Erreur lors de la mise à jour");
      return;
    }

    setEnabled(checked);
    toast.success(checked ? "2FA activé" : "2FA désactivé");
  };

  if (loading) {
    return <div className="flex justify-center py-4"><Loader2 size={16} className="animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-4 rounded-lg border border-border">
        <div className="flex items-center gap-3">
          <ShieldCheck size={18} className="text-primary" />
          <div>
            <p className="text-sm font-medium text-foreground">Authentification à deux facteurs</p>
            <p className="text-xs text-muted-foreground">Code OTP envoyé par email à chaque connexion</p>
          </div>
        </div>
        <Switch checked={enabled} onCheckedChange={toggleTwoFactor} disabled={saving} />
      </div>

      <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary/50">
        <Mail size={14} className="text-muted-foreground" />
        <p className="text-xs text-muted-foreground">
          Méthode : <span className="font-medium text-foreground">Email OTP</span>
          {enabled && <Badge variant="secondary" className="ml-2 text-[10px]">Actif</Badge>}
        </p>
      </div>

      <p className="text-xs text-muted-foreground">
        Note : Un code OTP est <strong>toujours requis</strong> pour les demandes de retrait, même si le 2FA n'est pas activé pour la connexion.
      </p>
    </div>
  );
}
