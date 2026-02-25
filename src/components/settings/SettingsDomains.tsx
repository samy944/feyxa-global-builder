import { useState } from "react";
import { useStore } from "@/hooks/useStore";
import { supabase } from "@/integrations/supabase/client";
import {
  Globe, ExternalLink, Search, CheckCircle2, AlertCircle, Loader2,
  RefreshCw, Link2, Wifi, ShoppingCart, Sparkles, Tag, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type DnsStatus = "idle" | "checking" | "verified" | "partial" | "not_configured" | "error";

interface DnsResult {
  domain: string;
  a_records: string[];
  cname_records: string[];
  txt_records: string[];
  points_to_lovable: boolean;
  has_verification: boolean;
  status: string;
}

interface DomainResult {
  domain: string;
  available: boolean;
  premium: boolean;
  price?: number;
}

export default function SettingsDomains() {
  const { store } = useStore();

  // ─── Connect existing domain ───
  const [customDomain, setCustomDomain] = useState("");
  const [dnsStatus, setDnsStatus] = useState<DnsStatus>("idle");
  const [dnsResult, setDnsResult] = useState<DnsResult | null>(null);

  // ─── Buy domain ───
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [domainResults, setDomainResults] = useState<DomainResult[]>([]);
  const [registering, setRegistering] = useState<string | null>(null);

  const checkDns = async (domain?: string) => {
    const d = domain || customDomain;
    if (!d.trim()) return;
    setDnsStatus("checking");
    setDnsResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("check-dns", {
        body: { domain: d.trim() },
      });
      if (error) throw error;
      setDnsResult(data);
      setDnsStatus(data.status as DnsStatus);
    } catch {
      setDnsStatus("error");
      toast.error("Impossible de vérifier le DNS. Réessayez.");
    }
  };

  const searchDomains = async () => {
    const q = searchQuery.trim().toLowerCase().replace(/\s+/g, "");
    if (!q) return;
    setSearching(true);
    setDomainResults([]);
    try {
      // Extract SLD (name without TLD)
      const sld = q.includes(".") ? q.split(".")[0] : q;
      const tlds = ["com", "shop", "store", "co", "net", "app", "africa", "io"];

      const { data, error } = await supabase.functions.invoke("domain-search", {
        body: { action: "check", sld, tlds },
      });
      if (error) throw error;
      setDomainResults(data.results || []);
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de la recherche de domaines.");
    } finally {
      setSearching(false);
    }
  };

  const registerDomain = async (domain: string) => {
    setRegistering(domain);
    try {
      const { data, error } = await supabase.functions.invoke("domain-search", {
        body: { action: "register", domain },
      });
      if (error) throw error;
      if (data.success) {
        toast.success(`🎉 Domaine ${domain} enregistré avec succès ! Le DNS est configuré automatiquement.`);
        setDomainResults((prev) => prev.filter((r) => r.domain !== domain));
      }
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de l'enregistrement du domaine.");
    } finally {
      setRegistering(null);
    }
  };

  const statusConfig: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
    verified: { icon: <CheckCircle2 size={16} />, label: "Vérifié — Domaine correctement configuré", color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" },
    partial: { icon: <AlertCircle size={16} />, label: "Partiellement configuré — TXT de vérification manquant", color: "text-amber-500 bg-amber-500/10 border-amber-500/20" },
    not_configured: { icon: <AlertCircle size={16} />, label: "Non configuré — Enregistrements DNS manquants", color: "text-destructive bg-destructive/10 border-destructive/20" },
    error: { icon: <AlertCircle size={16} />, label: "Erreur de vérification", color: "text-destructive bg-destructive/10 border-destructive/20" },
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Domaines</h2>
        <p className="text-sm text-muted-foreground mt-1">Configurez les adresses web de votre boutique.</p>
      </div>

      {/* ═══ Current subdomain ═══ */}
      <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 space-y-2">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Wifi size={16} className="text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Sous-domaine Feyxa</p>
            <p className="text-xs text-muted-foreground">Actif automatiquement — Gratuit</p>
          </div>
        </div>
        <div className="flex items-center gap-2 pl-10">
          <CheckCircle2 size={14} className="text-emerald-500" />
          <code className="text-sm text-primary font-mono">{store?.slug || "ma-boutique"}.feyxa.app</code>
        </div>
      </div>

      {/* ═══ BUY A DOMAIN ═══ */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <ShoppingCart size={18} className="text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Acheter un nom de domaine</h3>
              <p className="text-xs text-muted-foreground">Recherchez et enregistrez un domaine — DNS configuré automatiquement</p>
            </div>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchDomains()}
                placeholder="maboutique"
                className="w-full h-10 rounded-lg border border-border bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <Button onClick={searchDomains} disabled={!searchQuery.trim() || searching} size="sm" className="h-10 px-4">
              {searching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
              <span className="ml-2 hidden sm:inline">Rechercher</span>
            </Button>
          </div>

          {/* Search results */}
          {domainResults.length > 0 && (
            <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
              {domainResults.map((r) => (
                <div
                  key={r.domain}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    r.available
                      ? "border-emerald-500/20 bg-emerald-500/5"
                      : "border-border bg-muted/30 opacity-60"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Globe size={16} className={r.available ? "text-emerald-500" : "text-muted-foreground"} />
                    <div>
                      <p className="text-sm font-medium text-foreground">{r.domain}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {r.available ? (
                          <span className="text-xs text-emerald-600 font-medium">Disponible</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">Indisponible</span>
                        )}
                        {r.premium && (
                          <span className="inline-flex items-center gap-1 text-[10px] bg-amber-500/10 text-amber-600 px-1.5 py-0.5 rounded-full">
                            <Sparkles size={10} /> Premium
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {r.price != null && (
                      <div className="flex items-center gap-1 text-sm font-semibold text-foreground">
                        <Tag size={12} className="text-muted-foreground" />
                        {r.price.toFixed(2)} $/an
                      </div>
                    )}
                    {r.available && (
                      <Button
                        size="sm"
                        onClick={() => registerDomain(r.domain)}
                        disabled={registering !== null}
                        className="h-8"
                      >
                        {registering === r.domain ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <ShoppingCart size={14} />
                        )}
                        <span className="ml-1.5">Acheter</span>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {searching && (
            <div className="flex items-center justify-center gap-2 py-6 text-muted-foreground text-sm">
              <Loader2 size={16} className="animate-spin" />
              Recherche de domaines disponibles…
            </div>
          )}
        </div>
      </div>

      {/* ═══ CONNECT EXISTING DOMAIN ═══ */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
              <Link2 size={18} className="text-foreground" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Connecter un domaine existant</h3>
              <p className="text-xs text-muted-foreground">Utilisez votre propre nom de domaine (ex: maboutique.com)</p>
            </div>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Globe size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={customDomain}
                onChange={(e) => { setCustomDomain(e.target.value); setDnsStatus("idle"); }}
                placeholder="maboutique.com"
                className="w-full h-10 rounded-lg border border-border bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <Button
              onClick={() => checkDns()}
              disabled={!customDomain.trim() || dnsStatus === "checking"}
              size="sm"
              className="h-10 px-4"
            >
              {dnsStatus === "checking" ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Search size={16} />
              )}
              <span className="ml-2 hidden sm:inline">Vérifier DNS</span>
            </Button>
          </div>

          {/* DNS Status */}
          {dnsStatus !== "idle" && dnsStatus !== "checking" && (
            <div className={`flex items-start gap-3 p-3 rounded-lg border ${statusConfig[dnsStatus]?.color || ""}`}>
              <div className="mt-0.5">{statusConfig[dnsStatus]?.icon}</div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">{statusConfig[dnsStatus]?.label}</p>
                {dnsResult && (
                  <div className="text-xs space-y-1 mt-2">
                    <p>A Records: {dnsResult.a_records.length > 0 ? dnsResult.a_records.join(", ") : "—"}</p>
                    {dnsResult.cname_records.length > 0 && <p>CNAME: {dnsResult.cname_records.join(", ")}</p>}
                    <p>Vérification TXT: {dnsResult.has_verification ? "✓ Trouvé" : "✗ Manquant"}</p>
                  </div>
                )}
              </div>
              <Button variant="ghost" size="sm" className="h-7" onClick={() => checkDns()}>
                <RefreshCw size={12} />
              </Button>
            </div>
          )}
        </div>

        {/* DNS Instructions */}
        <div className="border-t border-border p-5 bg-secondary/30 space-y-3">
          <p className="text-sm font-medium text-foreground">Instructions DNS</p>
          <div className="grid gap-2 text-xs">
            <div className="flex items-center gap-3 p-2.5 rounded-lg bg-background border border-border">
              <span className="font-mono text-primary font-semibold w-8">A</span>
              <span className="text-muted-foreground">@</span>
              <span className="text-foreground font-mono ml-auto">185.158.133.1</span>
            </div>
            <div className="flex items-center gap-3 p-2.5 rounded-lg bg-background border border-border">
              <span className="font-mono text-primary font-semibold w-8">A</span>
              <span className="text-muted-foreground">www</span>
              <span className="text-foreground font-mono ml-auto">185.158.133.1</span>
            </div>
            <div className="flex items-center gap-3 p-2.5 rounded-lg bg-background border border-border">
              <span className="font-mono text-primary font-semibold w-8">TXT</span>
              <span className="text-muted-foreground">_lovable</span>
              <span className="text-foreground font-mono ml-auto text-[10px]">lovable_verify=...</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Propagation DNS : jusqu'à 72h. Le certificat SSL est provisionné automatiquement.
          </p>
          <Button variant="outline" size="sm" asChild>
            <a href="https://docs.lovable.dev/features/custom-domain" target="_blank" rel="noopener">
              <ExternalLink size={14} className="mr-1" /> Documentation
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
