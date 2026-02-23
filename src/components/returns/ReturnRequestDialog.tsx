import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2, RotateCcw } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  storeId: string;
  sellerId: string;
  productId?: string;
  onCreated?: () => void;
}

const reasons = [
  { value: "defective", label: "Produit défectueux" },
  { value: "wrong_item", label: "Mauvais article reçu" },
  { value: "not_as_described", label: "Non conforme à la description" },
  { value: "damaged", label: "Produit endommagé" },
  { value: "changed_mind", label: "Changement d'avis" },
  { value: "other", label: "Autre" },
];

export function ReturnRequestDialog({ open, onOpenChange, orderId, storeId, sellerId, productId, onCreated }: Props) {
  const { user } = useAuth();
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user || !reason) return;
    setSubmitting(true);

    const { error } = await supabase.from("return_requests" as any).insert({
      order_id: orderId,
      store_id: storeId,
      buyer_id: user.id,
      seller_id: sellerId,
      product_id: productId || null,
      reason,
      description: description.trim() || null,
    });

    if (error) {
      toast.error("Erreur lors de la demande de retour");
      console.error(error);
    } else {
      // Set order to dispute status
      await supabase.from("orders").update({ status: "dispute" as any }).eq("id", orderId);
      toast.success("Demande de retour envoyée");
      setReason("");
      setDescription("");
      onOpenChange(false);
      onCreated?.();
    }
    setSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw size={18} className="text-primary" />
            Demander un retour
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Motif du retour</label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger><SelectValue placeholder="Sélectionner un motif" /></SelectTrigger>
              <SelectContent>
                {reasons.map((r) => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Description (optionnel)</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez le problème en détail..."
              rows={4}
            />
          </div>
          <Button onClick={handleSubmit} disabled={submitting || !reason} className="w-full">
            {submitting && <Loader2 size={14} className="animate-spin mr-2" />}
            Envoyer la demande
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
