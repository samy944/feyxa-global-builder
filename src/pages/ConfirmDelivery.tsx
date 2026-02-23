import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MarketLayout } from "@/components/market/MarketLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Loader2,
  ShieldCheck,
  XCircle,
  Package,
  KeyRound,
} from "lucide-react";

type Status = "loading" | "ready" | "confirming" | "success" | "invalid" | "expired" | "used";

export default function ConfirmDelivery() {
  const { token } = useParams<{ token: string }>();
  const [status, setStatus] = useState<Status>("ready");
  const [orderNumber, setOrderNumber] = useState("");
  const [escrowReleased, setEscrowReleased] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // OTP fallback
  const [useOtp, setUseOtp] = useState(false);
  const [otpInput, setOtpInput] = useState("");

  const handleConfirm = async () => {
    setStatus("confirming");
    try {
      const body: any = {};
      if (useOtp) {
        body.otp = otpInput.trim();
        body.method = "otp";
      } else {
        body.token = token;
        body.method = "qr";
      }

      const { data, error } = await supabase.functions.invoke("confirm-delivery", {
        body,
      });

      if (error) throw error;

      if (data?.success) {
        setStatus("success");
        setOrderNumber(data.order_number || "");
        setEscrowReleased(data.escrow_released || false);
      } else {
        setStatus("invalid");
        setErrorMsg(data?.error || "Token invalide");
      }
    } catch (err: any) {
      const msg = err?.message || "";
      if (msg.includes("expiré")) {
        setStatus("expired");
      } else if (msg.includes("utilisé")) {
        setStatus("used");
      } else {
        setStatus("invalid");
        setErrorMsg(msg || "Erreur lors de la confirmation");
      }
    }
  };

  // Success state
  if (status === "success") {
    return (
      <MarketLayout>
        <section className="py-20">
          <div className="container max-w-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-6"
            >
              <div className="h-20 w-20 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
                <CheckCircle2 size={40} className="text-emerald-500" />
              </div>
              <h1 className="font-heading text-3xl tracking-wide">
                RÉCEPTION CONFIRMÉE
              </h1>
              {orderNumber && (
                <p className="text-sm text-muted-foreground font-mono">
                  Commande #{orderNumber}
                </p>
              )}
              <p className="text-muted-foreground text-sm">
                Merci d'avoir confirmé la réception de votre commande.
                {escrowReleased && " Les fonds ont été libérés au vendeur."}
              </p>
              <div className="flex gap-3 justify-center pt-2">
                <Button variant="outline" asChild>
                  <Link to="/market">Retour au Market</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/track">Suivi commandes</Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>
      </MarketLayout>
    );
  }

  // Invalid / expired / used states
  if (["invalid", "expired", "used"].includes(status)) {
    const messages: Record<string, { title: string; desc: string }> = {
      invalid: {
        title: "LIEN INVALIDE",
        desc: errorMsg || "Ce lien de confirmation est invalide. Vérifiez le QR code ou contactez le vendeur.",
      },
      expired: {
        title: "LIEN EXPIRÉ",
        desc: "Ce lien de confirmation a expiré. Demandez au vendeur de générer un nouveau QR code.",
      },
      used: {
        title: "DÉJÀ CONFIRMÉ",
        desc: "La réception de cette commande a déjà été confirmée.",
      },
    };
    const msg = messages[status] || messages.invalid;

    return (
      <MarketLayout>
        <section className="py-20">
          <div className="container max-w-md text-center space-y-6">
            <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
              <XCircle size={32} className="text-destructive" />
            </div>
            <h1 className="font-heading text-2xl tracking-wide">{msg.title}</h1>
            <p className="text-muted-foreground text-sm">{msg.desc}</p>

            {status === "invalid" && !useOtp && (
              <Button variant="outline" onClick={() => setUseOtp(true)}>
                <KeyRound size={14} className="mr-1.5" />
                Utiliser un code OTP
              </Button>
            )}

            <Button variant="outline" asChild>
              <Link to="/track">Suivi de commande</Link>
            </Button>
          </div>
        </section>
      </MarketLayout>
    );
  }

  // Ready / Confirming state
  return (
    <MarketLayout>
      <section className="py-20">
        <div className="container max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-8"
          >
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <ShieldCheck size={28} className="text-primary" />
            </div>

            <div className="space-y-2">
              <h1 className="font-heading text-3xl tracking-wide">
                CONFIRMER LA RÉCEPTION
              </h1>
              <p className="text-muted-foreground text-sm">
                Confirmez que vous avez bien reçu votre commande.
              </p>
            </div>

            {useOtp ? (
              <div className="space-y-4 text-left">
                <div className="space-y-1.5">
                  <label className="text-sm text-muted-foreground">Code OTP (6 chiffres)</label>
                  <Input
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="000000"
                    className="text-center text-2xl tracking-[0.5em] font-mono"
                    maxLength={6}
                  />
                </div>
                <Button
                  onClick={handleConfirm}
                  disabled={status === "confirming" || otpInput.length !== 6}
                  className="w-full"
                >
                  {status === "confirming" ? (
                    <Loader2 size={16} className="animate-spin mr-1.5" />
                  ) : (
                    <CheckCircle2 size={16} className="mr-1.5" />
                  )}
                  Confirmer avec OTP
                </Button>
                <Button
                  variant="ghost"
                  className="w-full text-xs"
                  onClick={() => setUseOtp(false)}
                >
                  ← Retour à la confirmation par QR
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-card border border-border rounded-xl p-5 space-y-3">
                  <Package size={24} className="text-primary mx-auto" />
                  <p className="text-sm text-muted-foreground">
                    En confirmant, vous attestez avoir reçu votre commande en bon état.
                    Les fonds seront libérés au vendeur.
                  </p>
                </div>

                <Button
                  onClick={handleConfirm}
                  disabled={status === "confirming"}
                  className="w-full"
                  size="lg"
                >
                  {status === "confirming" ? (
                    <Loader2 size={16} className="animate-spin mr-1.5" />
                  ) : (
                    <CheckCircle2 size={16} className="mr-1.5" />
                  )}
                  Confirmer la réception
                </Button>

                <Button
                  variant="ghost"
                  className="w-full text-xs"
                  onClick={() => setUseOtp(true)}
                >
                  <KeyRound size={12} className="mr-1" />
                  Utiliser un code OTP à la place
                </Button>
              </div>
            )}
          </motion.div>
        </div>
      </section>
    </MarketLayout>
  );
}
