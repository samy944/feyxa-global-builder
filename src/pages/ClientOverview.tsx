import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useWishlist } from "@/hooks/useWishlist";
import { motion } from "framer-motion";
import { Package, Heart, ShoppingBag, ArrowRight, Rocket, Store, Sparkles, Gift } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

// Mock loyalty config
const LOYALTY_TIERS = [
  { name: "Bronze", min: 0, discount: 0 },
  { name: "Argent", min: 300, discount: 5 },
  { name: "Or", min: 700, discount: 10 },
  { name: "Platine", min: 1500, discount: 15 },
];

function getLoyaltyTier(points: number) {
  let current = LOYALTY_TIERS[0];
  let next = LOYALTY_TIERS[1];
  for (let i = LOYALTY_TIERS.length - 1; i >= 0; i--) {
    if (points >= LOYALTY_TIERS[i].min) {
      current = LOYALTY_TIERS[i];
      next = LOYALTY_TIERS[i + 1] || null;
      break;
    }
  }
  return { current, next };
}

export default function ClientOverview() {
  const { user } = useAuth();
  const { count: wishlistCount } = useWishlist();
  const { isVendor } = useUserRole();
  const [orderCount, setOrderCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showRedeem, setShowRedeem] = useState(false);
  const [generatedCode, setGeneratedCode] = useState("");

  // Mock loyalty points based on order count
  const loyaltyPoints = orderCount * 150; // 150 points per order (mock)
  const { current: currentTier, next: nextTier } = getLoyaltyTier(loyaltyPoints);
  const progressToNext = nextTier
    ? Math.min(100, ((loyaltyPoints - currentTier.min) / (nextTier.min - currentTier.min)) * 100)
    : 100;
  const pointsToNext = nextTier ? nextTier.min - loyaltyPoints : 0;

  useEffect(() => {
    if (!user) return;
    const fetchStats = async () => {
      const { data: customers } = await supabase
        .from("customers")
        .select("id")
        .eq("user_id", user.id);
      if (customers?.length) {
        const { count } = await supabase
          .from("orders")
          .select("id", { count: "exact", head: true })
          .in("customer_id", customers.map((c) => c.id));
        setOrderCount(count || 0);
      }
      setLoading(false);
    };
    fetchStats();
  }, [user]);

  const handleRedeem = () => {
    if (loyaltyPoints < 500) {
      toast({ title: "Points insuffisants", description: "Il faut au moins 500 points pour générer un code promo.", variant: "destructive" });
      return;
    }
    const code = `FIDEL-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    setGeneratedCode(code);
    setShowRedeem(true);
  };

  const cards = [
    {
      label: "Commandes",
      value: orderCount,
      icon: Package,
      href: "/account/orders",
      color: "text-blue-500 bg-blue-500/10",
    },
    {
      label: "Favoris",
      value: wishlistCount,
      icon: Heart,
      href: "/account/wishlist",
      color: "text-pink-500 bg-pink-500/10",
    },
  ];

  return (
    <>
      <div className="mb-8">
        <h1 className="font-heading text-2xl text-foreground">
          Bonjour, {user?.user_metadata?.full_name?.split(" ")[0] || "là"} 👋
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Bienvenue dans votre espace personnel
        </p>
      </div>

      {/* Loyalty Card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6">
          <div className="absolute top-3 right-3">
            <Sparkles size={20} className="text-primary/40" />
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-11 w-11 rounded-full bg-primary/15 flex items-center justify-center">
              <Sparkles size={20} className="text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Mon Club Fidélité</h3>
              <p className="text-xs text-muted-foreground">Palier {currentTier.name}{currentTier.discount > 0 ? ` • -${currentTier.discount}%` : ""}</p>
            </div>
          </div>

          <div className="mb-4">
            <p className="text-3xl font-bold text-foreground">{loading ? "—" : loyaltyPoints} <span className="text-lg">🌟</span></p>
            <p className="text-xs text-muted-foreground mt-0.5">points de fidélité</p>
          </div>

          {nextTier && (
            <div className="space-y-1.5 mb-4">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{currentTier.name}</span>
                <span>{nextTier.name} (-{nextTier.discount}%)</span>
              </div>
              <Progress value={progressToNext} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Plus que <strong className="text-foreground">{pointsToNext} points</strong> pour débloquer -{nextTier.discount}%
              </p>
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            className="border-primary/20 text-primary hover:bg-primary/5"
            onClick={handleRedeem}
          >
            <Gift size={14} className="mr-1" /> Convertir mes points en code promo
          </Button>
        </Card>
      </motion.div>

      {/* Redeem Dialog */}
      <Dialog open={showRedeem} onOpenChange={setShowRedeem}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>🎉 Code promo généré !</DialogTitle>
            <DialogDescription>
              Utilisez ce code lors de votre prochain achat pour bénéficier d'une réduction de 5€.
            </DialogDescription>
          </DialogHeader>
          <div className="text-center py-6">
            <div className="inline-block bg-primary/10 border-2 border-dashed border-primary/30 rounded-xl px-8 py-4">
              <p className="font-mono text-2xl font-bold text-primary tracking-widest">{generatedCode}</p>
            </div>
            <p className="text-xs text-muted-foreground mt-3">500 points ont été déduits de votre solde</p>
          </div>
          <Button onClick={() => { navigator.clipboard.writeText(generatedCode); toast({ title: "Code copié !" }); }}>
            Copier le code
          </Button>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-2 gap-4 mb-8">
        {cards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <Link
              to={card.href}
              className="flex items-center gap-4 rounded-xl border border-border bg-card p-5 hover:shadow-card transition-shadow group"
            >
              <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${card.color}`}>
                <card.icon size={22} />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{loading ? "—" : card.value}</p>
                <p className="text-xs text-muted-foreground">{card.label}</p>
              </div>
              <ArrowRight
                size={16}
                className="ml-auto text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
              />
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card p-6 text-center space-y-3">
        <ShoppingBag size={32} className="mx-auto text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">
          Explorez la marketplace pour trouver vos prochains coups de cœur
        </p>
        <Button variant="hero" size="sm" asChild>
          <Link to="/market">
            Explorer le Market <ArrowRight size={14} className="ml-1" />
          </Link>
        </Button>
      </div>

      {/* Become vendor CTA */}
      {!isVendor && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl border-2 border-primary/15 bg-gradient-to-br from-primary/5 to-transparent p-6 space-y-3 mt-6"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Rocket size={20} className="text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Vous avez quelque chose à vendre ?</h3>
              <p className="text-xs text-muted-foreground">Créez votre boutique en ligne gratuitement.</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="border-primary/20 text-primary hover:bg-primary/5" asChild>
            <Link to="/account/become-vendor">
              <Store size={14} className="mr-1" /> Devenir vendeur <ArrowRight size={12} className="ml-1" />
            </Link>
          </Button>
        </motion.div>
      )}
    </>
  );
}
