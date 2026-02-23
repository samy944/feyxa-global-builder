import { useEffect, useState, useCallback, useRef } from "react";
import { useSeoHead } from "@/hooks/useSeoHead";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MarketLayout } from "@/components/market/MarketLayout";
import { ProductReviews } from "@/components/market/ProductReviews";
import { VariantSelector } from "@/components/market/VariantSelector";
import { SimilarProducts } from "@/components/market/SimilarProducts";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2, ChevronRight, Store, MapPin, Truck, RotateCcw, Shield,
  ShoppingBag, Star, Heart, Share2, Minus, Plus, Check, Package,
  Clock, Eye, ChevronLeft, ZoomIn, X, BadgePercent, Award
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import { initStoreTracking, trackViewContent, trackAddToCart } from "@/lib/tracking";
import { toast } from "sonner";

interface VariantData {
  id: string;
  name: string;
  price: number;
  stock_quantity: number;
  sku: string | null;
  options: Record<string, string>;
}

interface ProductDetail {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  compare_at_price: number | null;
  images: any;
  stock_quantity: number;
  avg_rating: number;
  review_count: number;
  tags: string[] | null;
  store_id: string;
  marketplace_category_id: string | null;
  weight_grams: number | null;
  sku: string | null;
  barcode: string | null;
  created_at: string;
  stores: {
    name: string;
    slug: string;
    city: string | null;
    currency: string;
    delivery_delay: string | null;
    return_policy: string | null;
    logo_url: string | null;
  };
}

