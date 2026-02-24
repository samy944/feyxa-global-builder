import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, UserPlus, Shield, Mail, Clock, CheckCircle, XCircle } from "lucide-react";

interface AdminUser {
  user_id: string;
  full_name: string | null;
  created_at: string;
}

interface AdminInvite {
  id: string;
  email: string;
  status: string;
  created_at: string;
  expires_at: string;
}

export default function AdminTeam() {
  const { user } = useAuth();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [invitations, setInvitations] = useState<AdminInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    // Get admin users
    const { data: adminRoles } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "marketplace_admin" as any);

    if (adminRoles && adminRoles.length > 0) {
      const ids = adminRoles.map((r: any) => r.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, created_at")
        .in("id", ids);
      setAdmins(
        (profiles || []).map((p: any) => ({
          user_id: p.id,
          full_name: p.full_name,
          created_at: p.created_at,
        }))
      );
    }

    // Get invitations
    const { data: invites } = await supabase
      .from("admin_invitations" as any)
      .select("id, email, status, created_at, expires_at")
      .order("created_at", { ascending: false });
    setInvitations((invites as any) || []);
    setLoading(false);
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim() || !user) return;
    setSending(true);

    // Generate token hash
    const token = crypto.randomUUID();
    const encoder = new TextEncoder();
    const data = encoder.encode(token);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const tokenHash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

    const { error } = await supabase.from("admin_invitations" as any).insert({
      email: inviteEmail.trim().toLowerCase(),
      invited_by: user.id,
      token_hash: tokenHash,
    } as any);

    if (error) {
      toast.error("Erreur lors de l'envoi");
      console.error(error);
    } else {
      const inviteUrl = `${window.location.origin}/admin/invite?token=${token}`;
      await navigator.clipboard.writeText(inviteUrl);
      toast.success("Invitation créée ! Le lien a été copié dans votre presse-papier.");
    }

    setSending(false);
    setInviteOpen(false);
    setInviteEmail("");
    fetchData();
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-primary" size={24} />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield size={20} className="text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Équipe admin</h1>
            <p className="text-sm text-muted-foreground">{admins.length} administrateur{admins.length > 1 ? "s" : ""}</p>
          </div>
        </div>
        <Button onClick={() => setInviteOpen(true)}>
          <UserPlus size={16} className="mr-2" /> Inviter un admin
        </Button>
      </div>

      {/* Current admins */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Administrateurs actifs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {admins.map((a) => (
            <div key={a.user_id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Shield size={14} className="text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{a.full_name || "Sans nom"}</p>
                  <p className="text-[10px] text-muted-foreground">
                    Depuis {new Date(a.created_at).toLocaleDateString("fr-FR")}
                  </p>
                </div>
              </div>
              <Badge variant="outline">Super Admin</Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Invitations */}
      {invitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Invitations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {invitations.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div className="flex items-center gap-3">
                  <Mail size={16} className="text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{inv.email}</p>
                    <p className="text-[10px] text-muted-foreground">
                      Envoyée le {new Date(inv.created_at).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                </div>
                <Badge
                  className={
                    inv.status === "accepted"
                      ? "bg-primary/10 text-primary"
                      : inv.status === "expired"
                      ? "bg-destructive/10 text-destructive"
                      : "bg-yellow-500/10 text-yellow-500"
                  }
                >
                  {inv.status === "accepted" ? (
                    <><CheckCircle size={10} className="mr-1" /> Acceptée</>
                  ) : inv.status === "expired" ? (
                    <><XCircle size={10} className="mr-1" /> Expirée</>
                  ) : (
                    <><Clock size={10} className="mr-1" /> En attente</>
                  )}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Invite Dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Inviter un administrateur</DialogTitle>
            <DialogDescription>
              Un lien d'invitation sera généré. Partagez-le avec la personne concernée.
            </DialogDescription>
          </DialogHeader>
          <Input
            placeholder="email@exemple.com"
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>Annuler</Button>
            <Button onClick={handleInvite} disabled={sending || !inviteEmail.trim()}>
              {sending && <Loader2 className="animate-spin mr-2" size={14} />}
              Générer l'invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
