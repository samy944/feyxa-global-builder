import { LandingSection } from "@/lib/landing-templates";
import { motion } from "framer-motion";
import { Star, Shield, Clock, MessageCircle, ChevronRight, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { LiveProductBlock } from "./LiveProductBlock";

interface Props {
  section: LandingSection;
  theme: {
    primaryColor: string;
    bgColor: string;
    textColor: string;
    radius: string;
    fontHeading: string;
    fontBody: string;
  };
  onCtaClick?: () => void;
  storeId?: string;
  productId?: string | null;
  collectionId?: string | null;
  onAddToCart?: (product: any, variant?: any) => void;
  subpages?: any[];
  landingSlug?: string;
}

const easeOut = [0.25, 0.46, 0.45, 0.94] as const;

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.7, ease: easeOut as unknown as [number, number, number, number] },
};

const staggerChildren = {
  initial: { opacity: 0 },
  whileInView: { opacity: 1 },
  viewport: { once: true, margin: "-80px" },
  transition: { staggerChildren: 0.12 },
};

const staggerItem = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: easeOut as unknown as [number, number, number, number] },
};

// Utility: subtle text color with opacity
function subtleText(color: string, opacity: number) {
  return color + Math.round(opacity * 255).toString(16).padStart(2, "0");
}

