import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function TrackingRedirect() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState(false);

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

      // 3. Redirect to target URL with UTM params preserved
      const targetUrl = data.target_url;
      
      // If internal URL, use navigate
      if (targetUrl.startsWith("/")) {
        navigate(targetUrl, { replace: true });
      } else {
        window.location.href = targetUrl;
      }
    };

    redirect();
  }, [code, navigate]);

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
