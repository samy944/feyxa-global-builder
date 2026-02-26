import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useSeoHead } from "@/hooks/useSeoHead";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MarketLayout } from "@/components/market/MarketLayout";
import { ProductReviews } from "@/components/market/ProductReviews";
import { VariantSelector } from "@/components/market/VariantSelector";
import { SimilarProducts } from "@/components/market/SimilarProducts";
import { FrequentlyBoughtTogether } from "@/components/market/FrequentlyBoughtTogether";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Loader2, ChevronRight, Store, MapPin, Truck, RotateCcw, Shield,
  ShoppingBag, Star, Heart, Share2, Minus, Plus, Check, Package,
  ChevronLeft, ZoomIn, X, BadgePercent, Award, Eye, Zap, Clock,
  Users, ThumbsUp, ArrowRight, ShoppingCart, Flame, ChevronDown, Play
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
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
  video_url: string | null;
  low_stock_alert_enabled: boolean;
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

/* ── Fake social proof for engagement ── */
function useFakeSocialProof() {
  const [viewers, setViewers] = useState(0);
  const [recentBuyers, setRecentBuyers] = useState(0);
  useEffect(() => {
    setViewers(Math.floor(Math.random() * 18) + 5);
    setRecentBuyers(Math.floor(Math.random() * 40) + 12);
    const interval = setInterval(() => {
      setViewers(v => Math.max(3, v + (Math.random() > 0.5 ? 1 : -1)));
    }, 8000);
    return () => clearInterval(interval);
  }, []);
  return { viewers, recentBuyers };
}

/* ── Helper to detect video embed URLs ── */
function getVideoEmbedUrl(url: string): string | null {
  if (!url) return null;
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]+)/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1`;
  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`;
  // Direct MP4
  if (url.match(/\.(mp4|webm)(\?|$)/i)) return url;
  return null;
}

function isDirectVideo(url: string) {
  return !!url.match(/\.(mp4|webm)(\?|$)/i);
}

