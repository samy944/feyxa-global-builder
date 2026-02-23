import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";

export default function ClientProfile() {
  const { user } = useAuth();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("full_name, phone")
      .eq("id", user!.id)
      .maybeSingle();
    if (data) {
      setFullName(data.full_name || "");
      setPhone(data.phone || "");
    }
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName, phone })
      .eq("id", user!.id);
    setSaving(false);
    if (error) {
      toast.error("Erreur lors de la sauvegarde");
    } else {
      toast.success("Profil mis à jour !");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 size={24} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <h1 className="font-heading text-2xl text-foreground mb-6">Mon profil</h1>

      <form onSubmit={handleSave} className="space-y-5 max-w-lg">
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Email</label>
            <input
              type="email"
              value={user?.email || ""}
              disabled
              className="w-full h-10 rounded-lg border border-border bg-muted px-3 text-sm text-muted-foreground"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Nom complet</label>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Jean Kouassi"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Téléphone</label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="+225 07 00 00 00"
            />
          </div>
        </div>
        <Button type="submit" variant="hero" disabled={saving}>
          {saving ? <Loader2 size={16} className="mr-1 animate-spin" /> : <Save size={16} className="mr-1" />}
          Enregistrer
        </Button>
      </form>
    </>
  );
}
