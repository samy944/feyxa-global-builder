import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storeId: string;
  sellerId: string;
  orderId?: string;
  productId?: string;
  onCreated?: () => void;
}

export function CreateTicketDialog({ open, onOpenChange, storeId, sellerId, orderId, productId, onCreated }: Props) {
  const { user } = useAuth();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState("medium");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user || !subject.trim() || !message.trim()) return;
    setSubmitting(true);

    const { data: ticket, error } = await supabase
      .from("support_tickets")
      .insert({
        store_id: storeId,
        buyer_id: user.id,
        seller_id: sellerId,
        order_id: orderId || null,
        product_id: productId || null,
        subject: subject.trim(),
        priority: priority as any,
      })
      .select("id")
      .single();

    if (error || !ticket) {
      toast.error("Erreur lors de la création du ticket");
      setSubmitting(false);
      return;
    }

    // Insert first message
    await supabase.from("ticket_messages").insert({
      ticket_id: ticket.id,
      sender_id: user.id,
      message: message.trim(),
    });

    toast.success("Ticket créé avec succès");
    setSubject("");
    setMessage("");
    setPriority("medium");
    setSubmitting(false);
    onOpenChange(false);
    onCreated?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ouvrir un ticket</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Sujet</label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Problème avec ma commande..." />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Priorité</label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Basse</SelectItem>
                <SelectItem value="medium">Moyenne</SelectItem>
                <SelectItem value="high">Haute</SelectItem>
                <SelectItem value="urgent">Urgente</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Message</label>
            <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Décrivez votre problème..." rows={4} />
          </div>
          <Button onClick={handleSubmit} disabled={submitting || !subject.trim() || !message.trim()} className="w-full">
            {submitting && <Loader2 size={14} className="animate-spin mr-2" />}
            Envoyer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
