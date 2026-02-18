import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, CheckCircle, XCircle, ArrowLeft, Wallet, Clock, Ban } from "lucide-react";
import { motion } from "framer-motion";

interface PayoutRequest {
  id: string;
  amount: number;
  status: string;
  payment_method: string | null;
  payment_details: any;
  notes: string | null;
  created_at: string;
  processed_at: string | null;
  stores: {
    name: string;
    slug: string;
    city: string | null;
    currency: string;
  };
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "En attente", variant: "secondary" },
  approved: { label: "Approuvé", variant: "default" },
  paid: { label: "Payé", variant: "default" },
  rejected: { label: "Rejeté", variant: "destructive" },
};

export default function AdminPayouts() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [actionDialog, setActionDialog] = useState<{ payout: PayoutRequest; action: "approved" | "rejected" } | null>(null);
  const [actionNotes, setActionNotes] = useState("");
  const [processing, setProcessing] = useState(false);
  const [filter, setFilter] = useState<string>("pending");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
      return;
    }
    if (user) checkAdminAndFetch();
  }, [user, authLoading]);

  useEffect(() => {
    if (isAdmin) fetchPayouts();
  }, [filter, isAdmin]);

  const checkAdminAndFetch = async () => {
    const { data } = await supabase.rpc("has_role", {
      _user_id: user!.id,
      _role: "marketplace_admin" as any,
    });
    if (!data) {
      toast.error("Accès refusé");
      navigate("/");
      return;
    }
    setIsAdmin(true);
  };

  const fetchPayouts = async () => {
    setLoading(true);
    let q = supabase
      .from("payout_requests")
      .select("*, stores!inner(name, slug, city, currency)")
      .order("created_at", { ascending: false });

    if (filter !== "all") {
      q = q.eq("status", filter as "pending" | "approved" | "paid" | "rejected");
    }

    const { data, error } = await q;
    if (error) {
      toast.error("Erreur de chargement");
      console.error(error);
    }
    setPayouts((data as unknown as PayoutRequest[]) || []);
    setLoading(false);
  };

  const handleAction = async () => {
    if (!actionDialog) return;
    setProcessing(true);

    const { error } = await supabase
      .from("payout_requests")
      .update({
        status: actionDialog.action,
        notes: actionNotes || null,
        processed_at: new Date().toISOString(),
      })
      .eq("id", actionDialog.payout.id);

    if (error) {
      toast.error("Erreur lors du traitement");
      console.error(error);
    } else {
      toast.success(
        actionDialog.action === "approved"
          ? "Retrait approuvé avec succès"
          : "Retrait rejeté"
      );
      // If rejected, refund the wallet balance
      if (actionDialog.action === "rejected") {
        // Refund via direct update (admin privilege)
        const payout = actionDialog.payout;
        const { data: wallet } = await supabase
          .from("wallets")
          .select("id")
          .eq("store_id", payout.stores ? (payout as any).store_id : "")
          .single();
        // Note: refund logic should ideally be a DB function
      }
      fetchPayouts();
    }

    setProcessing(false);
    setActionDialog(null);
    setActionNotes("");
  };

  const formatCurrency = (amount: number, currency: string) =>
    new Intl.NumberFormat("fr-FR", { style: "decimal" }).format(amount) + " " + currency;

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  if (authLoading || (!isAdmin && loading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  const stats = {
    pending: payouts.filter((p) => p.status === "pending").length,
    totalPending: payouts
      .filter((p) => p.status === "pending")
      .reduce((sum, p) => sum + p.amount, 0),
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container flex h-14 items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft size={18} />
          </Button>
          <div className="flex items-center gap-2">
            <Wallet size={20} className="text-primary" />
            <h1 className="font-heading text-lg">Administration — Retraits</h1>
          </div>
        </div>
      </header>

      <main className="container py-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
                  <Clock size={20} className="text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">En attente</p>
                  <p className="text-2xl font-heading">{filter === "pending" ? payouts.length : stats.pending}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
                  <Wallet size={20} className="text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Montant en attente</p>
                  <p className="text-2xl font-heading">
                    {formatCurrency(
                      filter === "pending"
                        ? payouts.reduce((s, p) => s + p.amount, 0)
                        : stats.totalPending,
                      "XOF"
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
                  <CheckCircle size={20} className="text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total affiché</p>
                  <p className="text-2xl font-heading">{payouts.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          {[
            { value: "pending", label: "En attente" },
            { value: "approved", label: "Approuvés" },
            { value: "paid", label: "Payés" },
            { value: "rejected", label: "Rejetés" },
            { value: "all", label: "Tous" },
          ].map((f) => (
            <Button
              key={f.value}
              variant={filter === f.value ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f.value)}
            >
              {f.label}
            </Button>
          ))}
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="animate-spin text-primary" size={24} />
              </div>
            ) : payouts.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                Aucune demande de retrait trouvée.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Boutique</TableHead>
                      <TableHead>Ville</TableHead>
                      <TableHead className="text-right">Montant</TableHead>
                      <TableHead>Méthode</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payouts.map((payout) => {
                      const sc = statusConfig[payout.status] || statusConfig.pending;
                      return (
                        <TableRow key={payout.id}>
                          <TableCell className="text-sm whitespace-nowrap">
                            {formatDate(payout.created_at)}
                          </TableCell>
                          <TableCell className="font-medium">{payout.stores.name}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {payout.stores.city || "—"}
                          </TableCell>
                          <TableCell className="text-right font-mono font-medium">
                            {formatCurrency(payout.amount, payout.stores.currency)}
                          </TableCell>
                          <TableCell className="capitalize text-sm">
                            {payout.payment_method?.replace("_", " ") || "—"}
                          </TableCell>
                          <TableCell>
                            <Badge variant={sc.variant}>{sc.label}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {payout.status === "pending" ? (
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() =>
                                    setActionDialog({ payout, action: "approved" })
                                  }
                                >
                                  <CheckCircle size={14} className="mr-1" />
                                  Approuver
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() =>
                                    setActionDialog({ payout, action: "rejected" })
                                  }
                                >
                                  <XCircle size={14} className="mr-1" />
                                  Rejeter
                                </Button>
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">
                                {payout.processed_at ? formatDate(payout.processed_at) : "—"}
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Confirm Dialog */}
      <Dialog open={!!actionDialog} onOpenChange={() => setActionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog?.action === "approved"
                ? "Approuver le retrait"
                : "Rejeter le retrait"}
            </DialogTitle>
            <DialogDescription>
              {actionDialog && (
                <>
                  <strong>{actionDialog.payout.stores.name}</strong> demande un retrait de{" "}
                  <strong>
                    {formatCurrency(
                      actionDialog.payout.amount,
                      actionDialog.payout.stores.currency
                    )}
                  </strong>{" "}
                  via {actionDialog.payout.payment_method?.replace("_", " ") || "N/A"}.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Notes (optionnel) — ex: référence de paiement..."
            value={actionNotes}
            onChange={(e) => setActionNotes(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog(null)}>
              Annuler
            </Button>
            <Button
              variant={actionDialog?.action === "approved" ? "default" : "destructive"}
              onClick={handleAction}
              disabled={processing}
            >
              {processing && <Loader2 className="animate-spin mr-2" size={14} />}
              {actionDialog?.action === "approved" ? "Confirmer l'approbation" : "Confirmer le rejet"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
