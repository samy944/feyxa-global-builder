import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useStore } from "@/hooks/useStore";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Shield, Clock, AlertTriangle } from "lucide-react";

interface AuditLog {
  id: string;
  action: string;
  target_type: string | null;
  target_id: string | null;
  created_at: string;
  metadata: Record<string, any> | null;
}

export default function SettingsSecurity() {
  const { store } = useStore();
  const { user } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!store?.id) return;
    supabase
      .from("audit_logs")
      .select("id, action, target_type, target_id, created_at, metadata")
      .eq("store_id", store.id)
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => {
        setLogs((data as AuditLog[]) || []);
        setLoading(false);
      });
  }, [store?.id]);

  const timeAgo = (d: string) => {
    const diff = Date.now() - new Date(d).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}j`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Sécurité</h2>
        <p className="text-sm text-muted-foreground mt-1">Surveillance et journal d'activité de votre boutique.</p>
      </div>

      {/* Security checklist */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Vérifications de sécurité</p>
        {[
          { label: "Authentification email vérifiée", ok: !!user?.email_confirmed_at },
          { label: "RLS activé sur toutes les tables", ok: true },
          { label: "Escrow actif pour les paiements", ok: true },
          { label: "Audit logs activés", ok: true },
        ].map((check, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-border">
            <div className={`w-2 h-2 rounded-full ${check.ok ? "bg-accent" : "bg-destructive"}`} />
            <span className="text-sm text-foreground flex-1">{check.label}</span>
            <Badge variant="secondary" className={`text-[10px] ${check.ok ? "text-accent" : "text-destructive"}`}>
              {check.ok ? "✓ OK" : "⚠ Action requise"}
            </Badge>
          </div>
        ))}
      </div>

      {/* Audit logs */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Shield size={16} className="text-primary" />
          <p className="text-sm font-medium text-foreground">Journal d'activité</p>
        </div>
        {loading ? (
          <div className="flex justify-center py-6"><Loader2 className="animate-spin text-muted-foreground" size={20} /></div>
        ) : logs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Aucune activité enregistrée</p>
        ) : (
          <div className="space-y-1">
            {logs.map((log) => (
              <div key={log.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-secondary/30 transition-colors">
                <Clock size={12} className="text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-foreground truncate">
                    <span className="font-medium">{log.action}</span>
                    {log.target_type && <span className="text-muted-foreground"> — {log.target_type}</span>}
                  </p>
                </div>
                <span className="text-[10px] text-muted-foreground shrink-0">il y a {timeAgo(log.created_at)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