export default function MarketProduct() {
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [variants, setVariants] = useState<VariantData[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<VariantData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });
  const [showFullscreen, setShowFullscreen] = useState(false);
  const { addItem } = useCart();
  const { toggle, isInWishlist } = useWishlist();
  const imageRef = useRef<HTMLDivElement>(null);

  const images: string[] = Array.isArray(product?.images) ? product.images : [];
  const pageUrl = typeof window !== "undefined" ? window.location.href : "";

  useSeoHead({
    title: product ? `${product.name} — Feyxa Market` : "Feyxa Market",
    description: product?.description?.slice(0, 155) || `Achetez ${product?.name || "ce produit"} sur Feyxa Market.`,
    image: images[0] || undefined,
    url: pageUrl,
    type: "product",
    price: product?.price,
    currency: product?.stores?.currency || "XOF",
    availability: product && product.stock_quantity > 0 ? "InStock" : "OutOfStock",
    brand: product?.stores?.name,
  });

  useEffect(() => {
    if (!slug) return;
    fetchProduct();
    window.scrollTo(0, 0);
  }, [slug]);

  const fetchProduct = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("products")
      .select("id, name, slug, description, price, compare_at_price, images, stock_quantity, avg_rating, review_count, tags, store_id, marketplace_category_id, weight_grams, sku, barcode, created_at, stores!inner(name, slug, city, currency, delivery_delay, return_policy, logo_url)")
      .eq("slug", slug!)
      .eq("is_published", true)
      .eq("is_marketplace_published", true)
      .eq("stores.is_active", true)
      .eq("stores.is_banned", false)
      .single();

    if (data) {
      const p = data as unknown as ProductDetail;
      setProduct(p);
      initStoreTracking(p.store_id, p.stores.currency).then(() => {
        trackViewContent({ id: p.id, name: p.name, price: p.price, currency: p.stores.currency });
      });
      const { data: vData } = await supabase
        .from("product_variants")
        .select("id, name, price, stock_quantity, sku, options")
        .eq("product_id", p.id);
      setVariants(vData?.length ? vData.map((v: any) => ({ ...v, options: v.options || {} })) : []);
    }
    setLoading(false);
  };

  const handleVariantChange = useCallback((v: VariantData | null) => {
    setSelectedVariant(v);
    setQuantity(1);
  }, []);

  const activePrice = selectedVariant ? selectedVariant.price : product?.price ?? 0;
  const activeStock = selectedVariant ? selectedVariant.stock_quantity : product?.stock_quantity ?? 0;
  const hasVariants = variants.length > 0;

  const discountPercent = product?.compare_at_price && product.compare_at_price > activePrice
    ? Math.round(((product.compare_at_price - activePrice) / product.compare_at_price) * 100)
    : 0;

  const formatPrice = (p: number) => {
    if (!product) return "";
    if (product.stores.currency === "XOF") return `${p.toLocaleString("fr-FR")} FCFA`;
    return `€${p.toFixed(2)}`;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current) return;
    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPosition({ x, y });
  };

  const handleAddToCart = () => {
    if (!product) return;
    const itemName = selectedVariant ? `${product.name} — ${selectedVariant.name}` : product.name;
    addItem({
      productId: product.id,
      name: itemName,
      price: activePrice,
      currency: product.stores.currency,
      image: images[0] ?? null,
      storeId: product.store_id,
      storeName: product.stores.name,
      storeSlug: product.stores.slug,
      slug: product.slug,
      maxStock: activeStock,
    }, quantity);
    trackAddToCart({ id: product.id, name: itemName, price: activePrice, currency: product.stores.currency, quantity });
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: product?.name, url: pageUrl });
    } else {
      navigator.clipboard.writeText(pageUrl);
      toast.success("Lien copié !");
    }
  };

  const isNew = product?.created_at
    ? (Date.now() - new Date(product.created_at).getTime()) < 14 * 24 * 60 * 60 * 1000
    : false;

  if (loading) {
    return (
      <MarketLayout>
        <div className="flex items-center justify-center py-40">
          <Loader2 size={24} className="animate-spin text-primary" />
        </div>
      </MarketLayout>
    );
  }

  if (!product) {
    return (
      <MarketLayout>
        <div className="text-center py-40">
          <p className="text-muted-foreground">Produit introuvable.</p>
          <Link to="/market" className="text-primary text-sm mt-2 inline-block">← Retour au Market</Link>
        </div>
      </MarketLayout>
    );
  }

  return (
    <MarketLayout>
      {/* Fullscreen image viewer */}
      <AnimatePresence>
        {showFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center"
            onClick={() => setShowFullscreen(false)}
          >
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-10"
              onClick={() => setShowFullscreen(false)}
            >
              <X size={24} />
            </Button>
            <div className="flex items-center gap-4 max-w-4xl w-full px-4">
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0"
                onClick={(e) => { e.stopPropagation(); setSelectedImage(i => Math.max(0, i - 1)); }}
                disabled={selectedImage === 0}
              >
                <ChevronLeft size={24} />
              </Button>
              <img
                src={images[selectedImage]}
                alt={product.name}
                className="max-h-[80vh] w-full object-contain rounded-xl"
                onClick={(e) => e.stopPropagation()}
              />
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0"
                onClick={(e) => { e.stopPropagation(); setSelectedImage(i => Math.min(images.length - 1, i + 1)); }}
                disabled={selectedImage === images.length - 1}
              >
                <ChevronRight size={24} />
              </Button>
            </div>
            {/* Thumbnails */}
            <div className="absolute bottom-6 flex gap-2">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); setSelectedImage(i); }}
                  className={`h-14 w-14 rounded-lg border-2 overflow-hidden transition-all ${
                    i === selectedImage ? "border-primary scale-110" : "border-border/50 opacity-60 hover:opacity-100"
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <section className="py-6 lg:py-10">
        <div className="container max-w-7xl">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6">
            <Link to="/market" className="hover:text-foreground transition-colors">Market</Link>
            <ChevronRight size={14} />
            <span className="text-foreground line-clamp-1">{product.name}</span>
          </nav>

          <div className="grid lg:grid-cols-12 gap-8 lg:gap-12">
            {/* ═══════════════════ LEFT: Images ═══════════════════ */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-7 space-y-3"
            >
              {/* Main Image with zoom */}
              <div
                ref={imageRef}
                className="relative aspect-square rounded-2xl border border-border bg-secondary overflow-hidden cursor-crosshair group"
                onMouseEnter={() => setIsZoomed(true)}
                onMouseLeave={() => setIsZoomed(false)}
                onMouseMove={handleMouseMove}
                onClick={() => images.length > 0 && setShowFullscreen(true)}
              >
                {images.length > 0 ? (
                  <>
                    <img
                      src={images[selectedImage]}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-200"
                      style={isZoomed ? {
                        transform: "scale(2)",
                        transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`
                      } : undefined}
                    />
                    <div className="absolute bottom-3 right-3 bg-background/80 backdrop-blur-sm rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ZoomIn size={12} />
                      Cliquez pour agrandir
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                    <Package size={80} />
                  </div>
                )}

                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-2">
                  {discountPercent > 0 && (
                    <Badge className="bg-destructive text-destructive-foreground font-bold text-sm px-3 py-1 shadow-lg">
                      <BadgePercent size={14} className="mr-1" />
                      -{discountPercent}%
                    </Badge>
                  )}
                  {isNew && (
                    <Badge className="bg-primary text-primary-foreground font-semibold text-xs px-3 py-1">
                      NOUVEAU
                    </Badge>
                  )}
                </div>

                {/* Image counter */}
                {images.length > 1 && (
                  <div className="absolute bottom-3 left-3 bg-background/80 backdrop-blur-sm rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground">
                    {selectedImage + 1} / {images.length}
                  </div>
                )}
              </div>

              {/* Thumbnails grid */}
              {images.length > 1 && (
                <div className="grid grid-cols-6 gap-2">
                  {images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImage(i)}
                      className={`aspect-square rounded-xl border-2 overflow-hidden transition-all ${
                        i === selectedImage
                          ? "border-primary ring-2 ring-primary/20 scale-[1.02]"
                          : "border-border hover:border-muted-foreground/30"
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </motion.div>

            {/* ═══════════════════ RIGHT: Details ═══════════════════ */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-5 space-y-5"
            >
              {/* Title */}
              <div>
                <h1 className="font-heading text-2xl sm:text-3xl lg:text-4xl text-foreground leading-tight">
                  {product.name}
                </h1>

                {/* Store info */}
                <Link
                  to={`/market/vendor/${product.stores.slug}`}
                  className="inline-flex items-center gap-2 mt-3 group/store"
                >
                  {product.stores.logo_url ? (
                    <img src={product.stores.logo_url} alt="" className="h-6 w-6 rounded-full object-cover border border-border" />
                  ) : (
                    <div className="h-6 w-6 rounded-full bg-secondary flex items-center justify-center">
                      <Store size={12} className="text-muted-foreground" />
                    </div>
                  )}
                  <span className="text-sm text-muted-foreground group-hover/store:text-foreground transition-colors font-medium">
                    {product.stores.name}
                  </span>
                  {product.stores.city && (
                    <span className="text-xs text-muted-foreground/60 flex items-center gap-0.5">
                      <MapPin size={10} /> {product.stores.city}
                    </span>
                  )}
                </Link>

                {/* Rating */}
                {product.review_count > 0 && (
                  <div className="flex items-center gap-3 mt-3">
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star
                          key={i}
                          size={16}
                          className={i < Math.round(product.avg_rating)
                            ? "fill-primary text-primary"
                            : "text-muted-foreground/20"
                          }
                        />
                      ))}
                    </div>
                    <span className="text-sm font-medium text-foreground">{product.avg_rating.toFixed(1)}</span>
                    <a href="#reviews" className="text-sm text-primary hover:underline">
                      {product.review_count} avis
                    </a>
                  </div>
                )}
              </div>

              <Separator />

              {/* Price block */}
              <div className="space-y-1">
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-bold text-foreground tracking-tight">
                    {formatPrice(activePrice)}
                  </span>
                  {!selectedVariant && product.compare_at_price && product.compare_at_price > product.price && (
                    <span className="text-lg text-muted-foreground line-through">
                      {formatPrice(product.compare_at_price)}
                    </span>
                  )}
                </div>
                {discountPercent > 0 && !selectedVariant && (
                  <p className="text-sm text-destructive font-medium">
                    Vous économisez {formatPrice(product.compare_at_price! - activePrice)} ({discountPercent}%)
                  </p>
                )}
                <p className="text-xs text-muted-foreground">TVA incluse · Livraison calculée au checkout</p>
              </div>

              {/* Variant selector */}
              {hasVariants && (
                <div className="pt-1">
                  <VariantSelector variants={variants} onVariantChange={handleVariantChange} />
                </div>
              )}

              {/* Stock indicator */}
              <div className="flex items-center gap-2">
                {activeStock > 10 ? (
                  <div className="flex items-center gap-1.5 text-sm">
                    <div className="h-2.5 w-2.5 rounded-full bg-primary animate-pulse" />
                    <span className="text-primary font-medium">En stock</span>
                  </div>
                ) : activeStock > 0 ? (
                  <div className="flex items-center gap-1.5 text-sm">
                    <div className="h-2.5 w-2.5 rounded-full bg-[hsl(38,92%,50%)] animate-pulse" />
                    <span className="text-[hsl(38,92%,40%)] dark:text-[hsl(38,92%,60%)] font-medium">
                      Plus que {activeStock} en stock — Commandez vite !
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-sm">
                    <div className="h-2.5 w-2.5 rounded-full bg-destructive" />
                    <span className="text-destructive font-medium">Rupture de stock</span>
                  </div>
                )}
              </div>

              {/* Quantity + Add to cart */}
              <div className="space-y-3 pt-2">
                {/* Quantity selector */}
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-foreground">Quantité</span>
                  <div className="flex items-center border border-border rounded-xl overflow-hidden">
                    <button
                      onClick={() => setQuantity(q => Math.max(1, q - 1))}
                      disabled={quantity <= 1}
                      className="h-10 w-10 flex items-center justify-center hover:bg-secondary transition-colors disabled:opacity-30"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="h-10 w-12 flex items-center justify-center text-sm font-semibold border-x border-border">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(q => Math.min(activeStock, q + 1))}
                      disabled={quantity >= activeStock}
                      className="h-10 w-10 flex items-center justify-center hover:bg-secondary transition-colors disabled:opacity-30"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  {quantity > 1 && (
                    <span className="text-sm text-muted-foreground">
                      Total : <strong className="text-foreground">{formatPrice(activePrice * quantity)}</strong>
                    </span>
                  )}
                </div>

                {/* CTA Buttons */}
                <div className="flex gap-3">
                  <Button
                    variant="hero"
                    size="lg"
                    className="flex-1 font-heading text-base tracking-wide h-13"
                    disabled={activeStock <= 0 || (hasVariants && !selectedVariant)}
                    onClick={handleAddToCart}
                  >
                    <ShoppingBag size={18} />
                    AJOUTER AU PANIER
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="h-13 px-4"
                    onClick={() => toggle(product.id)}
                  >
                    <Heart
                      size={20}
                      className={isInWishlist(product.id) ? "fill-destructive text-destructive" : ""}
                    />
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="h-13 px-4"
                    onClick={handleShare}
                  >
                    <Share2 size={18} />
                  </Button>
                </div>
              </div>

              {/* Trust badges */}
              <div className="grid grid-cols-2 gap-3 pt-4">
                <div className="flex items-center gap-3 rounded-xl bg-secondary/60 p-3">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Truck size={16} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">Livraison</p>
                    <p className="text-xs text-muted-foreground">{product.stores.delivery_delay || "2-5 jours"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-secondary/60 p-3">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <RotateCcw size={16} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">Retours</p>
                    <p className="text-xs text-muted-foreground">{product.stores.return_policy || "Retours sous 7j"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-secondary/60 p-3">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Shield size={16} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">Paiement sécurisé</p>
                    <p className="text-xs text-muted-foreground">Escrow protégé</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-secondary/60 p-3">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Award size={16} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">Qualité garantie</p>
                    <p className="text-xs text-muted-foreground">Vérifié par Feyxa</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ TABS: Description / Specs / Reviews ═══════════════════ */}
      <section className="py-10 border-t border-border">
        <div className="container max-w-7xl">
          <Tabs defaultValue="description" className="w-full">
            <TabsList className="w-full justify-start bg-transparent border-b border-border rounded-none gap-0 h-auto p-0">
              <TabsTrigger
                value="description"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6 py-3 font-semibold"
              >
                Description
              </TabsTrigger>
              <TabsTrigger
                value="specs"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6 py-3 font-semibold"
              >
                Caractéristiques
              </TabsTrigger>
              <TabsTrigger
                value="reviews"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6 py-3 font-semibold"
              >
                Avis ({product.review_count || 0})
              </TabsTrigger>
              <TabsTrigger
                value="store"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6 py-3 font-semibold"
              >
                Vendeur
              </TabsTrigger>
            </TabsList>

            {/* Description Tab */}
            <TabsContent value="description" className="pt-8">
              <div className="max-w-3xl">
                {product.description ? (
                  <div className="prose prose-sm max-w-none text-muted-foreground leading-relaxed space-y-4">
                    {product.description.split("\n").map((para, i) => (
                      <p key={i}>{para}</p>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">Aucune description disponible.</p>
                )}

                {/* Tags */}
                {product.tags && product.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-6">
                    {product.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Specs Tab */}
            <TabsContent value="specs" className="pt-8">
              <div className="max-w-2xl">
                <div className="rounded-xl border border-border overflow-hidden">
                  <table className="w-full text-sm">
                    <tbody>
                      {product.sku && (
                        <tr className="border-b border-border">
                          <td className="py-3 px-4 font-medium text-foreground bg-secondary/40 w-1/3">Référence (SKU)</td>
                          <td className="py-3 px-4 text-muted-foreground">{product.sku}</td>
                        </tr>
                      )}
                      {product.barcode && (
                        <tr className="border-b border-border">
                          <td className="py-3 px-4 font-medium text-foreground bg-secondary/40">Code-barres</td>
                          <td className="py-3 px-4 text-muted-foreground">{product.barcode}</td>
                        </tr>
                      )}
                      {product.weight_grams && (
                        <tr className="border-b border-border">
                          <td className="py-3 px-4 font-medium text-foreground bg-secondary/40">Poids</td>
                          <td className="py-3 px-4 text-muted-foreground">
                            {product.weight_grams >= 1000
                              ? `${(product.weight_grams / 1000).toFixed(1)} kg`
                              : `${product.weight_grams} g`
                            }
                          </td>
                        </tr>
                      )}
                      <tr className="border-b border-border">
                        <td className="py-3 px-4 font-medium text-foreground bg-secondary/40">Disponibilité</td>
                        <td className="py-3 px-4">
                          {activeStock > 0 ? (
                            <span className="inline-flex items-center gap-1.5 text-primary font-medium">
                              <Check size={14} /> En stock
                            </span>
                          ) : (
                            <span className="text-destructive font-medium">Rupture de stock</span>
                          )}
                        </td>
                      </tr>
                      {hasVariants && (
                        <tr className="border-b border-border">
                          <td className="py-3 px-4 font-medium text-foreground bg-secondary/40">Variantes</td>
                          <td className="py-3 px-4 text-muted-foreground">{variants.length} option(s)</td>
                        </tr>
                      )}
                      <tr className="border-b border-border">
                        <td className="py-3 px-4 font-medium text-foreground bg-secondary/40">Vendeur</td>
                        <td className="py-3 px-4">
                          <Link to={`/market/vendor/${product.stores.slug}`} className="text-primary hover:underline">
                            {product.stores.name}
                          </Link>
                        </td>
                      </tr>
                      {product.stores.city && (
                        <tr className="border-b border-border last:border-0">
                          <td className="py-3 px-4 font-medium text-foreground bg-secondary/40">Expédié depuis</td>
                          <td className="py-3 px-4 text-muted-foreground">{product.stores.city}</td>
                        </tr>
                      )}
                      <tr>
                        <td className="py-3 px-4 font-medium text-foreground bg-secondary/40">Livraison</td>
                        <td className="py-3 px-4 text-muted-foreground">{product.stores.delivery_delay || "2-5 jours"}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>

            {/* Reviews Tab */}
            <TabsContent value="reviews" className="pt-8" id="reviews">
              <ProductReviews
                productId={product.id}
                avgRating={product.avg_rating || 0}
                reviewCount={product.review_count || 0}
              />
            </TabsContent>

            {/* Store Tab */}
            <TabsContent value="store" className="pt-8">
              <div className="max-w-lg">
                <div className="rounded-xl border border-border bg-card p-6 space-y-4">
                  <div className="flex items-center gap-4">
                    {product.stores.logo_url ? (
                      <img src={product.stores.logo_url} alt="" className="h-14 w-14 rounded-xl object-cover border border-border" />
                    ) : (
                      <div className="h-14 w-14 rounded-xl bg-secondary flex items-center justify-center">
                        <Store size={24} className="text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-heading text-lg text-foreground">{product.stores.name}</h3>
                      {product.stores.city && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin size={12} /> {product.stores.city}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-secondary/60 p-3 text-center">
                      <Truck size={16} className="mx-auto text-primary mb-1" />
                      <p className="text-xs font-medium text-foreground">Livraison</p>
                      <p className="text-xs text-muted-foreground">{product.stores.delivery_delay || "2-5 jours"}</p>
                    </div>
                    <div className="rounded-lg bg-secondary/60 p-3 text-center">
                      <RotateCcw size={16} className="mx-auto text-primary mb-1" />
                      <p className="text-xs font-medium text-foreground">Retours</p>
                      <p className="text-xs text-muted-foreground">{product.stores.return_policy || "Sous 7 jours"}</p>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full" asChild>
                    <Link to={`/market/vendor/${product.stores.slug}`}>
                      Voir la boutique
                      <ChevronRight size={14} />
                    </Link>
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Similar products */}
      <SimilarProducts
        productId={product.id}
        storeId={product.store_id}
        categoryId={product.marketplace_category_id}
        tags={product.tags}
      />

      {/* Sticky mobile bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-background/95 backdrop-blur-md border-t border-border p-3">
        <div className="flex items-center gap-3">
          <div className="shrink-0">
            <p className="text-lg font-bold text-foreground">{formatPrice(activePrice)}</p>
            {activeStock > 0 && activeStock <= 10 && (
              <p className="text-xs text-[hsl(38,92%,40%)]">Plus que {activeStock} !</p>
            )}
          </div>
          <Button
            variant="hero"
            className="flex-1 font-heading tracking-wide"
            disabled={activeStock <= 0 || (hasVariants && !selectedVariant)}
            onClick={handleAddToCart}
          >
            <ShoppingBag size={16} />
            AJOUTER AU PANIER
          </Button>
          <Button variant="outline" size="icon" onClick={() => toggle(product.id)}>
            <Heart size={18} className={isInWishlist(product.id) ? "fill-destructive text-destructive" : ""} />
          </Button>
        </div>
      </div>

      {/* Bottom spacing for mobile bar */}
      <div className="h-20 lg:hidden" />
    </MarketLayout>
  );
}
