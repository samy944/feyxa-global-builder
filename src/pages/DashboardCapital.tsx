import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/hooks/useStore";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { toast } from "@/hooks/use-toast";
import {
  Landmark,
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Banknote,
  Calculator,
  Loader2,
  Lock,
} from "lucide-react";

export default function DashboardCapital() {
  const { store } = useStore();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [simAmount, setSimAmount] = useState([0]);

  const fmt = (n: number) =>
    `${Math.round(n).toLocaleString("fr-FR")} FCFA`;

  // Financing score
  const { data: score } = useQuery({
    queryKey: ["financing-score", store?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("seller_financing_scores")
        .select("*")
        .eq("store_id", store!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!store?.id,
  });

  // Active/offered offers
  const { data: offers } = useQuery({
    queryKey: ["financing-offers", store?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("financing_offers")
        .select("*")
        .eq("store_id", store!.id)
        .order("created_at", { ascending: false })
        .limit(10);
      return data ?? [];
    },
    enabled: !!store?.id,
  });

  // Repayments for active offer
  const activeOffer = offers?.find((o: any) => o.status === "active");
  const pendingOffer = offers?.find((o: any) => o.status === "offered");

  const { data: repayments } = useQuery({
    queryKey: ["financing-repayments", activeOffer?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("financing_repayments")
        .select("*")
        .eq("offer_id", activeOffer!.id)
        .order("created_at", { ascending: false })
        .limit(20);
      return data ?? [];
    },
    enabled: !!activeOffer?.id,
  });

  // Accept offer mutation
  const acceptMut = useMutation({
    mutationFn: async (offerId: string) => {
      const { data, error } = await supabase.rpc("accept_financing_offer", {
        _offer_id: offerId,
        _user_id: user!.id,
      });
      if (error) throw error;
      const result = data as any;
      if (!result?.success) throw new Error(result?.error || "Erreur");
      return result;
    },
    onSuccess: (data: any) => {
      toast({ title: "Financement accepté !", description: `${fmt(data.amount)} crédités sur votre portefeuille.` });
      qc.invalidateQueries({ queryKey: ["financing-offers"] });
      qc.invalidateQueries({ queryKey: ["wallet"] });
    },
    onError: (err: any) => {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    },
  });

  const maxSim = score?.max_eligible_amount ?? 0;
  const simVal = simAmount[0] || maxSim;
  const simFee = Math.round(simVal * 0.08);
  const simTotal = simVal + simFee;
  const simMonthly = Math.round(simTotal / 6);

  const repaymentProgress = activeOffer
    ? Math.round(((activeOffer as any).amount_repaid / (activeOffer as any).total_repayable) * 100)
    : 0;

  if (!store) return null;

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-5xl">
      <div className="flex items-center gap-3">
        <Landmark className="text-primary" size={24} />
        <div>
          <h1 className="text-foreground font-heading text-2xl tracking-wide">FEYXA CAPITAL</h1>
          <p className="text-sm text-muted-foreground">Financement vendeur basé sur performance</p>
        </div>
      </div>

      {/* Eligibility Score */}
      {score ? (
        <div className="grid sm:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground flex items-center gap-1.5">
                <TrendingUp size={14} /> Ventes 90j
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-bold text-foreground">{fmt(score.sales_90d)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground flex items-center gap-1.5">
                <ShieldCheck size={14} /> Score éligibilité
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-bold text-foreground">{score.eligibility_score}/100</p>
              <Progress value={Math.max(0, score.eligibility_score)} className="h-1.5 mt-1" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Banknote size={14} /> Montant éligible
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-bold text-primary">{fmt(score.max_eligible_amount)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground flex items-center gap-1.5">
                {score.is_eligible ? <CheckCircle2 size={14} className="text-emerald-500" /> : <AlertTriangle size={14} className="text-amber-500" />}
                Statut
              </CardTitle>
            </CardHeader>
            <CardContent>
              {score.frozen ? (
                <Badge variant="destructive" className="gap-1"><Lock size={12} /> Gelé</Badge>
              ) : score.is_eligible ? (
                <Badge className="bg-emerald-100 text-emerald-800 gap-1"><CheckCircle2 size={12} /> Éligible</Badge>
              ) : (
                <Badge variant="secondary" className="gap-1"><Clock size={12} /> Non éligible</Badge>
              )}
              {score.frozen_reason && (
                <p className="text-xs text-destructive mt-1">{score.frozen_reason}</p>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <p>Votre score de financement sera calculé prochainement.</p>
          </CardContent>
        </Card>
      )}

      {/* Active Financing */}
      {activeOffer && (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Banknote size={18} className="text-primary" /> Financement actif
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Montant reçu</p>
                <p className="text-lg font-bold text-foreground">{fmt((activeOffer as any).offered_amount)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total à rembourser</p>
                <p className="text-lg font-bold text-foreground">{fmt((activeOffer as any).total_repayable)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Restant</p>
                <p className="text-lg font-bold text-amber-600">{fmt((activeOffer as any).remaining_balance)}</p>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Progression du remboursement</span>
                <span>{repaymentProgress}%</span>
              </div>
              <Progress value={repaymentProgress} className="h-2.5" />
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>Déduction par retrait : {(activeOffer as any).repayment_percentage}%</span>
              <span>Remboursé : {fmt((activeOffer as any).amount_repaid)}</span>
              {(activeOffer as any).missed_cycles > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {(activeOffer as any).missed_cycles} cycle(s) manqué(s)
                </Badge>
              )}
            </div>

            {/* Repayment history */}
            {repayments && repayments.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium text-foreground mb-2">Historique des remboursements</p>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {repayments.map((r: any) => (
                    <div key={r.id} className="flex items-center justify-between text-xs py-1.5 border-b border-border/50 last:border-0">
                      <span className="text-muted-foreground">
                        {new Date(r.created_at).toLocaleDateString("fr-FR")}
                      </span>
                      <span className="text-foreground font-medium">-{fmt(r.amount_deducted)}</span>
                      <span className="text-muted-foreground">Restant: {fmt(r.remaining_after)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Pending Offer */}
      {pendingOffer && !activeOffer && (
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-emerald-700">
              <Banknote size={18} /> Offre de financement disponible
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Montant proposé</p>
                <p className="text-2xl font-bold text-foreground">{fmt((pendingOffer as any).offered_amount)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total remboursable</p>
                <p className="text-lg font-medium text-foreground">{fmt((pendingOffer as any).total_repayable)}</p>
                <p className="text-xs text-muted-foreground">Frais : 8%</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Déduction par retrait</p>
                <p className="text-lg font-medium text-foreground">{(pendingOffer as any).repayment_percentage}%</p>
              </div>
            </div>
            <Button
              onClick={() => acceptMut.mutate((pendingOffer as any).id)}
              disabled={acceptMut.isPending}
              className="gap-2"
            >
              {acceptMut.isPending ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
              Accepter le financement
            </Button>
            <p className="text-xs text-muted-foreground">
              En acceptant, le montant sera immédiatement crédité sur votre portefeuille.
              Les remboursements seront automatiquement déduits de vos futurs retraits.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Simulation Tool */}
      {score?.is_eligible && !activeOffer && !pendingOffer && maxSim > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calculator size={18} /> Simulateur de financement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Montant souhaité</span>
                <span className="font-medium text-foreground">{fmt(simVal)}</span>
              </div>
              <Slider
                value={simAmount[0] ? simAmount : [maxSim]}
                onValueChange={setSimAmount}
                min={50000}
                max={maxSim}
                step={10000}
              />
            </div>
            <div className="grid sm:grid-cols-3 gap-4 pt-2">
              <div className="bg-secondary/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Frais (8%)</p>
                <p className="font-bold text-foreground">{fmt(simFee)}</p>
              </div>
              <div className="bg-secondary/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Total remboursable</p>
                <p className="font-bold text-foreground">{fmt(simTotal)}</p>
              </div>
              <div className="bg-secondary/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">≈ Mensualité (6 mois)</p>
                <p className="font-bold text-foreground">{fmt(simMonthly)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Past offers */}
      {offers && offers.filter((o: any) => ["closed", "defaulted"].includes(o.status)).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Historique des financements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {offers
                .filter((o: any) => ["closed", "defaulted"].includes(o.status))
                .map((o: any) => (
                  <div key={o.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-foreground">{fmt(o.offered_amount)}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(o.created_at).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                    <Badge variant={o.status === "closed" ? "default" : "destructive"}>
                      {o.status === "closed" ? "Remboursé" : "Défaut"}
                    </Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
