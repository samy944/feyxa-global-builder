import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Aminata Diallo",
    role: "Fondatrice, Afrik'Style",
    city: "Dakar",
    quote:
      "En 3 mois sur Feyxa, j'ai triplé mes ventes. Le paiement Mobile Money intégré a tout changé pour mes clients.",
    rating: 5,
    metric: "3×",
    metricLabel: "ventes",
  },
  {
    name: "Jean-Marc Kouassi",
    role: "CEO, TechShop CI",
    city: "Abidjan",
    quote:
      "L'IA génère mes fiches produit en 10 secondes. J'ai gagné des heures chaque semaine. C'est un game-changer.",
    rating: 5,
    metric: "10s",
    metricLabel: "par fiche",
  },
  {
    name: "Fatou Ndiaye",
    role: "E-commerçante",
    city: "Paris",
    quote:
      "La logistique Chine→Afrique intégrée m'a permis de lancer mon business sans intermédiaire. Incroyable.",
    rating: 5,
    metric: "0",
    metricLabel: "intermédiaire",
  },
  {
    name: "Moussa Traoré",
    role: "Directeur, MaliShop",
    city: "Bamako",
    quote:
      "Le dashboard est magnifique et ultra clair. Je vois mes commandes, mes revenus et mes stocks en un coup d'œil.",
    rating: 5,
    metric: "1",
    metricLabel: "dashboard",
  },
];

const stats = [
  { value: "2,400+", label: "Boutiques actives" },
  { value: "18", label: "Pays couverts" },
  { value: "99.9%", label: "Uptime garanti" },
  { value: "€12M+", label: "Volume traité" },
];

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="relative py-28 overflow-hidden">
      {/* Bg effects */}
      <div className="absolute inset-0 -z-10 grid-pattern opacity-[0.08]" />
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 30% 50%, hsla(var(--primary) / 0.05), transparent 70%)",
        }}
      />

      <div className="container relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-20 max-w-2xl mx-auto"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary mb-6">
            <Star size={12} className="fill-primary" />
            Témoignages
          </span>
          <h2 className="font-heading text-4xl sm:text-5xl lg:text-6xl leading-[1] mb-6 text-foreground">
            ILS NOUS
            <br />
            <span className="text-gradient">FONT CONFIANCE.</span>
          </h2>
          <p className="text-lg leading-relaxed text-muted-foreground">
            Des entrepreneurs du monde entier développent leur business avec Feyxa.
          </p>
        </motion.div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-16 max-w-4xl mx-auto"
        >
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              className="text-center rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-5"
            >
              <p className="font-heading text-3xl sm:text-4xl mb-1 text-primary">
                {stat.value}
              </p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Testimonial cards — bento-style 2-column layout */}
        <div className="grid md:grid-cols-2 gap-5 max-w-4xl mx-auto">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{
                delay: i * 0.1,
                duration: 0.5,
                ease: [0.22, 1, 0.36, 1],
              }}
              whileHover={{ y: -4 }}
              className="group relative rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm p-7 flex flex-col transition-all duration-300 hover:border-primary/20"
            >
              {/* Hover glow */}
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none shadow-glow" />

              {/* Top row: metric + stars */}
              <div className="relative z-10 flex items-start justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center">
                    <span className="font-heading text-lg text-primary leading-none">
                      {t.metric}
                    </span>
                  </div>
                  <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                    {t.metricLabel}
                  </span>
                </div>
                <div className="flex gap-0.5">
                  {Array.from({ length: t.rating }).map((_, si) => (
                    <Star
                      key={si}
                      size={13}
                      className="fill-primary text-primary"
                    />
                  ))}
                </div>
              </div>

              {/* Quote */}
              <div className="relative z-10 flex-1 mb-6">
                <Quote size={16} className="text-primary/30 mb-2" />
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {t.quote}
                </p>
              </div>

              {/* Author */}
              <div className="relative z-10 flex items-center gap-3 pt-5 border-t border-border/50">
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary shrink-0">
                  {t.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {t.role} · {t.city}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
