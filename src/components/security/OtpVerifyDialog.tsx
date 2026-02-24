import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

interface OtpVerifyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  email: string;
  purpose?: string;
  onVerified: () => void;
  title?: string;
  description?: string;
}

export function OtpVerifyDialog({
  open,
  onOpenChange,
  userId,
  email,
  purpose = "login_2fa",
  onVerified,
  title = "Vérification en deux étapes",
  description,
}: OtpVerifyDialogProps) {
  const [code, setCode] = useState<string[]>(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [devOtp, setDevOtp] = useState("");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (open && !sent) {
      sendOtp();
    }
  }, [open]);

  const sendOtp = async () => {
    setSending(true);
    const { data, error } = await supabase.functions.invoke("otp", {
      body: { action: "generate", user_id: userId, email, purpose },
    });
    setSending(false);

    if (error || data?.error) {
      toast.error(data?.error || "Erreur lors de l'envoi du code");
      return;
    }

    setSent(true);
    if (data?._dev_otp) setDevOtp(data._dev_otp);
    toast.success("Code envoyé à " + email);
  };

  const handleInput = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits entered
    if (newCode.every((d) => d !== "") && newCode.join("").length === 6) {
      verifyOtp(newCode.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const newCode = [...code];
    for (let i = 0; i < pasted.length; i++) {
      newCode[i] = pasted[i];
    }
    setCode(newCode);
    if (pasted.length === 6) {
      verifyOtp(pasted);
    }
  };

  const verifyOtp = async (otpCode: string) => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("otp", {
      body: { action: "verify", user_id: userId, code: otpCode, purpose },
    });
    setLoading(false);

    if (error || data?.error) {
      toast.error(data?.error || "Code invalide");
      setCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
      return;
    }

    if (data?.verified) {
      toast.success("Vérification réussie");
      onVerified();
      onOpenChange(false);
    }
  };

  const maskedEmail = email.replace(/(.{2})(.*)(@.*)/, "$1***$3");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck size={20} className="text-primary" />
            <DialogTitle>{title}</DialogTitle>
          </div>
          <DialogDescription>
            {description ||
              `Un code à 6 chiffres a été envoyé à ${maskedEmail}. Il expire dans 10 minutes.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* OTP Input */}
          <div className="flex justify-center gap-2" onPaste={handlePaste}>
            {code.map((digit, i) => (
              <input
                key={i}
                ref={(el) => (inputRefs.current[i] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleInput(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className="w-12 h-14 text-center text-xl font-semibold rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                autoFocus={i === 0}
              />
            ))}
          </div>

          {/* Dev OTP hint */}
          {devOtp && (
            <p className="text-xs text-center text-muted-foreground">
              Code de démo : <span className="font-mono font-bold text-primary">{devOtp}</span>
            </p>
          )}

          {loading && (
            <div className="flex justify-center">
              <Loader2 size={20} className="animate-spin text-primary" />
            </div>
          )}

          {/* Resend */}
          <div className="text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={sendOtp}
              disabled={sending}
              className="text-xs text-muted-foreground"
            >
              {sending ? "Envoi…" : "Renvoyer le code"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
