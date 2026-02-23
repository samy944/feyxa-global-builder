import { useState, useCallback } from "react";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  QrCode,
  RefreshCw,
  Loader2,
  Copy,
  Clock,
  KeyRound,
  CheckCircle2,
} from "lucide-react";

interface Props {
  orderId: string;
  storeId: string;
  orderStatus: string;
}

export default function DeliveryQRSection({ orderId, storeId, orderStatus }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tokenData, setTokenData] = useState<{
    token: string;
    otp: string;
    expires_at: string;
  } | null>(null);

  const canGenerate = ["shipped", "packed", "confirmed"].includes(orderStatus);

  const generateToken = useCallback(
    async (regenerate = false) => {
      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke(
          "generate-delivery-token",
          {
            body: { order_id: orderId, store_id: storeId, regenerate },
          }
        );
        if (error) throw error;
        setTokenData(data);
        if (regenerate) toast.success("Nouveau QR code généré");
      } catch (err: any) {
        toast.error(err?.message || "Erreur lors de la génération");
      } finally {
        setLoading(false);
      }
    },
    [orderId, storeId]
  );

  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && !tokenData) {
      generateToken();
    }
  };

  const confirmUrl = tokenData
    ? `${window.location.origin}/confirm-delivery/${tokenData.token}`
    : "";

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copié !`);
  };

  const formatExpiry = (d: string) =>
    new Date(d).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

  if (!canGenerate && orderStatus !== "delivered") return null;

  if (orderStatus === "delivered") {
    return (
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-2 text-sm">
          <CheckCircle2 size={16} className="text-emerald-500" />
          <span className="font-medium text-foreground">Livraison confirmée</span>
        </div>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full text-xs gap-1.5">
          <QrCode size={12} /> QR de confirmation livraison
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode size={18} /> QR Code de confirmation
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={24} className="animate-spin text-primary" />
          </div>
        ) : tokenData ? (
          <div className="space-y-5">
            {/* QR Code */}
            <div className="flex justify-center">
              <div className="bg-white p-4 rounded-xl">
                <QRCodeSVG
                  value={confirmUrl}
                  size={200}
                  level="H"
                  includeMargin
                />
              </div>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              Le client scanne ce QR pour confirmer la réception
            </p>

            {/* URL copy */}
            <div className="flex gap-2">
              <Input
                value={confirmUrl}
                readOnly
                className="text-xs font-mono"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(confirmUrl, "Lien")}
              >
                <Copy size={14} />
              </Button>
            </div>

            {/* OTP fallback */}
            <div className="bg-secondary/50 rounded-lg p-3 space-y-2">
              <p className="text-xs font-medium text-foreground flex items-center gap-1.5">
                <KeyRound size={12} /> Code OTP (si scan impossible)
              </p>
              <div className="flex items-center gap-2">
                <span className="font-mono text-2xl font-bold tracking-[0.3em] text-primary">
                  {tokenData.otp}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => copyToClipboard(tokenData.otp, "OTP")}
                >
                  <Copy size={12} />
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Le livreur peut saisir ce code pour confirmer la réception
              </p>
            </div>

            {/* Expiry */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock size={10} /> Expire le {formatExpiry(tokenData.expires_at)}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs gap-1"
                onClick={() => generateToken(true)}
                disabled={loading}
              >
                <RefreshCw size={10} /> Regénérer
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">
            Erreur lors de la génération
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
