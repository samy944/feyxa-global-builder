import { useEffect, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { MarketSearch } from "./MarketSearch";
import { ShoppingBag, Star, Zap } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

/* ─── Floating mini-card ─── */
function FloatingCard({
  children,
  className = "",
  delay = 0,
  duration = 18,
  x = 0,
  y = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  x?: number;
  y?: number;
}) {
  return (
    <motion.div
      className={`absolute pointer-events-none select-none ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay + 0.6, duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div
        animate={{ x: [0, x, 0], y: [0, y, 0] }}
        transition={{ duration, repeat: Infinity, ease: "easeInOut" }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

function MiniProductCard({ name, price, image }: { name: string; price: string; image: string }) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-xl backdrop-blur-xl"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.06)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
      }}
    >
      <div
        className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: "rgba(255,255,255,0.06)" }}
      >
        <span className="text-lg">{image}</span>
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium truncate" style={{ color: "rgba(255,255,255,0.8)" }}>
          {name}
        </p>
        <p className="text-[11px] font-semibold" style={{ color: "hsl(var(--primary))" }}>
          {price}
        </p>
      </div>
    </div>
  );
}

function StatBadge({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div
      className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl backdrop-blur-xl"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <Icon size={14} style={{ color: "hsl(var(--primary))" }} />
      <div>
        <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.4)" }}>{label}</p>
        <p className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.85)" }}>{value}</p>
      </div>
    </div>
  );
}

export function MarketHero() {
  const { t } = useTranslation();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const titleY = useTransform(scrollYProgress, [0, 1], [0, 60]);
  const subtitleY = useTransform(scrollYProgress, [0, 1], [0, 40]);
  const searchY = useTransform(scrollYProgress, [0, 1], [0, 25]);
  const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  /* Noise grain canvas */
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = 256, h = 256;
    canvas.width = w;
    canvas.height = h;
    const imageData = ctx.createImageData(w, h);
    for (let i = 0; i < imageData.data.length; i += 4) {
      const v = Math.random() * 255;
      imageData.data[i] = v;
      imageData.data[i + 1] = v;
      imageData.data[i + 2] = v;
      imageData.data[i + 3] = 18; // very subtle
    }
    ctx.putImageData(imageData, 0, 0);
  }, []);

  return (
    <section
      ref={heroRef}
      className="relative flex flex-col items-center justify-center text-center overflow-hidden"
      style={{ minHeight: "88vh" }}
    >
      {/* ── Background layers ── */}
      {/* Base gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(180deg, #0b0f14 0%, #0f141a 50%, #0b0f14 100%)",
        }}
      />

      {/* Radial green glow behind title */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 50% 40% at 50% 42%, hsla(106, 75%, 47%, 0.06) 0%, transparent 70%)",
        }}
      />

      {/* Secondary warm glow for depth */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 30% 60%, hsla(200, 60%, 30%, 0.03) 0%, transparent 70%)",
        }}
      />

      {/* Grain texture */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ opacity: 0.5, mixBlendMode: "overlay" }}
      />

      {/* ── Floating elements ── */}
      <FloatingCard className="top-[18%] left-[8%] hidden lg:block" delay={0.2} duration={20} x={8} y={-12}>
        <MiniProductCard name="AirPods Max" price="45 000 FCFA" image="🎧" />
      </FloatingCard>

      <FloatingCard className="top-[30%] right-[6%] hidden lg:block" delay={0.5} duration={22} x={-10} y={8}>
        <StatBadge icon={Star} label={t.market.verifiedReviews} value="12 400+" />
      </FloatingCard>

      <FloatingCard className="bottom-[22%] left-[10%] hidden lg:block" delay={0.8} duration={24} x={6} y={-6}>
        <StatBadge icon={Zap} label={t.market.deliveryTime} value="24h" />
      </FloatingCard>

      <FloatingCard className="bottom-[18%] right-[9%] hidden lg:block" delay={1.0} duration={19} x={-8} y={10}>
        <MiniProductCard name="Nike Air Force" price="28 500 FCFA" image="👟" />
      </FloatingCard>

      {/* ── Content ── */}
      <motion.div className="relative z-10 px-4 w-full max-w-4xl mx-auto" style={{ opacity }}>
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="mb-10"
        >
          <span
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium"
            style={{
              background: "rgba(71,210,30,0.08)",
              border: "1px solid rgba(71,210,30,0.15)",
              color: "hsl(var(--primary))",
            }}
          >
            <ShoppingBag size={12} />
            {t.market.heroBadge}
          </span>
        </motion.div>

        {/* Title */}
        <motion.h1
          style={{ y: titleY }}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="leading-[1.02]"
        >
          <span
            style={{
              display: "block",
              color: "#FFFFFF",
              fontSize: "clamp(3rem, 7vw + 0.5rem, 5.5rem)",
              fontWeight: 700,
              letterSpacing: "-0.035em",
              lineHeight: 1.02,
            }}
          >
            {t.market.heroTitle1}
          </span>
          <span
            style={{
              display: "block",
              fontSize: "clamp(3rem, 7vw + 0.5rem, 5.5rem)",
              fontWeight: 700,
              letterSpacing: "-0.035em",
              lineHeight: 1.02,
              background: "linear-gradient(135deg, hsl(106, 75%, 52%), hsl(106, 75%, 38%))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {t.market.heroTitle2}
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          style={{ y: subtitleY }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="mt-8 mx-auto"
        >
          <span
            style={{
              color: "rgba(255,255,255,0.4)",
              fontSize: "clamp(1.0625rem, 1.5vw, 1.3125rem)",
              fontWeight: 400,
              lineHeight: 1.7,
              maxWidth: "460px",
              display: "block",
              margin: "0 auto",
              letterSpacing: "0.01em",
            }}
          >
            {t.market.heroSubtitle}
          </span>
        </motion.p>

        {/* Search */}
        <motion.div
          style={{ y: searchY }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="mt-16 w-full mx-auto"
        >
          <div className="mx-auto" style={{ maxWidth: "min(80%, 680px)" }}>
            <MarketSearch />
          </div>
        </motion.div>
      </motion.div>

      {/* Bottom fade */}
      <div
        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
        style={{
          background: "linear-gradient(to top, #0b0f14, transparent)",
        }}
      />
    </section>
  );
}
