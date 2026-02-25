import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Save, Globe } from "lucide-react";
import { useTranslation, type Language } from "@/lib/i18n";

export default function ClientProfile() {
  const { user } = useAuth();
  const { t, lang, setLang } = useTranslation();
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
      .select("full_name, phone, preferred_language")
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
      toast.error(t.errors.generic);
    } else {
      toast.success(t.common.success);
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
      <h1 className="font-heading text-2xl text-foreground mb-6">{t.account.myProfile}</h1>

      <form onSubmit={handleSave} className="space-y-5 max-w-lg">
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">{t.auth.email}</label>
            <input
              type="email"
              value={user?.email || ""}
              disabled
              className="w-full h-10 rounded-lg border border-border bg-muted px-3 text-sm text-muted-foreground"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">{t.auth.fullName}</label>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Jean Kouassi"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">{t.checkout.phone}</label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="+225 07 00 00 00"
            />
          </div>
        </div>

        {/* Language Preference */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <Globe size={18} className="text-muted-foreground" />
            <label className="text-sm font-medium text-foreground">{t.account.languagePref}</label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setLang("fr")}
              className={`flex items-center justify-center gap-2 rounded-lg border-2 p-3 text-sm font-medium transition-all ${
                lang === "fr" ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary" : "border-border text-muted-foreground hover:border-primary/40"
              }`}
            >
              🇫🇷 {t.common.french}
            </button>
            <button
              type="button"
              onClick={() => setLang("en")}
              className={`flex items-center justify-center gap-2 rounded-lg border-2 p-3 text-sm font-medium transition-all ${
                lang === "en" ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary" : "border-border text-muted-foreground hover:border-primary/40"
              }`}
            >
              🇬🇧 {t.common.english}
            </button>
          </div>
        </div>

        <Button type="submit" variant="hero" disabled={saving}>
          {saving ? <Loader2 size={16} className="mr-1 animate-spin" /> : <Save size={16} className="mr-1" />}
          {t.common.save}
        </Button>
      </form>
    </>
  );
}
