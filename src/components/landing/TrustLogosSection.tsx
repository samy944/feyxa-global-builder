import { motion } from "framer-motion";

const partners = [
  { name: "MTN Mobile Money", abbr: "MTN" },
  { name: "Orange Money", abbr: "OM" },
  { name: "Wave", abbr: "Wave" },
  { name: "Moov Money", abbr: "Moov" },
  { name: "CinetPay", abbr: "CP" },
  { name: "DHL Express", abbr: "DHL" },
  { name: "FedEx", abbr: "FedEx" },
  { name: "Visa", abbr: "Visa" },
];

export function TrustLogosSection() {
  return (
    <section className="py-16 border-y border-border/50 bg-muted/30">
      <div className="container">
        <p className="text-center text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground mb-10">
          Ils nous font confiance et nous intègrent
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6">
          {partners.map((p, i) => (
            <motion.div
              key={p.name}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07, duration: 0.4 }}
              className="flex items-center gap-2 text-muted-foreground/60 hover:text-foreground transition-colors duration-300 select-none"
            >
              <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center text-xs font-bold tracking-tight">
                {p.abbr.slice(0, 2)}
              </div>
              <span className="text-sm font-semibold tracking-tight whitespace-nowrap">
                {p.name}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
