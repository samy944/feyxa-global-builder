import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  ArrowLeft,
  Store,
  MapPin,
  Palette,
  Package,
  Truck,
  CheckCircle2,
  Rocket,
  TrendingUp,
  Target,
  Zap,
  Loader2,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

const steps = [
  { icon: Store, label: "Ma boutique", desc: "Nom et type de votre boutique" },
  { icon: MapPin, label: "Localisation", desc: "Pays, ville et quartier" },
  { icon: Rocket, label: "Smart Start", desc: "Démarrez avec un modèle intelligent" },
  { icon: Package, label: "Produits", desc: "Ce que vous vendez" },
  { icon: Truck, label: "Livraison", desc: "Méthodes de livraison" },
  { icon: Palette, label: "Style", desc: "Couleurs et apparence" },
  { icon: CheckCircle2, label: "Lancement", desc: "Résumé et création" },
];

const smartStartTemplates = [
  {
    id: "us_trending",
    icon: TrendingUp,
    title: "🇺🇸 Tendance Américaine",
    desc: "10 produits tendance inspirés d'Amazon, TikTok Shop & Temu, adaptés à votre marché",
    badge: "Populaire",
    color: "primary",
  },
  {
    id: "niche",
    icon: Target,
    title: "🎯 Boutique Niche",
    desc: "L'IA génère 8 produits spécialisés dans votre niche personnalisée",
    badge: "Personnalisable",
    color: "accent",
  },
  {
    id: "one_product",
    icon: Zap,
    title: "⚡ One Product",
    desc: "1 produit star avec une page de vente optimisée pour la conversion",
    badge: "Conversion max",
    color: "accent",
  },
  {
    id: "skip",
    icon: Package,
    title: "📦 Démarrer vide",
    desc: "Ajoutez vos propres produits manuellement depuis le dashboard",
    badge: null,
    color: "muted",
  },
];

const productCategories = [
  "Mode & Vêtements", "Électronique", "Beauté & Cosmétiques", "Alimentation",
  "Maison & Déco", "Accessoires", "Santé & Bien-être", "Artisanat", "Autre",
];

const deliveryMethods = [
  { id: "local", label: "Livraison locale", desc: "Vous livrez dans votre ville" },
  { id: "pickup", label: "Retrait en boutique", desc: "Le client vient chercher" },
  { id: "cod", label: "Paiement à la livraison", desc: "Le client paie à réception" },
  { id: "whatsapp", label: "WhatsApp", desc: "Commande via WhatsApp" },
];

const themeColors = [
  { name: "Bleu", value: "#3b82f6" },
  { name: "Vert", value: "#10b981" },
  { name: "Orange", value: "#f59e0b" },
  { name: "Rouge", value: "#ef4444" },
  { name: "Violet", value: "#8b5cf6" },
  { name: "Rose", value: "#ec4899" },
];

