import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useStore } from "@/hooks/useStore";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, UserPlus, Trash2, Shield } from "lucide-react";

interface Member {
  id: string;
  user_id: string;
  role: "owner" | "admin" | "staff";
  created_at: string;
  profile?: { full_name: string | null; avatar_url: string | null } | null;
}

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  owner: { label: "Propriétaire", color: "bg-primary/10 text-primary" },
  admin: { label: "Administrateur", color: "bg-accent/10 text-accent" },
  staff: { label: "Collaborateur", color: "bg-secondary text-muted-foreground" },
};

const ROLE_PERMISSIONS = {
  owner: ["Accès total", "Gestion finances", "Supprimer la boutique", "Inviter/supprimer des membres"],
  admin: ["Produits & commandes", "Analytics", "Marketing", "Inviter des collaborateurs"],
  staff: ["Voir les commandes", "Mettre à jour les statuts", "Voir les produits"],
};

export default function SettingsTeam() {
  const { store } = useStore();
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!store?.id) return;
    loadMembers();
  }, [store?.id]);

  async function loadMembers() {
    setLoading(true);
    const { data } = await supabase
      .from("store_members")
      .select("id, user_id, role, created_at")
      .eq("store_id", store!.id)
      .order("created_at");
    
    // Load profiles for each member
    const memberData = data || [];
    const profiles = await Promise.all(
      memberData.map(m => 
        supabase.from("profiles").select("full_name, avatar_url").eq("id", m.user_id).maybeSingle()
      )
    );
    
    const enriched = memberData.map((m, i) => ({
      ...m,
      profile: profiles[i]?.data,
    })) as Member[];
    
    setMembers(enriched);
    setLoading(false);
  }

  async function removeMember(memberId: string) {
    const { error } = await supabase.from("store_members").delete().eq("id", memberId);
    if (error) { toast.error("Impossible de supprimer ce membre"); return; }
    setMembers(members.filter(m => m.id !== memberId));
    toast.success("Membre retiré");
  }

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-muted-foreground" size={20} /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Équipe & Rôles</h2>
        <p className="text-sm text-muted-foreground mt-1">Gérez les membres de votre boutique et leurs permissions.</p>
      </div>

      {/* Members list */}
      <div className="space-y-2">
        {members.map(member => {
          const roleConf = ROLE_LABELS[member.role] || ROLE_LABELS.staff;
          const isCurrentUser = member.user_id === user?.id;
          const isOwner = member.role === "owner";
          
          return (
            <div key={member.id} className="flex items-center justify-between p-4 rounded-lg border border-border">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
                  {(member.profile?.full_name?.[0] || member.user_id.slice(0, 2)).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">
                      {member.profile?.full_name || "Utilisateur"}
                      {isCurrentUser && <span className="text-xs text-muted-foreground ml-1">(vous)</span>}
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
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeMember(member.id)}>
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
        <div className="grid grid-cols-3 gap-3">
          {Object.entries(ROLE_PERMISSIONS).map(([role, perms]) => (
            <div key={role} className="space-y-1.5">
              <Badge variant="secondary" className={`text-[10px] ${ROLE_LABELS[role]?.color}`}>
                {ROLE_LABELS[role]?.label}
              </Badge>
              <ul className="text-xs text-muted-foreground space-y-0.5">
                {perms.map(p => <li key={p}>• {p}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <Button variant="outline" size="sm" disabled>
        <UserPlus size={14} /> Inviter un membre (bientôt)
      </Button>
    </div>
  );
}