/* ── Image gallery with vertical thumbnails + video support ── */
function ProductGallery({
  images, name, discountPercent, isNew, selectedImage, setSelectedImage, setShowFullscreen, videoUrl
}: {
  images: string[];
  name: string;
  discountPercent: number;
  isNew: boolean;
  selectedImage: number;
  setSelectedImage: (i: number) => void;
  setShowFullscreen: (v: boolean) => void;
  videoUrl: string | null;
}) {
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [showVideoModal, setShowVideoModal] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  const hasVideo = !!videoUrl && !!getVideoEmbedUrl(videoUrl);
  // Video is the last "slide"
  const videoIndex = images.length;
  const isVideoSelected = hasVideo && selectedImage === videoIndex;
  const totalSlides = images.length + (hasVideo ? 1 : 0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imgRef.current || isVideoSelected) return;
    const rect = imgRef.current.getBoundingClientRect();
    setZoomPos({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  };

  return (
    <>
      <div className="flex gap-3">
        {/* Vertical thumbnails (desktop) */}
        {totalSlides > 1 && (
          <div className="hidden lg:flex flex-col gap-2 w-20 shrink-0">
            {images.map((img, i) => (
              <motion.button
                key={i}
                onClick={() => setSelectedImage(i)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`aspect-square rounded-xl border-2 overflow-hidden transition-all ${
                  i === selectedImage
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-border hover:border-muted-foreground/40"
                }`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" loading="lazy" />
              </motion.button>
            ))}
            {hasVideo && (
              <motion.button
                onClick={() => setSelectedImage(videoIndex)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`aspect-square rounded-xl border-2 overflow-hidden transition-all relative bg-secondary flex items-center justify-center ${
                  isVideoSelected
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-border hover:border-muted-foreground/40"
                }`}
              >
                <Play size={20} className="text-primary" />
                <span className="absolute bottom-0.5 text-[8px] font-medium text-muted-foreground">Vidéo</span>
              </motion.button>
            )}
          </div>
        )}

        {/* Main image / video */}
        <div className="flex-1 space-y-3">
          <div
            ref={imgRef}
            className="relative aspect-square rounded-2xl border border-border bg-secondary overflow-hidden cursor-crosshair group"
            onMouseEnter={() => !isVideoSelected && setIsZoomed(true)}
            onMouseLeave={() => setIsZoomed(false)}
            onMouseMove={handleMouseMove}
            onClick={() => {
              if (isVideoSelected) setShowVideoModal(true);
              else if (images.length > 0) setShowFullscreen(true);
            }}
          >
            {isVideoSelected ? (
              <div className="w-full h-full flex flex-col items-center justify-center bg-background gap-3 cursor-pointer">
                <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <Play size={36} className="text-primary ml-1" />
                </div>
                <p className="text-sm text-muted-foreground font-medium">Cliquez pour lire la vidéo</p>
              </div>
            ) : images.length > 0 ? (
              <AnimatePresence mode="wait">
                <motion.img
                  key={selectedImage}
                  src={images[selectedImage]}
                  alt={name}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="w-full h-full object-cover"
                  style={isZoomed ? {
                    transform: "scale(2.5)",
                    transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                    transition: "transform-origin 0.1s ease"
                  } : { transition: "transform 0.3s ease" }}
                />
              </AnimatePresence>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground/20">
                <Package size={100} />
              </div>
            )}

            {/* Zoom hint (only on images) */}
            {!isVideoSelected && (
              <div className="absolute bottom-3 right-3 bg-background/80 backdrop-blur-sm rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <ZoomIn size={12} /> Survolez pour zoomer
              </div>
            )}

            {/* Badges */}
            <div className="absolute top-3 left-3 flex flex-col gap-2 pointer-events-none">
              {discountPercent > 0 && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", bounce: 0.5 }}>
                  <Badge className="bg-destructive text-destructive-foreground font-bold text-sm px-3 py-1.5 shadow-lg">
                    <Flame size={14} className="mr-1" /> -{discountPercent}%
                  </Badge>
                </motion.div>
              )}
              {isNew && (
                <Badge className="bg-primary text-primary-foreground font-semibold text-xs px-3 py-1">
                  ✨ NOUVEAU
                </Badge>
              )}
            </div>

            {/* Navigation arrows on hover */}
            {totalSlides > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); setSelectedImage(Math.max(0, selectedImage - 1)); }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background disabled:opacity-0"
                  disabled={selectedImage === 0}
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setSelectedImage(Math.min(totalSlides - 1, selectedImage + 1)); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background disabled:opacity-0"
                  disabled={selectedImage === totalSlides - 1}
                >
                  <ChevronRight size={18} />
                </button>
              </>
            )}

            {/* Image counter */}
            {totalSlides > 1 && (
              <div className="absolute bottom-3 left-3 bg-background/80 backdrop-blur-sm rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground font-medium pointer-events-none">
                {selectedImage + 1} / {totalSlides}
              </div>
            )}
          </div>

          {/* Horizontal thumbnails (mobile) */}
          {totalSlides > 1 && (
            <div className="flex lg:hidden gap-2 overflow-x-auto pb-1">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`h-16 w-16 rounded-xl border-2 overflow-hidden shrink-0 transition-all ${
                    i === selectedImage ? "border-primary" : "border-border"
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
              {hasVideo && (
                <button
                  onClick={() => setSelectedImage(videoIndex)}
                  className={`h-16 w-16 rounded-xl border-2 overflow-hidden shrink-0 transition-all flex items-center justify-center bg-secondary ${
                    isVideoSelected ? "border-primary" : "border-border"
                  }`}
                >
                  <Play size={16} className="text-primary" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Video Modal */}
      {hasVideo && (
        <Dialog open={showVideoModal} onOpenChange={setShowVideoModal}>
          <DialogContent className="sm:max-w-4xl p-0 overflow-hidden">
            <div className="aspect-video w-full">
              {isDirectVideo(videoUrl!) ? (
                <video src={getVideoEmbedUrl(videoUrl!)!} controls autoPlay className="w-full h-full" />
              ) : (
                <iframe
                  src={getVideoEmbedUrl(videoUrl!)!}
                  className="w-full h-full"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

/* ═══════════════════════════════════════════════ */
/* ═══════════════ MAIN COMPONENT ═══════════════ */
/* ═══════════════════════════════════════════════ */

export default function MarketProduct() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [variants, setVariants] = useState<VariantData[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<VariantData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [showOneClick, setShowOneClick] = useState(false);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const { addItem } = useCart();
  const { toggle, isInWishlist } = useWishlist();
  const { viewers, recentBuyers } = useFakeSocialProof();
  const ctaRef = useRef<HTMLDivElement>(null);

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

  // Sticky bar on scroll past CTA
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setShowStickyBar(!entry.isIntersecting),
      { threshold: 0 }
    );
    if (ctaRef.current) observer.observe(ctaRef.current);
    return () => observer.disconnect();
  }, [product]);

  useEffect(() => {
    if (!slug) return;
    fetchProduct();
    window.scrollTo(0, 0);
  }, [slug]);

  const fetchProduct = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("products")
      .select("id, name, slug, description, price, compare_at_price, images, stock_quantity, avg_rating, review_count, tags, store_id, marketplace_category_id, weight_grams, sku, barcode, created_at, video_url, low_stock_alert_enabled, stores!inner(name, slug, city, currency, delivery_delay, return_policy, logo_url)")
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
    setAddedToCart(false);
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
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 3000);
  };

  const handleBuyNow = () => {
    handleAddToCart();
    navigate("/checkout");
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

  // Stock percentage for progress bar
  const stockPercent = useMemo(() => {
    if (activeStock <= 0) return 0;
    if (activeStock >= 50) return 100;
    return Math.max(5, (activeStock / 50) * 100);
  }, [activeStock]);

  if (loading) {
    return (
      <MarketLayout>
        <div className="flex flex-col items-center justify-center py-40 gap-3">
          <Loader2 size={28} className="animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Chargement du produit…</p>
        </div>
      </MarketLayout>
    );
  }

  if (!product) {
    return (
      <MarketLayout>
        <div className="text-center py-40 space-y-3">
          <Package size={48} className="mx-auto text-muted-foreground/30" />
          <p className="text-muted-foreground">Produit introuvable.</p>
          <Button variant="outline" asChild>
            <Link to="/market">← Retour au Market</Link>
          </Button>
        </div>
      </MarketLayout>
    );
  }

  return (
    <MarketLayout>
      {/* ═══ Fullscreen Lightbox ═══ */}
      <AnimatePresence>
        {showFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md flex items-center justify-center"
            onClick={() => setShowFullscreen(false)}
          >
            <Button variant="ghost" size="icon" className="absolute top-4 right-4 z-10 h-12 w-12" onClick={() => setShowFullscreen(false)}>
              <X size={24} />
            </Button>
            <div className="flex items-center gap-4 max-w-5xl w-full px-4">
              <Button variant="ghost" size="icon" className="shrink-0 h-12 w-12" onClick={(e) => { e.stopPropagation(); setSelectedImage(i => Math.max(0, i - 1)); }} disabled={selectedImage === 0}>
                <ChevronLeft size={28} />
              </Button>
              <motion.img
                key={selectedImage}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                src={images[selectedImage]}
                alt={product.name}
                className="max-h-[85vh] w-full object-contain rounded-xl"
                onClick={(e) => e.stopPropagation()}
              />
              <Button variant="ghost" size="icon" className="shrink-0 h-12 w-12" onClick={(e) => { e.stopPropagation(); setSelectedImage(i => Math.min(images.length - 1, i + 1)); }} disabled={selectedImage === images.length - 1}>
                <ChevronRight size={28} />
              </Button>
            </div>
            <div className="absolute bottom-8 flex gap-2.5">
              {images.map((img, i) => (
                <button key={i} onClick={(e) => { e.stopPropagation(); setSelectedImage(i); }}
                  className={`h-16 w-16 rounded-xl border-2 overflow-hidden transition-all ${i === selectedImage ? "border-primary scale-110 shadow-glow" : "border-border/50 opacity-50 hover:opacity-100"}`}>
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ Desktop Sticky Top Bar ═══ */}
      <AnimatePresence>
        {showStickyBar && (
          <motion.div
            initial={{ y: -80 }}
            animate={{ y: 0 }}
            exit={{ y: -80 }}
            transition={{ type: "spring", damping: 25 }}
            className="fixed top-0 left-0 right-0 z-40 hidden lg:block bg-background/95 backdrop-blur-md border-b border-border shadow-card"
          >
            <div className="container max-w-7xl flex items-center justify-between py-2.5">
              <div className="flex items-center gap-4 min-w-0">
                {images[0] && <img src={images[0]} alt="" className="h-10 w-10 rounded-lg object-cover border border-border shrink-0" />}
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{product.name}</p>
                  <p className="text-xs text-muted-foreground">{product.stores.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {product.review_count > 0 && (
                  <div className="flex items-center gap-1">
                    <Star size={12} className="fill-primary text-primary" />
                    <span className="text-xs font-medium">{product.avg_rating.toFixed(1)}</span>
                  </div>
                )}
                <span className="text-lg font-bold text-foreground">{formatPrice(activePrice)}</span>
                {discountPercent > 0 && (
                  <Badge variant="destructive" className="text-xs">-{discountPercent}%</Badge>
                )}
                <Button variant="hero" size="sm" onClick={handleAddToCart} disabled={activeStock <= 0 || (hasVariants && !selectedVariant)}>
                  <ShoppingBag size={14} /> Ajouter
                </Button>
              </div>
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
            <span className="text-foreground font-medium line-clamp-1">{product.name}</span>
          </nav>

          <div className="grid lg:grid-cols-12 gap-8 lg:gap-10">
            {/* ═══ LEFT: Gallery ═══ */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="lg:col-span-7">
              <ProductGallery
                images={images}
                name={product.name}
                discountPercent={discountPercent}
                isNew={isNew}
                selectedImage={selectedImage}
                setSelectedImage={setSelectedImage}
                setShowFullscreen={setShowFullscreen}
                videoUrl={product.video_url}
              />
            </motion.div>

            {/* ═══ RIGHT: Product Info ═══ */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="lg:col-span-5 space-y-5">
              
              {/* Social proof bar with pulse */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="flex items-center gap-4 text-xs text-muted-foreground"
              >
                <span className="flex items-center gap-1.5 bg-primary/5 border border-primary/10 rounded-full px-3 py-1.5">
                  <Eye size={12} className="text-primary animate-pulse" />
                  <strong className="text-foreground">{viewers}</strong> personnes regardent
                </span>
                <span className="flex items-center gap-1.5 bg-secondary rounded-full px-3 py-1.5">
                  <ShoppingCart size={12} className="text-primary" />
                  <strong className="text-foreground">{recentBuyers}</strong> ventes récentes
                </span>
              </motion.div>

              {/* Title */}
              <div>
                <h1 className="font-heading text-2xl sm:text-3xl lg:text-[2.1rem] text-foreground leading-tight">
                  {product.name}
                </h1>

                {/* Store info */}
                <Link to={`/market/vendor/${product.stores.slug}`} className="inline-flex items-center gap-2 mt-3 group/store">
                  {product.stores.logo_url ? (
                    <img src={product.stores.logo_url} alt="" className="h-7 w-7 rounded-full object-cover border border-border" />
                  ) : (
                    <div className="h-7 w-7 rounded-full bg-secondary flex items-center justify-center">
                      <Store size={13} className="text-muted-foreground" />
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
                <div className="flex items-center gap-3 mt-3">
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star key={i} size={16} className={i < Math.round(product.avg_rating || 0) ? "fill-primary text-primary" : "text-muted-foreground/20"} />
                    ))}
                  </div>
                  {product.review_count > 0 ? (
                    <>
                      <span className="text-sm font-semibold text-foreground">{product.avg_rating.toFixed(1)}</span>
                      <a href="#reviews" className="text-sm text-primary hover:underline">
                        {product.review_count} avis vérifiés
                      </a>
                    </>
                  ) : (
                    <span className="text-sm text-muted-foreground">Aucun avis encore</span>
                  )}
                </div>
              </div>

              <Separator />

              {/* Price block */}
              <div className="rounded-xl bg-card-gradient border border-border p-4 space-y-2">
                <div className="flex items-end gap-3">
                  <span className="text-4xl font-bold text-foreground tracking-tight leading-none">
                    {formatPrice(activePrice)}
                  </span>
                  {!selectedVariant && product.compare_at_price && product.compare_at_price > product.price && (
                    <span className="text-base text-muted-foreground line-through pb-0.5">
                      {formatPrice(product.compare_at_price)}
                    </span>
                  )}
                  {discountPercent > 0 && !selectedVariant && (
                    <Badge variant="destructive" className="text-xs mb-0.5">-{discountPercent}%</Badge>
                  )}
                </div>
                {discountPercent > 0 && !selectedVariant && (
                  <p className="text-sm text-destructive font-medium flex items-center gap-1">
                    <Zap size={13} />
                    Vous économisez {formatPrice(product.compare_at_price! - activePrice)}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">TVA incluse · Livraison calculée au checkout</p>
              </div>

              {/* Variant selector */}
              {hasVariants && (
                <VariantSelector variants={variants} onVariantChange={handleVariantChange} />
              )}

              {/* Stock indicator with scarcity alerts */}
              <div className="space-y-2">
                {activeStock > 10 ? (
                  <div className="flex items-center gap-1.5 text-sm">
                    <div className="h-2.5 w-2.5 rounded-full bg-primary animate-pulse" />
                    <span className="text-primary font-semibold">En stock</span>
                    <span className="text-muted-foreground">— Prêt à expédier</span>
                  </div>
                ) : activeStock > 0 && activeStock <= 5 ? (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ type: "spring", bounce: 0.4 }}
                    className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                      >
                        <Flame size={18} className="text-destructive" />
                      </motion.div>
                      <span className="text-sm font-bold text-destructive">
                        🔥 Vite, plus que {activeStock} article{activeStock > 1 ? "s" : ""} en stock !
                      </span>
                    </div>
                    <Progress value={stockPercent} className="h-2.5 [&>div]:bg-destructive" />
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock size={11} /> Commandez maintenant avant rupture
                    </p>
                  </motion.div>
                ) : activeStock > 0 ? (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-2"
                  >
                    <div className="flex items-center gap-1.5 text-sm">
                      <Flame size={14} className="text-destructive" />
                      <span className="text-destructive font-semibold">
                        Plus que {activeStock} en stock !
                      </span>
                    </div>
                    <Progress value={stockPercent} className="h-2" />
                    <p className="text-xs text-muted-foreground">Stock limité — commandez maintenant</p>
                  </motion.div>
                ) : (
                  <div className="flex items-center gap-1.5 text-sm">
                    <div className="h-2.5 w-2.5 rounded-full bg-destructive" />
                    <span className="text-destructive font-medium">Rupture de stock</span>
                  </div>
                )}
              </div>

              {/* Quantity + CTA */}
              <div ref={ctaRef} className="space-y-3 pt-1">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-foreground">Quantité</span>
                  <div className="flex items-center border border-border rounded-xl overflow-hidden bg-secondary/30">
                    <button onClick={() => setQuantity(q => Math.max(1, q - 1))} disabled={quantity <= 1}
                      className="h-11 w-11 flex items-center justify-center hover:bg-secondary transition-colors disabled:opacity-30">
                      <Minus size={14} />
                    </button>
                    <span className="h-11 w-14 flex items-center justify-center text-sm font-bold border-x border-border">
                      {quantity}
                    </span>
                    <button onClick={() => setQuantity(q => Math.min(activeStock, q + 1))} disabled={quantity >= activeStock}
                      className="h-11 w-11 flex items-center justify-center hover:bg-secondary transition-colors disabled:opacity-30">
                      <Plus size={14} />
                    </button>
                  </div>
                  {quantity > 1 && (
                    <motion.span initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="text-sm text-muted-foreground">
                      = <strong className="text-foreground">{formatPrice(activePrice * quantity)}</strong>
                    </motion.span>
                  )}
                </div>

                {/* CTA Buttons */}
                <div className="space-y-2">
                  <Button
                    variant="hero"
                    size="lg"
                    className="w-full font-heading text-base tracking-wide h-14 relative overflow-hidden"
                    disabled={activeStock <= 0 || (hasVariants && !selectedVariant)}
                    onClick={handleAddToCart}
                  >
                    <AnimatePresence mode="wait">
                      {addedToCart ? (
                        <motion.span key="added" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }}
                          className="flex items-center gap-2">
                          <Check size={18} /> AJOUTÉ AU PANIER ✓
                        </motion.span>
                      ) : (
                        <motion.span key="add" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }}
                          className="flex items-center gap-2">
                          <ShoppingBag size={18} /> AJOUTER AU PANIER
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </Button>

                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full font-semibold h-12 border-primary/30 text-foreground hover:bg-primary/5"
                    disabled={activeStock <= 0 || (hasVariants && !selectedVariant)}
                    onClick={handleBuyNow}
                  >
                    <Zap size={16} className="text-primary" />
                    ACHETER MAINTENANT
                    <ArrowRight size={14} />
                  </Button>

                  {/* ─── One-Click Buy ─── */}
                  <Button
                    size="lg"
                    className="w-full font-bold h-12 bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90 transition-opacity"
                    disabled={activeStock <= 0 || (hasVariants && !selectedVariant)}
                    onClick={() => setShowOneClick(true)}
                  >
                    <Zap size={16} />
                    ACHETER EN 1 CLIC
                  </Button>
                </div>

                {/* Action row */}
                <div className="flex items-center gap-2 pt-1">
                  <Button variant="ghost" size="sm" className="flex-1 text-xs" onClick={() => toggle(product.id)}>
                    <Heart size={15} className={isInWishlist(product.id) ? "fill-destructive text-destructive" : ""} />
                    {isInWishlist(product.id) ? "Dans vos favoris" : "Ajouter aux favoris"}
                  </Button>
                  <Button variant="ghost" size="sm" className="flex-1 text-xs" onClick={handleShare}>
                    <Share2 size={15} />
                    Partager
                  </Button>
                </div>
              </div>

              {/* Trust badges */}
              <div className="grid grid-cols-2 gap-2.5 pt-3">
                {[
                  { icon: Truck, title: "Livraison rapide", desc: product.stores.delivery_delay || "2-5 jours" },
                  { icon: RotateCcw, title: "Retours faciles", desc: product.stores.return_policy || "Retours sous 7j" },
                  { icon: Shield, title: "Paiement sécurisé", desc: "Escrow protégé" },
                  { icon: Award, title: "Qualité garantie", desc: "Vérifié par Feyxa" },
                ].map(({ icon: Icon, title, desc }, i) => (
                  <motion.div
                    key={title}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + i * 0.08 }}
                    className="flex items-center gap-2.5 rounded-xl bg-secondary/50 p-3 border border-border/50"
                  >
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon size={15} className="text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground leading-tight">{title}</p>
                      <p className="text-[11px] text-muted-foreground leading-tight truncate">{desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Quick description preview */}
              {product.description && (
                <div className="pt-2">
                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                    {product.description}
                  </p>
                  <a href="#product-details" className="text-xs text-primary hover:underline mt-1 inline-flex items-center gap-1">
                    Lire la description complète <ChevronDown size={12} />
                  </a>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══ TABS Section ═══ */}
      <section className="py-10 border-t border-border" id="product-details">
        <div className="container max-w-7xl">
          <Tabs defaultValue="description" className="w-full">
            <TabsList className="w-full justify-start bg-transparent border-b border-border rounded-none gap-0 h-auto p-0 overflow-x-auto">
              {[
                { value: "description", label: "Description" },
                { value: "specs", label: "Caractéristiques" },
                { value: "reviews", label: `Avis (${product.review_count || 0})` },
                { value: "store", label: "À propos du vendeur" },
              ].map(({ value, label }) => (
                <TabsTrigger key={value} value={value}
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-5 py-3.5 font-semibold text-sm whitespace-nowrap">
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="description" className="pt-8">
              <div className="max-w-3xl space-y-6">
                {product.description ? (
                  <div className="text-muted-foreground leading-relaxed space-y-4 text-[15px]">
                    {product.description.split("\n").map((para, i) => (
                      <p key={i}>{para}</p>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">Aucune description disponible.</p>
                )}

                {product.tags && product.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {product.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="specs" className="pt-8">
              <div className="max-w-2xl">
                <div className="rounded-xl border border-border overflow-hidden divide-y divide-border">
                  {[
                    product.sku && { label: "Référence (SKU)", value: product.sku },
                    product.barcode && { label: "Code-barres", value: product.barcode },
                    product.weight_grams && {
                      label: "Poids",
                      value: product.weight_grams >= 1000 ? `${(product.weight_grams / 1000).toFixed(1)} kg` : `${product.weight_grams} g`
                    },
                    { label: "Disponibilité", value: activeStock > 0 ? "En stock" : "Rupture", isStock: true },
                    hasVariants && { label: "Variantes", value: `${variants.length} option(s) disponible(s)` },
                    { label: "Vendeur", value: product.stores.name, isLink: true },
                    product.stores.city && { label: "Expédié depuis", value: product.stores.city },
                    { label: "Délai de livraison", value: product.stores.delivery_delay || "2-5 jours" },
                    { label: "Politique de retour", value: product.stores.return_policy || "Retours sous 7 jours" },
                  ].filter(Boolean).map((row: any, i) => (
                    <div key={i} className="flex">
                      <div className="py-3.5 px-4 font-medium text-foreground bg-secondary/40 w-2/5 text-sm">{row.label}</div>
                      <div className="py-3.5 px-4 text-sm text-muted-foreground flex-1">
                        {row.isStock ? (
                          <span className={`inline-flex items-center gap-1.5 font-medium ${activeStock > 0 ? "text-primary" : "text-destructive"}`}>
                            {activeStock > 0 && <Check size={14} />} {row.value}
                          </span>
                        ) : row.isLink ? (
                          <Link to={`/market/vendor/${product.stores.slug}`} className="text-primary hover:underline">{row.value}</Link>
                        ) : (
                          row.value
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="reviews" className="pt-8" id="reviews">
              <ProductReviews productId={product.id} avgRating={product.avg_rating || 0} reviewCount={product.review_count || 0} />
            </TabsContent>

            <TabsContent value="store" className="pt-8">
              <div className="max-w-lg">
                <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
                  <div className="flex items-center gap-4">
                    {product.stores.logo_url ? (
                      <img src={product.stores.logo_url} alt="" className="h-16 w-16 rounded-2xl object-cover border border-border shadow-card" />
                    ) : (
                      <div className="h-16 w-16 rounded-2xl bg-secondary flex items-center justify-center">
                        <Store size={28} className="text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-heading text-xl text-foreground">{product.stores.name}</h3>
                      {product.stores.city && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                          <MapPin size={12} /> {product.stores.city}
                        </p>
                      )}
                      <div className="flex items-center gap-1.5 mt-1">
                        <Badge variant="secondary" className="text-[10px]">
                          <Shield size={10} className="mr-0.5" /> Vendeur vérifié
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-secondary/60 p-3.5 text-center space-y-1">
                      <Truck size={18} className="mx-auto text-primary" />
                      <p className="text-xs font-semibold text-foreground">Livraison</p>
                      <p className="text-xs text-muted-foreground">{product.stores.delivery_delay || "2-5 jours"}</p>
                    </div>
                    <div className="rounded-xl bg-secondary/60 p-3.5 text-center space-y-1">
                      <RotateCcw size={18} className="mx-auto text-primary" />
                      <p className="text-xs font-semibold text-foreground">Retours</p>
                      <p className="text-xs text-muted-foreground">{product.stores.return_policy || "Sous 7 jours"}</p>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full" asChild>
                    <Link to={`/market/vendor/${product.stores.slug}`}>
                      Voir tous les produits du vendeur
                      <ArrowRight size={14} />
                    </Link>
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Frequently bought together */}
      <FrequentlyBoughtTogether
        productId={product.id}
        storeId={product.store_id}
        categoryId={product.marketplace_category_id}
        currentPrice={activePrice}
        currentName={product.name}
        currentImage={images[0] ?? null}
        currentSlug={product.slug}
        currency={product.stores.currency}
      />

      {/* Similar products */}
      <SimilarProducts productId={product.id} storeId={product.store_id} categoryId={product.marketplace_category_id} tags={product.tags} />

      {/* ═══ Mobile Sticky Bottom Bar ═══ */}
      <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-background/95 backdrop-blur-md border-t border-border px-3 py-2.5 safe-area-bottom">
        <div className="flex items-center gap-2.5">
          <div className="shrink-0 min-w-0">
            <p className="text-base font-bold text-foreground leading-tight">{formatPrice(activePrice)}</p>
            {discountPercent > 0 && (
              <p className="text-[10px] text-destructive font-semibold">-{discountPercent}% de réduction</p>
            )}
          </div>
          <Button
            variant="hero"
            className="flex-1 font-heading tracking-wide h-11"
            disabled={activeStock <= 0 || (hasVariants && !selectedVariant)}
            onClick={handleAddToCart}
          >
            {addedToCart ? <><Check size={15} /> Ajouté ✓</> : <><ShoppingBag size={15} /> AJOUTER</>}
          </Button>
          <Button variant="outline" size="icon" className="h-11 w-11 shrink-0" onClick={() => toggle(product.id)}>
            <Heart size={17} className={isInWishlist(product.id) ? "fill-destructive text-destructive" : ""} />
          </Button>
        </div>
      </div>
      <div className="h-20 lg:hidden" />

      {/* ═══ One-Click Checkout Dialog ═══ */}
      <Dialog open={showOneClick} onOpenChange={setShowOneClick}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Zap size={20} className="text-primary" />
              </div>
              <div>
                <h3 className="font-heading text-lg text-foreground">Achat en 1 clic</h3>
                <p className="text-xs text-muted-foreground">Confirmation rapide de votre commande</p>
              </div>
            </div>

            <Separator />

            {/* Product summary */}
            <div className="flex gap-3 rounded-xl border border-border bg-secondary/30 p-3">
              {images[0] && (
                <img src={images[0]} alt={product.name} className="h-16 w-16 rounded-lg object-cover border border-border" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground line-clamp-2">{product.name}</p>
                {selectedVariant && (
                  <p className="text-xs text-muted-foreground mt-0.5">{selectedVariant.name}</p>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-base font-bold text-foreground">{formatPrice(activePrice * quantity)}</span>
                  <span className="text-xs text-muted-foreground">× {quantity}</span>
                </div>
              </div>
            </div>

            {/* Shipping info */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-3 text-sm">
                <MapPin size={15} className="text-muted-foreground shrink-0" />
                <div>
                  <p className="font-medium text-foreground">Adresse de livraison par défaut</p>
                  <p className="text-xs text-muted-foreground">123 Rue du Commerce, Cotonou, Bénin</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Shield size={15} className="text-muted-foreground shrink-0" />
                <div>
                  <p className="font-medium text-foreground">Paiement à la livraison</p>
                  <p className="text-xs text-muted-foreground">Moyen de paiement par défaut</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Truck size={15} className="text-muted-foreground shrink-0" />
                <div>
                  <p className="font-medium text-foreground">Livraison estimée</p>
                  <p className="text-xs text-muted-foreground">{product.stores.delivery_delay || "2-5 jours ouvrés"}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Total */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Total à payer</span>
              <span className="text-xl font-bold text-foreground">{formatPrice(activePrice * quantity)}</span>
            </div>

            {/* CTA */}
            <Button
              size="lg"
              className="w-full font-bold h-13 bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90 transition-opacity text-base"
              onClick={() => {
                handleAddToCart();
                setShowOneClick(false);
                navigate("/checkout");
                toast.success("Commande express initiée !");
              }}
            >
              <Zap size={18} />
              Confirmer et Payer
            </Button>

            <p className="text-[10px] text-center text-muted-foreground">
              En confirmant, vous acceptez nos conditions générales de vente.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </MarketLayout>
  );
}
