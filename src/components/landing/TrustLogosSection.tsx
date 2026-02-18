import { motion } from "framer-motion";

/* Minimal recognizable SVG logos — monochrome, styled via currentColor */

const MtnLogo = () => (
  <svg viewBox="0 0 80 32" fill="currentColor" className="h-7 w-auto">
    <path d="M4 28V12l10 10 10-10v16h4V4L18 14 8 4H4v24h0zm36 0h4V8h8v20h4V8h8v20h4V4H40v24z" />
  </svg>
);

const OrangeLogo = () => (
  <svg viewBox="0 0 80 32" fill="currentColor" className="h-7 w-auto">
    <circle cx="16" cy="16" r="12" />
    <text x="38" y="22" fontSize="14" fontWeight="700" fontFamily="sans-serif" fill="currentColor">orange</text>
  </svg>
);

const WaveLogo = () => (
  <svg viewBox="0 0 90 32" fill="currentColor" className="h-7 w-auto">
    <path d="M4 20c4-8 8-8 12 0s8 8 12 0 8-8 12 0" strokeWidth="3.5" stroke="currentColor" fill="none" strokeLinecap="round" />
    <text x="46" y="22" fontSize="13" fontWeight="700" fontFamily="sans-serif" fill="currentColor">wave</text>
  </svg>
);

const MoovLogo = () => (
  <svg viewBox="0 0 80 32" fill="currentColor" className="h-7 w-auto">
    <text x="4" y="24" fontSize="18" fontWeight="800" fontFamily="sans-serif" letterSpacing="-0.5">moov</text>
  </svg>
);

const CinetPayLogo = () => (
  <svg viewBox="0 0 100 32" fill="currentColor" className="h-7 w-auto">
    <rect x="2" y="6" width="20" height="20" rx="4" />
    <path d="M8 16l4 4 6-8" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <text x="28" y="22" fontSize="12" fontWeight="700" fontFamily="sans-serif" fill="currentColor">CinetPay</text>
  </svg>
);

const DhlLogo = () => (
  <svg viewBox="0 0 70 32" fill="currentColor" className="h-7 w-auto">
    <text x="4" y="24" fontSize="22" fontWeight="900" fontFamily="sans-serif" letterSpacing="2">DHL</text>
  </svg>
);

const FedExLogo = () => (
  <svg viewBox="0 0 80 32" fill="currentColor" className="h-7 w-auto">
    <text x="4" y="23" fontSize="16" fontWeight="800" fontFamily="sans-serif" letterSpacing="-0.5">FedEx</text>
  </svg>
);

const VisaLogo = () => (
  <svg viewBox="0 0 70 32" fill="currentColor" className="h-7 w-auto">
    <text x="4" y="24" fontSize="20" fontWeight="800" fontFamily="sans-serif" fontStyle="italic" letterSpacing="1">VISA</text>
  </svg>
);

const partners = [
  { name: "MTN Mobile Money", logo: MtnLogo },
  { name: "Orange Money", logo: OrangeLogo },
  { name: "Wave", logo: WaveLogo },
  { name: "Moov Money", logo: MoovLogo },
  { name: "CinetPay", logo: CinetPayLogo },
  { name: "DHL Express", logo: DhlLogo },
  { name: "FedEx", logo: FedExLogo },
  { name: "Visa", logo: VisaLogo },
];

export function TrustLogosSection() {
  return (
    <section className="py-16 border-y border-border/50 bg-muted/30">
      <div className="container">
        <p className="text-center text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground mb-10">
          Ils nous font confiance et nous intègrent
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-8">
          {partners.map((p, i) => (
            <motion.div
              key={p.name}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07, duration: 0.4 }}
              className="text-muted-foreground/50 hover:text-foreground transition-colors duration-300 select-none"
              title={p.name}
            >
              <p.logo />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
