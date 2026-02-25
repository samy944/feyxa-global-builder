import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useWishlist } from "@/hooks/useWishlist";
import { motion } from "framer-motion";
import { Package, Heart, ShoppingBag, ArrowRight, Rocket, Store } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function ClientOverview() {
  const { user } = useAuth();
  const { count: wishlistCount } = useWishlist();
  const { isVendor } = useUserRole();
  const [orderCount, setOrderCount] = useState(0);
  const [loading, setLoading] = useState(true);

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
          className="rounded-xl border-2 border-primary/15 bg-gradient-to-br from-primary/5 to-transparent p-6 space-y-3"
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
