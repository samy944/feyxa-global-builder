import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function ExpressCheckout() {
  const handleExpressPay = (provider: string) => {
    toast.info(`${provider} sera bientôt disponible.`, {
      description: "Cette fonctionnalité est en cours d'intégration.",
    });
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground uppercase tracking-wider text-center font-medium">Paiement express</p>

      <div className="grid grid-cols-2 gap-3">
        {/* Apple Pay */}
        <Button
          type="button"
          className="bg-foreground text-background hover:bg-foreground/90 h-12 font-medium text-sm rounded-xl"
          onClick={() => handleExpressPay("Apple Pay")}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5 mr-1.5 fill-current" aria-hidden="true">
            <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.08-.5-2.06-.51-3.2 0-1.42.64-2.17.45-3.02-.4C3.79 16.17 4.36 9.02 8.93 8.76c1.28.07 2.17.72 2.91.76.98-.2 1.92-.77 2.97-.7 1.26.1 2.2.58 2.83 1.47-2.59 1.53-1.97 4.89.59 5.82-.47 1.22-.7 1.77-1.31 2.82l.13 1.35zM12.03 8.67c-.14-2.33 1.86-4.35 4.07-4.55.3 2.55-2.31 4.7-4.07 4.55z" />
          </svg>
           Pay
        </Button>

        {/* Google Pay */}
        <Button
          type="button"
          variant="outline"
          className="h-12 font-medium text-sm rounded-xl border-2"
          onClick={() => handleExpressPay("Google Pay")}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5 mr-1.5" aria-hidden="true">
            <path d="M12.24 10.29v3.35h4.74c-.19 1.22-.77 2.25-1.64 2.94l2.65 2.06c1.54-1.42 2.43-3.52 2.43-6.01 0-.58-.05-1.14-.15-1.68H12.24v-.66z" fill="#4285F4" />
            <path d="M5.3 14.15l-.6.46-2.12 1.65C4.35 19.66 7.9 22 12 22c2.7 0 4.96-.89 6.62-2.42l-2.65-2.06c-.89.6-2.03.95-3.97.95-3.04 0-5.62-2.05-6.54-4.82l-.16.5z" fill="#34A853" />
            <path d="M2.58 16.26A9.96 9.96 0 0 1 2 12c0-1.49.35-2.9.97-4.15l2.72 2.11A5.96 5.96 0 0 0 5.37 12c0 .73.12 1.43.32 2.08L2.58 16.26z" fill="#FBBC05" />
            <path d="M12 6.53c1.52 0 2.88.52 3.96 1.55l2.96-2.97C17.04 3.33 14.7 2 12 2 7.9 2 4.35 4.33 2.58 7.85l2.72 2.11C6.38 7.59 8.96 6.53 12 6.53z" fill="#EA4335" />
          </svg>
           Pay
        </Button>
      </div>

      {/* OR separator */}
      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground font-medium uppercase">ou</span>
        <Separator className="flex-1" />
      </div>
    </div>
  );
}
