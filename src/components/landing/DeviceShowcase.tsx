import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface PhoneScreen {
  label: string;
  src: string;
}

const screens: PhoneScreen[] = [
  { label: "Dashboard", src: "/mockups/phone-dashboard.webp" },
  { label: "Marketplace", src: "/mockups/phone-marketplace.webp" },
  { label: "Checkout", src: "/mockups/phone-checkout.webp" },
];

const INTERVAL = 4000;

export function DeviceShowcase() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mql.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    const onVisibility = () => setPaused(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  const advance = useCallback(() => {
    setActive((prev) => (prev + 1) % screens.length);
  }, []);

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

  return (
    <div
      className="relative flex flex-col items-center gap-6"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-label="Aperçu de l'application Feyxa"
      role="region"
    >
      {/* iPhone Frame */}
      <div className="relative">
        {/* Glow behind phone */}
        <div
          className="absolute -inset-8 -z-10 rounded-[3rem] blur-[80px]"
          style={{ background: "hsla(106, 75%, 47%, 0.1)" }}
        />

        <div
          className="relative w-[260px] sm:w-[280px] lg:w-[300px] aspect-[9/19.5] rounded-[2.5rem] overflow-hidden"
          style={{
            border: "5px solid hsl(0, 0%, 18%)",
            boxShadow:
              "0 0 0 1px hsl(0, 0%, 25%), 0 20px 60px -10px hsla(0, 0%, 0%, 0.5), 0 0 40px -10px hsla(106, 75%, 47%, 0.15)",
            background: "hsl(0, 0%, 8%)",
          }}
        >
          {/* Notch / Dynamic Island */}
          <div
            className="absolute top-2 left-1/2 -translate-x-1/2 w-[90px] h-[26px] rounded-full z-20"
            style={{ background: "hsl(0, 0%, 6%)" }}
          />

          {/* Screen content */}
          <div className="w-full h-full overflow-hidden">
            {reducedMotion ? (
              <img
                src={screens[0].src}
                alt={screens[0].label}
                className="w-full h-full object-cover object-center"
                loading="eager"
              />
            ) : (
              <AnimatePresence mode="wait">
                <motion.img
                  key={`screen-${active}`}
                  src={screens[active].src}
                  alt={screens[active].label}
                  className="w-full h-full object-cover object-center"
                  loading="eager"
                  initial={{ opacity: 0, y: 12, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.98 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                />
              </AnimatePresence>
            )}
          </div>

          {/* Bottom bar indicator */}
          <div
            className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[100px] h-[4px] rounded-full z-20"
            style={{ background: "hsl(0, 0%, 30%)" }}
          />
        </div>
      </div>

      {/* Label + Dots */}
      <div className="flex flex-col items-center gap-3">
        <AnimatePresence mode="wait">
          <motion.span
            key={screens[active].label}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="text-xs font-medium tracking-widest uppercase"
            style={{ color: "hsl(0, 0%, 55%)" }}
          >
            {screens[active].label}
          </motion.span>
        </AnimatePresence>

        <div className="flex gap-2">
          {screens.map((screen, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              aria-label={`Voir ${screen.label}`}
              className="h-1.5 rounded-full transition-all duration-500"
              style={{
                width: i === active ? "24px" : "8px",
                background:
                  i === active
                    ? "hsl(106, 75%, 47%)"
                    : "hsl(0, 0%, 30%)",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
