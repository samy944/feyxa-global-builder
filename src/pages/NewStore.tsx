import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useStore } from "@/hooks/useStore";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Store, MapPin, Zap, Globe, ArrowRight, ArrowLeft,
  TrendingUp, Target, Package, Loader2, Sparkles,
} from "lucide-react";
import { toast } from "sonner";

const steps = [
  { icon: Store, label: "Nom", desc: "Nom de votre boutique" },
  { icon: MapPin, label: "Localisation", desc: "Pays et devise" },
  { icon: Zap, label: "Modèle", desc: "Type de boutique" },
  { icon: Globe, label: "Domaine", desc: "Sous-domaine" },
];

const countries = [
  { name: "Bénin", currency: "XOF" },
  { name: "Togo", currency: "XOF" },
  { name: "Côte d'Ivoire", currency: "XOF" },
  { name: "Sénégal", currency: "XOF" },
  { name: "Burkina Faso", currency: "XOF" },
  { name: "Mali", currency: "XOF" },
  { name: "Niger", currency: "XOF" },
  { name: "Cameroun", currency: "XAF" },
  { name: "Ghana", currency: "GHS" },
  { name: "Nigeria", currency: "NGN" },
  { name: "France", currency: "EUR" },
  { name: "États-Unis", currency: "USD" },
];

const templates = [
  { id: "us_trending", icon: TrendingUp, title: "🇺🇸 Tendance", desc: "10 produits tendance générés par l'IA", badge: "Populaire" },
  { id: "niche", icon: Target, title: "🎯 Niche", desc: "8 produits spécialisés dans votre niche", badge: "Personnalisable" },
  { id: "one_product", icon: Zap, title: "⚡ One Product", desc: "1 produit star + page de vente", badge: "Conversion" },
  { id: "skip", icon: Package, title: "📦 Vide", desc: "Ajoutez vos produits manuellement", badge: null },
];

