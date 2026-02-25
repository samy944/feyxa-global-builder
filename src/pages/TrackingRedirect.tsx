import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const ALLOWED_EXTERNAL_DOMAINS = [
  "feyxa.com",
  "lovable.app",
];

function isAllowedUrl(url: string): boolean {
  if (url.startsWith("/")) return true;
  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) return false;
    return ALLOWED_EXTERNAL_DOMAINS.some(
      (domain) =>
        parsed.hostname === domain || parsed.hostname.endsWith("." + domain)
    );
  } catch {
    return false;
  }
}

export default function TrackingRedirect() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState(false);
  const [externalWarning, setExternalWarning] = useState<string | null>(null);

  useEffect(() => {
    if (!code) {
      setError(true);
      return;
    }

    const redirect = async () => {
      // 1. Look up tracking link
      const { data } = await supabase
        .from("tracking_links")
        .select("target_url, id")
        .eq("short_code", code)
        .maybeSingle();

      if (!data) {
        setError(true);
        return;
      }

      // 2. Increment click count via secure function
      await supabase.rpc("increment_tracking_link_click", { _short_code: code });

      // 3. Validate and redirect
      const targetUrl = data.target_url;

      if (targetUrl.startsWith("/")) {
        navigate(targetUrl, { replace: true });
      } else if (isAllowedUrl(targetUrl)) {
        window.location.href = targetUrl;
      } else {
        // Show interstitial warning for unknown external domains
        setExternalWarning(targetUrl);
      }
    };

    redirect();
  }, [code, navigate]);

  if (externalWarning) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center max-w-md space-y-4">
          <h1 className="text-2xl font-bold text-foreground">Vous quittez Feyxa</h1>
          <p className="text-muted-foreground">
            Ce lien mène vers un site externe. Vérifiez l'URL avant de continuer&nbsp;:
          </p>
          <p className="text-sm font-mono bg-muted rounded p-2 break-all text-foreground">
            {externalWarning}
          </p>
          <div className="flex gap-3 justify-center pt-2">
            <button
              onClick={() => navigate("/", { replace: true })}
              className="px-4 py-2 rounded-md border border-border text-foreground hover:bg-muted transition-colors"
            >
              Retour
            </button>
            <a
              href={externalWarning}
              rel="noopener noreferrer nofollow"
              className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Continuer
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Lien introuvable</h1>
          <p className="text-muted-foreground">Ce lien n'existe pas ou n'est plus actif.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
