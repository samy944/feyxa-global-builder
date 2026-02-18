import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/hooks/useStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import {
  Wallet,
  Clock,
  ArrowDownCircle,
  ArrowUpCircle,
  Loader2,
  TrendingUp,
  Banknote,
} from "lucide-react";

export default function DashboardWallet() {
  const { store } = useStore();
  const [payoutAmount, setPayoutAmount] = useState("");
  const [requesting, setRequesting] = useState(false);

  const formatPrice = (amount: number, currency = "XOF") =>
    currency === "XOF"
      ? `${Math.round(amount).toLocaleString("fr-FR")} FCFA`
      : `€${amount.toFixed(2)}`;

  const { data: wallet, refetch: refetchWallet } = useQuery({
    queryKey: ["wallet", store?.id],
    queryFn: async () => {
      if (!store?.id) return null;
      // Ensure wallet exists via RPC
      await supabase.rpc("ensure_wallet", { _store_id: store.id });
      const { data, error } = await supabase
        .from("wallets")
        .select("*")
        .eq("store_id", store.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!store?.id,
  });

  const { data: transactions } = useQuery({
    queryKey: ["wallet-transactions", wallet?.id],
    queryFn: async () => {
      if (!wallet?.id) return [];
      const { data, error } = await supabase
        .from("wallet_transactions")
        .select("*")
        .eq("wallet_id", wallet.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!wallet?.id,
  });

  const { data: payouts } = useQuery({
    queryKey: ["payouts", store?.id],
    queryFn: async () => {
      if (!store?.id) return [];
      const { data, error } = await supabase
        .from("payout_requests")
        .select("*")
        .eq("store_id", store.id)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!store?.id,
  });

  const handleRequestPayout = async () => {
    const amount = parseFloat(payoutAmount);
    if (!amount || amount <= 0 || !store?.id) return;

    setRequesting(true);
    try {
      const { error } = await supabase.rpc("request_payout", {
        _store_id: store.id,
        _amount: amount,
      });
      if (error) throw error;

      toast({ title: "Demande envoyée", description: `Retrait de ${formatPrice(amount)} demandé.` });
      setPayoutAmount("");
      refetchWallet();
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err.message?.includes("insuffisant")
          ? "Solde disponible insuffisant."
          : "Erreur lors de la demande.",
        variant: "destructive",
      });
    } finally {
      setRequesting(false);
    }
  };

  const txTypeLabel: Record<string, { label: string; color: string }> = {
    escrow_hold: { label: "Escrow", color: "bg-amber-100 text-amber-800" },
    escrow_release: { label: "Libéré", color: "bg-emerald-100 text-emerald-800" },
    commission: { label: "Commission", color: "bg-red-100 text-red-800" },
    payout: { label: "Retrait", color: "bg-blue-100 text-blue-800" },
    refund: { label: "Remboursement", color: "bg-purple-100 text-purple-800" },
  };

  const payoutStatusLabel: Record<string, string> = {
    pending: "En attente",
    approved: "Approuvé",
    paid: "Payé",
    rejected: "Rejeté",
  };

  if (!store) return null;

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <h1 className="font-heading text-2xl tracking-wide text-foreground">PORTEFEUILLE</h1>

      {/* Balance cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Banknote size={16} /> Disponible
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">
              {formatPrice(wallet?.balance_available ?? 0, wallet?.currency)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock size={16} /> En attente (Escrow)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">
              {formatPrice(wallet?.balance_pending ?? 0, wallet?.currency)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp size={16} /> Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">
              {formatPrice(
                (wallet?.balance_available ?? 0) + (wallet?.balance_pending ?? 0),
                wallet?.currency
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payout request */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Wallet size={18} /> Demander un retrait
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 items-end">
            <div className="flex-1 space-y-1.5">
              <label className="text-sm text-muted-foreground">Montant ({wallet?.currency || "XOF"})</label>
              <Input
                type="number"
                placeholder="10000"
                value={payoutAmount}
                onChange={(e) => setPayoutAmount(e.target.value)}
                min={1}
                max={wallet?.balance_available ?? 0}
              />
            </div>
            <Button
              onClick={handleRequestPayout}
              disabled={requesting || !payoutAmount || parseFloat(payoutAmount) <= 0}
            >
              {requesting ? <Loader2 size={16} className="animate-spin" /> : "Demander"}
            </Button>
          </div>
          {(wallet?.balance_available ?? 0) > 0 && (
            <p className="text-xs text-muted-foreground mt-2">
              Maximum : {formatPrice(wallet?.balance_available ?? 0, wallet?.currency)}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Recent payouts */}
      {payouts && payouts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Demandes de retrait</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {payouts.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {formatPrice(p.amount, wallet?.currency)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(p.created_at).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {payoutStatusLabel[p.status] || p.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transaction history */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Historique des transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {!transactions || transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Aucune transaction pour le moment.
            </p>
          ) : (
            <div className="space-y-2">
              {transactions.map((tx: any) => {
                const meta = txTypeLabel[tx.type] || { label: tx.type, color: "bg-secondary text-foreground" };
                return (
                  <div key={tx.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                    <div className="flex items-center gap-3">
                      {tx.amount >= 0 ? (
                        <ArrowDownCircle size={16} className="text-emerald-500" />
                      ) : (
                        <ArrowUpCircle size={16} className="text-red-500" />
                      )}
                      <div>
                        <p className="text-sm text-foreground">{tx.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(tx.created_at).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${meta.color}`}>
                        {meta.label}
                      </span>
                      <span className={`text-sm font-medium ${tx.amount >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                        {tx.amount >= 0 ? "+" : ""}{formatPrice(Math.abs(tx.amount), wallet?.currency)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
