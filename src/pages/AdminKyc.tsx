import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Clock, Eye, Loader2, UserCheck, Search } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface KycRecord {
  id: string;
  user_id: string;
  store_id: string | null;
  id_document_type: string;
  id_document_url: string | null;
  selfie_url: string | null;
  status: string;
  rejection_reason: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  created_at: string;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  not_started: { label: "Non soumis", color: "bg-secondary text-muted-foreground" },
  pending: { label: "En attente", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400" },
  approved: { label: "Approuvé", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400" },
  rejected: { label: "Rejeté", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
};

const docTypeLabels: Record<string, string> = {
  national_id: "Carte d'identité",
  passport: "Passeport",
  driver_license: "Permis de conduire",
};

export default function AdminKyc() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("pending");
  const [search, setSearch] = useState("");
  const [reviewingKyc, setReviewingKyc] = useState<KycRecord | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState(false);

  const { data: kycList, isLoading } = useQuery({
    queryKey: ["admin-kyc", tab],
    queryFn: async () => {
      let q = supabase
        .from("vendor_kyc")
        .select("*")
        .order("submitted_at", { ascending: false });

      if (tab !== "all") {
        q = q.eq("status", tab as any);
      }

      const { data, error } = await q.limit(50);
      if (error) throw error;
      return (data || []) as KycRecord[];
    },
  });

  const handleApprove = async (kyc: KycRecord) => {
    setProcessing(true);
    const { error } = await supabase
      .from("vendor_kyc")
      .update({
        status: "approved",
        reviewed_by: user?.id,
        reviewed_at: new Date().toISOString(),
        rejection_reason: null,
      })
      .eq("id", kyc.id);

    setProcessing(false);
    if (error) {
      toast.error("Erreur");
      return;
    }
    toast.success("KYC approuvé");
    setReviewingKyc(null);
    queryClient.invalidateQueries({ queryKey: ["admin-kyc"] });
  };

  const handleReject = async (kyc: KycRecord) => {
    if (!rejectionReason.trim()) {
      toast.error("Veuillez préciser la raison du rejet");
      return;
    }
    setProcessing(true);
    const { error } = await supabase
      .from("vendor_kyc")
      .update({
        status: "rejected",
        reviewed_by: user?.id,
        reviewed_at: new Date().toISOString(),
        rejection_reason: rejectionReason.trim(),
      })
      .eq("id", kyc.id);

    setProcessing(false);
    if (error) {
      toast.error("Erreur");
      return;
    }
    toast.success("KYC rejeté");
    setReviewingKyc(null);
    setRejectionReason("");
    queryClient.invalidateQueries({ queryKey: ["admin-kyc"] });
  };

  const getDocUrl = (path: string | null) => {
    if (!path) return null;
    const { data } = supabase.storage.from("kyc-documents").getPublicUrl(path);
    return data?.publicUrl;
  };

  const filtered = kycList?.filter((k) =>
    search ? k.user_id.includes(search) || k.id.includes(search) : true
  );

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <UserCheck size={24} /> Vérification KYC
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Validez les documents d'identité des vendeurs</p>
        </div>
        <Badge variant="outline" className="text-sm">
          {kycList?.filter((k) => k.status === "pending").length || 0} en attente
        </Badge>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Rechercher par ID utilisateur…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="pending" className="gap-1.5">
            <Clock size={14} /> En attente
          </TabsTrigger>
          <TabsTrigger value="approved" className="gap-1.5">
            <CheckCircle2 size={14} /> Approuvés
          </TabsTrigger>
          <TabsTrigger value="rejected" className="gap-1.5">
            <XCircle size={14} /> Rejetés
          </TabsTrigger>
          <TabsTrigger value="all">Tous</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 size={20} className="animate-spin text-muted-foreground" /></div>
          ) : !filtered?.length ? (
            <p className="text-sm text-muted-foreground text-center py-12">Aucune demande KYC</p>
          ) : (
            <div className="space-y-2">
              {filtered.map((kyc) => {
                const st = statusConfig[kyc.status] || statusConfig.not_started;
                return (
                  <Card key={kyc.id}>
                    <CardContent className="flex items-center gap-4 py-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          Utilisateur : {kyc.user_id.slice(0, 8)}…
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {docTypeLabels[kyc.id_document_type] || kyc.id_document_type}
                          {kyc.submitted_at && ` · Soumis le ${new Date(kyc.submitted_at).toLocaleDateString("fr-FR")}`}
                        </p>
                      </div>
                      <Badge className={`text-xs ${st.color}`}>{st.label}</Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setReviewingKyc(kyc)}
                        className="gap-1.5"
                      >
                        <Eye size={14} /> Examiner
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Review dialog */}
      <Dialog open={!!reviewingKyc} onOpenChange={(open) => !open && setReviewingKyc(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Examen KYC</DialogTitle>
            <DialogDescription>
              Vérifiez les documents du vendeur {reviewingKyc?.user_id.slice(0, 8)}…
            </DialogDescription>
          </DialogHeader>

          {reviewingKyc && (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase mb-2">
                  Document d'identité ({docTypeLabels[reviewingKyc.id_document_type] || reviewingKyc.id_document_type})
                </p>
                {reviewingKyc.id_document_url ? (
                  <img
                    src={getDocUrl(reviewingKyc.id_document_url) || ""}
                    alt="Document d'identité"
                    className="w-full rounded-lg border border-border max-h-64 object-contain bg-secondary"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">Non fourni</p>
                )}
              </div>

              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase mb-2">Selfie avec document</p>
                {reviewingKyc.selfie_url ? (
                  <img
                    src={getDocUrl(reviewingKyc.selfie_url) || ""}
                    alt="Selfie"
                    className="w-full rounded-lg border border-border max-h-64 object-contain bg-secondary"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">Non fourni</p>
                )}
              </div>

              {reviewingKyc.status === "pending" && (
                <div className="space-y-3 pt-2 border-t border-border">
                  <Input
                    placeholder="Raison du rejet (si applicable)"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleApprove(reviewingKyc)}
                      disabled={processing}
                      className="flex-1 gap-1.5"
                    >
                      {processing ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                      Approuver
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleReject(reviewingKyc)}
                      disabled={processing}
                      className="flex-1 gap-1.5"
                    >
                      {processing ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                      Rejeter
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
