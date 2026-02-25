import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Store, Package, BarChart2, Megaphone, ArrowRight, Loader2, CheckCircle2, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const benefits = [
  { icon: Store, title: "Votre propre boutique", desc: "Créez et personnalisez votre vitrine en quelques minutes." },
  { icon: Package, title: "Gestion de produits", desc: "Ajoutez, organisez et publiez vos produits facilement." },
  { icon: BarChart2, title: "Analytics détaillés", desc: "Suivez vos ventes, clients et performances en temps réel." },
  { icon: Megaphone, title: "Outils marketing", desc: "Landing pages, coupons, liens de tracking et plus encore." },
];

export default function BecomeVendor() {
  const { user } = useAuth();
  const { isVendor } = useUserRole();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  if (isVendor) {
    return (
      <div className="text-center py-16 space-y-4">
        <CheckCircle2 size={48} className="mx-auto text-primary" />
        <h2 className="text-xl font-bold text-foreground">Vous êtes déjà vendeur !</h2>
        <Button variant="hero" size="sm" onClick={() => navigate("/dashboard")}>
          Aller au dashboard <ArrowRight size={14} className="ml-1" />
        </Button>
      </div>
    );
  }

  const handleActivate = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { error } = await supabase.from("user_roles").insert({
        user_id: user.id,
        role: "vendor" as any,
      });
      if (error) throw error;
      toast.success("Compte vendeur activé ! Créons votre boutique.");
      navigate("/onboarding");
    } catch (err: any) {
      if (err?.code === "23505") {
        toast.info("Votre compte vendeur est déjà actif.");
        navigate("/onboarding");
      } else {
        toast.error("Erreur lors de l'activation. Réessayez.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
          <Rocket size={14} />
          Activation vendeur
        </div>
        <h1 className="text-2xl font-bold text-foreground">Devenez vendeur sur Feyxa</h1>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Transformez votre passion en business. Créez votre boutique en ligne et commencez à vendre dès aujourd'hui.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {benefits.map((b, i) => (
          <motion.div
            key={b.title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="rounded-xl border border-border bg-card p-5 space-y-3"
          >
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <b.icon size={20} className="text-primary" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">{b.title}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">{b.desc}</p>
          </motion.div>
        ))}
      </div>

      <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-6 text-center space-y-4">
        <h2 className="text-lg font-bold text-foreground">Prêt à lancer votre boutique ?</h2>
        <p className="text-sm text-muted-foreground">
          L'activation est gratuite. Vous serez guidé étape par étape pour configurer votre boutique.
        </p>
        <Button variant="hero" size="lg" onClick={handleActivate} disabled={loading}>
          {loading ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
          {loading ? "Activation en cours..." : "Activer mon compte vendeur"}
          {!loading && <ArrowRight size={16} className="ml-2" />}
        </Button>
      </div>
    </div>
  );
}
