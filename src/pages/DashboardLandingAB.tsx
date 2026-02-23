import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { ArrowLeft, Trophy, Eye, MousePointer, ShoppingCart, DollarSign } from "lucide-react";
import { toast } from "sonner";

export default function DashboardLandingAB() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [landing, setLanding] = useState<any>(null);
  const [variants, setVariants] = useState<any[]>([]);
  const [split, setSplit] = useState(50);

  const fetchData = async () => {
    if (!id) return;
    const { data: lp } = await supabase.from("landing_pages").select("*").eq("id", id).single();
    if (!lp) return navigate("/dashboard/landings");
    setLanding(lp);
    setSplit(lp.ab_split || 50);

    const { data: vars } = await supabase
      .from("landing_ab_variants")
      .select("*")
      .eq("landing_page_id", id)
      .order("variant_name");

    if (!vars || vars.length < 2) {
      // Auto-create A/B variants from current sections
      const varA = { landing_page_id: id, variant_name: "A", sections: lp.sections };
      const varB = { landing_page_id: id, variant_name: "B", sections: lp.sections };
      await supabase.from("landing_ab_variants").insert([varA, varB]);
      const { data: newVars } = await supabase.from("landing_ab_variants").select("*").eq("landing_page_id", id).order("variant_name");
      setVariants(newVars || []);
    } else {
      setVariants(vars);
    }
  };

  useEffect(() => { fetchData(); }, [id]);

  const updateSplit = async (val: number[]) => {
    const s = val[0];
    setSplit(s);
    await supabase.from("landing_pages").update({ ab_split: s }).eq("id", id);
  };

  const promoteWinner = async (variantId: string) => {
    const winner = variants.find(v => v.id === variantId);
    if (!winner) return;

    await supabase.from("landing_pages").update({
      sections: winner.sections,
      ab_enabled: false,
    }).eq("id", id!);

    await supabase.from("landing_ab_variants").update({ is_winner: true }).eq("id", variantId);

    toast.success("Variante promue ! A/B test désactivé.");
    fetchData();
  };

  const resetMetrics = async () => {
    for (const v of variants) {
      await supabase.from("landing_ab_variants").update({
        views: 0, clicks: 0, add_to_carts: 0, purchases: 0, revenue: 0, is_winner: false,
      }).eq("id", v.id);
    }
    toast.success("Métriques réinitialisées");
    fetchData();
  };

  const ctr = (v: any) => v.views > 0 ? ((v.clicks / v.views) * 100).toFixed(1) : "0.0";
  const convRate = (v: any) => v.views > 0 ? ((v.purchases / v.views) * 100).toFixed(1) : "0.0";

  if (!landing) return null;

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button size="sm" variant="ghost" onClick={() => navigate("/dashboard/landings")}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Retour
        </Button>
        <div>
          <h1 className="text-xl font-bold text-foreground">A/B Test — {landing.title}</h1>
          <p className="text-sm text-muted-foreground">/lp/{landing.slug}</p>
        </div>
      </div>

      {/* Split control */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Répartition du trafic</span>
            <span className="text-xs text-muted-foreground">A: {split}% — B: {100 - split}%</span>
          </div>
          <Slider value={[split]} onValueChange={updateSplit} min={10} max={90} step={5} />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Variante A</span>
            <span>Variante B</span>
          </div>
        </CardContent>
      </Card>

      {/* Variants comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {variants.map(v => (
          <Card key={v.id} className={`${v.is_winner ? "ring-2 ring-emerald-500" : ""}`}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  Variante {v.variant_name}
                  {v.is_winner && <Badge className="bg-emerald-100 text-emerald-700"><Trophy className="w-3 h-3 mr-1" /> Gagnant</Badge>}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <MetricCard icon={<Eye className="w-4 h-4" />} label="Vues" value={v.views} />
                <MetricCard icon={<MousePointer className="w-4 h-4" />} label="CTR" value={ctr(v) + "%"} sub={`${v.clicks} clics`} />
                <MetricCard icon={<ShoppingCart className="w-4 h-4" />} label="Add to Cart" value={v.add_to_carts} />
                <MetricCard icon={<DollarSign className="w-4 h-4" />} label="Conversions" value={convRate(v) + "%"} sub={`${v.purchases} achats`} />
              </div>
              {v.revenue > 0 && (
                <p className="text-sm text-muted-foreground">Revenu : <span className="font-semibold text-foreground">{v.revenue.toLocaleString()} FCFA</span></p>
              )}
              {!v.is_winner && !landing.ab_enabled === false && (
                <Button size="sm" variant="outline" className="w-full" onClick={() => promoteWinner(v.id)}>
                  <Trophy className="w-4 h-4 mr-1" /> Promouvoir cette variante
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={resetMetrics}>Réinitialiser les métriques</Button>
      </div>
    </div>
  );
}

function MetricCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: any; sub?: string }) {
  return (
    <div className="p-3 rounded-lg bg-muted/50 border border-border">
      <div className="flex items-center gap-2 text-muted-foreground mb-1">{icon}<span className="text-xs">{label}</span></div>
      <p className="text-lg font-bold text-foreground">{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
    </div>
  );
}
