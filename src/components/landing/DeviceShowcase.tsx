import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";

interface DeviceSlide {
  label: string;
  laptop: string;
  tablet: string;
  phone: string;
}

const slides: DeviceSlide[] = [
  {
    label: "Dashboard Vendeur",
    laptop: "/mockups/laptop-dashboard.webp",
    tablet: "/mockups/tablet-dashboard.webp",
    phone: "/mockups/screen-dashboard.webp",
  },
  {
    label: "Marketplace Publique",
    laptop: "/mockups/laptop-marketplace.webp",
    tablet: "/mockups/tablet-marketplace.webp",
    phone: "/mockups/screen-marketplace.webp",
  },
  {
    label: "Checkout Rapide",
    laptop: "/mockups/laptop-checkout.webp",
    tablet: "/mockups/tablet-checkout.webp",
    phone: "/mockups/screen-checkout.webp",
  },
];

const LAPTOP_INTERVAL = 3500;
const TABLET_INTERVAL = 4200;
const PHONE_INTERVAL = 5000;

function useDeviceSlide(interval: number, paused: boolean, reducedMotion: boolean) {
  const [active, setActive] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const advance = useCallback(() => {
    setActive((prev) => (prev + 1) % slides.length);
  }, []);

  useEffect(() => {
    if (reducedMotion || paused) {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      return;
    }
    timerRef.current = setInterval(advance, interval);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [reducedMotion, paused, advance, interval]);

  return { active, setActive };
}

export function DeviceShowcase() {
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

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

  const laptop = useDeviceSlide(LAPTOP_INTERVAL, paused, reducedMotion);
  const tablet = useDeviceSlide(TABLET_INTERVAL, paused, reducedMotion);
  const phone = useDeviceSlide(PHONE_INTERVAL, paused, reducedMotion);

  if (reducedMotion) {
    return (
      <div className="flex items-end justify-center gap-4">
        <LaptopFrame>
          <img src={slides[0].laptop} alt="Dashboard" className="w-full h-full object-cover" loading="lazy" />
        </LaptopFrame>
      </div>
    );
  }

  return (
    <div
      className="relative w-full"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-label="Aperçu multi-écrans du produit FEYXA"
      role="region"
    >
      {/* Label */}
      <div className="text-center mb-6">
        <p className="text-xs font-medium tracking-widest uppercase text-muted-foreground/70">
          Aperçu du produit
        </p>
      </div>

      {/* Devices cascade — perspective container */}
      <ParallaxDevices
        slides={slides}
        laptop={laptop}
        tablet={tablet}
        phone={phone}
        reducedMotion={reducedMotion}
      />

      {/* Dots — laptop controls */}
      <div className="flex justify-center gap-2 mt-6">
        {slides.map((slide, i) => (
          <button
            key={i}
            onClick={() => {
              laptop.setActive(i);
              tablet.setActive(i);
              phone.setActive(i);
            }}
            aria-label={`Voir ${slide.label}`}
            className={`h-2 rounded-full transition-all duration-500 ${
              i === laptop.active
                ? "w-6 bg-primary"
                : "w-2 bg-muted-foreground/25 hover:bg-muted-foreground/40"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
/* ── Parallax wrapper ── */

interface ParallaxDevicesProps {
  slides: DeviceSlide[];
  laptop: { active: number };
  tablet: { active: number };
  phone: { active: number };
  reducedMotion: boolean;
}

function ParallaxDevices({ slides, laptop, tablet, phone, reducedMotion }: ParallaxDevicesProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  // Each device moves at a different rate — creates depth on scroll
  // Laptop (front): moves least. Tablet (back-left): moves most. Phone (mid-right): medium.
  const laptopY = useTransform(scrollYProgress, [0, 1], reducedMotion ? [0, 0] : [40, -20]);
  const tabletY = useTransform(scrollYProgress, [0, 1], reducedMotion ? [0, 0] : [80, -50]);
  const phoneY = useTransform(scrollYProgress, [0, 1], reducedMotion ? [0, 0] : [60, -35]);

  return (
    <div
      ref={containerRef}
      className="relative flex items-end justify-center min-h-[360px] sm:min-h-[480px] lg:min-h-[520px]"
      style={{ perspective: "1200px" }}
    >
      {/* Glow behind laptop */}
      <div className="absolute inset-0 -z-10 flex items-center justify-center">
        <div className="w-[70%] h-[50%] rounded-[3rem] blur-[100px] bg-primary/10" />
      </div>

      {/* Tablet — back left, tilted */}
      <motion.div
        className="absolute z-10 hidden sm:block"
        style={{
          left: "-5%",
          bottom: "18%",
          y: tabletY,
          rotateY: 12,
          scale: 0.88,
          transformStyle: "preserve-3d",
        }}
        initial={{ opacity: 0, x: -60 }}
        animate={{ opacity: 0.85, x: 0 }}
        transition={{ delay: 0.7, duration: 1, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="relative">
          <DeviceLabel label={slides[tablet.active].label} device="Tablette" />
          <TabletFrame>
            <AnimatePresence mode="wait">
              <motion.img
                key={`tablet-${tablet.active}`}
                src={slides[tablet.active].tablet}
                alt={slides[tablet.active].label}
                className="w-full h-full object-cover"
                loading="lazy"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              />
            </AnimatePresence>
          </TabletFrame>
        </div>
      </motion.div>

      {/* Laptop — center front, dominant */}
      <motion.div
        className="relative z-20"
        style={{ y: laptopY }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      >
        <DeviceLabel label={slides[laptop.active].label} device="Desktop" />
        <LaptopFrame>
          <AnimatePresence mode="wait">
            <motion.img
              key={`laptop-${laptop.active}`}
              src={slides[laptop.active].laptop}
              alt={slides[laptop.active].label}
              className="w-full h-full object-cover"
              loading="lazy"
              initial={{ opacity: 0, x: 20, scale: 0.98 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -15, scale: 0.98 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            />
          </AnimatePresence>
        </LaptopFrame>
      </motion.div>

      {/* Phone — front right, floating */}
      <motion.div
        className="absolute z-30"
        style={{
          right: "0%",
          bottom: "25%",
          y: phoneY,
          rotateY: -8,
          transformStyle: "preserve-3d",
        }}
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.9, duration: 1, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="relative">
          <DeviceLabel label={slides[phone.active].label} device="Mobile" />
          <PhoneFrame>
            <AnimatePresence mode="wait">
              <motion.img
                key={`phone-${phone.active}`}
                src={slides[phone.active].phone}
                alt={slides[phone.active].label}
                className="w-full h-full object-cover"
                loading="lazy"
                initial={{ opacity: 0, y: 15, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.98 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              />
            </AnimatePresence>
          </PhoneFrame>
        </div>
      </motion.div>
    </div>
  );
}

function DeviceLabel({ label, device }: { label: string; device: string }) {
  return (
    <div className="text-center mb-2">
      <AnimatePresence mode="wait">
        <motion.span
          key={label}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.25 }}
          className="text-[10px] font-semibold tracking-wider uppercase text-muted-foreground/60"
        >
          {device} — {label}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

/* ── Device Frames ── */

function LaptopFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      {/* Screen */}
      <div
        className="w-[320px] sm:w-[400px] lg:w-[480px] aspect-[16/10] rounded-t-xl overflow-hidden shadow-elevated"
        style={{
          border: "4px solid hsl(var(--foreground) / 0.15)",
          borderBottom: "none",
          background: "hsl(var(--foreground) / 0.05)",
        }}
      >
        {children}
      </div>
      {/* Base / keyboard hint */}
      <div
        className="w-[110%] h-3 sm:h-4 -ml-[5%] rounded-b-xl"
        style={{
          background: "linear-gradient(to bottom, hsl(var(--foreground) / 0.12), hsl(var(--foreground) / 0.08))",
        }}
      />
      <div
        className="w-[30%] h-1 mx-auto rounded-b-lg"
        style={{ background: "hsl(var(--foreground) / 0.08)" }}
      />
    </div>
  );
}

function TabletFrame({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="w-[160px] sm:w-[210px] lg:w-[240px] aspect-[3/4] rounded-2xl overflow-hidden"
      style={{
        border: "5px solid hsl(var(--foreground) / 0.12)",
        background: "hsl(var(--foreground) / 0.05)",
      }}
    >
      {children}
    </div>
  );
}

function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      <div
        className="w-[110px] sm:w-[130px] lg:w-[150px] aspect-[9/19] rounded-[1.5rem] overflow-hidden shadow-elevated"
        style={{
          border: "4px solid hsl(var(--foreground) / 0.12)",
          background: "hsl(var(--foreground) / 0.05)",
        }}
      >
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[50px] h-[14px] bg-foreground/10 rounded-b-xl z-10" />
        <div className="w-full h-full overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}
