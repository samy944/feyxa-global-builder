import { useState, useEffect } from "react";
import { useStore } from "@/hooks/useStore";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Instagram, Facebook, MessageCircle, Video, Copy, Sparkles,
  Loader2, Check, RefreshCw, Share2, ShoppingBag,
} from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

const PLATFORMS = [
  { id: "instagram", label: "Instagram", icon: Instagram, color: "text-pink-500 bg-pink-500/10" },
  { id: "facebook", label: "Facebook", icon: Facebook, color: "text-blue-500 bg-blue-500/10" },
  { id: "tiktok", label: "TikTok", icon: Video, color: "text-foreground bg-secondary" },
  { id: "whatsapp", label: "WhatsApp", icon: MessageCircle, color: "text-green-500 bg-green-500/10" },
];

export default function DashboardSocialCommerce() {
  const { store } = useStore();
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [platform, setPlatform] = useState("instagram");
  const [generatedContent, setGeneratedContent] = useState("");
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!store?.id) return;
    supabase
      .from("products")
      .select("id, name, price, compare_at_price, images, description, slug")
      .eq("store_id", store.id)
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => {
        setProducts(data || []);
        setLoading(false);
      });
  }, [store?.id]);

  const toggleProduct = (id: string) => {
    setSelectedProducts((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : prev.length < 5 ? [...prev, id] : prev
    );
  };

  const handleGenerate = async () => {
    if (selectedProducts.length === 0) {
      toast.error("Sélectionnez au moins un produit");
      return;
    }
    setGenerating(true);
    setGeneratedContent("");
    try {
      const selectedData = products
        .filter((p) => selectedProducts.includes(p.id))
        .map((p) => ({
          name: p.name,
          price: p.price,
          compare_at_price: p.compare_at_price,
          description: p.description,
          currency: store?.currency || "XOF",
        }));

      const { data, error } = await supabase.functions.invoke("social-commerce", {
        body: {
          products: selectedData,
          storeName: store?.name,
          platform,
          storeUrl: store?.slug ? `${window.location.origin}/store/${store.slug}` : undefined,
        },
      });
      if (error) throw error;
      if (data?.error) { toast.error(data.error); return; }
      setGeneratedContent(data.content || "");
      toast.success("Contenu généré !");
    } catch (e) {
      console.error(e);
      toast.error("Erreur lors de la génération");
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedContent);
    setCopied(true);
    toast.success("Copié dans le presse-papiers !");
    setTimeout(() => setCopied(false), 2000);
  };

  const getFirstImage = (p: any) => {
    const imgs = Array.isArray(p.images) ? p.images : [];
    return imgs[0] || null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="animate-spin text-muted-foreground" size={32} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-gradient-to-br from-pink-500/20 to-purple-500/20">
          <Share2 className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Social Commerce</h1>
          <p className="text-sm text-muted-foreground">Générez du contenu prêt à publier pour vos réseaux sociaux</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left: Product Selection + Platform */}
        <div className="space-y-4">
          {/* Platform selector */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Plateforme</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {PLATFORMS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPlatform(p.id)}
                    className={`flex items-center gap-2 p-3 rounded-xl border transition-all text-sm font-medium ${
                      platform === p.id
                        ? "border-primary bg-primary/5 text-foreground"
                        : "border-border text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    <p.icon size={18} className={platform === p.id ? "text-primary" : ""} />
                    {p.label}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Products */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between">
                <span>Produits à promouvoir</span>
                <Badge variant="secondary" className="text-xs">
                  {selectedProducts.length}/5
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] pr-2">
                <div className="space-y-2">
                  {products.map((p) => {
                    const img = getFirstImage(p);
                    const selected = selectedProducts.includes(p.id);
                    return (
                      <button
                        key={p.id}
                        onClick={() => toggleProduct(p.id)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                          selected
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/30"
                        }`}
                      >
                        <Checkbox checked={selected} className="pointer-events-none" />
                        {img ? (
                          <img src={img} alt="" className="w-10 h-10 rounded-lg object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                            <ShoppingBag size={16} className="text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {p.price?.toLocaleString()} {store?.currency || "FCFA"}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                  {products.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Aucun produit publié
                    </p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Button
            onClick={handleGenerate}
            disabled={generating || selectedProducts.length === 0}
            className="w-full gap-2"
            size="lg"
          >
            {generating ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Sparkles size={18} />
            )}
            Générer le contenu
          </Button>
        </div>

        {/* Right: Generated Content */}
        <Card className="h-fit">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Sparkles size={14} className="text-primary" />
                Contenu généré
              </span>
              {generatedContent && (
                <div className="flex items-center gap-1.5">
                  <Button variant="ghost" size="sm" onClick={handleGenerate} disabled={generating} className="h-7 gap-1 text-xs">
                    <RefreshCw size={12} /> Régénérer
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleCopy} className="h-7 gap-1 text-xs">
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                    {copied ? "Copié" : "Copier"}
                  </Button>
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {generatedContent ? (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown>{generatedContent}</ReactMarkdown>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
                <div className="p-4 rounded-full bg-secondary">
                  <Share2 size={24} className="text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Sélectionnez des produits et une plateforme,<br />
                  puis cliquez sur "Générer" pour créer votre post
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