export default function Onboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [generatingProducts, setGeneratingProducts] = useState(false);
  const [generatedCount, setGeneratedCount] = useState(0);

  const [data, setData] = useState({
    storeName: "",
    storeType: "",
    country: "Bénin",
    city: "",
    quarter: "",
    smartTemplate: "" as string,
    nicheDescription: "",
    categories: [] as string[],
    deliveryMethods: ["local", "cod"] as string[],
    themeColor: "#3b82f6",
    currency: "XOF",
  });

  const update = (key: string, value: any) => setData((d) => ({ ...d, [key]: value }));

  const toggleCategory = (cat: string) => {
    setData((d) => ({
      ...d,
      categories: d.categories.includes(cat)
        ? d.categories.filter((c) => c !== cat)
        : [...d.categories, cat],
    }));
  };

  const toggleDelivery = (id: string) => {
    setData((d) => ({
      ...d,
      deliveryMethods: d.deliveryMethods.includes(id)
        ? d.deliveryMethods.filter((m) => m !== id)
        : [...d.deliveryMethods, id],
    }));
  };

  const generateSlug = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const handleCreate = async () => {
    if (!user) return;
    setLoading(true);
    const slug = generateSlug(data.storeName);

    const { data: storeData, error } = await supabase.from("stores").insert({
      owner_id: user.id,
      name: data.storeName,
      slug,
      description: `Boutique ${data.storeType} à ${data.city}, ${data.country}`,
      currency: data.currency,
      theme: { primary: data.themeColor, style: "modern" },
      settings: {
        country: data.country,
        city: data.city,
        quarter: data.quarter,
        categories: data.categories,
        deliveryMethods: data.deliveryMethods,
        smart_start_template: data.smartTemplate || null,
      },
    }).select("id").single();

    if (error) {
      setLoading(false);
      toast.error("Erreur: " + error.message);
      return;
    }

    // If a smart start template is selected (not "skip"), generate products
    if (data.smartTemplate && data.smartTemplate !== "skip" && storeData?.id) {
      setGeneratingProducts(true);
      try {
        const { data: fnData, error: fnError } = await supabase.functions.invoke("smart-start", {
          body: {
            store_id: storeData.id,
            template: data.smartTemplate,
            country: data.country,
            currency: data.currency,
            niche_description: data.nicheDescription || undefined,
          },
        });

        if (fnError) {
          console.error("Smart start error:", fnError);
          toast.error("Boutique créée mais erreur lors de la génération des produits. Vous pouvez les ajouter manuellement.");
        } else {
          setGeneratedCount(fnData?.count || 0);
          toast.success(`${fnData?.count || 0} produits générés par l'IA !`);
        }
      } catch (e) {
        console.error("Smart start exception:", e);
        toast.error("Boutique créée. Les produits n'ont pas pu être générés automatiquement.");
      }
      setGeneratingProducts(false);
    }

    setLoading(false);
    toast.success("Boutique créée avec succès !");
    
    if (data.smartTemplate === "one_product") {
      window.location.href = `/store/${slug}/lp`;
    } else if (data.smartTemplate === "skip" || !data.smartTemplate) {
      // No products generated — redirect to products page to add first product
      window.location.href = "/dashboard/products?welcome=1";
    } else {
      window.location.href = "/dashboard";
    }
  };

  const canNext = () => {
    switch (step) {
      case 0: return data.storeName.length >= 2;
      case 1: return data.city.length >= 2;
      case 2: {
        if (!data.smartTemplate) return false;
        if (data.smartTemplate === "niche" && data.nicheDescription.length < 3) return false;
        return true;
      }
      case 3: return data.categories.length > 0;
      case 4: return data.deliveryMethods.length > 0;
      case 5: return true;
      default: return true;
    }
  };

  const lastStep = steps.length - 1;

  return (
    <div className="min-h-screen bg-hero flex flex-col">
      <div className="absolute inset-0 grid-pattern opacity-20" />

      {/* Progress bar */}
      <div className="relative z-10 border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">F</span>
              </div>
              <span className="font-bold text-foreground">Feyxa</span>
            </div>
            <span className="text-sm text-muted-foreground">Étape {step + 1} sur {steps.length}</span>
          </div>
          <div className="flex gap-1">
            {steps.map((_, i) => (
              <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= step ? "bg-primary" : "bg-border"}`} />
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="rounded-2xl border border-border bg-card p-8"
            >
              <div className="flex items-center gap-3 mb-6">
                {(() => {
                  const Icon = steps[step].icon;
                  return <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><Icon size={20} /></div>;
                })()}
                <div>
                  <h2 className="text-lg font-bold text-foreground">{steps[step].label}</h2>
                  <p className="text-sm text-muted-foreground">{steps[step].desc}</p>
                </div>
              </div>

              {/* Step 0: Store info */}
              {step === 0 && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Nom de la boutique</label>
                    <input
                      value={data.storeName}
                      onChange={(e) => update("storeName", e.target.value)}
                      className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Ex: Fashion Cotonou"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Type d'activité</label>
                    <input
                      value={data.storeType}
                      onChange={(e) => update("storeType", e.target.value)}
                      className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Ex: Boutique de vêtements"
                    />
                  </div>
                </div>
              )}

              {/* Step 1: Location */}
              {step === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Pays</label>
                    <select
                      value={data.country}
                      onChange={(e) => update("country", e.target.value)}
                      className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      {["Bénin", "Togo", "Côte d'Ivoire", "Sénégal", "Burkina Faso", "Mali", "Niger", "Guinée", "Cameroun", "Ghana", "Nigeria"].map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Ville</label>
                    <input
                      value={data.city}
                      onChange={(e) => update("city", e.target.value)}
                      className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Ex: Cotonou"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Quartier (optionnel)</label>
                    <input
                      value={data.quarter}
                      onChange={(e) => update("quarter", e.target.value)}
                      className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Ex: Ganhi"
                    />
                  </div>
                </div>
              )}

              {/* Step 2: Smart Start */}
              {step === 2 && (
                <div className="space-y-3">
                  <div className="grid gap-3">
                    {smartStartTemplates.map((t) => {
                      const Icon = t.icon;
                      const isSelected = data.smartTemplate === t.id;
                      return (
                        <button
                          key={t.id}
                          onClick={() => update("smartTemplate", t.id)}
                          className={`relative w-full rounded-xl border p-4 text-left transition-all ${
                            isSelected
                              ? "border-primary bg-primary/5 ring-1 ring-primary"
                              : "border-border hover:border-primary/40 hover:bg-secondary/30"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
                              isSelected ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"
                            }`}>
                              <Icon size={18} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-semibold text-foreground">{t.title}</p>
                                {t.badge && (
                                  <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                                    {t.badge}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">{t.desc}</p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Niche description input */}
                  {data.smartTemplate === "niche" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mt-3"
                    >
                      <label className="text-sm font-medium text-foreground mb-1.5 block">
                        <Sparkles size={14} className="inline mr-1 text-primary" />
                        Décrivez votre niche
                      </label>
                      <input
                        value={data.nicheDescription}
                        onChange={(e) => update("nicheDescription", e.target.value)}
                        className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Ex: accessoires de sport pour femmes, gadgets tech, cosmétiques bio..."
                      />
                    </motion.div>
                  )}

                  {/* One product description input */}
                  {data.smartTemplate === "one_product" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mt-3"
                    >
                      <label className="text-sm font-medium text-foreground mb-1.5 block">
                        <Zap size={14} className="inline mr-1 text-primary" />
                        Type de produit (optionnel)
                      </label>
                      <input
                        value={data.nicheDescription}
                        onChange={(e) => update("nicheDescription", e.target.value)}
                        className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Ex: ceinture amincissante, lampe LED intelligente..."
                      />
                    </motion.div>
                  )}
                </div>
              )}

              {/* Step 3: Products */}
              {step === 3 && (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">Sélectionnez vos catégories de produits</p>
                  <div className="grid grid-cols-2 gap-2">
                    {productCategories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => toggleCategory(cat)}
                        className={`rounded-lg border p-3 text-sm text-left transition-colors ${
                          data.categories.includes(cat)
                            ? "border-primary bg-primary/10 text-foreground"
                            : "border-border text-muted-foreground hover:border-primary/30"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 4: Delivery */}
              {step === 4 && (
                <div className="space-y-3">
                  {deliveryMethods.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => toggleDelivery(m.id)}
                      className={`w-full rounded-lg border p-4 text-left transition-colors ${
                        data.deliveryMethods.includes(m.id)
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/30"
                      }`}
                    >
                      <p className="text-sm font-medium text-foreground">{m.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{m.desc}</p>
                    </button>
                  ))}
                </div>
              )}

              {/* Step 5: Theme */}
              {step === 5 && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">Choisissez votre couleur principale</p>
                  <div className="flex gap-3 flex-wrap">
                    {themeColors.map((c) => (
                      <button
                        key={c.value}
                        onClick={() => update("themeColor", c.value)}
                        className={`h-12 w-12 rounded-xl border-2 transition-all ${
                          data.themeColor === c.value ? "border-foreground scale-110" : "border-transparent"
                        }`}
                        style={{ backgroundColor: c.value }}
                        title={c.name}
                      />
                    ))}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Devise</label>
                    <select
                      value={data.currency}
                      onChange={(e) => update("currency", e.target.value)}
                      className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="XOF">XOF (Franc CFA)</option>
                      <option value="EUR">EUR (Euro)</option>
                      <option value="USD">USD (Dollar US)</option>
                      <option value="GHS">GHS (Cedi)</option>
                      <option value="NGN">NGN (Naira)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Step 6: Summary */}
              {step === 6 && (
                <div className="space-y-4">
                  {generatingProducts ? (
                    <div className="flex flex-col items-center justify-center py-8 gap-4">
                      <div className="relative">
                        <Loader2 size={32} className="animate-spin text-primary" />
                        <Sparkles size={14} className="absolute -top-1 -right-1 text-primary animate-pulse" />
                      </div>
                      <div className="text-center">
                        <p className="font-medium text-foreground">L'IA génère vos produits...</p>
                        <p className="text-sm text-muted-foreground mt-1">Cela peut prendre quelques secondes</p>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl bg-secondary/50 p-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Boutique</span>
                        <span className="text-foreground font-medium">{data.storeName}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Localisation</span>
                        <span className="text-foreground">{data.city}, {data.country}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Smart Start</span>
                        <span className="text-foreground font-medium">
                          {data.smartTemplate === "us_trending" && "🇺🇸 Tendance US (10 produits)"}
                          {data.smartTemplate === "niche" && "🎯 Niche: " + data.nicheDescription}
                          {data.smartTemplate === "one_product" && "⚡ One Product"}
                          {data.smartTemplate === "skip" && "📦 Manuel"}
                          {!data.smartTemplate && "Non sélectionné"}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Catégories</span>
                        <span className="text-foreground">{data.categories.length} sélectionnées</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Livraison</span>
                        <span className="text-foreground">{data.deliveryMethods.length} méthodes</span>
                      </div>
                      <div className="flex justify-between text-sm items-center">
                        <span className="text-muted-foreground">Couleur</span>
                        <div className="h-5 w-5 rounded-md" style={{ backgroundColor: data.themeColor }} />
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Devise</span>
                        <span className="text-foreground">{data.currency}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6">
            <Button
              variant="ghost"
              onClick={() => setStep(Math.max(0, step - 1))}
              disabled={step === 0 || loading || generatingProducts}
            >
              <ArrowLeft size={16} />
              Retour
            </Button>

            {step < lastStep ? (
              <Button
                variant="hero"
                onClick={() => setStep(step + 1)}
                disabled={!canNext()}
              >
                Suivant
                <ArrowRight size={16} />
              </Button>
            ) : (
              <Button variant="hero" onClick={handleCreate} disabled={loading || generatingProducts}>
                {loading || generatingProducts ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    {generatingProducts ? "Génération IA..." : "Création..."}
                  </>
                ) : (
                  <>
                    Lancer ma boutique
                    <CheckCircle2 size={16} />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
