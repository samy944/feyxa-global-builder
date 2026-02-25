import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap } from "lucide-react";
import { motion } from "framer-motion";

export function CtaSection() {
  return (
    <section className="relative py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" />
      <div className="absolute inset-0 grid-pattern opacity-20" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px]" />

      <div className="container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="max-w-3xl mx-auto text-center space-y-8"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary">
            <Zap size={14} className="fill-primary" />
            Prêt à décoller ?
          </div>

          <h2 className="font-heading text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.1]">
            <span className="text-foreground">Lancez votre boutique</span>
            <br />
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              en quelques minutes.
            </span>
          </h2>

          <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Rejoignez des milliers d'entrepreneurs qui font confiance à Feyxa pour vendre en ligne. Aucune carte bancaire requise.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button variant="hero" size="lg" className="text-base px-8 h-13" asChild>
              <Link to="/start">
                Créer ma boutique gratuitement
                <ArrowRight size={18} />
              </Link>
            </Button>
            <Button variant="hero-outline" size="lg" className="text-base px-8 h-13" asChild>
              <Link to="/#pricing">Voir les tarifs</Link>
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            ✓ Essai gratuit &nbsp; ✓ Sans engagement &nbsp; ✓ Support 24/7
          </p>
        </motion.div>
      </div>
    </section>
  );
}
