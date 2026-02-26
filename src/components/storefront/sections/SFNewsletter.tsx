import { useState } from "react";
import { Mail, ArrowRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import type { SFSectionProps } from "../types";

export function SFNewsletter({ templateId, theme }: SFSectionProps) {
  const [email, setEmail] = useState("");

  const handleSubmit = () => {
    if (!email) return;
    toast.success("Merci ! Vous êtes inscrit(e) à la newsletter.");
    setEmail("");
  };

  if (templateId === "minimal") {
    return (
      <section className="container py-16 sm:py-20" id="contact">
        <div className="text-center max-w-md mx-auto">
          <h3 className="text-xl font-light" style={{ color: `hsl(${theme.colors.foreground})`, fontFamily: `"${theme.fonts.heading}", sans-serif` }}>Restez connecté</h3>
          <p className="text-sm mt-3 leading-relaxed" style={{ color: `hsl(${theme.colors.mutedForeground})` }}>Recevez nos nouvelles collections et offres exclusives</p>
          <div className="flex gap-2 mt-8">
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="votre@email.com" className="flex-1 h-11 border-b bg-transparent px-0 text-sm focus:outline-none transition-all" style={{ borderColor: `hsl(${theme.colors.border})`, color: `hsl(${theme.colors.foreground})` }} />
            <button onClick={handleSubmit} className="text-sm font-medium flex items-center gap-1 hover:opacity-70 transition-opacity" style={{ color: `hsl(${theme.colors.foreground})` }}>
              S'inscrire <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (templateId === "fashion") {
    return (
      <section className="py-20" id="contact" style={{ backgroundColor: `hsl(${theme.colors.foreground})` }}>
        <div className="container text-center max-w-lg mx-auto">
          <h3 className="text-xl font-bold uppercase tracking-[0.15em]" style={{ color: `hsl(${theme.colors.background})`, fontFamily: `"${theme.fonts.heading}", serif` }}>Rejoignez le cercle</h3>
          <p className="text-xs mt-3 leading-relaxed" style={{ color: `hsl(${theme.colors.background} / 0.5)` }}>Accès anticipé aux nouvelles collections, offres privées</p>
          <div className="flex gap-2 mt-8">
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="votre@email.com" className="flex-1 h-11 border px-4 text-sm bg-transparent focus:outline-none" style={{ borderColor: `hsl(${theme.colors.background} / 0.2)`, color: `hsl(${theme.colors.background})` }} />
            <button onClick={handleSubmit} className="px-8 h-11 text-sm font-semibold uppercase tracking-wider transition-all hover:brightness-110" style={{ backgroundColor: `hsl(${theme.colors.primary})`, color: `hsl(${theme.colors.primaryForeground})` }}>OK</button>
          </div>
        </div>
      </section>
    );
  }

  // tech, marketplace, default
  return (
    <section className="container py-12 sm:py-16" id="contact">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl p-8 sm:p-14 text-center relative overflow-hidden" style={{ backgroundColor: `hsl(${theme.colors.primary} / 0.06)`, border: `1px solid hsl(${theme.colors.primary} / 0.12)` }}>
        <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl" style={{ background: `hsl(${theme.colors.primary} / 0.1)` }} />
        <div className="relative z-10">
          <div className="h-12 w-12 rounded-xl mx-auto mb-5 flex items-center justify-center" style={{ backgroundColor: `hsl(${theme.colors.primary} / 0.12)` }}>
            <Mail size={22} style={{ color: `hsl(${theme.colors.primary})` }} />
          </div>
          <h3 className="text-xl sm:text-2xl font-bold" style={{ fontFamily: `"${theme.fonts.heading}", sans-serif` }}>Ne manquez rien</h3>
          <p className="text-sm mt-3 max-w-md mx-auto leading-relaxed" style={{ color: `hsl(${theme.colors.mutedForeground})` }}>Inscrivez-vous pour recevoir nos offres exclusives et nouveautés en avant-première.</p>
          <div className="flex gap-2 max-w-sm mx-auto mt-7">
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="votre@email.com" className="flex-1 h-11 rounded-xl border px-4 text-sm focus:outline-none focus:ring-2 transition-all" style={{ backgroundColor: `hsl(${theme.colors.card})`, borderColor: `hsl(${theme.colors.border})`, color: `hsl(${theme.colors.foreground})` }} />
            <button onClick={handleSubmit} className="rounded-xl px-6 h-11 text-sm font-semibold transition-all hover:brightness-110 hover:shadow-lg" style={{ backgroundColor: `hsl(${theme.colors.primary})`, color: `hsl(${theme.colors.primaryForeground})`, boxShadow: `0 4px 12px hsl(${theme.colors.primary} / 0.2)` }}>S'inscrire</button>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
