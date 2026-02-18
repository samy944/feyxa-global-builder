import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const slides = [
  {
    id: 0,
    label: "Dashboard Vendeur",
    image: "/mockups/screen-dashboard.webp",
  },
  {
    id: 1,
    label: "Marketplace Publique",
    image: "/mockups/screen-marketplace.webp",
  },
  {
    id: 2,
    label: "Checkout Rapide",
    image: "/mockups/screen-checkout.webp",
  },
];

const INTERVAL = 3500;

export function PhoneShowcase() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Detect prefers-reduced-motion
  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mql.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  // Pause when tab is hidden
  useEffect(() => {
    const onVisibility = () => setPaused(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  const advance = useCallback(() => {
    setActive((prev) => (prev + 1) % slides.length);
  }, []);

  // Auto-rotate
  useEffect(() => {
    if (reducedMotion || paused) {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      return;
    }
    timerRef.current = setInterval(advance, INTERVAL);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [reducedMotion, paused, advance]);

  const currentSlide = slides[active];

  // Static fallback for reduced motion
  if (reducedMotion) {
    return (
      <div className="flex flex-col items-center gap-4">
        <p className="text-xs font-medium tracking-widest uppercase text-muted-foreground">
          Aperçu du produit — {slides[0].label}
        </p>
        <PhoneFrame>
          <img
            src={slides[0].image}
            alt={slides[0].label}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </PhoneFrame>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col items-center gap-5"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-label="Aperçu des écrans du produit FEYXA"
      role="region"
    >
      {/* Label */}
      <div className="text-center space-y-1">
        <p className="text-xs font-medium tracking-widest uppercase text-muted-foreground/70">
          Aperçu du produit
        </p>
        <AnimatePresence mode="wait">
          <motion.p
            key={currentSlide.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3 }}
            className="text-sm font-semibold text-foreground"
          >
            {currentSlide.label}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Phone */}
      <div className="relative">
        {/* Glow behind phone */}
        <div className="absolute inset-0 -z-10 scale-90 rounded-[3rem] blur-[60px] bg-primary/10" />

        <PhoneFrame>
          <AnimatePresence mode="wait">
            <motion.img
              key={currentSlide.id}
              src={currentSlide.image}
              alt={currentSlide.label}
              className="w-full h-full object-cover"
              loading="lazy"
              initial={{ opacity: 0, x: 30, scale: 0.98 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -20, scale: 0.98 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            />
          </AnimatePresence>
        </PhoneFrame>

        {/* Subtle reflection */}
        <div className="absolute inset-x-4 bottom-0 h-20 bg-gradient-to-t from-background/60 to-transparent rounded-b-[2rem] pointer-events-none" />
      </div>

      {/* Dot indicators */}
      <div className="flex gap-2">
        {slides.map((slide) => (
          <button
            key={slide.id}
            onClick={() => setActive(slide.id)}
            aria-label={`Voir ${slide.label}`}
            className={`h-2 rounded-full transition-all duration-500 ${
              slide.id === active
                ? "w-6 bg-primary"
                : "w-2 bg-muted-foreground/25 hover:bg-muted-foreground/40"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative w-[260px] h-[530px] sm:w-[280px] sm:h-[572px] rounded-[2.5rem] overflow-hidden shadow-elevated"
      style={{
        border: "6px solid hsl(var(--foreground) / 0.12)",
        background: "hsl(var(--foreground) / 0.05)",
      }}
    >
      {/* Notch */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[100px] h-[26px] bg-foreground/10 rounded-b-2xl z-10" />
      {/* Screen */}
      <div className="w-full h-full rounded-[2rem] overflow-hidden">
        {children}
      </div>
    </div>
  );
}
