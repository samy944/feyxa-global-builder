import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore } from "@/hooks/useStore";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, UserPlus, Trash2, Shield, Mail, Copy, Clock, XCircle, RefreshCw } from "lucide-react";

interface Member {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
  profile?: { full_name: string | null; avatar_url: string | null } | null;
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
  expires_at: string;
}

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  owner: { label: "Propriétaire", color: "bg-primary/10 text-primary" },
  admin: { label: "Administrateur", color: "bg-blue-500/10 text-blue-400" },
  manager: { label: "Manager", color: "bg-emerald-500/10 text-emerald-400" },
  support: { label: "Support", color: "bg-amber-500/10 text-amber-400" },
  finance: { label: "Finance", color: "bg-violet-500/10 text-violet-400" },
  staff: { label: "Collaborateur", color: "bg-secondary text-muted-foreground" },
  viewer: { label: "Lecteur", color: "bg-muted text-muted-foreground" },
};

const ROLE_PERMISSIONS: Record<string, string[]> = {
  owner: ["Accès total", "Supprimer la boutique", "Gérer l'équipe"],
  admin: ["Produits", "Commandes", "Analytics", "Marketing", "Wallet", "Paramètres", "Équipe"],
  manager: ["Produits", "Commandes", "Clients", "Analytics"],
  support: ["Commandes (lecture)", "Tickets", "Retours"],
  finance: ["Portefeuille", "Analytics", "Commandes (lecture)"],
  viewer: ["Lecture seule sur tout"],
};

const INVITABLE_ROLES = ["admin", "manager", "support", "finance", "viewer", "staff"];

