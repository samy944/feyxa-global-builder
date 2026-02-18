import { motion } from "framer-motion";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Aminata Diallo",
    role: "Fondatrice, Afrik'Style",
    city: "Dakar",
    quote:
      "En 3 mois sur Feyxa, j'ai triplé mes ventes. Le paiement Mobile Money intégré a tout changé pour mes clients.",
    rating: 5,
  },
  {
    name: "Jean-Marc Kouassi",
    role: "CEO, TechShop CI",
    city: "Abidjan",
    quote:
      "L'IA génère mes fiches produit en 10 secondes. J'ai gagné des heures chaque semaine. C'est un game-changer.",
    rating: 5,
  },
  {
    name: "Fatou Ndiaye",
    role: "E-commerçante",
    city: "Paris",
    quote:
      "La logistique Chine→Afrique intégrée m'a permis de lancer mon business sans intermédiaire. Incroyable.",
    rating: 5,
  },
  {
    name: "Moussa Traoré",
    role: "Directeur, MaliShop",
    city: "Bamako",
    quote:
      "Le dashboard est magnifique et ultra clair. Je vois mes commandes, mes revenus et mes stocks en un coup d'œil.",
    rating: 5,
  },
];

const stats = [
  { value: "2,400+", label: "Boutiques actives" },
  { value: "18", label: "Pays couverts" },
  { value: "99.9%", label: "Uptime garanti" },
  { value: "€12M+", label: "Volume traité" },
];

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.45,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  }),
};

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="relative overflow-hidden" style={{ padding: "120px 0" }}>
      {/* Background glow */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 70% 40% at 50% 50%, hsla(106, 75%, 47%, 0.03), transparent 70%)",
        }}
      />

      <div className="container">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-16 max-w-2xl mx-auto"
        >
          <p
            className="text-sm font-medium mb-5 tracking-widest uppercase"
            style={{ color: "hsl(106, 75%, 47%)" }}
          >
            Témoignages
          </p>
          <h2 className="font-heading text-4xl sm:text-5xl lg:text-6xl leading-[1] mb-6 text-foreground">
            ILS NOUS
            <br />
            <span className="text-gradient">FONT CONFIANCE.</span>
          </h2>
          <p className="text-lg leading-relaxed" style={{ color: "hsl(0, 0%, 55%)" }}>
            Des entrepreneurs du monde entier développent leur business avec Feyxa.
          </p>
        </motion.div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16 max-w-4xl mx-auto"
        >
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p
                className="font-heading text-3xl sm:text-4xl mb-1"
                style={{ color: "hsl(106, 75%, 47%)" }}
              >
                {stat.value}
              </p>
              <p className="text-sm" style={{ color: "hsl(0, 0%, 45%)" }}>
                {stat.label}
              </p>
            </div>
          ))}
        </motion.div>

        {/* Testimonial cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              custom={i}
              variants={cardVariants}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-40px" }}
              className="group relative rounded-2xl p-6 sm:p-7 flex flex-col transition-all duration-300"
              style={{
                background: "hsl(0, 0%, 10%)",
                border: "1px solid hsla(0, 0%, 100%, 0.08)",
              }}
              whileHover={{ y: -4 }}
            >
              {/* Hover glow */}
              <div
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{
                  boxShadow:
                    "0 0 40px -10px hsla(106, 75%, 47%, 0.12), 0 20px 50px -15px hsla(0, 0%, 0%, 0.3)",
                }}
              />

              {/* Stars */}
              <div className="relative z-10 flex gap-0.5 mb-4">
                {Array.from({ length: t.rating }).map((_, si) => (
                  <Star
                    key={si}
                    size={14}
                    fill="hsl(106, 75%, 47%)"
                    style={{ color: "hsl(106, 75%, 47%)" }}
                  />
                ))}
              </div>

              {/* Quote */}
              <p
                className="relative z-10 text-sm leading-relaxed flex-1 mb-6"
                style={{ color: "hsl(0, 0%, 65%)" }}
              >
                "{t.quote}"
              </p>

              {/* Author */}
              <div className="relative z-10 flex items-center gap-3">
                <div
                  className="h-9 w-9 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
                  style={{
                    background: "hsla(106, 75%, 47%, 0.1)",
                    color: "hsl(106, 75%, 47%)",
                  }}
                >
                  {t.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{t.name}</p>
                  <p className="text-xs" style={{ color: "hsl(0, 0%, 42%)" }}>
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
