import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStore } from "@/hooks/useStore";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Shield, Clock, ShieldCheck, History, UserCheck } from "lucide-react";
import { TwoFactorSettings } from "@/components/security/TwoFactorSettings";
import { LoginActivityTable } from "@/components/security/LoginActivityTable";
import { KycUploadForm } from "@/components/security/KycUploadForm";

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
        <p className="text-sm text-muted-foreground mt-1">Authentification, vérification d'identité et journal d'activité.</p>
      </div>

      <Tabs defaultValue="2fa" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="2fa" className="gap-1.5 text-xs">
            <ShieldCheck size={14} />
            2FA
          </TabsTrigger>
          <TabsTrigger value="kyc" className="gap-1.5 text-xs">
            <UserCheck size={14} />
            KYC
          </TabsTrigger>
          <TabsTrigger value="logins" className="gap-1.5 text-xs">
            <History size={14} />
            Connexions
          </TabsTrigger>
          <TabsTrigger value="audit" className="gap-1.5 text-xs">
            <Shield size={14} />
            Audit
          </TabsTrigger>
        </TabsList>

        <TabsContent value="2fa" className="mt-6">
          <TwoFactorSettings />

          {/* Security checklist */}
          <div className="mt-6 space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Vérifications</p>
            {[
              { label: "Email vérifié", ok: !!user?.email_confirmed_at },
              { label: "RLS activé", ok: true },
              { label: "Escrow actif", ok: true },
              { label: "Audit logs", ok: true },
            ].map((check, i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg border border-border">
                <div className={`w-2 h-2 rounded-full ${check.ok ? "bg-emerald-500" : "bg-destructive"}`} />
                <span className="text-xs text-foreground flex-1">{check.label}</span>
                <Badge variant="secondary" className={`text-[10px] ${check.ok ? "text-emerald-500" : "text-destructive"}`}>
                  {check.ok ? "✓" : "⚠"}
                </Badge>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="kyc" className="mt-6">
          <KycUploadForm />
        </TabsContent>

        <TabsContent value="logins" className="mt-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <History size={16} className="text-primary" />
              <p className="text-sm font-medium text-foreground">Historique des connexions</p>
            </div>
            <LoginActivityTable />
          </div>
        </TabsContent>

        <TabsContent value="audit" className="mt-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Shield size={16} className="text-primary" />
              <p className="text-sm font-medium text-foreground">Journal d'activité boutique</p>
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
