import { useState, useEffect } from "react";
import { useStore } from "@/hooks/useStore";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import { toast } from "@/hooks/use-toast";
import {
  Save, Plus, Trash2, Eye, Star, MessageSquare, HelpCircle, Shield,
  GripVertical, ExternalLink,
} from "lucide-react";

interface BenefitItem { title: string; desc: string }
interface FaqItem { q: string; a: string }
interface TestimonialItem { name: string; rating: number; text: string }

interface LandingConfig {
  benefits_title: string;
  benefits_subtitle: string;
  benefits: BenefitItem[];
  testimonials_title: string;
  testimonials: TestimonialItem[];
  guarantee_title: string;
  guarantee_text: string;
  faq_title: string;
  faq_subtitle: string;
  faqs: FaqItem[];
  social_proof_count: string;
}

const defaultConfig: LandingConfig = {
  benefits_title: "Pourquoi choisir ce produit ?",
  benefits_subtitle: "Des avantages qui font la différence au quotidien.",
  benefits: [
    { title: "Résultats rapides", desc: "Voyez la différence dès les premiers jours d'utilisation." },
    { title: "Qualité premium", desc: "Matériaux et fabrication aux standards internationaux." },
    { title: "Livraison rapide", desc: "Recevez votre commande en 48-72h partout au pays." },
    { title: "Paiement sécurisé", desc: "Vos données sont protégées à chaque étape." },
    { title: "Satisfait ou remboursé", desc: "Retour gratuit sous 14 jours, sans condition." },
    { title: "Support 24/7", desc: "Notre équipe répond à toutes vos questions rapidement." },
  ],
  testimonials_title: "Ils l'ont adopté",
  testimonials: [
    { name: "Aminata D.", rating: 5, text: "Excellente qualité ! Je recommande à 100%." },
    { name: "Moussa K.", rating: 5, text: "Livraison rapide et produit conforme. Très satisfait." },
    { name: "Fatou S.", rating: 4, text: "Bon rapport qualité-prix, je suis contente de mon achat." },
  ],
  guarantee_title: "Garantie satisfaction 100%",
  guarantee_text: "Si pour une raison quelconque vous n'êtes pas entièrement satisfait de votre achat, retournez-le dans les 14 jours et nous vous remboursons intégralement. Sans question, sans complication.",
  faq_title: "Questions fréquentes",
  faq_subtitle: "Tout ce que vous devez savoir avant d'acheter.",
  faqs: [
    { q: "Comment passer commande ?", a: "Cliquez sur le bouton \"Commander maintenant\", remplissez vos informations de livraison et confirmez." },
    { q: "Quels sont les délais de livraison ?", a: "La livraison prend généralement 48 à 72 heures selon votre localisation." },
    { q: "Puis-je retourner le produit ?", a: "Oui ! Vous avez 14 jours pour retourner le produit. Le retour est gratuit." },
    { q: "Quels moyens de paiement acceptez-vous ?", a: "Paiement à la livraison (COD), Mobile Money et virements bancaires." },
    { q: "Le produit est-il garanti ?", a: "Oui, tous nos produits sont couverts par une garantie satisfaction." },
  ],
  social_proof_count: "500+",
};

type SectionTab = "benefits" | "testimonials" | "guarantee" | "faq";

const tabs: { id: SectionTab; label: string; icon: React.ElementType }[] = [
  { id: "benefits", label: "Avantages", icon: Star },
  { id: "testimonials", label: "Témoignages", icon: MessageSquare },
  { id: "guarantee", label: "Garantie", icon: Shield },
  { id: "faq", label: "FAQ", icon: HelpCircle },
];

