import { LandingSection } from "@/lib/landing-templates";
import { motion } from "framer-motion";
import { Star, Shield, Clock, MessageCircle } from "lucide-react";
import { useState, useEffect } from "react";

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
}

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-50px" },
  transition: { duration: 0.5 },
};

export function LandingSectionRenderer({ section, theme, onCtaClick }: Props) {
  if (!section.visible) return null;

  const { data } = section;
  const t = theme;

  switch (section.type) {
    case "hero":
      return (
        <motion.section {...fadeUp} className="relative overflow-hidden py-20 md:py-32 px-6">
          <div className="max-w-5xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6" style={{ fontFamily: `"${t.fontHeading}", sans-serif`, color: t.textColor }}>
              {data.title}
            </h1>
            <p className="text-lg md:text-xl opacity-70 max-w-2xl mx-auto mb-10" style={{ color: t.textColor }}>{data.subtitle}</p>
            <button onClick={onCtaClick} className="px-8 py-4 text-lg font-semibold text-white transition-all hover:scale-105 active:scale-95" style={{ backgroundColor: t.primaryColor, borderRadius: t.radius }}>
              {data.ctaText}
            </button>
            {data.imageUrl && (
              <div className="mt-12 max-w-3xl mx-auto">
                <img src={data.imageUrl} alt="" className="w-full rounded-xl shadow-2xl" loading="lazy" />
              </div>
            )}
          </div>
        </motion.section>
      );

    case "benefits":
      return (
        <motion.section {...fadeUp} className="py-16 md:py-24 px-6">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12" style={{ fontFamily: `"${t.fontHeading}", sans-serif`, color: t.textColor }}>{data.title}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {(data.items || []).map((item: any, i: number) => (
                <div key={i} className="p-6 rounded-xl border border-black/5 bg-white/50 backdrop-blur-sm text-center" style={{ borderRadius: t.radius }}>
                  <span className="text-3xl mb-4 block">{item.icon}</span>
                  <h3 className="text-lg font-semibold mb-2" style={{ color: t.textColor }}>{item.title}</h3>
                  <p className="text-sm opacity-60" style={{ color: t.textColor }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.section>
      );

    case "social-proof":
      return (
        <motion.section {...fadeUp} className="py-16 md:py-24 px-6" style={{ backgroundColor: t.primaryColor + "08" }}>
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12" style={{ fontFamily: `"${t.fontHeading}", sans-serif`, color: t.textColor }}>{data.title}</h2>
            {data.stats?.length > 0 && (
              <div className="flex flex-wrap justify-center gap-12 mb-12">
                {data.stats.map((s: any, i: number) => (
                  <div key={i} className="text-center">
                    <div className="text-3xl md:text-4xl font-bold" style={{ color: t.primaryColor }}>{s.value}</div>
                    <div className="text-sm opacity-60 mt-1" style={{ color: t.textColor }}>{s.label}</div>
                  </div>
                ))}
              </div>
            )}
            {data.testimonials?.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                {data.testimonials.map((t2: any, i: number) => (
                  <div key={i} className="p-6 bg-white rounded-xl shadow-sm border border-black/5" style={{ borderRadius: t.radius }}>
                    <div className="flex gap-1 mb-3">
                      {Array.from({ length: t2.rating || 5 }).map((_, j) => (
                        <Star key={j} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-sm mb-3 italic" style={{ color: t.textColor }}>"{t2.text}"</p>
                    <p className="text-xs font-semibold" style={{ color: t.textColor }}>— {t2.name}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.section>
      );

    case "product-highlights":
      return (
        <motion.section {...fadeUp} className="py-16 md:py-24 px-6">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12" style={{ fontFamily: `"${t.fontHeading}", sans-serif`, color: t.textColor }}>{data.title}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {(data.items || []).map((item: any, i: number) => (
                <div key={i} className="p-6 rounded-xl border border-black/5 bg-white" style={{ borderRadius: t.radius }}>
                  {item.imageUrl && <img src={item.imageUrl} alt={item.name} className="w-full h-48 object-cover rounded-lg mb-4" loading="lazy" />}
                  <h3 className="font-semibold text-lg mb-2" style={{ color: t.textColor }}>{item.name}</h3>
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-bold" style={{ color: t.primaryColor }}>{item.price?.toLocaleString()} FCFA</span>
                    {item.originalPrice && <span className="text-sm line-through opacity-40" style={{ color: t.textColor }}>{item.originalPrice?.toLocaleString()} FCFA</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.section>
      );

    case "pricing":
      return (
        <motion.section {...fadeUp} className="py-16 md:py-24 px-6">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12" style={{ fontFamily: `"${t.fontHeading}", sans-serif`, color: t.textColor }}>{data.title}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(data.items || []).map((item: any, i: number) => (
                <div key={i} className="p-8 rounded-xl border-2 text-center flex flex-col" style={{ borderColor: item.highlight ? t.primaryColor : "rgba(0,0,0,0.08)", borderRadius: t.radius, backgroundColor: item.highlight ? t.primaryColor + "08" : "white" }}>
                  <h3 className="text-lg font-bold mb-2" style={{ color: t.textColor }}>{item.name}</h3>
                  <div className="mb-4">
                    <span className="text-3xl font-bold" style={{ color: t.primaryColor }}>{item.price?.toLocaleString()}</span>
                    <span className="text-sm opacity-50" style={{ color: t.textColor }}> FCFA</span>
                  </div>
                  {item.originalPrice && <div className="text-sm line-through opacity-40 mb-4" style={{ color: t.textColor }}>{item.originalPrice?.toLocaleString()} FCFA</div>}
                  <ul className="space-y-2 mb-6 flex-1">
                    {(item.features || []).map((f: string, j: number) => (
                      <li key={j} className="text-sm flex items-center gap-2 justify-center" style={{ color: t.textColor }}>
                        <span style={{ color: t.primaryColor }}>✓</span> {f}
                      </li>
                    ))}
                  </ul>
                  <button onClick={onCtaClick} className="w-full py-3 font-semibold text-white transition-all hover:opacity-90" style={{ backgroundColor: t.primaryColor, borderRadius: t.radius }}>
                    Choisir
                  </button>
                </div>
              ))}
            </div>
          </div>
        </motion.section>
      );

    case "countdown":
      return <CountdownSection data={data} theme={t} />;

    case "faq":
      return (
        <motion.section {...fadeUp} className="py-16 md:py-24 px-6">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12" style={{ fontFamily: `"${t.fontHeading}", sans-serif`, color: t.textColor }}>{data.title}</h2>
            <div className="space-y-4">
              {(data.items || []).map((item: any, i: number) => (
                <FaqItem key={i} q={item.q} a={item.a} theme={t} />
              ))}
            </div>
          </div>
        </motion.section>
      );

    case "guarantee":
      return (
        <motion.section {...fadeUp} className="py-16 md:py-24 px-6">
          <div className="max-w-2xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-6" style={{ backgroundColor: t.primaryColor + "15" }}>
              <Shield className="w-8 h-8" style={{ color: t.primaryColor }} />
            </div>
            <h2 className="text-3xl font-bold mb-4" style={{ fontFamily: `"${t.fontHeading}", sans-serif`, color: t.textColor }}>{data.title}</h2>
            <p className="text-lg opacity-70" style={{ color: t.textColor }}>{data.text}</p>
          </div>
        </motion.section>
      );

    case "cta":
      return (
        <motion.section {...fadeUp} className="py-20 md:py-28 px-6 text-center" style={{ backgroundColor: t.primaryColor + "08" }}>
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: `"${t.fontHeading}", sans-serif`, color: t.textColor }}>{data.title}</h2>
            <p className="text-lg opacity-70 mb-8" style={{ color: t.textColor }}>{data.subtitle}</p>
            <button onClick={onCtaClick} className="px-10 py-4 text-lg font-semibold text-white transition-all hover:scale-105 active:scale-95 shadow-lg" style={{ backgroundColor: t.primaryColor, borderRadius: t.radius }}>
              {data.ctaText}
            </button>
          </div>
        </motion.section>
      );

    case "lead-capture":
    case "waitlist":
      return (
        <motion.section {...fadeUp} className="py-16 md:py-24 px-6">
          <div className="max-w-md mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-6" style={{ fontFamily: `"${t.fontHeading}", sans-serif`, color: t.textColor }}>{data.title}</h2>
            {data.incentive && <p className="text-sm mb-6 font-medium" style={{ color: t.primaryColor }}>{data.incentive}</p>}
            {data.spotsText && <p className="text-sm mb-4 font-medium" style={{ color: t.primaryColor }}>{data.spotsText}</p>}
            <div className="flex gap-2">
              <input type="text" placeholder={data.placeholder} className="flex-1 px-4 py-3 border border-black/10 text-sm bg-white" style={{ borderRadius: t.radius, color: t.textColor }} />
              <button className="px-6 py-3 font-semibold text-white text-sm whitespace-nowrap" style={{ backgroundColor: t.primaryColor, borderRadius: t.radius }}>{data.buttonText}</button>
            </div>
          </div>
        </motion.section>
      );

    case "collection-grid":
      return (
        <motion.section {...fadeUp} className="py-16 md:py-24 px-6">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12" style={{ fontFamily: `"${t.fontHeading}", sans-serif`, color: t.textColor }}>{data.title}</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="aspect-square rounded-xl bg-black/5 flex items-center justify-center text-sm opacity-40" style={{ borderRadius: t.radius }}>Produits de la collection</div>
            </div>
          </div>
        </motion.section>
      );

    // ===== NEW BLOCKS =====

    case "image":
      return (
        <motion.section {...fadeUp} className="py-8 px-6">
          <div className="max-w-4xl mx-auto">
            {data.url ? (
              <figure>
                <img src={data.url} alt={data.alt || ""} className="w-full rounded-xl" style={{ borderRadius: t.radius }} loading="lazy" />
                {data.caption && <figcaption className="text-center text-sm opacity-50 mt-3" style={{ color: t.textColor }}>{data.caption}</figcaption>}
              </figure>
            ) : (
              <div className="aspect-video rounded-xl bg-black/5 flex items-center justify-center text-muted-foreground" style={{ borderRadius: t.radius }}>Aucune image</div>
            )}
          </div>
        </motion.section>
      );

    case "video":
      return (
        <motion.section {...fadeUp} className="py-8 px-6">
          <div className="max-w-4xl mx-auto">
            {data.url ? (
              <video src={data.url} poster={data.poster} controls className="w-full rounded-xl" style={{ borderRadius: t.radius }} preload="none" />
            ) : (
              <div className="aspect-video rounded-xl bg-black/5 flex items-center justify-center text-muted-foreground" style={{ borderRadius: t.radius }}>Aucune vidéo</div>
            )}
          </div>
        </motion.section>
      );

    case "rich-text":
      return (
        <motion.section {...fadeUp} className="py-12 px-6">
          <div className="max-w-3xl mx-auto prose prose-sm" style={{ color: t.textColor }}>
            <div className="whitespace-pre-wrap">{data.content}</div>
          </div>
        </motion.section>
      );

    case "columns":
      return (
        <motion.section {...fadeUp} className="py-16 px-6">
          <div className="max-w-5xl mx-auto">
            {data.title && <h2 className="text-3xl font-bold text-center mb-12" style={{ fontFamily: `"${t.fontHeading}", sans-serif`, color: t.textColor }}>{data.title}</h2>}
            <div className={`grid gap-6 ${data.cols === 2 ? "grid-cols-1 md:grid-cols-2" : data.cols === 4 ? "grid-cols-2 md:grid-cols-4" : "grid-cols-1 md:grid-cols-3"}`}>
              {(data.items || []).map((col: any, i: number) => (
                <div key={i} className="p-6 rounded-xl border border-black/5 bg-white/50" style={{ borderRadius: t.radius }}>
                  <h3 className="font-semibold mb-2" style={{ color: t.textColor }}>{col.title}</h3>
                  <p className="text-sm opacity-60" style={{ color: t.textColor }}>{col.content}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.section>
      );

    case "gallery":
      return (
        <motion.section {...fadeUp} className="py-16 px-6">
          <div className="max-w-5xl mx-auto">
            {data.title && <h2 className="text-3xl font-bold text-center mb-12" style={{ fontFamily: `"${t.fontHeading}", sans-serif`, color: t.textColor }}>{data.title}</h2>}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {(data.images || []).map((img: string, i: number) => (
                <img key={i} src={img} alt="" className="w-full aspect-square object-cover rounded-xl" style={{ borderRadius: t.radius }} loading="lazy" />
              ))}
              {(!data.images || data.images.length === 0) && (
                <div className="aspect-square rounded-xl bg-black/5 flex items-center justify-center text-sm opacity-40 col-span-full" style={{ borderRadius: t.radius }}>Ajoutez des images</div>
              )}
            </div>
          </div>
        </motion.section>
      );

    case "testimonials-grid":
      return (
        <motion.section {...fadeUp} className="py-16 md:py-24 px-6" style={{ backgroundColor: t.primaryColor + "05" }}>
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12" style={{ fontFamily: `"${t.fontHeading}", sans-serif`, color: t.textColor }}>{data.title}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(data.items || []).map((item: any, i: number) => (
                <div key={i} className="p-6 bg-white rounded-xl shadow-sm border border-black/5" style={{ borderRadius: t.radius }}>
                  <div className="flex gap-1 mb-3">
                    {Array.from({ length: item.rating || 5 }).map((_, j) => (
                      <Star key={j} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-sm mb-4 italic" style={{ color: t.textColor }}>"{item.text}"</p>
                  <div className="flex items-center gap-3">
                    {item.avatar && <img src={item.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />}
                    <p className="text-xs font-semibold" style={{ color: t.textColor }}>{item.name}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.section>
      );

    case "stats":
      return (
        <motion.section {...fadeUp} className="py-16 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-wrap justify-center gap-12">
              {(data.items || []).map((s: any, i: number) => (
                <div key={i} className="text-center">
                  <div className="text-4xl md:text-5xl font-bold" style={{ color: t.primaryColor }}>{s.value}</div>
                  <div className="text-sm opacity-60 mt-2" style={{ color: t.textColor }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.section>
      );

    case "comparison-table":
      return (
        <motion.section {...fadeUp} className="py-16 md:py-24 px-6">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12" style={{ fontFamily: `"${t.fontHeading}", sans-serif`, color: t.textColor }}>{data.title}</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    {(data.headers || []).map((h: string, i: number) => (
                      <th key={i} className="p-4 text-left text-sm font-semibold border-b-2" style={{ color: i > 0 ? t.primaryColor : t.textColor, borderColor: t.primaryColor + "20" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(data.rows || []).map((row: string[], i: number) => (
                    <tr key={i}>
                      {row.map((cell: string, j: number) => (
                        <td key={j} className="p-4 text-sm border-b border-black/5" style={{ color: t.textColor }}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.section>
      );

    case "tabs":
      return <TabsSection data={data} theme={t} />;

    case "trust-badges":
      return (
        <motion.section {...fadeUp} className="py-12 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-wrap justify-center gap-8">
              {(data.items || []).map((badge: any, i: number) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <span className="text-2xl">{badge.icon}</span>
                  <span className="text-xs font-medium opacity-70" style={{ color: t.textColor }}>{badge.label}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.section>
      );

    case "announcement-bar":
      return (
        <div className="py-3 px-4 text-center text-sm font-medium text-white" style={{ backgroundColor: data.bgColor || t.primaryColor }}>
          {data.text}
        </div>
      );

    case "whatsapp-button":
      return (
        <motion.section {...fadeUp} className="py-12 px-6 text-center">
          <a
            href={`https://wa.me/${(data.phone || "").replace(/\D/g, "")}?text=${encodeURIComponent(data.message || "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-8 py-4 text-white font-semibold text-lg rounded-full transition-all hover:scale-105 active:scale-95"
            style={{ backgroundColor: "#25D366", borderRadius: t.radius }}
          >
            <MessageCircle className="w-6 h-6" />
            {data.label || "WhatsApp"}
          </a>
        </motion.section>
      );

    case "before-after":
      return (
        <motion.section {...fadeUp} className="py-16 px-6">
          <div className="max-w-4xl mx-auto">
            {data.title && <h2 className="text-3xl font-bold text-center mb-12" style={{ fontFamily: `"${t.fontHeading}", sans-serif`, color: t.textColor }}>{data.title}</h2>}
            <div className="grid grid-cols-2 gap-6">
              <div className="text-center">
                {data.beforeImage ? <img src={data.beforeImage} alt={data.beforeLabel} className="w-full rounded-xl" style={{ borderRadius: t.radius }} loading="lazy" /> : <div className="aspect-square rounded-xl bg-black/5" style={{ borderRadius: t.radius }} />}
                <p className="mt-3 font-medium text-sm" style={{ color: t.textColor }}>{data.beforeLabel || "Avant"}</p>
              </div>
              <div className="text-center">
                {data.afterImage ? <img src={data.afterImage} alt={data.afterLabel} className="w-full rounded-xl" style={{ borderRadius: t.radius }} loading="lazy" /> : <div className="aspect-square rounded-xl bg-black/5" style={{ borderRadius: t.radius }} />}
                <p className="mt-3 font-medium text-sm" style={{ color: t.textColor }}>{data.afterLabel || "Après"}</p>
              </div>
            </div>
          </div>
        </motion.section>
      );

    case "sticky-cta":
      return (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white/95 backdrop-blur-sm border-t border-black/10 shadow-lg">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div>
              <span className="font-medium text-sm" style={{ color: t.textColor }}>{data.text}</span>
              {data.price && <span className="ml-2 font-bold" style={{ color: t.primaryColor }}>{data.price}</span>}
            </div>
            <button onClick={onCtaClick} className="px-6 py-3 font-semibold text-white text-sm" style={{ backgroundColor: t.primaryColor, borderRadius: t.radius }}>
              {data.ctaText || "Acheter"}
            </button>
          </div>
        </div>
      );

    default:
      return null;
  }
}

// --- Sub-components ---

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
    <motion.section {...fadeUp} className="py-16 px-6 text-center" style={{ backgroundColor: t.primaryColor + "08" }}>
      <h2 className="text-2xl md:text-3xl font-bold mb-8" style={{ fontFamily: `"${t.fontHeading}", sans-serif`, color: t.textColor }}>{data.title}</h2>
      <div className="flex justify-center gap-4">
        {units.map((u, i) => (
          <div key={i} className="w-20 h-20 flex flex-col items-center justify-center rounded-xl bg-white shadow-sm border border-black/5" style={{ borderRadius: t.radius }}>
            <span className="text-2xl font-bold" style={{ color: t.primaryColor }}>{String(u.value).padStart(2, "0")}</span>
            <span className="text-[10px] uppercase tracking-wider opacity-50" style={{ color: t.textColor }}>{u.label}</span>
          </div>
        ))}
      </div>
    </motion.section>
  );
}

function FaqItem({ q, a, theme: t }: { q: string; a: string; theme: Props["theme"] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-black/5 rounded-xl overflow-hidden bg-white" style={{ borderRadius: t.radius }}>
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-5 text-left">
        <span className="font-medium text-sm" style={{ color: t.textColor }}>{q}</span>
        <span className="text-lg opacity-40 shrink-0 ml-4">{open ? "−" : "+"}</span>
      </button>
      {open && <div className="px-5 pb-5 text-sm opacity-60" style={{ color: t.textColor }}>{a}</div>}
    </div>
  );
}

function TabsSection({ data, theme: t }: { data: any; theme: Props["theme"] }) {
  const [active, setActive] = useState(0);
  const items = data.items || [];
  return (
    <motion.section {...fadeUp} className="py-16 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex gap-2 mb-8 justify-center flex-wrap">
          {items.map((tab: any, i: number) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className="px-5 py-2.5 text-sm font-medium transition-all"
              style={{
                backgroundColor: active === i ? t.primaryColor : "transparent",
                color: active === i ? "white" : t.textColor,
                borderRadius: t.radius,
                border: active === i ? "none" : `1px solid ${t.textColor}20`,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {items[active] && (
          <div className="p-6 rounded-xl border border-black/5 bg-white" style={{ borderRadius: t.radius, color: t.textColor }}>
            {items[active].content}
          </div>
        )}
      </div>
    </motion.section>
  );
}
