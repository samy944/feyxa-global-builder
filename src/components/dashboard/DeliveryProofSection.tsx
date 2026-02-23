import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Camera,
  Loader2,
  Image as ImageIcon,
  X,
  Download,
  CheckCircle2,
  XCircle,
  Eye,
} from "lucide-react";

interface DeliveryProof {
  id: string;
  notes: string | null;
  created_at: string;
  files: { id: string; file_url: string; mime_type: string; size: number }[];
}

interface Props {
  orderId: string;
  storeId: string;
  orderStatus: string;
  /** read-only mode for buyers */
  readOnly?: boolean;
  /** admin mode: show approve/reject */
  isAdmin?: boolean;
}

export default function DeliveryProofSection({
  orderId,
  storeId,
  orderStatus,
  readOnly = false,
  isAdmin = false,
}: Props) {
  const [proofs, setProofs] = useState<DeliveryProof[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [notes, setNotes] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const fetchProofs = useCallback(async () => {
    setLoading(true);
    const { data: proofRows } = await supabase
      .from("delivery_proofs")
      .select("id, notes, created_at")
      .eq("order_id", orderId)
      .order("created_at", { ascending: false });

    if (!proofRows || proofRows.length === 0) {
      setProofs([]);
      setLoading(false);
      return;
    }

    const proofIds = proofRows.map((p) => p.id);
    const { data: fileRows } = await supabase
      .from("delivery_proof_files")
      .select("id, proof_id, file_url, mime_type, size")
      .in("proof_id", proofIds);

    const mapped: DeliveryProof[] = proofRows.map((p) => ({
      ...p,
      files: (fileRows || []).filter((f) => f.proof_id === p.id),
    }));

    setProofs(mapped);
    setLoading(false);
  }, [orderId]);

  useEffect(() => {
    fetchProofs();
  }, [fetchProofs]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []).slice(0, 3);
    setFiles(selected);
    setPreviews(selected.map((f) => URL.createObjectURL(f)));
  };

  const removeFile = (idx: number) => {
    URL.revokeObjectURL(previews[idx]);
    setFiles((prev) => prev.filter((_, i) => i !== idx));
    setPreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (files.length === 0) {
      toast.error("Ajoutez au moins une photo");
      return;
    }

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      // 1) Create proof record
      const { data: proof, error: proofErr } = await supabase
        .from("delivery_proofs")
        .insert({
          order_id: orderId,
          store_id: storeId,
          seller_id: user.id,
          notes: notes.trim() || null,
        })
        .select("id")
        .single();

      if (proofErr || !proof) throw proofErr;

      // 2) Upload files to storage
      const fileRecords: { proof_id: string; file_url: string; mime_type: string; size: number }[] = [];

      for (const file of files) {
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${storeId}/${orderId}/${proof.id}/${crypto.randomUUID()}.${ext}`;

        const { error: uploadErr } = await supabase.storage
          .from("delivery-proofs")
          .upload(path, file, { contentType: file.type });

        if (uploadErr) throw uploadErr;

        fileRecords.push({
          proof_id: proof.id,
          file_url: path,
          mime_type: file.type,
          size: file.size,
        });
      }

      // 3) Insert file records
      const { error: filesErr } = await supabase
        .from("delivery_proof_files")
        .insert(fileRecords);

      if (filesErr) throw filesErr;

      toast.success("Preuve de livraison ajoutée !");
      setOpen(false);
      setFiles([]);
      setPreviews([]);
      setNotes("");
      fetchProofs();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Erreur lors de l'upload");
    } finally {
      setUploading(false);
    }
  };

  const getSignedUrl = async (path: string) => {
    const { data } = await supabase.storage
      .from("delivery-proofs")
      .createSignedUrl(path, 3600);
    return data?.signedUrl || "";
  };

  const openLightbox = async (path: string) => {
    const url = await getSignedUrl(path);
    setLightboxUrl(url);
  };

  const downloadFile = async (path: string, filename: string) => {
    const url = await getSignedUrl(path);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
  };

  const canAdd = !readOnly && ["shipped", "delivered"].includes(orderStatus);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Camera size={16} className="text-primary" />
          <h2 className="text-sm font-semibold text-foreground">
            Preuve de livraison
          </h2>
          {proofs.length > 0 && (
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
              {proofs.length}
            </span>
          )}
        </div>

        {canAdd && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="text-xs gap-1.5">
                <Camera size={12} /> Ajouter
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Ajouter une preuve de livraison</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {/* File input */}
                <div>
                  <label className="text-sm text-muted-foreground block mb-2">
                    Photos (1-3 max)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileChange}
                    className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-primary/10 file:px-3 file:py-2 file:text-xs file:font-medium file:text-primary hover:file:bg-primary/20"
                  />
                </div>

                {/* Previews */}
                {previews.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {previews.map((url, i) => (
                      <div key={i} className="relative group">
                        <img
                          src={url}
                          alt={`Preview ${i + 1}`}
                          className="w-20 h-20 object-cover rounded-lg border border-border"
                        />
                        <button
                          onClick={() => removeFile(i)}
                          className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Notes */}
                <div>
                  <label className="text-sm text-muted-foreground block mb-1.5">
                    Notes (optionnel)
                  </label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ex: Livré à la porte, reçu par M. Koné..."
                    className="text-sm min-h-[60px]"
                    rows={2}
                  />
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={uploading || files.length === 0}
                  className="w-full"
                >
                  {uploading ? (
                    <Loader2 size={14} className="animate-spin mr-1.5" />
                  ) : (
                    <Camera size={14} className="mr-1.5" />
                  )}
                  {uploading ? "Upload en cours..." : "Envoyer la preuve"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 size={16} className="animate-spin text-muted-foreground" />
          </div>
        ) : proofs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            {readOnly
              ? "Aucune preuve de livraison disponible."
              : "Aucune preuve ajoutée. Ajoutez des photos pour confirmer la livraison."}
          </p>
        ) : (
          <div className="space-y-4">
            {proofs.map((proof) => (
              <ProofCard
                key={proof.id}
                proof={proof}
                onView={openLightbox}
                onDownload={downloadFile}
                isAdmin={isAdmin}
                formatDate={formatDate}
                getSignedUrl={getSignedUrl}
              />
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            className="absolute top-4 right-4 text-white/70 hover:text-white"
            onClick={() => setLightboxUrl(null)}
          >
            <X size={24} />
          </button>
          <img
            src={lightboxUrl}
            alt="Preuve de livraison"
            className="max-w-full max-h-[85vh] rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

function ProofCard({
  proof,
  onView,
  onDownload,
  isAdmin,
  formatDate,
  getSignedUrl,
}: {
  proof: DeliveryProof;
  onView: (path: string) => void;
  onDownload: (path: string, name: string) => void;
  isAdmin: boolean;
  formatDate: (d: string) => string;
  getSignedUrl: (path: string) => Promise<string>;
}) {
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});

  useEffect(() => {
    const load = async () => {
      const urls: Record<string, string> = {};
      for (const f of proof.files) {
        urls[f.id] = await getSignedUrl(f.file_url);
      }
      setThumbnails(urls);
    };
    load();
  }, [proof.files, getSignedUrl]);

  return (
    <div className="border border-border rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {formatDate(proof.created_at)}
        </span>
        <div className="flex items-center gap-1">
          <CheckCircle2 size={12} className="text-emerald-500" />
          <span className="text-xs text-emerald-500 font-medium">Envoyée</span>
        </div>
      </div>

      {/* Photo grid */}
      <div className="flex gap-2 flex-wrap">
        {proof.files.map((f) => (
          <div key={f.id} className="relative group">
            {thumbnails[f.id] ? (
              <img
                src={thumbnails[f.id]}
                alt="Preuve"
                className="w-24 h-24 object-cover rounded-lg border border-border cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => onView(f.file_url)}
              />
            ) : (
              <div className="w-24 h-24 rounded-lg border border-border bg-secondary flex items-center justify-center">
                <ImageIcon size={16} className="text-muted-foreground" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 rounded-lg transition-colors flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
              <button
                onClick={() => onView(f.file_url)}
                className="p-1 rounded-full bg-white/90 text-foreground"
              >
                <Eye size={12} />
              </button>
              {isAdmin && (
                <button
                  onClick={() =>
                    onDownload(f.file_url, `proof-${f.id.slice(0, 8)}.jpg`)
                  }
                  className="p-1 rounded-full bg-white/90 text-foreground"
                >
                  <Download size={12} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {proof.notes && (
        <p className="text-xs text-muted-foreground italic">
          📝 {proof.notes}
        </p>
      )}
    </div>
  );
}
