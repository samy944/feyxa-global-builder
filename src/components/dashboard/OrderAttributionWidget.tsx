import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Globe, Share2, Target, Megaphone, Loader2 } from "lucide-react";

interface Attribution {
  first_source: string | null;
  first_medium: string | null;
  first_campaign: string | null;
  first_content: string | null;
  last_source: string | null;
  last_medium: string | null;
  last_campaign: string | null;
  last_content: string | null;
  session_id: string | null;
  tracking_link_id: string | null;
}

const SOURCE_ICONS: Record<string, string> = {
  facebook: "📘",
  instagram: "📸",
  whatsapp: "💬",
  tiktok: "🎵",
  google: "🔍",
  direct: "🔗",
  referral: "🤝",
};

export default function OrderAttributionWidget({ orderId }: { orderId: string }) {
  const [attr, setAttr] = useState<Attribution | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("order_attributions")
      .select("first_source, first_medium, first_campaign, first_content, last_source, last_medium, last_campaign, last_content, session_id, tracking_link_id")
      .eq("order_id", orderId)
      .maybeSingle()
      .then(({ data }) => {
        setAttr(data);
        setLoading(false);
      });
  }, [orderId]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
        <Loader2 className="w-3 h-3 animate-spin" /> Chargement attribution…
      </div>
    );
  }

  if (!attr) {
    return (
      <div className="text-xs text-muted-foreground py-2 flex items-center gap-1.5">
        <Globe className="w-3 h-3" /> Aucune attribution — trafic direct ou non tracké
      </div>
    );
  }

  const lastSource = attr.last_source || attr.first_source || "direct";
  const icon = SOURCE_ICONS[lastSource] || "🌐";

  const items = [
    { label: "Source", value: attr.last_source, fallback: attr.first_source, icon: Share2 },
    { label: "Medium", value: attr.last_medium, fallback: attr.first_medium, icon: Globe },
    { label: "Campagne", value: attr.last_campaign, fallback: attr.first_campaign, icon: Megaphone },
    { label: "Contenu", value: attr.last_content, fallback: attr.first_content, icon: Target },
  ].filter((i) => i.value || i.fallback);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-sm">{icon}</span>
        <span className="text-xs font-medium text-foreground">
          Origine : {lastSource.charAt(0).toUpperCase() + lastSource.slice(1)}
        </span>
        {attr.first_source && attr.last_source && attr.first_source !== attr.last_source && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            multi-touch
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <item.icon className="w-3 h-3 text-muted-foreground" />
            <span className="text-[11px] text-muted-foreground">{item.label} :</span>
            <span className="text-[11px] font-medium text-foreground truncate">
              {item.value || item.fallback}
            </span>
          </div>
        ))}
      </div>

      {attr.first_source && attr.last_source && attr.first_source !== attr.last_source && (
        <div className="text-[10px] text-muted-foreground border-t border-border pt-1.5 mt-1">
          Premier contact : {attr.first_source}
          {attr.first_campaign && ` / ${attr.first_campaign}`}
          {" → "}
          Dernier contact : {attr.last_source}
          {attr.last_campaign && ` / ${attr.last_campaign}`}
        </div>
      )}
    </div>
  );
}
