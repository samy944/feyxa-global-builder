import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Loader2, Monitor, Smartphone, Globe, CheckCircle2, XCircle } from "lucide-react";

interface LoginEntry {
  id: string;
  ip_address: string | null;
  user_agent: string | null;
  success: boolean;
  failure_reason: string | null;
  created_at: string;
}

function parseDevice(ua: string | null): { icon: any; label: string } {
  if (!ua) return { icon: Globe, label: "Inconnu" };
  const lower = ua.toLowerCase();
  if (lower.includes("mobile") || lower.includes("android") || lower.includes("iphone")) {
    return { icon: Smartphone, label: "Mobile" };
  }
  return { icon: Monitor, label: "Desktop" };
}

function parseBrowser(ua: string | null): string {
  if (!ua) return "Inconnu";
  if (ua.includes("Chrome") && !ua.includes("Edg")) return "Chrome";
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Safari") && !ua.includes("Chrome")) return "Safari";
  if (ua.includes("Edg")) return "Edge";
  return "Autre";
}

export function LoginActivityTable() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<LoginEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("login_activity")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => {
        setEntries((data as LoginEntry[]) || []);
        setLoading(false);
      });
  }, [user?.id]);

  if (loading) {
    return <div className="flex justify-center py-6"><Loader2 size={20} className="animate-spin text-muted-foreground" /></div>;
  }

  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-6">Aucune connexion enregistrée</p>;
  }

  return (
    <div className="space-y-1">
      {entries.map((entry) => {
        const device = parseDevice(entry.user_agent);
        const DeviceIcon = device.icon;
        const browser = parseBrowser(entry.user_agent);

        return (
          <div key={entry.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/30 transition-colors">
            <div className={`shrink-0 ${entry.success ? "text-emerald-500" : "text-destructive"}`}>
              {entry.success ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
            </div>
            <DeviceIcon size={14} className="text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-foreground">
                {device.label} — {browser}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {entry.ip_address || "IP inconnue"}
                {entry.failure_reason && ` · ${entry.failure_reason}`}
              </p>
            </div>
            <span className="text-[10px] text-muted-foreground shrink-0">
              {new Date(entry.created_at).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        );
      })}
    </div>
  );
}