export function LandingSectionRenderer({ section, theme, onCtaClick, storeId, productId, collectionId, onAddToCart, subpages, landingSlug }: Props) {
  if (!section.visible) return null;

  const { data } = section;
  const t = theme;

  switch (section.type) {
    // ===== HEADER =====
    case "header":
      return <LandingHeader data={data} theme={t} onCtaClick={onCtaClick} subpages={subpages} landingSlug={landingSlug} />;

    // ===== HERO — Apple-style immersive =====
    case "hero":
      return (
        <section className="relative overflow-hidden" style={{ backgroundColor: t.bgColor }}>
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 opacity-[0.03]" style={{ background: `radial-gradient(ellipse 80% 50% at 50% -20%, ${t.primaryColor}, transparent)` }} />

          <div className="max-w-[980px] mx-auto px-6 pt-28 pb-16 md:pt-40 md:pb-24 text-center relative">
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-sm font-medium tracking-widest uppercase mb-6"
              style={{ color: t.primaryColor }}
            >
              Nouveau
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-[2.5rem] md:text-[3.5rem] lg:text-[4rem] font-bold leading-[1.08] tracking-tight mb-6"
              style={{ fontFamily: `"${t.fontHeading}", "SF Pro Display", sans-serif`, color: t.textColor }}
            >
              {data.title}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="text-xl md:text-2xl font-normal leading-relaxed max-w-[680px] mx-auto mb-10"
              style={{ color: subtleText(t.textColor, 0.6) }}
            >
              {data.subtitle}
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="flex items-center justify-center gap-4 flex-wrap"
            >
              <button
                onClick={onCtaClick}
                className="px-8 py-4 text-[17px] font-semibold text-white transition-all duration-300 hover:brightness-110 hover:scale-[1.02] active:scale-95 shadow-lg"
                style={{ backgroundColor: t.primaryColor, borderRadius: "980px" }}
              >
                {data.ctaText}
              </button>
              <button
                className="px-6 py-4 text-[17px] font-semibold transition-all duration-300 hover:opacity-80 flex items-center gap-1"
                style={{ color: t.primaryColor }}
              >
                En savoir plus <ChevronRight className="w-4 h-4" />
              </button>
            </motion.div>
          </div>

          {data.imageUrl && (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.4, ease: easeOut as unknown as [number, number, number, number] }}
              className="max-w-[1200px] mx-auto px-6 pb-20"
            >
              <img
                src={data.imageUrl}
                alt=""
                className="w-full rounded-2xl shadow-2xl"
                loading="lazy"
                style={{ borderRadius: t.radius }}
              />
            </motion.div>
          )}
        </section>
      );

    // ===== BENEFITS — Clean cards =====
    case "benefits":
      return (
        <section className="py-20 md:py-32 px-6" style={{ backgroundColor: t.bgColor }}>
          <div className="max-w-[980px] mx-auto">
            <motion.h2 {...fadeUp} className="text-3xl md:text-[2.5rem] font-bold text-center leading-tight mb-4" style={{ fontFamily: `"${t.fontHeading}", sans-serif`, color: t.textColor }}>
              {data.title}
            </motion.h2>
            <motion.div {...fadeUp} className="w-12 h-[2px] mx-auto mb-16" style={{ backgroundColor: t.primaryColor }} />
            <motion.div {...staggerChildren} className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10">
              {(data.items || []).map((item: any, i: number) => (
                <motion.div key={i} {...staggerItem} className="text-center group">
                  <div
                    className="w-16 h-16 mx-auto mb-6 flex items-center justify-center rounded-2xl text-3xl transition-transform duration-300 group-hover:scale-110"
                    style={{ backgroundColor: t.primaryColor + "10" }}
                  >
                    {item.icon}
                  </div>
                  <h3 className="text-lg font-semibold mb-3" style={{ color: t.textColor }}>{item.title}</h3>
                  <p className="text-[15px] leading-relaxed" style={{ color: subtleText(t.textColor, 0.55) }}>{item.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      );

    // ===== SOCIAL PROOF =====
    case "social-proof":
      return (
        <section className="py-20 md:py-32 px-6" style={{ backgroundColor: t.primaryColor + "04" }}>
          <div className="max-w-[980px] mx-auto">
            <motion.h2 {...fadeUp} className="text-3xl md:text-[2.5rem] font-bold text-center leading-tight mb-4" style={{ fontFamily: `"${t.fontHeading}", sans-serif`, color: t.textColor }}>
              {data.title}
            </motion.h2>
            <motion.div {...fadeUp} className="w-12 h-[2px] mx-auto mb-16" style={{ backgroundColor: t.primaryColor }} />

            {data.stats?.length > 0 && (
              <motion.div {...staggerChildren} className="flex flex-wrap justify-center gap-16 mb-20">
                {data.stats.map((s: any, i: number) => (
                  <motion.div key={i} {...staggerItem} className="text-center">
                    <div className="text-[2.75rem] md:text-[3.5rem] font-bold tracking-tight" style={{ color: t.primaryColor }}>{s.value}</div>
                    <div className="text-sm font-medium mt-1 tracking-wide uppercase" style={{ color: subtleText(t.textColor, 0.45) }}>{s.label}</div>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {data.testimonials?.length > 0 && (
              <motion.div {...staggerChildren} className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-[780px] mx-auto">
                {data.testimonials.map((t2: any, i: number) => (
                  <motion.div key={i} {...staggerItem} className="p-8 rounded-2xl transition-shadow duration-300 hover:shadow-lg" style={{ backgroundColor: t.bgColor, border: `1px solid ${t.textColor}08` }}>
                    <div className="flex gap-1 mb-4">
                      {Array.from({ length: t2.rating || 5 }).map((_, j) => (
                        <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="text-[15px] leading-relaxed mb-5" style={{ color: subtleText(t.textColor, 0.7) }}>"{t2.text}"</p>
                    <p className="text-sm font-semibold" style={{ color: t.textColor }}>— {t2.name}</p>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        </section>
      );

    // ===== PRODUCT HIGHLIGHTS =====
    case "product-highlights":
      return storeId ? (
        <LiveProductBlock storeId={storeId} productId={productId} title={data.title} theme={t} onAddToCart={onAddToCart} mode="highlights" columns={2} />
      ) : (
        <motion.section {...fadeUp} className="py-20 md:py-32 px-6">
          <div className="max-w-[980px] mx-auto text-center">
            <h2 className="text-3xl md:text-[2.5rem] font-bold mb-4" style={{ fontFamily: `"${t.fontHeading}", sans-serif`, color: t.textColor }}>{data.title}</h2>
            <p className="text-sm" style={{ color: subtleText(t.textColor, 0.35) }}>Connectez une boutique pour afficher les produits</p>
          </div>
        </motion.section>
      );

    // ===== PRICING =====
    case "pricing":
      return (
        <section className="py-20 md:py-32 px-6" style={{ backgroundColor: t.bgColor }}>
          <div className="max-w-[980px] mx-auto">
            <motion.h2 {...fadeUp} className="text-3xl md:text-[2.5rem] font-bold text-center leading-tight mb-4" style={{ fontFamily: `"${t.fontHeading}", sans-serif`, color: t.textColor }}>
              {data.title}
            </motion.h2>
            <motion.div {...fadeUp} className="w-12 h-[2px] mx-auto mb-16" style={{ backgroundColor: t.primaryColor }} />
            <motion.div {...staggerChildren} className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(data.items || []).map((item: any, i: number) => (
                <motion.div
                  key={i}
                  {...staggerItem}
                  className="p-8 rounded-2xl text-center flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                  style={{
                    border: item.highlight ? `2px solid ${t.primaryColor}` : `1px solid ${t.textColor}0D`,
                    backgroundColor: item.highlight ? t.primaryColor + "06" : t.bgColor,
                    borderRadius: "1.25rem",
                  }}
                >
                  {item.highlight && (
                    <span className="inline-block self-center px-4 py-1 text-[11px] font-bold uppercase tracking-widest text-white rounded-full mb-4" style={{ backgroundColor: t.primaryColor }}>
                      Populaire
                    </span>
                  )}
                  <h3 className="text-xl font-bold mb-2" style={{ color: t.textColor }}>{item.name}</h3>
                  <div className="mb-6">
                    <span className="text-[2.5rem] font-bold tracking-tight" style={{ color: t.primaryColor }}>{item.price?.toLocaleString()}</span>
                    <span className="text-sm ml-1" style={{ color: subtleText(t.textColor, 0.4) }}>FCFA</span>
                  </div>
                  {item.originalPrice && (
                    <div className="text-sm line-through mb-6" style={{ color: subtleText(t.textColor, 0.3) }}>
                      {item.originalPrice?.toLocaleString()} FCFA
                    </div>
                  )}
                  <ul className="space-y-3 mb-8 flex-1 text-left">
                    {(item.features || []).map((f: string, j: number) => (
                      <li key={j} className="text-[15px] flex items-start gap-3" style={{ color: subtleText(t.textColor, 0.65) }}>
                        <span className="mt-0.5 flex-shrink-0" style={{ color: t.primaryColor }}>✓</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={onCtaClick}
                    className="w-full py-3.5 font-semibold transition-all duration-300 hover:brightness-110"
                    style={{
                      backgroundColor: item.highlight ? t.primaryColor : "transparent",
                      color: item.highlight ? "white" : t.primaryColor,
                      borderRadius: "980px",
                      border: item.highlight ? "none" : `2px solid ${t.primaryColor}`,
                    }}
                  >
                    Choisir
                  </button>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      );

    // ===== COUNTDOWN =====
    case "countdown":
      return <CountdownSection data={data} theme={t} />;

    // ===== FAQ =====
    case "faq":
      return (
        <section className="py-20 md:py-32 px-6" style={{ backgroundColor: t.bgColor }}>
          <div className="max-w-[680px] mx-auto">
            <motion.h2 {...fadeUp} className="text-3xl md:text-[2.5rem] font-bold text-center leading-tight mb-4" style={{ fontFamily: `"${t.fontHeading}", sans-serif`, color: t.textColor }}>
              {data.title}
            </motion.h2>
            <motion.div {...fadeUp} className="w-12 h-[2px] mx-auto mb-14" style={{ backgroundColor: t.primaryColor }} />
            <motion.div {...staggerChildren} className="space-y-0 divide-y" style={{ borderColor: t.textColor + "0D" }}>
              {(data.items || []).map((item: any, i: number) => (
                <motion.div key={i} {...staggerItem}>
                  <FaqItem q={item.q} a={item.a} theme={t} />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      );

    // ===== GUARANTEE =====
    case "guarantee":
      return (
        <motion.section {...fadeUp} className="py-20 md:py-28 px-6">
          <div className="max-w-[680px] mx-auto text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-8" style={{ backgroundColor: t.primaryColor + "0A" }}>
              <Shield className="w-10 h-10" style={{ color: t.primaryColor }} />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold mb-5" style={{ fontFamily: `"${t.fontHeading}", sans-serif`, color: t.textColor }}>{data.title}</h2>
            <p className="text-lg leading-relaxed" style={{ color: subtleText(t.textColor, 0.6) }}>{data.text}</p>
          </div>
        </motion.section>
      );

    // ===== CTA =====
    case "cta":
      return (
        <section className="py-24 md:py-36 px-6 relative overflow-hidden" style={{ backgroundColor: t.primaryColor + "05" }}>
          <div className="absolute inset-0 opacity-[0.02]" style={{ background: `radial-gradient(ellipse 60% 80% at 50% 120%, ${t.primaryColor}, transparent)` }} />
          <motion.div {...fadeUp} className="max-w-[680px] mx-auto text-center relative">
            <h2 className="text-3xl md:text-[2.5rem] font-bold leading-tight mb-5" style={{ fontFamily: `"${t.fontHeading}", sans-serif`, color: t.textColor }}>{data.title}</h2>
            <p className="text-lg leading-relaxed mb-10" style={{ color: subtleText(t.textColor, 0.55) }}>{data.subtitle}</p>
            <button
              onClick={onCtaClick}
              className="px-10 py-4 text-[17px] font-semibold text-white transition-all duration-300 hover:brightness-110 hover:scale-[1.02] active:scale-95 shadow-lg"
              style={{ backgroundColor: t.primaryColor, borderRadius: "980px" }}
            >
              {data.ctaText}
            </button>
          </motion.div>
        </section>
      );

    // ===== LEAD CAPTURE / WAITLIST =====
    case "lead-capture":
    case "waitlist":
      return (
        <section className="py-20 md:py-28 px-6" style={{ backgroundColor: t.bgColor }}>
          <motion.div {...fadeUp} className="max-w-[480px] mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-6" style={{ fontFamily: `"${t.fontHeading}", sans-serif`, color: t.textColor }}>{data.title}</h2>
            {data.incentive && <p className="text-sm font-semibold mb-6" style={{ color: t.primaryColor }}>{data.incentive}</p>}
            {data.spotsText && <p className="text-sm font-semibold mb-5" style={{ color: t.primaryColor }}>{data.spotsText}</p>}
            <div className="flex gap-3">
              <input
                type="text"
                placeholder={data.placeholder}
                className="flex-1 px-5 py-3.5 text-sm bg-transparent border outline-none transition-all duration-200 focus:border-opacity-100"
                style={{ borderColor: t.textColor + "1A", color: t.textColor, borderRadius: "980px" }}
              />
              <button className="px-7 py-3.5 font-semibold text-white text-sm whitespace-nowrap" style={{ backgroundColor: t.primaryColor, borderRadius: "980px" }}>
                {data.buttonText}
              </button>
            </div>
          </motion.div>
        </section>
      );

    // ===== COLLECTION GRID =====
    case "collection-grid":
      return storeId ? (
        <LiveProductBlock storeId={storeId} collectionId={collectionId} title={data.title} theme={t} onAddToCart={onAddToCart} mode="collection" columns={data.columns || 3} />
      ) : (
        <motion.section {...fadeUp} className="py-20 md:py-32 px-6">
          <div className="max-w-[980px] mx-auto text-center">
            <h2 className="text-3xl md:text-[2.5rem] font-bold mb-4" style={{ fontFamily: `"${t.fontHeading}", sans-serif`, color: t.textColor }}>{data.title}</h2>
            <p className="text-sm" style={{ color: subtleText(t.textColor, 0.35) }}>Connectez une boutique pour afficher la collection</p>
          </div>
        </motion.section>
      );

    // ===== IMAGE =====
    case "image":
      return (
        <motion.section {...fadeUp} className="py-10 md:py-16 px-6">
          <div className="max-w-[980px] mx-auto">
            {data.url ? (
              <figure>
                <img src={data.url} alt={data.alt || ""} className="w-full rounded-2xl" style={{ borderRadius: t.radius }} loading="lazy" />
                {data.caption && <figcaption className="text-center text-sm mt-4" style={{ color: subtleText(t.textColor, 0.4) }}>{data.caption}</figcaption>}
              </figure>
            ) : (
              <div className="aspect-video rounded-2xl flex items-center justify-center" style={{ borderRadius: t.radius, backgroundColor: t.textColor + "08" }}>
                <span style={{ color: subtleText(t.textColor, 0.3) }}>Aucune image</span>
              </div>
            )}
          </div>
        </motion.section>
      );

    // ===== VIDEO =====
    case "video":
      return (
        <motion.section {...fadeUp} className="py-10 md:py-16 px-6">
          <div className="max-w-[980px] mx-auto">
            {data.url ? (
              <video src={data.url} poster={data.poster} controls className="w-full rounded-2xl" style={{ borderRadius: t.radius }} preload="none" />
            ) : (
              <div className="aspect-video rounded-2xl flex items-center justify-center" style={{ borderRadius: t.radius, backgroundColor: t.textColor + "08" }}>
                <span style={{ color: subtleText(t.textColor, 0.3) }}>Aucune vidéo</span>
              </div>
            )}
          </div>
        </motion.section>
      );

    // ===== RICH TEXT =====
    case "rich-text":
      return (
        <motion.section {...fadeUp} className="py-14 px-6">
          <div className="max-w-[680px] mx-auto prose prose-sm" style={{ color: subtleText(t.textColor, 0.75) }}>
            <div className="whitespace-pre-wrap leading-relaxed text-[15px]">{data.content}</div>
          </div>
        </motion.section>
      );

    // ===== COLUMNS =====
    case "columns":
      return (
        <section className="py-20 md:py-28 px-6" style={{ backgroundColor: t.bgColor }}>
          <div className="max-w-[980px] mx-auto">
            {data.title && (
              <>
                <motion.h2 {...fadeUp} className="text-3xl md:text-[2.5rem] font-bold text-center leading-tight mb-4" style={{ fontFamily: `"${t.fontHeading}", sans-serif`, color: t.textColor }}>{data.title}</motion.h2>
                <motion.div {...fadeUp} className="w-12 h-[2px] mx-auto mb-16" style={{ backgroundColor: t.primaryColor }} />
              </>
            )}
            <motion.div {...staggerChildren} className={`grid gap-8 ${data.cols === 2 ? "grid-cols-1 md:grid-cols-2" : data.cols === 4 ? "grid-cols-2 md:grid-cols-4" : "grid-cols-1 md:grid-cols-3"}`}>
              {(data.items || []).map((col: any, i: number) => (
                <motion.div key={i} {...staggerItem} className="p-8 rounded-2xl transition-all duration-300 hover:shadow-lg" style={{ backgroundColor: t.bgColor, border: `1px solid ${t.textColor}08` }}>
                  <h3 className="font-semibold text-lg mb-3" style={{ color: t.textColor }}>{col.title}</h3>
                  <p className="text-[15px] leading-relaxed" style={{ color: subtleText(t.textColor, 0.55) }}>{col.content}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      );

    // ===== GALLERY =====
    case "gallery":
      return (
        <section className="py-20 md:py-28 px-6" style={{ backgroundColor: t.bgColor }}>
          <div className="max-w-[1100px] mx-auto">
            {data.title && (
              <>
                <motion.h2 {...fadeUp} className="text-3xl md:text-[2.5rem] font-bold text-center leading-tight mb-4" style={{ fontFamily: `"${t.fontHeading}", sans-serif`, color: t.textColor }}>{data.title}</motion.h2>
                <motion.div {...fadeUp} className="w-12 h-[2px] mx-auto mb-16" style={{ backgroundColor: t.primaryColor }} />
              </>
            )}
            <motion.div {...staggerChildren} className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {(data.images || []).map((img: string, i: number) => (
                <motion.img key={i} {...staggerItem} src={img} alt="" className="w-full aspect-square object-cover rounded-2xl transition-transform duration-500 hover:scale-[1.02]" style={{ borderRadius: t.radius }} loading="lazy" />
              ))}
              {(!data.images || data.images.length === 0) && (
                <div className="aspect-square rounded-2xl flex items-center justify-center text-sm col-span-full" style={{ backgroundColor: t.textColor + "06", color: subtleText(t.textColor, 0.3), borderRadius: t.radius }}>
                  Ajoutez des images
                </div>
              )}
            </motion.div>
          </div>
        </section>
      );

    // ===== TESTIMONIALS GRID =====
    case "testimonials-grid":
      return (
        <section className="py-20 md:py-32 px-6" style={{ backgroundColor: t.primaryColor + "03" }}>
          <div className="max-w-[980px] mx-auto">
            <motion.h2 {...fadeUp} className="text-3xl md:text-[2.5rem] font-bold text-center leading-tight mb-4" style={{ fontFamily: `"${t.fontHeading}", sans-serif`, color: t.textColor }}>
              {data.title}
            </motion.h2>
            <motion.div {...fadeUp} className="w-12 h-[2px] mx-auto mb-16" style={{ backgroundColor: t.primaryColor }} />
            <motion.div {...staggerChildren} className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(data.items || []).map((item: any, i: number) => (
                <motion.div key={i} {...staggerItem} className="p-8 rounded-2xl transition-all duration-300 hover:shadow-lg" style={{ backgroundColor: t.bgColor, border: `1px solid ${t.textColor}06` }}>
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: item.rating || 5 }).map((_, j) => (
                      <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-[15px] leading-relaxed mb-6" style={{ color: subtleText(t.textColor, 0.7) }}>"{item.text}"</p>
                  <div className="flex items-center gap-3">
                    {item.avatar && <img src={item.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />}
                    <p className="text-sm font-semibold" style={{ color: t.textColor }}>{item.name}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      );

    // ===== STATS =====
    case "stats":
      return (
        <motion.section {...fadeUp} className="py-20 md:py-28 px-6">
          <div className="max-w-[980px] mx-auto">
            <div className="flex flex-wrap justify-center gap-16 md:gap-24">
              {(data.items || []).map((s: any, i: number) => (
                <div key={i} className="text-center">
                  <div className="text-[2.75rem] md:text-[3.5rem] font-bold tracking-tight" style={{ color: t.primaryColor }}>{s.value}</div>
                  <div className="text-sm font-medium tracking-wide uppercase mt-2" style={{ color: subtleText(t.textColor, 0.45) }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.section>
      );

    // ===== COMPARISON TABLE =====
    case "comparison-table":
      return (
        <section className="py-20 md:py-28 px-6" style={{ backgroundColor: t.bgColor }}>
          <div className="max-w-[680px] mx-auto">
            <motion.h2 {...fadeUp} className="text-3xl font-bold text-center mb-4" style={{ fontFamily: `"${t.fontHeading}", sans-serif`, color: t.textColor }}>{data.title}</motion.h2>
            <motion.div {...fadeUp} className="w-12 h-[2px] mx-auto mb-14" style={{ backgroundColor: t.primaryColor }} />
            <motion.div {...fadeUp} className="overflow-x-auto rounded-2xl" style={{ border: `1px solid ${t.textColor}0A` }}>
              <table className="w-full border-collapse">
                <thead>
                  <tr style={{ backgroundColor: t.primaryColor + "06" }}>
                    {(data.headers || []).map((h: string, i: number) => (
                      <th key={i} className="p-5 text-left text-sm font-semibold" style={{ color: i > 0 ? t.primaryColor : t.textColor }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(data.rows || []).map((row: string[], i: number) => (
                    <tr key={i} style={{ borderTop: `1px solid ${t.textColor}08` }}>
                      {row.map((cell: string, j: number) => (
                        <td key={j} className="p-5 text-[15px]" style={{ color: subtleText(t.textColor, 0.7) }}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </motion.div>
          </div>
        </section>
      );

    // ===== TABS =====
    case "tabs":
      return <TabsSection data={data} theme={t} />;

    // ===== TRUST BADGES =====
    case "trust-badges":
      return (
        <motion.section {...fadeUp} className="py-14 px-6">
          <div className="max-w-[800px] mx-auto">
            <div className="flex flex-wrap justify-center gap-10 md:gap-14">
              {(data.items || []).map((badge: any, i: number) => (
                <div key={i} className="flex flex-col items-center gap-3 group">
                  <span className="text-3xl transition-transform duration-300 group-hover:scale-110">{badge.icon}</span>
                  <span className="text-xs font-medium tracking-wide" style={{ color: subtleText(t.textColor, 0.5) }}>{badge.label}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.section>
      );

    // ===== ANNOUNCEMENT BAR =====
    case "announcement-bar":
      return (
        <div className="py-3 px-4 text-center text-sm font-medium text-white" style={{ backgroundColor: data.bgColor || t.primaryColor }}>
          {data.text}
        </div>
      );

    // ===== WHATSAPP =====
    case "whatsapp-button":
      return (
        <motion.section {...fadeUp} className="py-14 px-6 text-center">
          <a
            href={`https://wa.me/${(data.phone || "").replace(/\D/g, "")}?text=${encodeURIComponent(data.message || "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-8 py-4 text-white font-semibold text-[17px] transition-all duration-300 hover:scale-[1.03] active:scale-95 shadow-lg"
            style={{ backgroundColor: "#25D366", borderRadius: "980px" }}
          >
            <MessageCircle className="w-5 h-5" />
            {data.label || "WhatsApp"}
          </a>
        </motion.section>
      );

    // ===== BEFORE/AFTER =====
    case "before-after":
      return (
        <section className="py-20 md:py-28 px-6" style={{ backgroundColor: t.bgColor }}>
          <div className="max-w-[800px] mx-auto">
            {data.title && (
              <>
                <motion.h2 {...fadeUp} className="text-3xl font-bold text-center mb-4" style={{ fontFamily: `"${t.fontHeading}", sans-serif`, color: t.textColor }}>{data.title}</motion.h2>
                <motion.div {...fadeUp} className="w-12 h-[2px] mx-auto mb-14" style={{ backgroundColor: t.primaryColor }} />
              </>
            )}
            <motion.div {...fadeUp} className="grid grid-cols-2 gap-6">
              <div className="text-center">
                {data.beforeImage ? <img src={data.beforeImage} alt={data.beforeLabel} className="w-full rounded-2xl" style={{ borderRadius: t.radius }} loading="lazy" /> : <div className="aspect-square rounded-2xl" style={{ backgroundColor: t.textColor + "06", borderRadius: t.radius }} />}
                <p className="mt-4 font-medium text-sm" style={{ color: subtleText(t.textColor, 0.6) }}>{data.beforeLabel || "Avant"}</p>
              </div>
              <div className="text-center">
                {data.afterImage ? <img src={data.afterImage} alt={data.afterLabel} className="w-full rounded-2xl" style={{ borderRadius: t.radius }} loading="lazy" /> : <div className="aspect-square rounded-2xl" style={{ backgroundColor: t.textColor + "06", borderRadius: t.radius }} />}
                <p className="mt-4 font-medium text-sm" style={{ color: subtleText(t.textColor, 0.6) }}>{data.afterLabel || "Après"}</p>
              </div>
            </motion.div>
          </div>
        </section>
      );

    // ===== STICKY CTA =====
    case "sticky-cta":
      return (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 backdrop-blur-xl border-t shadow-xl" style={{ backgroundColor: t.bgColor + "E6", borderColor: t.textColor + "0A" }}>
          <div className="max-w-[980px] mx-auto flex items-center justify-between">
            <div>
              <span className="font-medium text-sm" style={{ color: t.textColor }}>{data.text}</span>
              {data.price && <span className="ml-3 font-bold text-lg" style={{ color: t.primaryColor }}>{data.price}</span>}
            </div>
            <button onClick={onCtaClick} className="px-8 py-3 font-semibold text-white text-sm" style={{ backgroundColor: t.primaryColor, borderRadius: "980px" }}>
              {data.ctaText || "Acheter"}
            </button>
          </div>
        </div>
      );

    // ===== FOOTER =====
    case "footer":
      return <LandingFooter data={data} theme={t} />;

    default:
      return null;
  }
}

// ========== SUB-COMPONENTS ==========

function LandingHeader({ data, theme: t, onCtaClick, subpages, landingSlug }: { data: any; theme: Props["theme"]; onCtaClick?: () => void; subpages?: any[]; landingSlug?: string }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (e: React.MouseEvent, href: string) => {
    if (!href.startsWith("#")) return;
    e.preventDefault();
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    setMobileOpen(false);
  };

  // Build nav links: combine data.links + subpages
  const navLinks = [...(data.links || [])];
  if (subpages && subpages.length > 1 && landingSlug) {
    subpages.forEach((sp: any) => {
      if (!sp.is_home) {
        navLinks.push({ label: sp.title, href: `/lp/${landingSlug}/${sp.slug}` });
      }
    });
  }

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        backgroundColor: scrolled ? t.bgColor + "F2" : "transparent",
        backdropFilter: scrolled ? "blur(20px) saturate(180%)" : "none",
        borderBottom: scrolled ? `1px solid ${t.textColor}08` : "none",
      }}
    >
      <div className="max-w-[980px] mx-auto px-6 flex items-center justify-between h-14">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          {data.logo ? (
            <img src={data.logo} alt={data.storeName} className="h-7 w-auto" />
          ) : (
            <a href={landingSlug ? `/lp/${landingSlug}` : "#"} className="text-lg font-bold tracking-tight" style={{ color: t.textColor }}>{data.storeName}</a>
          )}
        </div>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link: any, i: number) => (
            <a
              key={i}
              href={link.href}
              onClick={(e) => link.href.startsWith("#") ? scrollTo(e, link.href) : undefined}
              className="text-xs font-medium transition-colors duration-200 hover:opacity-100"
              style={{ color: subtleText(t.textColor, 0.65) }}
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden md:block">
          {data.ctaText && (
            <button
              onClick={onCtaClick}
              className="px-5 py-2 text-xs font-semibold text-white transition-all duration-200 hover:brightness-110"
              style={{ backgroundColor: t.primaryColor, borderRadius: "980px" }}
            >
              {data.ctaText}
            </button>
          )}
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)} style={{ color: t.textColor }}>
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ duration: 0.2 }}
          className="md:hidden overflow-hidden backdrop-blur-xl"
          style={{ backgroundColor: t.bgColor + "F8", borderTop: `1px solid ${t.textColor}08` }}
        >
          <div className="max-w-[980px] mx-auto px-6 py-5 flex flex-col gap-4">
            {navLinks.map((link: any, i: number) => (
              <a
                key={i}
                href={link.href}
                onClick={(e) => link.href.startsWith("#") ? scrollTo(e, link.href) : undefined}
                className="text-sm font-medium py-1"
                style={{ color: subtleText(t.textColor, 0.7) }}
              >
                {link.label}
              </a>
            ))}
            {data.ctaText && (
              <button
                onClick={() => { setMobileOpen(false); onCtaClick?.(); }}
                className="mt-2 px-6 py-3 text-sm font-semibold text-white"
                style={{ backgroundColor: t.primaryColor, borderRadius: "980px" }}
              >
                {data.ctaText}
              </button>
            )}
          </div>
        </motion.div>
      )}
    </header>
  );
}

function LandingFooter({ data, theme: t }: { data: any; theme: Props["theme"] }) {
  return (
    <footer className="py-16 px-6" style={{ borderTop: `1px solid ${t.textColor}0A` }}>
      <div className="max-w-[980px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-12">
          {/* Brand */}
          <div>
            <h3 className="text-lg font-bold mb-3" style={{ color: t.textColor }}>{data.storeName}</h3>
            <p className="text-sm leading-relaxed" style={{ color: subtleText(t.textColor, 0.5) }}>{data.description}</p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: subtleText(t.textColor, 0.4) }}>Liens</h4>
            <div className="flex flex-col gap-3">
              {(data.links || []).map((link: any, i: number) => (
                <a key={i} href={link.href} className="text-sm transition-colors hover:opacity-100" style={{ color: subtleText(t.textColor, 0.6) }}>
                  {link.label}
                </a>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: subtleText(t.textColor, 0.4) }}>Contact</h4>
            <div className="flex flex-col gap-3 text-sm" style={{ color: subtleText(t.textColor, 0.6) }}>
              {data.phone && <span>{data.phone}</span>}
              {data.email && <span>{data.email}</span>}
              {data.socials && (
                <div className="flex gap-4 mt-2">
                  {data.socials.instagram && <a href={data.socials.instagram} target="_blank" rel="noopener noreferrer" className="hover:opacity-100 transition-opacity">Instagram</a>}
                  {data.socials.facebook && <a href={data.socials.facebook} target="_blank" rel="noopener noreferrer" className="hover:opacity-100 transition-opacity">Facebook</a>}
                  {data.socials.tiktok && <a href={data.socials.tiktok} target="_blank" rel="noopener noreferrer" className="hover:opacity-100 transition-opacity">TikTok</a>}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="pt-8 text-center text-xs" style={{ borderTop: `1px solid ${t.textColor}08`, color: subtleText(t.textColor, 0.3) }}>
          © {new Date().getFullYear()} {data.storeName}. Tous droits réservés.
        </div>
      </div>
    </footer>
  );
}

function CountdownSection({ data, theme: t }: { data: any; theme: Props["theme"] }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  useEffect(() => {
    const end = new Date(data.endDate).getTime();
    const tick = () => {
      const diff = Math.max(0, end - Date.now());
      setTimeLeft({ days: Math.floor(diff / 86400000), hours: Math.floor((diff % 86400000) / 3600000), minutes: Math.floor((diff % 3600000) / 60000), seconds: Math.floor((diff % 60000) / 1000) });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [data.endDate]);

  const units = [
    { value: timeLeft.days, label: "Jours" },
    { value: timeLeft.hours, label: "Heures" },
    { value: timeLeft.minutes, label: "Min" },
    { value: timeLeft.seconds, label: "Sec" },
  ];

  return (
    <motion.section {...fadeUp} className="py-20 px-6 text-center" style={{ backgroundColor: t.primaryColor + "05" }}>
      <h2 className="text-2xl md:text-3xl font-bold mb-10" style={{ fontFamily: `"${t.fontHeading}", sans-serif`, color: t.textColor }}>{data.title}</h2>
      <div className="flex justify-center gap-5">
        {units.map((u, i) => (
          <div key={i} className="w-20 h-24 flex flex-col items-center justify-center rounded-2xl" style={{ backgroundColor: t.bgColor, border: `1px solid ${t.textColor}0A` }}>
            <span className="text-[1.75rem] font-bold tabular-nums" style={{ color: t.primaryColor }}>{String(u.value).padStart(2, "0")}</span>
            <span className="text-[10px] uppercase tracking-widest mt-1" style={{ color: subtleText(t.textColor, 0.4) }}>{u.label}</span>
          </div>
        ))}
      </div>
    </motion.section>
  );
}

function FaqItem({ q, a, theme: t }: { q: string; a: string; theme: Props["theme"] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="py-5" style={{ borderColor: t.textColor + "0D" }}>
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between text-left group">
        <span className="font-medium text-[15px] pr-4" style={{ color: t.textColor }}>{q}</span>
        <span className="text-xl shrink-0 transition-transform duration-200" style={{ color: subtleText(t.textColor, 0.3), transform: open ? "rotate(45deg)" : "none" }}>+</span>
      </button>
      <motion.div
        initial={false}
        animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.25 }}
        className="overflow-hidden"
      >
        <p className="pt-4 text-[15px] leading-relaxed" style={{ color: subtleText(t.textColor, 0.55) }}>{a}</p>
      </motion.div>
    </div>
  );
}

function TabsSection({ data, theme: t }: { data: any; theme: Props["theme"] }) {
  const [active, setActive] = useState(0);
  const items = data.items || [];
  return (
    <motion.section {...fadeUp} className="py-20 px-6">
      <div className="max-w-[680px] mx-auto">
        <div className="flex gap-1 mb-10 justify-center flex-wrap p-1 rounded-full mx-auto w-fit" style={{ backgroundColor: t.textColor + "08" }}>
          {items.map((tab: any, i: number) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className="px-6 py-2.5 text-sm font-medium transition-all duration-200"
              style={{
                backgroundColor: active === i ? t.bgColor : "transparent",
                color: active === i ? t.textColor : subtleText(t.textColor, 0.5),
                borderRadius: "980px",
                boxShadow: active === i ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {items[active] && (
          <div className="p-8 rounded-2xl text-[15px] leading-relaxed" style={{ backgroundColor: t.bgColor, border: `1px solid ${t.textColor}08`, color: subtleText(t.textColor, 0.7) }}>
            {items[active].content}
          </div>
        )}
      </div>
    </motion.section>
  );
}