export default function DashboardLanding() {
  const { store, loading: storeLoading } = useStore();
  const [config, setConfig] = useState<LandingConfig>(defaultConfig);
  const [activeTab, setActiveTab] = useState<SectionTab>("benefits");
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!store) return;
    const settings = store.settings as Record<string, any> | null;
    if (settings?.landing_config) {
      setConfig({ ...defaultConfig, ...settings.landing_config });
    }
    setLoaded(true);
  }, [store]);

  const save = async () => {
    if (!store) return;
    setSaving(true);
    const currentSettings = (store.settings as Record<string, any>) || {};
    const { error } = await supabase
      .from("stores")
      .update({ settings: { ...currentSettings, landing_config: config } as any })
      .eq("id", store.id);

    setSaving(false);
    if (error) {
      toast({ title: "Erreur", description: "Impossible de sauvegarder.", variant: "destructive" });
    } else {
      toast({ title: "Sauvegardé", description: "Votre landing page a été mise à jour." });
    }
  };

  const updateField = <K extends keyof LandingConfig>(key: K, value: LandingConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  // Benefits helpers
  const updateBenefit = (i: number, field: keyof BenefitItem, value: string) => {
    const updated = [...config.benefits];
    updated[i] = { ...updated[i], [field]: value };
    updateField("benefits", updated);
  };
  const addBenefit = () => updateField("benefits", [...config.benefits, { title: "", desc: "" }]);
  const removeBenefit = (i: number) => updateField("benefits", config.benefits.filter((_, j) => j !== i));

  // Testimonial helpers
  const updateTestimonial = (i: number, field: keyof TestimonialItem, value: string | number) => {
    const updated = [...config.testimonials];
    updated[i] = { ...updated[i], [field]: value };
    updateField("testimonials", updated);
  };
  const addTestimonial = () => updateField("testimonials", [...config.testimonials, { name: "", rating: 5, text: "" }]);
  const removeTestimonial = (i: number) => updateField("testimonials", config.testimonials.filter((_, j) => j !== i));

  // FAQ helpers
  const updateFaq = (i: number, field: keyof FaqItem, value: string) => {
    const updated = [...config.faqs];
    updated[i] = { ...updated[i], [field]: value };
    updateField("faqs", updated);
  };
  const addFaq = () => updateField("faqs", [...config.faqs, { q: "", a: "" }]);
  const removeFaq = (i: number) => updateField("faqs", config.faqs.filter((_, j) => j !== i));

  if (storeLoading || !loaded) {
    return (
      <div className="p-6 lg:p-8">
        <div className="animate-pulse text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Landing Page</h1>
          <p className="text-sm text-muted-foreground mt-1">Personnalisez votre page de vente One Product</p>
        </div>
        <div className="flex items-center gap-2">
          {store?.slug && (
            <Button variant="outline" size="sm" asChild>
              <a href={`/store/${store.slug}/lp`} target="_blank" rel="noopener noreferrer">
                <Eye size={14} className="mr-1" /> Prévisualiser
                <ExternalLink size={12} className="ml-1" />
              </a>
            </Button>
          )}
          <Button variant="hero" size="sm" onClick={save} disabled={saving}>
            <Save size={14} className="mr-1" />
            {saving ? "Sauvegarde..." : "Enregistrer"}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <nav className="flex gap-1 mb-6 overflow-x-auto pb-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors whitespace-nowrap ${
              activeTab === t.id
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            }`}
          >
            <t.icon size={16} />
            {t.label}
          </button>
        ))}
      </nav>

      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-border bg-card p-6 space-y-6 max-w-3xl"
      >
        {/* ── BENEFITS ── */}
        {activeTab === "benefits" && (
          <>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Titre de la section</label>
                <Input value={config.benefits_title} onChange={(e) => updateField("benefits_title", e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Sous-titre</label>
                <Input value={config.benefits_subtitle} onChange={(e) => updateField("benefits_subtitle", e.target.value)} />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">Avantages ({config.benefits.length})</h3>
                <Button variant="outline" size="sm" onClick={addBenefit} disabled={config.benefits.length >= 8}>
                  <Plus size={14} className="mr-1" /> Ajouter
                </Button>
              </div>
              {config.benefits.map((b, i) => (
                <div key={i} className="flex gap-3 items-start p-4 rounded-lg border border-border bg-background">
                  <GripVertical size={16} className="text-muted-foreground mt-2.5 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Input placeholder="Titre" value={b.title} onChange={(e) => updateBenefit(i, "title", e.target.value)} />
                    <Input placeholder="Description" value={b.desc} onChange={(e) => updateBenefit(i, "desc", e.target.value)} />
                  </div>
                  <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-destructive" onClick={() => removeBenefit(i)}>
                    <Trash2 size={14} />
                  </Button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── TESTIMONIALS ── */}
        {activeTab === "testimonials" && (
          <>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Titre de la section</label>
                <Input value={config.testimonials_title} onChange={(e) => updateField("testimonials_title", e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Nombre de clients (affiché)</label>
                <Input value={config.social_proof_count} onChange={(e) => updateField("social_proof_count", e.target.value)} placeholder="ex: 500+" />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">Témoignages ({config.testimonials.length})</h3>
                <Button variant="outline" size="sm" onClick={addTestimonial} disabled={config.testimonials.length >= 6}>
                  <Plus size={14} className="mr-1" /> Ajouter
                </Button>
              </div>
              {config.testimonials.map((t, i) => (
                <div key={i} className="flex gap-3 items-start p-4 rounded-lg border border-border bg-background">
                  <GripVertical size={16} className="text-muted-foreground mt-2.5 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="flex gap-2">
                      <Input placeholder="Nom" value={t.name} onChange={(e) => updateTestimonial(i, "name", e.target.value)} className="flex-1" />
                      <select
                        value={t.rating}
                        onChange={(e) => updateTestimonial(i, "rating", Number(e.target.value))}
                        className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
                      >
                        {[5, 4, 3, 2, 1].map((r) => (
                          <option key={r} value={r}>{r} ★</option>
                        ))}
                      </select>
                    </div>
                    <Textarea placeholder="Avis du client..." value={t.text} onChange={(e) => updateTestimonial(i, "text", e.target.value)} rows={2} />
                  </div>
                  <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-destructive" onClick={() => removeTestimonial(i)}>
                    <Trash2 size={14} />
                  </Button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── GUARANTEE ── */}
        {activeTab === "guarantee" && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Titre</label>
              <Input value={config.guarantee_title} onChange={(e) => updateField("guarantee_title", e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Texte de garantie</label>
              <Textarea value={config.guarantee_text} onChange={(e) => updateField("guarantee_text", e.target.value)} rows={4} />
            </div>
          </div>
        )}

        {/* ── FAQ ── */}
        {activeTab === "faq" && (
          <>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Titre</label>
                <Input value={config.faq_title} onChange={(e) => updateField("faq_title", e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Sous-titre</label>
                <Input value={config.faq_subtitle} onChange={(e) => updateField("faq_subtitle", e.target.value)} />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">Questions ({config.faqs.length})</h3>
                <Button variant="outline" size="sm" onClick={addFaq} disabled={config.faqs.length >= 10}>
                  <Plus size={14} className="mr-1" /> Ajouter
                </Button>
              </div>
              {config.faqs.map((f, i) => (
                <div key={i} className="flex gap-3 items-start p-4 rounded-lg border border-border bg-background">
                  <GripVertical size={16} className="text-muted-foreground mt-2.5 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Input placeholder="Question" value={f.q} onChange={(e) => updateFaq(i, "q", e.target.value)} />
                    <Textarea placeholder="Réponse" value={f.a} onChange={(e) => updateFaq(i, "a", e.target.value)} rows={2} />
                  </div>
                  <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-destructive" onClick={() => removeFaq(i)}>
                    <Trash2 size={14} />
                  </Button>
                </div>
              ))}
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
