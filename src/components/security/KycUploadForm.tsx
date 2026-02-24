import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useStore } from "@/hooks/useStore";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, CheckCircle2, Clock, XCircle, Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface KycRecord {
  id: string;
  status: string;
  id_document_type: string;
  id_document_url: string | null;
  selfie_url: string | null;
  rejection_reason: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
}

export function KycUploadForm() {
  const { user } = useAuth();
  const { store } = useStore();
  const [kyc, setKyc] = useState<KycRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [docType, setDocType] = useState("national_id");
  const [idFile, setIdFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);

  useEffect(() => {
    if (!user) return;
    loadKyc();
  }, [user?.id]);

  const loadKyc = async () => {
    const { data } = await supabase
      .from("vendor_kyc")
      .select("*")
      .eq("user_id", user!.id)
      .maybeSingle();
    setKyc(data as KycRecord | null);
    if (data?.id_document_type) setDocType(data.id_document_type);
    setLoading(false);
  };

  const uploadFile = async (file: File, folder: string) => {
    const ext = file.name.split(".").pop();
    const path = `${user!.id}/${folder}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("kyc-documents")
      .upload(path, file, { upsert: true });
    if (error) throw error;
    return path;
  };

  const handleSubmit = async () => {
    if (!idFile || !selfieFile || !user) {
      toast.error("Veuillez fournir les deux documents");
      return;
    }

    setUploading(true);
    try {
      const [idPath, selfiePath] = await Promise.all([
        uploadFile(idFile, "id-document"),
        uploadFile(selfieFile, "selfie"),
      ]);

      const kycData = {
        user_id: user.id,
        store_id: store?.id || null,
        id_document_type: docType,
        id_document_url: idPath,
        selfie_url: selfiePath,
        status: "pending" as const,
        submitted_at: new Date().toISOString(),
      };

      if (kyc) {
        await supabase.from("vendor_kyc").update(kycData).eq("id", kyc.id);
      } else {
        await supabase.from("vendor_kyc").insert(kycData);
      }

      toast.success("Documents soumis pour vérification");
      loadKyc();
    } catch (err: any) {
      toast.error("Erreur : " + err.message);
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 size={20} className="animate-spin text-muted-foreground" /></div>;
  }

  const statusConfig: Record<string, { icon: any; label: string; color: string }> = {
    not_started: { icon: Upload, label: "Non soumis", color: "text-muted-foreground" },
    pending: { icon: Clock, label: "En cours de vérification", color: "text-amber-500" },
    approved: { icon: CheckCircle2, label: "Vérifié", color: "text-emerald-500" },
    rejected: { icon: XCircle, label: "Rejeté", color: "text-destructive" },
  };

  const status = statusConfig[kyc?.status || "not_started"];
  const StatusIcon = status.icon;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold text-foreground">Vérification d'identité (KYC)</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Requis pour effectuer des retraits et accéder à toutes les fonctionnalités.
        </p>
      </div>

      {/* Status */}
      <div className="flex items-center gap-3 p-4 rounded-lg border border-border">
        <StatusIcon size={18} className={status.color} />
        <div>
          <p className="text-sm font-medium text-foreground">Statut : {status.label}</p>
          {kyc?.rejection_reason && (
            <p className="text-xs text-destructive mt-1">Raison : {kyc.rejection_reason}</p>
          )}
        </div>
      </div>

      {/* Form - only if not approved or pending */}
      {(!kyc || kyc.status === "not_started" || kyc.status === "rejected") && (
        <div className="space-y-4">
          {/* Document type */}
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">
              Type de document
            </label>
            <Select value={docType} onValueChange={setDocType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="national_id">Carte d'identité nationale</SelectItem>
                <SelectItem value="passport">Passeport</SelectItem>
                <SelectItem value="driver_license">Permis de conduire</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* ID Document upload */}
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">
              Photo du document d'identité
            </label>
            <label className="flex items-center justify-center gap-2 p-6 rounded-lg border-2 border-dashed border-border hover:border-primary/50 cursor-pointer transition-colors">
              <Upload size={18} className="text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {idFile ? idFile.name : "Cliquez pour sélectionner"}
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setIdFile(e.target.files?.[0] || null)}
              />
            </label>
          </div>

          {/* Selfie upload */}
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">
              Selfie avec le document
            </label>
            <label className="flex items-center justify-center gap-2 p-6 rounded-lg border-2 border-dashed border-border hover:border-primary/50 cursor-pointer transition-colors">
              <Camera size={18} className="text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {selfieFile ? selfieFile.name : "Prenez un selfie avec votre document"}
              </span>
              <input
                type="file"
                accept="image/*"
                capture="user"
                className="hidden"
                onChange={(e) => setSelfieFile(e.target.files?.[0] || null)}
              />
            </label>
          </div>

          <Button onClick={handleSubmit} disabled={uploading || !idFile || !selfieFile}>
            {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            Soumettre pour vérification
          </Button>
        </div>
      )}
    </div>
  );
}
