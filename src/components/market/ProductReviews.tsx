import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Star, User } from "lucide-react";
import { motion } from "framer-motion";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  images: string[];
  created_at: string;
  buyer_id: string;
  profiles?: { full_name: string | null } | null;
}

interface ProductReviewsProps {
  productId: string;
  avgRating: number;
  reviewCount: number;
}

export function ProductReviews({ productId, avgRating, reviewCount }: ProductReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const fetchReviews = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("reviews")
      .select("id, rating, comment, images, created_at, buyer_id")
      .eq("product_id", productId)
      .eq("is_approved", true)
      .order("created_at", { ascending: false })
      .limit(20);

    if (data) {
      // Fetch buyer names
      const buyerIds = [...new Set(data.map((r) => r.buyer_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", buyerIds);

      const profileMap: Record<string, string> = {};
      profiles?.forEach((p) => {
        profileMap[p.id] = p.full_name || "Acheteur";
      });

      setReviews(
        data.map((r) => ({
          ...r,
          images: Array.isArray(r.images) ? (r.images as string[]) : [],
          profiles: { full_name: profileMap[r.buyer_id] || "Acheteur" },
        }))
      );
    }
    setLoading(false);
  };

  // Compute star breakdown
  const breakdown = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));

  const renderStars = (rating: number, size = 14) =>
    Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={size}
        className={i < rating ? "fill-primary text-primary" : "text-muted-foreground/30"}
      />
    ));

  if (reviewCount === 0 && !loading) {
    return (
      <section className="py-12 border-t border-border">
        <div className="container">
          <h2 className="font-heading text-2xl text-foreground mb-4">AVIS CLIENTS</h2>
          <p className="text-muted-foreground text-sm">Aucun avis pour ce produit.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 border-t border-border">
      <div className="container">
        <h2 className="font-heading text-2xl text-foreground mb-8">AVIS CLIENTS</h2>

        <div className="grid lg:grid-cols-3 gap-10">
          {/* Summary */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-5xl font-bold text-foreground">{avgRating.toFixed(1)}</span>
              <div>
                <div className="flex gap-0.5">{renderStars(Math.round(avgRating), 16)}</div>
                <p className="text-sm text-muted-foreground mt-1">
                  {reviewCount} {reviewCount <= 1 ? "avis" : "avis"}
                </p>
              </div>
            </div>

            {/* Star breakdown */}
            <div className="space-y-2">
              {breakdown.map(({ star, count }) => {
                const pct = reviewCount > 0 ? (count / reviewCount) * 100 : 0;
                return (
                  <div key={star} className="flex items-center gap-2 text-sm">
                    <span className="w-3 text-muted-foreground">{star}</span>
                    <Star size={12} className="fill-primary text-primary" />
                    <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-6 text-right text-xs text-muted-foreground">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Reviews list */}
          <div className="lg:col-span-2 space-y-6">
            {loading ? (
              <p className="text-muted-foreground text-sm">Chargement des avis…</p>
            ) : (
              reviews.map((review, i) => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-xl border border-border bg-card p-5 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
                        <User size={14} className="text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {review.profiles?.full_name || "Acheteur"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(review.created_at).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-0.5">{renderStars(review.rating)}</div>
                  </div>

                  {review.comment && (
                    <p className="text-sm text-muted-foreground leading-relaxed">{review.comment}</p>
                  )}

                  {review.images.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto">
                      {review.images.map((img, idx) => (
                        <img
                          key={idx}
                          src={img as string}
                          alt="Avis"
                          className="h-16 w-16 rounded-lg object-cover border border-border"
                        />
                      ))}
                    </div>
                  )}
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
