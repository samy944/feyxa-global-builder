import { useState } from "react";
import { Mail } from "lucide-react";
import type { SFSectionProps } from "../types";

export function SFNewsletter({ templateId, theme }: SFSectionProps) {
  const [email, setEmail] = useState("");

  if (templateId === "minimal") {
    return (
      <section className="container py-14" id="contact">
        <div className="text-center max-w-md mx-auto">
          <h3 className="text-lg font-light" style={{ color: `hsl(${theme.colors.foreground})`, fontFamily: `"${theme.fonts.heading}", sans-serif` }}>Newsletter</h3>
          <p className="text-xs mt-2" style={{ color: `hsl(${theme.colors.mutedForeground})` }}>Recevez nos nouveautés</p>
          <div className="flex gap-2 mt-5">
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="votre@email.com" className="flex-1 h-10 border-b bg-transparent px-0 text-sm focus:outline-none" style={{ borderColor: `hsl(${theme.colors.border})`, color: `hsl(${theme.colors.foreground})` }} />
            <button className="text-sm font-medium" style={{ color: `hsl(${theme.colors.foreground})` }}>S'inscrire</button>
          </div>
        </div>
      </section>
    );
  }

  if (templateId === "fashion") {
    return (
      <section className="py-16" id="contact" style={{ backgroundColor: `hsl(${theme.colors.foreground})` }}>
        <div className="container text-center max-w-lg mx-auto">
          <h3 className="text-lg font-bold uppercase tracking-wider" style={{ color: `hsl(${theme.colors.background})`, fontFamily: `"${theme.fonts.heading}", serif` }}>Rejoignez-nous</h3>
          <p className="text-xs mt-2" style={{ color: `hsl(${theme.colors.background} / 0.6)` }}>Offres exclusives, nouvelles collections</p>
          <div className="flex gap-2 mt-6">
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="votre@email.com" className="flex-1 h-10 rounded-none border px-4 text-sm bg-transparent focus:outline-none" style={{ borderColor: `hsl(${theme.colors.background} / 0.3)`, color: `hsl(${theme.colors.background})` }} />
            <button className="px-6 h-10 text-sm font-semibold" style={{ backgroundColor: `hsl(${theme.colors.primary})`, color: `hsl(${theme.colors.primaryForeground})` }}>OK</button>
          </div>
        </div>
      </section>
    );
  }

  // tech, marketplace, default
  return (
    <section className="container py-10 sm:py-14" id="contact">
      <div className="rounded-lg p-8 sm:p-12 text-center" style={{ backgroundColor: `hsl(${theme.colors.primary} / 0.06)`, border: `1px solid hsl(${theme.colors.primary} / 0.15)` }}>
        <Mail size={28} className="mx-auto mb-4" style={{ color: `hsl(${theme.colors.primary})` }} />
        <h3 className="text-lg sm:text-xl font-bold" style={{ fontFamily: `"${theme.fonts.heading}", sans-serif` }}>Restez informé</h3>
        <p className="text-sm mt-2 max-w-md mx-auto" style={{ color: `hsl(${theme.colors.mutedForeground})` }}>Recevez nos offres exclusives et nouveautés.</p>
        <div className="flex gap-2 max-w-sm mx-auto mt-5">
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="votre@email.com" className="flex-1 h-10 rounded-lg border px-4 text-sm focus:outline-none focus:ring-2" style={{ backgroundColor: `hsl(${theme.colors.card})`, borderColor: `hsl(${theme.colors.border})`, color: `hsl(${theme.colors.foreground})` }} />
          <button className="rounded-lg px-5 h-10 text-sm font-semibold transition-opacity hover:opacity-90" style={{ backgroundColor: `hsl(${theme.colors.primary})`, color: `hsl(${theme.colors.primaryForeground})` }}>S'inscrire</button>
        </div>
      </div>
    </section>
  );
}
