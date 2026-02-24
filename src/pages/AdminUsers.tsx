import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Search, Users, Shield, ShieldOff } from "lucide-react";

interface UserRow {
  id: string;
  full_name: string | null;
  phone: string | null;
  created_at: string;
  roles: string[];
}

export default function AdminUsers() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    setLoading(true);
    // Get profiles
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, phone, created_at")
      .order("created_at", { ascending: false })
      .limit(500);

    // Get all roles
    const { data: roles } = await supabase
      .from("user_roles")
      .select("user_id, role");

    const rolesMap: Record<string, string[]> = {};
    (roles || []).forEach((r: any) => {
      if (!rolesMap[r.user_id]) rolesMap[r.user_id] = [];
      rolesMap[r.user_id].push(r.role);
    });

    setUsers(
      (profiles || []).map((p: any) => ({
        ...p,
        roles: rolesMap[p.id] || ["client"],
      }))
    );
    setLoading(false);
  };

  const toggleVendorRole = async (userId: string, hasVendor: boolean) => {
    setProcessing(userId);
    if (hasVendor) {
      await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", "vendor" as any);
      toast.success("Rôle vendeur retiré");
    } else {
      await supabase.from("user_roles").insert({ user_id: userId, role: "vendor" as any });
      toast.success("Rôle vendeur ajouté");
    }
    fetchUsers();
    setProcessing(null);
  };

  const toggleAdminRole = async (userId: string, hasAdmin: boolean) => {
    setProcessing(userId);
    if (hasAdmin) {
      await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", "marketplace_admin" as any);
      toast.success("Rôle admin retiré");
    } else {
      await supabase.from("user_roles").insert({ user_id: userId, role: "marketplace_admin" as any });
      toast.success("Rôle admin ajouté");
    }
    fetchUsers();
    setProcessing(null);
  };

  const filtered = users.filter(
    (u) =>
      (u.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (u.phone || "").includes(search)
  );

  const roleColor = (role: string) => {
    if (role === "marketplace_admin") return "bg-destructive/10 text-destructive";
    if (role === "vendor") return "bg-primary/10 text-primary";
    return "bg-secondary text-muted-foreground";
  };

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Users size={20} className="text-primary" />
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Utilisateurs</h1>
          <p className="text-sm text-muted-foreground">{users.length} utilisateur{users.length > 1 ? "s" : ""}</p>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Rechercher par nom ou téléphone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-primary" size={24} />
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Téléphone</TableHead>
                <TableHead>Rôles</TableHead>
                <TableHead>Inscrit le</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((user) => {
                const hasVendor = user.roles.includes("vendor");
                const hasAdmin = user.roles.includes("marketplace_admin");
                return (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium text-foreground">
                      {user.full_name || "Sans nom"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{user.phone || "—"}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {user.roles.map((r) => (
                          <Badge key={r} className={`text-[10px] ${roleColor(r)}`}>
                            {r === "marketplace_admin" ? "Admin" : r === "vendor" ? "Vendeur" : "Client"}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {new Date(user.created_at).toLocaleDateString("fr-FR")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={processing === user.id}
                          onClick={() => toggleVendorRole(user.id, hasVendor)}
                        >
                          {hasVendor ? "Retirer vendeur" : "Ajouter vendeur"}
                        </Button>
                        <Button
                          size="sm"
                          variant={hasAdmin ? "destructive" : "outline"}
                          disabled={processing === user.id}
                          onClick={() => toggleAdminRole(user.id, hasAdmin)}
                        >
                          {hasAdmin ? (
                            <><ShieldOff size={14} className="mr-1" /> Retirer admin</>
                          ) : (
                            <><Shield size={14} className="mr-1" /> Promouvoir admin</>
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
