import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Loader2, Check, X, Star, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface ReviewItem {
  id: string;
  rating: number;
  comment: string | null;
  is_approved: boolean;
  created_at: string;
  product_id: string;
  store_id: string;
  buyer_id: string;
  products: { name: string; slug: string };
  stores: { name: string; slug: string };
}

export default function AdminReviews() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("pending");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdmin();
  }, [user]);

  useEffect(() => {
    if (isAdmin) fetchReviews();
  }, [isAdmin, filter]);

  const checkAdmin = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "marketplace_admin")
      .maybeSingle();

    if (data) {
      setIsAdmin(true);
    } else {
      navigate("/dashboard");
    }
  };

  const fetchReviews = async () => {
    setLoading(true);
    let q = supabase
      .from("reviews")
      .select("id, rating, comment, is_approved, created_at, product_id, store_id, buyer_id, products(name, slug), stores(name, slug)")
      .order("created_at", { ascending: false })
      .limit(100);

    if (filter === "pending") q = q.eq("is_approved", false);
    if (filter === "approved") q = q.eq("is_approved", true);

    const { data } = await q;
    if (data) setReviews(data as unknown as ReviewItem[]);
    setLoading(false);
  };

  const handleModerate = async (reviewId: string, approve: boolean) => {
    const { error } = await supabase
      .from("reviews")
      .update({ is_approved: approve })
      .eq("id", reviewId);

    if (error) {
      toast.error("Erreur lors de la modération");
    } else {
      toast.success(approve ? "Avis approuvé" : "Avis rejeté");
      setReviews((prev) =>
        prev.map((r) => (r.id === reviewId ? { ...r, is_approved: approve } : r))
      );
    }
  };

  const handleDelete = async (reviewId: string) => {
    const { error } = await supabase.from("reviews").delete().eq("id", reviewId);
    if (error) {
      toast.error("Erreur lors de la suppression");
    } else {
      toast.success("Avis supprimé");
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    }
  };

  const renderStars = (rating: number) =>
    Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={12}
        className={i < rating ? "fill-primary text-primary" : "text-muted-foreground/30"}
      />
    ));

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-heading text-3xl text-foreground">MODÉRATION AVIS</h1>
          <Select value={filter} onValueChange={(v) => setFilter(v as any)}>
            <SelectTrigger className="w-40">
              <Filter size={14} className="mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">En attente</SelectItem>
              <SelectItem value="approved">Approuvés</SelectItem>
              <SelectItem value="all">Tous</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 size={24} className="animate-spin text-primary" />
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground">Aucun avis à modérer.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="rounded-xl border border-border bg-card p-5 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-0.5">{renderStars(review.rating)}</div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        review.is_approved
                          ? "bg-primary/10 text-primary"
                          : "bg-yellow-500/10 text-yellow-400"
                      }`}>
                        {review.is_approved ? "Approuvé" : "En attente"}
                      </span>
                    </div>
                    <p className="text-sm text-foreground font-medium">
                      {review.products?.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Vendeur: {review.stores?.name} · {new Date(review.created_at).toLocaleDateString("fr-FR")}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {!review.is_approved && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleModerate(review.id, true)}
                        className="text-primary"
                      >
                        <Check size={14} className="mr-1" />
                        Approuver
                      </Button>
                    )}
                    {review.is_approved && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleModerate(review.id, false)}
                      >
                        Rejeter
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(review.id)}
                      className="text-destructive"
                    >
                      <X size={14} />
                    </Button>
                  </div>
                </div>

                {review.comment && (
                  <p className="text-sm text-muted-foreground">{review.comment}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
