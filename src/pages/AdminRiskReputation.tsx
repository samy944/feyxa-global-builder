import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  RefreshCw, Shield, ShieldAlert, ShieldCheck, ShieldX,
  Star, TrendingUp, Award, Ban, Eye, EyeOff, Wallet,
  History, Users, Store, AlertTriangle
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

function scoreColor(score: number) {
  if (score >= 80) return "text-green-600";
  if (score >= 60) return "text-yellow-600";
  if (score >= 40) return "text-orange-600";
  return "text-red-600";
}

function scoreBadge(score: number) {
  if (score >= 80) return { label: "Excellent", variant: "outline" as const, className: "border-green-500/30 bg-green-500/10 text-green-600" };
  if (score >= 60) return { label: "Bon", variant: "outline" as const, className: "border-yellow-500/30 bg-yellow-500/10 text-yellow-600" };
  if (score >= 40) return { label: "À risque", variant: "outline" as const, className: "border-orange-500/30 bg-orange-500/10 text-orange-600" };
  return { label: "Critique", variant: "outline" as const, className: "border-red-500/30 bg-red-500/10 text-red-600" };
}

export default function AdminRiskReputation() {
  const { user } = useAuth();
  const [tab, setTab] = useState("sellers");
  const [sellerScores, setSellerScores] = useState<any[]>([]);
  const [userScores, setUserScores] = useState<any[]>([]);
  const [reputation, setReputation] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);

  // Override dialog
  const [overrideTarget, setOverrideTarget] = useState<any>(null);
  const [overrideScore, setOverrideScore] = useState("");
  const [overrideReason, setOverrideReason] = useState("");

  const fetchData = async () => {
    setLoading(true);
    const [s, u, r, h] = await Promise.all([
      supabase.from("seller_risk_scores").select("*").order("score", { ascending: true }),
      supabase.from("user_risk_scores").select("*").order("score", { ascending: true }),
      supabase.from("seller_reputation").select("*").order("ranking_score", { ascending: false }),
      supabase.from("risk_score_history").select("*").order("created_at", { ascending: false }).limit(50),
    ]);
    setSellerScores((s.data as any[]) || []);
    setUserScores((u.data as any[]) || []);
    setReputation((r.data as any[]) || []);
    setHistory((h.data as any[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const runCalculation = async () => {
    setCalculating(true);
    try {
      const { data, error } = await supabase.functions.invoke("calculate-risk-scores", {
        body: { action: "calculate_all" },
      });
      if (error) throw error;
      toast.success(`Calcul terminé: ${data.sellers} vendeurs, ${data.users} clients, ${data.reputation} réputations`);
      fetchData();
    } catch (err: any) {
      toast.error("Erreur: " + (err.message || "Échec du calcul"));
    }
    setCalculating(false);
  };

  const submitOverride = async () => {
    if (!overrideTarget || !overrideScore) return;
    try {
      const { error } = await supabase.functions.invoke("calculate-risk-scores", {
        body: {
          action: "override",
          target_type: overrideTarget.type,
          target_id: overrideTarget.id,
          override_score: parseInt(overrideScore),
          reason: overrideReason,
          admin_id: user?.id,
        },
      });
      if (error) throw error;
      toast.success("Score mis à jour");
      setOverrideTarget(null);
      setOverrideScore("");
      setOverrideReason("");
      fetchData();
    } catch (err: any) {
      toast.error("Erreur: " + err.message);
    }
  };

  // KPIs
  const criticalSellers = sellerScores.filter((s) => s.score < 40).length;
  const criticalUsers = userScores.filter((u) => u.score < 40).length;
  const frozenPayouts = sellerScores.filter((s) => s.payouts_frozen).length;
  const codDisabled = userScores.filter((u) => u.cod_disabled).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">Risk & Réputation</h1>
          <p className="text-muted-foreground text-sm">Scores dynamiques clients & vendeurs</p>
        </div>
        <Button onClick={runCalculation} disabled={calculating} size="sm">
          <RefreshCw size={14} className={calculating ? "animate-spin" : ""} />
          {calculating ? "Calcul..." : "Recalculer tout"}
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 text-red-600 text-xs mb-1">
              <ShieldAlert size={14} /> Vendeurs critiques
            </div>
            <p className="text-2xl font-bold text-red-600">{criticalSellers}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 text-orange-600 text-xs mb-1">
              <AlertTriangle size={14} /> Clients à risque
            </div>
            <p className="text-2xl font-bold text-orange-600">{criticalUsers}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 text-destructive text-xs mb-1">
              <Ban size={14} /> Retraits gelés
            </div>
            <p className="text-2xl font-bold">{frozenPayouts}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Wallet size={14} /> COD désactivé
            </div>
            <p className="text-2xl font-bold">{codDisabled}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="sellers"><Store size={14} className="mr-1" /> Vendeurs</TabsTrigger>
          <TabsTrigger value="users"><Users size={14} className="mr-1" /> Clients</TabsTrigger>
          <TabsTrigger value="reputation"><Award size={14} className="mr-1" /> Réputation</TabsTrigger>
          <TabsTrigger value="history"><History size={14} className="mr-1" /> Historique</TabsTrigger>
        </TabsList>

        {/* ── SELLERS TAB ── */}
        <TabsContent value="sellers">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Scores de risque vendeurs</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Store ID</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Expéditions tardives</TableHead>
                    <TableHead>Annulations</TableHead>
                    <TableHead>Retours</TableHead>
                    <TableHead>SLA</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sellerScores.map((s) => {
                    const badge = scoreBadge(s.score);
                    return (
                      <TableRow key={s.id}>
                        <TableCell className="font-mono text-xs">{s.store_id?.slice(0, 8)}...</TableCell>
                        <TableCell>
                          <span className={`text-lg font-bold ${scoreColor(s.score)}`}>{s.score}</span>
                        </TableCell>
                        <TableCell>{Math.round(s.late_shipment_rate * 100)}%</TableCell>
                        <TableCell>{Math.round(s.cancellation_rate * 100)}%</TableCell>
                        <TableCell>{Math.round(s.return_rate * 100)}%</TableCell>
                        <TableCell>{Math.round(s.sla_compliance)}%</TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <Badge variant={badge.variant} className={badge.className}>{badge.label}</Badge>
                            {s.visibility_reduced && (
                              <Badge variant="outline" className="text-orange-600 border-orange-300 text-[10px]">
                                <EyeOff size={10} className="mr-0.5" /> Visibilité réduite
                              </Badge>
                            )}
                            {s.payouts_frozen && (
                              <Badge variant="outline" className="text-red-600 border-red-300 text-[10px]">
                                <Ban size={10} className="mr-0.5" /> Retraits gelés
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-xs"
                            onClick={() => setOverrideTarget({ type: "seller", id: s.store_id, score: s.score })}
                          >
                            Override
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {sellerScores.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        {loading ? "Chargement..." : "Aucun score. Lancez un calcul."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── USERS TAB ── */}
        <TabsContent value="users">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Scores de risque clients</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User ID</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>COD échec</TableHead>
                    <TableHead>Retours</TableHead>
                    <TableHead>Litiges</TableHead>
                    <TableHead>Commandes</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userScores.map((u) => {
                    const badge = scoreBadge(u.score);
                    return (
                      <TableRow key={u.id}>
                        <TableCell className="font-mono text-xs">{u.user_id?.slice(0, 8)}...</TableCell>
                        <TableCell>
                          <span className={`text-lg font-bold ${scoreColor(u.score)}`}>{u.score}</span>
                        </TableCell>
                        <TableCell>{Math.round(u.cod_failure_rate * 100)}%</TableCell>
                        <TableCell>{Math.round(u.return_rate * 100)}%</TableCell>
                        <TableCell>{Math.round(u.dispute_rate * 100)}%</TableCell>
                        <TableCell>{u.total_orders}</TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <Badge variant={badge.variant} className={badge.className}>{badge.label}</Badge>
                            {u.cod_disabled && (
                              <Badge variant="outline" className="text-red-600 border-red-300 text-[10px]">
                                COD désactivé
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-xs"
                            onClick={() => setOverrideTarget({ type: "user", id: u.user_id, score: u.score })}
                          >
                            Override
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {userScores.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        {loading ? "Chargement..." : "Aucun score. Lancez un calcul."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── REPUTATION TAB ── */}
        <TabsContent value="reputation">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Réputation & Classement vendeurs</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Store ID</TableHead>
                    <TableHead>Note</TableHead>
                    <TableHead>Livraison</TableHead>
                    <TableHead>Qualité</TableHead>
                    <TableHead>Réputation</TableHead>
                    <TableHead>Classement</TableHead>
                    <TableHead>Badge</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reputation.map((r, i) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-bold text-muted-foreground">#{i + 1}</TableCell>
                      <TableCell className="font-mono text-xs">{r.store_id?.slice(0, 8)}...</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Star size={12} className="text-yellow-500 fill-yellow-500" />
                          <span className="font-medium">{r.avg_rating?.toFixed(1)}</span>
                          <span className="text-xs text-muted-foreground">({r.total_reviews})</span>
                        </div>
                      </TableCell>
                      <TableCell>{r.delivery_speed_score}/100</TableCell>
                      <TableCell>{r.product_quality_score}/100</TableCell>
                      <TableCell>
                        <span className={`font-bold ${scoreColor(r.reputation_score)}`}>{r.reputation_score}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-bold">{Math.round(r.ranking_score)}</span>
                      </TableCell>
                      <TableCell>
                        {r.verified_badge ? (
                          <Badge className="bg-primary/10 text-primary border-primary/30">
                            <ShieldCheck size={12} className="mr-1" /> Vérifié
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {reputation.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        {loading ? "Chargement..." : "Aucune réputation. Lancez un calcul."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── HISTORY TAB ── */}
        <TabsContent value="history">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Historique des scores</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Target ID</TableHead>
                    <TableHead>Ancien</TableHead>
                    <TableHead>Nouveau</TableHead>
                    <TableHead>Raison</TableHead>
                    <TableHead>Par</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((h) => (
                    <TableRow key={h.id}>
                      <TableCell>
                        <Badge variant="outline" className={h.target_type === "seller" ? "text-primary" : "text-secondary-foreground"}>
                          {h.target_type === "seller" ? "Vendeur" : "Client"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{h.target_id?.slice(0, 8)}...</TableCell>
                      <TableCell className={h.previous_score !== null ? scoreColor(h.previous_score) : "text-muted-foreground"}>
                        {h.previous_score ?? "—"}
                      </TableCell>
                      <TableCell className={scoreColor(h.new_score)}>
                        <span className="font-bold">{h.new_score}</span>
                      </TableCell>
                      <TableCell className="text-xs max-w-[200px] truncate">{h.change_reason}</TableCell>
                      <TableCell className="text-xs">
                        {h.changed_by ? h.changed_by.slice(0, 8) + "..." : "Système"}
                      </TableCell>
                      <TableCell className="text-xs whitespace-nowrap">
                        {format(new Date(h.created_at), "dd MMM HH:mm", { locale: fr })}
                      </TableCell>
                    </TableRow>
                  ))}
                  {history.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Aucun historique
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Override Dialog */}
      <Dialog open={!!overrideTarget} onOpenChange={() => setOverrideTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Override de score</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">
                {overrideTarget?.type === "seller" ? "Vendeur" : "Client"}: <code className="font-mono">{overrideTarget?.id?.slice(0, 12)}...</code>
              </p>
              <p className="text-sm">Score actuel: <span className={`font-bold ${scoreColor(overrideTarget?.score || 0)}`}>{overrideTarget?.score}</span></p>
            </div>
            <div>
              <Label>Nouveau score (0-100)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={overrideScore}
                onChange={(e) => setOverrideScore(e.target.value)}
                placeholder="ex: 75"
              />
            </div>
            <div>
              <Label>Raison</Label>
              <Textarea
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="Justification de l'override..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOverrideTarget(null)}>Annuler</Button>
            <Button onClick={submitOverride} disabled={!overrideScore}>Appliquer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