export default function SettingsTeam() {
  const { store } = useStore();
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("staff");
  const [sending, setSending] = useState(false);
  const [lastInviteUrl, setLastInviteUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!store?.id) return;
    loadData();
  }, [store?.id]);

  async function loadData() {
    setLoading(true);
    const [membersRes, invitesRes] = await Promise.all([
      supabase
        .from("store_members")
        .select("id, user_id, role, created_at")
        .eq("store_id", store!.id)
        .order("created_at"),
      supabase
        .from("store_invitations")
        .select("id, email, role, status, created_at, expires_at")
        .eq("store_id", store!.id)
        .in("status", ["pending"])
        .order("created_at", { ascending: false }),
    ]);

    const memberData = membersRes.data || [];
    const profiles = await Promise.all(
      memberData.map((m) =>
        supabase.from("profiles").select("full_name, avatar_url").eq("id", m.user_id).maybeSingle()
      )
    );

    setMembers(
      memberData.map((m, i) => ({ ...m, profile: profiles[i]?.data })) as Member[]
    );
    setInvitations((invitesRes.data || []) as Invitation[]);
    setLoading(false);
  }

  async function sendInvite() {
    if (!inviteEmail.trim() || !store?.id) return;
    setSending(true);
    setLastInviteUrl(null);

    const { data, error } = await supabase.functions.invoke("team-invite", {
      body: { action: "send", store_id: store.id, email: inviteEmail.trim(), role: inviteRole },
    });

    if (error || !data?.success) {
      toast.error(data?.error || "Erreur d'envoi");
    } else {
      toast.success(data.message);
      setLastInviteUrl(data.accept_url);
      setInviteEmail("");
      loadData();
    }
    setSending(false);
  }

  async function revokeInvite(id: string) {
    const { data, error } = await supabase.functions.invoke("team-invite", {
      body: { action: "revoke", invitation_id: id },
    });
    if (error || !data?.success) {
      toast.error("Erreur de révocation");
    } else {
      toast.success("Invitation révoquée");
      loadData();
    }
  }

  async function removeMember(memberId: string) {
    const { error } = await supabase.from("store_members").delete().eq("id", memberId);
    if (error) {
      toast.error("Impossible de supprimer ce membre");
      return;
    }

    // Audit log
    if (store?.id) {
      await supabase.from("audit_logs").insert({
        store_id: store.id,
        user_id: user?.id,
        action: "member_removed",
        target_type: "store_member",
        target_id: memberId,
      });
    }

    setMembers(members.filter((m) => m.id !== memberId));
    toast.success("Membre retiré");
  }

  function copyLink() {
    if (lastInviteUrl) {
      navigator.clipboard.writeText(lastInviteUrl);
      toast.success("Lien copié !");
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="animate-spin text-muted-foreground" size={20} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Équipe & Rôles</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Gérez les membres de votre boutique et leurs permissions.
        </p>
      </div>

      {/* Invite form */}
      <div className="border border-border rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <UserPlus size={16} className="text-primary" />
          <p className="text-sm font-medium text-foreground">Inviter un membre</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            placeholder="email@exemple.com"
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            className="flex-1"
          />
          <Select value={inviteRole} onValueChange={setInviteRole}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {INVITABLE_ROLES.map((r) => (
                <SelectItem key={r} value={r}>
                  {ROLE_LABELS[r]?.label || r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={sendInvite} disabled={sending || !inviteEmail.trim()} size="sm">
            {sending ? (
              <Loader2 size={14} className="animate-spin mr-1.5" />
            ) : (
              <Mail size={14} className="mr-1.5" />
            )}
            Inviter
          </Button>
        </div>

        {lastInviteUrl && (
          <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50 border border-border">
            <p className="text-xs text-muted-foreground flex-1 truncate">{lastInviteUrl}</p>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={copyLink}>
              <Copy size={13} />
            </Button>
          </div>
        )}
      </div>

      {/* Pending invitations */}
      {invitations.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground flex items-center gap-2">
            <Clock size={14} className="text-muted-foreground" />
            Invitations en attente ({invitations.length})
          </p>
          {invitations.map((inv) => {
            const roleConf = ROLE_LABELS[inv.role] || ROLE_LABELS.staff;
            const isExpired = new Date(inv.expires_at) < new Date();
            return (
              <div
                key={inv.id}
                className="flex items-center justify-between p-3 rounded-lg border border-border"
                style={{ opacity: isExpired ? 0.5 : 1 }}
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-xs font-bold">
                    <Mail size={14} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{inv.email}</p>
                    <p className="text-xs text-muted-foreground">
                      {isExpired
                        ? "Expiré"
                        : `Expire le ${new Date(inv.expires_at).toLocaleDateString("fr-FR")}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className={`text-[10px] ${roleConf.color}`}>
                    {roleConf.label}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive"
                    onClick={() => revokeInvite(inv.id)}
                  >
                    <XCircle size={14} />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Members list */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">
          Membres actifs ({members.length})
        </p>
        {members.map((member) => {
          const roleConf = ROLE_LABELS[member.role] || ROLE_LABELS.staff;
          const isCurrentUser = member.user_id === user?.id;
          const isOwner = member.role === "owner";

          return (
            <div
              key={member.id}
              className="flex items-center justify-between p-4 rounded-lg border border-border"
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
                  {(member.profile?.full_name?.[0] || member.user_id.slice(0, 2)).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">
                      {member.profile?.full_name || "Utilisateur"}
                      {isCurrentUser && (
                        <span className="text-xs text-muted-foreground ml-1">(vous)</span>
                      )}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Ajouté le {new Date(member.created_at).toLocaleDateString("fr-FR")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className={`text-[10px] ${roleConf.color}`}>
                  {roleConf.label}
                </Badge>
                {!isOwner && !isCurrentUser && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => removeMember(member.id)}
                  >
                    <Trash2 size={14} />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Permissions reference */}
      <div className="border border-border rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Shield size={16} className="text-primary" />
          <p className="text-sm font-medium text-foreground">Matrice des permissions</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {Object.entries(ROLE_PERMISSIONS).map(([role, perms]) => (
            <div key={role} className="space-y-1.5">
              <Badge variant="secondary" className={`text-[10px] ${ROLE_LABELS[role]?.color}`}>
                {ROLE_LABELS[role]?.label}
              </Badge>
              <ul className="text-xs text-muted-foreground space-y-0.5">
                {perms.map((p) => (
                  <li key={p}>• {p}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
