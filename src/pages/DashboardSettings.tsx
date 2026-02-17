import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import {
  Store, Globe, Palette, Truck, CreditCard, Bell, Shield, Users, Save
} from "lucide-react";

const sections = [
  { id: "general", label: "Général", icon: Store },
  { id: "team", label: "Équipe", icon: Users },
  { id: "delivery", label: "Livraison", icon: Truck },
  { id: "payments", label: "Paiements", icon: CreditCard },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "domain", label: "Domaine", icon: Globe },
  { id: "theme", label: "Apparence", icon: Palette },
  { id: "security", label: "Sécurité", icon: Shield },
];

export default function DashboardSettings() {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState("general");

  return (
    <div className="p-6 lg:p-8">
      <h1 className="text-2xl font-bold text-foreground tracking-tight mb-6">Paramètres</h1>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar nav */}
        <nav className="lg:w-48 flex lg:flex-col gap-1 overflow-x-auto pb-2 lg:pb-0">
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors whitespace-nowrap ${
                activeSection === s.id
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              <s.icon size={16} />
              {s.label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="flex-1 max-w-2xl">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-border bg-card p-6 space-y-6"
          >
            {activeSection === "general" && (
              <>
                <h2 className="text-lg font-semibold text-foreground">Informations générales</h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Nom de la boutique</label>
                    <input
                      defaultValue="Ma Boutique Demo"
                      className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Description</label>
                    <textarea
                      rows={3}
                      defaultValue="Boutique de mode et accessoires à Cotonou"
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Devise</label>
                      <select className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
                        <option>XOF (Franc CFA)</option>
                        <option>EUR (Euro)</option>
                        <option>USD (Dollar US)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Langue</label>
                      <select className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
                        <option>Français</option>
                        <option>English</option>
                      </select>
                    </div>
                  </div>
                  <Button variant="hero" size="sm">
                    <Save size={14} />
                    Enregistrer
                  </Button>
                </div>
              </>
            )}

            {activeSection === "payments" && (
              <>
                <h2 className="text-lg font-semibold text-foreground">Méthodes de paiement</h2>
                <div className="space-y-3">
                  {[
                    { name: "Paiement à la livraison (COD)", desc: "Le client paie en espèces à la réception", enabled: true },
                    { name: "Mobile Money (MTN/Orange/Wave)", desc: "Paiement via mobile money — sandbox", enabled: true },
                    { name: "WhatsApp Pay", desc: "Commande via WhatsApp avec confirmation vendeur", enabled: true },
                    { name: "Stripe", desc: "Paiement par carte bancaire internationale", enabled: false },
                    { name: "Paystack", desc: "Paiement en ligne pour l'Afrique", enabled: false },
                  ].map((p) => (
                    <div key={p.name} className="flex items-center justify-between p-4 rounded-lg border border-border">
                      <div>
                        <p className="text-sm font-medium text-foreground">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.desc}</p>
                      </div>
                      <div className={`px-2 py-1 rounded text-xs font-medium ${p.enabled ? "bg-accent/10 text-accent" : "bg-secondary text-muted-foreground"}`}>
                        {p.enabled ? "Actif" : "À configurer"}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {activeSection === "delivery" && (
              <>
                <h2 className="text-lg font-semibold text-foreground">Zones de livraison</h2>
                <div className="space-y-3">
                  {[
                    { zone: "Cotonou Centre", fee: "500 XOF", active: true },
                    { zone: "Abomey-Calavi", fee: "1,000 XOF", active: true },
                    { zone: "Porto-Novo", fee: "1,500 XOF", active: true },
                    { zone: "Parakou", fee: "3,000 XOF", active: false },
                  ].map((z) => (
                    <div key={z.zone} className="flex items-center justify-between p-4 rounded-lg border border-border">
                      <div>
                        <p className="text-sm font-medium text-foreground">{z.zone}</p>
                        <p className="text-xs text-muted-foreground">Frais: {z.fee}</p>
                      </div>
                      <span className={`text-xs font-medium ${z.active ? "text-accent" : "text-muted-foreground"}`}>
                        {z.active ? "Active" : "Inactive"}
                      </span>
                    </div>
                  ))}
                  <Button variant="outline" size="sm">+ Ajouter une zone</Button>
                </div>
              </>
            )}

            {activeSection === "domain" && (
              <>
                <h2 className="text-lg font-semibold text-foreground">Domaine</h2>
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-secondary/50">
                    <p className="text-sm text-foreground font-medium">Sous-domaine actuel</p>
                    <p className="text-sm text-primary font-mono mt-1">ma-boutique.feyxa.app</p>
                  </div>
                  <div className="p-4 rounded-lg border border-border">
                    <p className="text-sm font-medium text-foreground">Domaine personnalisé</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Disponible avec le plan Pro. Configurez votre propre domaine (ex: maboutique.com).
                    </p>
                    <Button variant="outline" size="sm" className="mt-3">Configurer</Button>
                  </div>
                </div>
              </>
            )}

            {activeSection === "team" && (
              <>
                <h2 className="text-lg font-semibold text-foreground">Équipe</h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
                        {user?.email?.[0]?.toUpperCase() || "U"}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{user?.email}</p>
                        <p className="text-xs text-muted-foreground">Propriétaire</p>
                      </div>
                    </div>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded font-medium">Owner</span>
                  </div>
                  <Button variant="outline" size="sm">+ Inviter un membre</Button>
                </div>
              </>
            )}

            {["notifications", "theme", "security"].includes(activeSection) && (
              <div className="text-center py-8">
                <p className="text-muted-foreground text-sm">Configuration {sections.find(s => s.id === activeSection)?.label} — bientôt disponible</p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