export default function NewStore() {
  const { user } = useAuth();
  const { refetch } = useStore();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const [data, setData] = useState({
    name: "",
    country: "Bénin",
    currency: "XOF",
    template: "",
    nicheDesc: "",
  });

  const update = (k: string, v: any) => setData((d) => ({ ...d, [k]: v }));

  const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const canNext = () => {
    if (step === 0) return data.name.length >= 2;
    if (step === 1) return true;
    if (step === 2) {
      if (!data.template) return false;
      if (data.template === "niche" && data.nicheDesc.length < 3) return false;
      return true;
    }
    return slug.length >= 2;
  };

  const handleCreate = async () => {
    if (!user) return;
    setLoading(true);

    const { data: storeData, error } = await supabase.from("stores").insert({
      owner_id: user.id,
      name: data.name,
      slug,
      currency: data.currency,
      city: data.country,
      settings: {
        country: data.country,
        smart_start_template: data.template !== "skip" ? data.template : null,
      },
    }).select("id").single();

    if (error) {
      toast.error("Erreur: " + error.message);
      setLoading(false);
      return;
    }

    // Smart start
    if (data.template && data.template !== "skip" && storeData?.id) {
      try {
        await supabase.functions.invoke("smart-start", {
          body: {
            store_id: storeData.id,
            template: data.template,
            country: data.country,
            currency: data.currency,
            niche_description: data.nicheDesc || undefined,
          },
        });
        toast.success("Produits générés par l'IA !");
      } catch {
        toast.error("Boutique créée, produits non générés.");
      }
    }

    refetch();
    toast.success("Boutique créée !");
    setLoading(false);
    navigate("/dashboard");
  };

  return (
    <div className="p-6 md:p-10 max-w-lg mx-auto">
      {/* Progress */}
      <div className="flex gap-1 mb-8">
        {steps.map((_, i) => (
          <div
            key={i}
            className="h-1 flex-1 rounded-full transition-colors duration-300"
            style={{
              background: i <= step ? "hsl(var(--primary))" : "hsl(var(--border))",
            }}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            {(() => {
              const Icon = steps[step].icon;
              return (
                <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: "hsl(var(--primary) / 0.1)", color: "hsl(var(--primary))" }}>
                  <Icon size={20} />
                </div>
              );
            })()}
            <div>
              <h2 className="text-lg font-bold text-foreground">{steps[step].label}</h2>
              <p className="text-sm text-muted-foreground">{steps[step].desc}</p>
            </div>
          </div>

          {/* Step 0: Name */}
          {step === 0 && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Nom de la boutique</label>
                <input
                  value={data.name}
                  onChange={(e) => update("name", e.target.value)}
                  className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Ex: Urban Style Paris"
                />
              </div>
            </div>
          )}

          {/* Step 1: Country */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Pays</label>
                <select
                  value={data.country}
                  onChange={(e) => {
                    const c = countries.find((c) => c.name === e.target.value);
                    update("country", e.target.value);
                    if (c) update("currency", c.currency);
                  }}
                  className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {countries.map((c) => (
                    <option key={c.name} value={c.name}>{c.name} ({c.currency})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Devise</label>
                <input
                  value={data.currency}
                  onChange={(e) => update("currency", e.target.value)}
                  className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          )}

          {/* Step 2: Template */}
          {step === 2 && (
            <div className="space-y-3">
              {templates.map((t) => {
                const Icon = t.icon;
                const sel = data.template === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => update("template", t.id)}
                    className="w-full rounded-xl border p-4 text-left transition-all duration-200"
                    style={{
                      borderColor: sel ? "hsl(var(--primary))" : "hsl(var(--border))",
                      background: sel ? "hsl(var(--primary) / 0.05)" : "transparent",
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0"
                        style={{
                          background: sel ? "hsl(var(--primary) / 0.15)" : "hsl(var(--secondary))",
                          color: sel ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
                        }}
                      >
                        <Icon size={18} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-foreground">{t.title}</p>
                          {t.badge && (
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: "hsl(var(--primary) / 0.1)", color: "hsl(var(--primary))" }}>
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

              {data.template === "niche" && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">
                    <Sparkles size={14} className="inline mr-1 text-primary" />
                    Décrivez votre niche
                  </label>
                  <input
                    value={data.nicheDesc}
                    onChange={(e) => update("nicheDesc", e.target.value)}
                    className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Ex: accessoires de sport pour femmes..."
                  />
                </motion.div>
              )}
            </div>
          )}

          {/* Step 3: Domain */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Sous-domaine</label>
                <div className="flex items-center gap-0">
                  <input
                    value={slug}
                    readOnly
                    className="flex-1 h-10 rounded-l-lg border border-border bg-secondary px-3 text-sm text-foreground"
                  />
                  <div className="h-10 px-3 rounded-r-lg border border-l-0 border-border flex items-center text-sm text-muted-foreground" style={{ background: "hsl(var(--secondary))" }}>
                    .feyxa.app
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex gap-3 mt-8">
        {step > 0 && (
          <button
            onClick={() => setStep((s) => s - 1)}
            className="h-10 px-5 rounded-lg text-sm font-medium transition-colors duration-200"
            style={{ background: "hsl(var(--secondary))", color: "hsl(var(--foreground))" }}
          >
            <ArrowLeft size={14} className="inline mr-1" />
            Retour
          </button>
        )}
        <button
          onClick={() => {
            if (step < steps.length - 1) setStep((s) => s + 1);
            else handleCreate();
          }}
          disabled={!canNext() || loading}
          className="flex-1 h-10 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-40"
          style={{
            background: "hsl(var(--primary))",
            color: "hsl(var(--primary-foreground))",
          }}
        >
          {loading ? (
            <Loader2 size={16} className="inline animate-spin" />
          ) : step < steps.length - 1 ? (
            <>Suivant <ArrowRight size={14} className="inline ml-1" /></>
          ) : (
            "Créer la boutique"
          )}
        </button>
      </div>
    </div>
  );
}
