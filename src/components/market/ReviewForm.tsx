import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Star, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

interface ReviewFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  productName: string;
  storeId: string;
  orderId: string;
  onSuccess?: () => void;
}

export function ReviewForm({
  open,
  onOpenChange,
  productId,
  productName,
  storeId,
  orderId,
  onSuccess,
}: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Veuillez donner une note");
      return;
    }

    setSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Vous devez être connecté");
      setSubmitting(false);
      return;
    }

    const { error } = await supabase.from("reviews").insert({
      product_id: productId,
      store_id: storeId,
      buyer_id: user.id,
      order_id: orderId,
      rating,
      comment: comment.trim() || null,
    });

    if (error) {
      if (error.message.includes("duplicate") || error.message.includes("unique")) {
        toast.error("Vous avez déjà laissé un avis pour ce produit sur cette commande");
      } else if (error.message.includes("row-level security")) {
        toast.error("Vous n'êtes pas autorisé à laisser un avis sur cette commande");
      } else {
        toast.error("Erreur lors de l'envoi de l'avis");
      }
    } else {
      toast.success("Avis envoyé ! Il sera visible après modération.");
      setRating(0);
      setComment("");
      onOpenChange(false);
      onSuccess?.();
    }
    setSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">LAISSER UN AVIS</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          <p className="text-sm text-muted-foreground line-clamp-1">{productName}</p>

          {/* Star rating */}
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="p-0.5 transition-transform hover:scale-110"
              >
                <Star
                  size={28}
                  className={
                    star <= (hoverRating || rating)
                      ? "fill-primary text-primary"
                      : "text-muted-foreground/30"
                  }
                />
              </button>
            ))}
            {rating > 0 && (
              <span className="text-sm text-muted-foreground ml-2">
                {rating}/5
              </span>
            )}
          </div>

          {/* Comment */}
          <Textarea
            placeholder="Partagez votre expérience (optionnel)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={1000}
            rows={4}
          />

          <Button
            onClick={handleSubmit}
            disabled={submitting || rating === 0}
            className="w-full"
          >
            {submitting && <Loader2 size={16} className="animate-spin mr-2" />}
            Envoyer l'avis
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
