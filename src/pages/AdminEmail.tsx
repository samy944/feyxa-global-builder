import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Save, Loader2, Plus, Trash2, TestTube, Eye, EyeOff,
  Mail, Server, Zap, CheckCircle2, XCircle, Send
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter
} from "@/components/ui/dialog";

type EmailProvider = {
  id: string;
  name: string;
  provider_type: string;
  is_active: boolean;
  is_default: boolean;
  config: Record<string, any>;
  from_name: string;
  from_email: string;
};

const PROVIDER_TYPES = [
  { value: "resend", label: "Resend", icon: Zap },
  { value: "smtp", label: "SMTP personnalisé", icon: Server },
  { value: "sendgrid", label: "SendGrid", icon: Send },
  { value: "mailgun", label: "Mailgun", icon: Mail },
];

export default function AdminEmail() {
  const [providers, setProviders] = useState<EmailProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [editProvider, setEditProvider] = useState<Partial<EmailProvider> | null>(null);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  const fetchProviders = async () => {
    const { data } = await supabase.from("email_providers").select("*").order("created_at");
    setProviders((data as any[] || []) as EmailProvider[]);
    setLoading(false);
  };

  useEffect(() => { fetchProviders(); }, []);

  const saveProvider = async () => {
    if (!editProvider?.name || !editProvider?.from_email) {
      toast.error("Nom et email expéditeur requis");
      return;
    }
    setSaving(true);
    const payload = {
      name: editProvider.name,
      provider_type: editProvider.provider_type || "resend",
      is_active: editProvider.is_active ?? false,
      is_default: editProvider.is_default ?? false,
      config: editProvider.config || {},
      from_name: editProvider.from_name || "Feyxa",
      from_email: editProvider.from_email,
    };

    if (editProvider.id) {
      await supabase.from("email_providers").update(payload).eq("id", editProvider.id);
    } else {
      await supabase.from("email_providers").insert(payload);
    }
    setSaving(false);
    setEditProvider(null);
    toast.success("Provider enregistré");
    fetchProviders();
  };

  const deleteProvider = async (id: string) => {
    await supabase.from("email_providers").delete().eq("id", id);
    toast.success("Provider supprimé");
    fetchProviders();
  };

  const setDefault = async (id: string) => {
    // Remove default from all, then set this one
    await supabase.from("email_providers").update({ is_default: false }).neq("id", "___");
    await supabase.from("email_providers").update({ is_default: true }).eq("id", id);
    toast.success("Provider par défaut mis à jour");
    fetchProviders();
  };

  const testConnection = async (provider: EmailProvider) => {
    setTesting(provider.id);
    try {
      const { data, error } = await supabase.functions.invoke("test-email-provider", {
        body: { provider_id: provider.id },
      });
      if (error) throw error;
      if (data?.success) {
        toast.success("Connexion réussie ! Email test envoyé.");
      } else {
        toast.error(data?.error || "Échec du test");
      }
    } catch (err: any) {
      toast.error("Erreur: " + (err.message || "Échec du test"));
    }
    setTesting(null);
  };

  const renderConfigFields = (type: string) => {
    const config = editProvider?.config || {};
    const updateConfig = (key: string, val: any) =>
      setEditProvider({ ...editProvider!, config: { ...config, [key]: val } });

    switch (type) {
      case "resend":
        return (
          <div className="space-y-3">
            <div>
              <Label>Clé API Resend</Label>
              <div className="relative">
                <Input
                  type={showSecrets.api_key ? "text" : "password"}
                  value={config.api_key || ""}
                  onChange={(e) => updateConfig("api_key", e.target.value)}
                  placeholder="re_xxxxxxxxxxxxx"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1 h-7 w-7 p-0"
                  onClick={() => setShowSecrets({ ...showSecrets, api_key: !showSecrets.api_key })}
                >
                  {showSecrets.api_key ? <EyeOff size={14} /> : <Eye size={14} />}
                </Button>
              </div>
            </div>
          </div>
        );
      case "smtp":
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Host SMTP</Label><Input value={config.host || ""} onChange={(e) => updateConfig("host", e.target.value)} placeholder="smtp.example.com" /></div>
              <div><Label>Port</Label><Input type="number" value={config.port || 587} onChange={(e) => updateConfig("port", parseInt(e.target.value))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Username</Label><Input value={config.username || ""} onChange={(e) => updateConfig("username", e.target.value)} /></div>
              <div>
                <Label>Password</Label>
                <div className="relative">
                  <Input
                    type={showSecrets.password ? "text" : "password"}
                    value={config.password || ""}
                    onChange={(e) => updateConfig("password", e.target.value)}
                  />
                  <Button type="button" variant="ghost" size="sm" className="absolute right-1 top-1 h-7 w-7 p-0"
                    onClick={() => setShowSecrets({ ...showSecrets, password: !showSecrets.password })}>
                    {showSecrets.password ? <EyeOff size={14} /> : <Eye size={14} />}
                  </Button>
                </div>
              </div>
            </div>
            <div>
              <Label>Chiffrement</Label>
              <Select value={config.encryption || "tls"} onValueChange={(v) => updateConfig("encryption", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="tls">TLS</SelectItem>
                  <SelectItem value="ssl">SSL</SelectItem>
                  <SelectItem value="none">Aucun</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );
      case "sendgrid":
        return (
          <div>
            <Label>Clé API SendGrid</Label>
            <div className="relative">
              <Input
                type={showSecrets.api_key ? "text" : "password"}
                value={config.api_key || ""}
                onChange={(e) => updateConfig("api_key", e.target.value)}
                placeholder="SG.xxxxxxxxxxxxx"
              />
              <Button type="button" variant="ghost" size="sm" className="absolute right-1 top-1 h-7 w-7 p-0"
                onClick={() => setShowSecrets({ ...showSecrets, api_key: !showSecrets.api_key })}>
                {showSecrets.api_key ? <EyeOff size={14} /> : <Eye size={14} />}
              </Button>
            </div>
          </div>
        );
      case "mailgun":
        return (
          <div className="space-y-3">
            <div>
              <Label>Clé API Mailgun</Label>
              <div className="relative">
                <Input
                  type={showSecrets.api_key ? "text" : "password"}
                  value={config.api_key || ""}
                  onChange={(e) => updateConfig("api_key", e.target.value)}
                />
                <Button type="button" variant="ghost" size="sm" className="absolute right-1 top-1 h-7 w-7 p-0"
                  onClick={() => setShowSecrets({ ...showSecrets, api_key: !showSecrets.api_key })}>
                  {showSecrets.api_key ? <EyeOff size={14} /> : <Eye size={14} />}
                </Button>
              </div>
            </div>
            <div><Label>Domaine</Label><Input value={config.domain || ""} onChange={(e) => updateConfig("domain", e.target.value)} placeholder="mg.example.com" /></div>
            <div>
              <Label>Région</Label>
              <Select value={config.region || "us"} onValueChange={(v) => updateConfig("region", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="us">US</SelectItem>
                  <SelectItem value="eu">EU</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Configuration Email</h1>
          <p className="text-sm text-muted-foreground">Gérez les fournisseurs d'email et les paramètres d'envoi</p>
        </div>
        <Dialog open={!!editProvider} onOpenChange={(v) => !v && setEditProvider(null)}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={() => setEditProvider({ provider_type: "resend", config: {}, is_active: true, from_name: "Feyxa" })}>
              <Plus size={14} /> Nouveau provider
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editProvider?.id ? "Modifier" : "Nouveau"} fournisseur email</DialogTitle>
            </DialogHeader>
            {editProvider && (
              <div className="space-y-4">
                <div>
                  <Label>Type de provider</Label>
                  <Select
                    value={editProvider.provider_type || "resend"}
                    onValueChange={(v) => setEditProvider({ ...editProvider, provider_type: v, config: {} })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PROVIDER_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Nom</Label><Input value={editProvider.name || ""} onChange={(e) => setEditProvider({ ...editProvider, name: e.target.value })} placeholder="Mon provider" /></div>
                  <div><Label>Nom expéditeur</Label><Input value={editProvider.from_name || ""} onChange={(e) => setEditProvider({ ...editProvider, from_name: e.target.value })} /></div>
                </div>
                <div><Label>Email expéditeur</Label><Input type="email" value={editProvider.from_email || ""} onChange={(e) => setEditProvider({ ...editProvider, from_email: e.target.value })} placeholder="noreply@feyxa.com" /></div>

                {renderConfigFields(editProvider.provider_type || "resend")}

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Switch checked={editProvider.is_active ?? true} onCheckedChange={(v) => setEditProvider({ ...editProvider, is_active: v })} />
                    <Label>Actif</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={editProvider.is_default ?? false} onCheckedChange={(v) => setEditProvider({ ...editProvider, is_default: v })} />
                    <Label>Par défaut</Label>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button onClick={saveProvider} disabled={saving}>
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Enregistrer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Provider Cards */}
      <div className="space-y-3">
        {providers.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Mail size={40} className="mx-auto mb-3 opacity-40" />
              <p>Aucun fournisseur email configuré</p>
              <p className="text-xs mt-1">Ajoutez un provider pour envoyer des emails</p>
            </CardContent>
          </Card>
        )}
        {providers.map((p) => {
          const typeInfo = PROVIDER_TYPES.find((t) => t.value === p.provider_type);
          const Icon = typeInfo?.icon || Mail;
          return (
            <Card key={p.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
                    <Icon size={18} className="text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground">{p.name}</p>
                      {p.is_default && <Badge variant="secondary" className="text-[10px]">Défaut</Badge>}
                      {p.is_active ? (
                        <Badge className="text-[10px] bg-emerald-500/10 text-emerald-500 border-0"><CheckCircle2 size={10} /> Actif</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px]"><XCircle size={10} /> Inactif</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{typeInfo?.label} — {p.from_name} &lt;{p.from_email}&gt;</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => testConnection(p)}
                    disabled={testing === p.id}
                  >
                    {testing === p.id ? <Loader2 size={14} className="animate-spin" /> : <TestTube size={14} />}
                    Tester
                  </Button>
                  {!p.is_default && (
                    <Button size="sm" variant="outline" onClick={() => setDefault(p.id)}>
                      Définir par défaut
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => setEditProvider(p)}>
                    Modifier
                  </Button>
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteProvider(p.id)}>
                    <Trash2 size={14} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Email Logs */}
      <EmailLogsSection />
    </div>
  );
}

/* ─── Email Logs ─── */
function EmailLogsSection() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("email_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => {
        setLogs(data || []);
        setLoading(false);
      });
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Logs d'envoi</CardTitle>
        <CardDescription>Derniers 50 emails envoyés</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-6"><Loader2 className="animate-spin text-primary" /></div>
        ) : logs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Aucun email envoyé pour le moment</p>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {logs.map((log) => (
              <div key={log.id} className="flex items-center justify-between p-3 rounded-lg border border-border text-sm">
                <div className="flex items-center gap-3">
                  {log.status === "sent" ? (
                    <CheckCircle2 size={16} className="text-emerald-500" />
                  ) : (
                    <XCircle size={16} className="text-destructive" />
                  )}
                  <div>
                    <p className="font-medium text-foreground">{log.subject}</p>
                    <p className="text-xs text-muted-foreground">{log.recipient}</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={log.status === "sent" ? "secondary" : "destructive"} className="text-[10px]">
                    {log.status}
                  </Badge>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {new Date(log.created_at).toLocaleString("fr-FR")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
