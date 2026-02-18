import { motion } from "framer-motion";
import { DeviceShowcase } from "./DeviceShowcase";

export function ShowcaseSection() {
  return (
    <section className="relative py-20 lg:py-28 bg-background overflow-hidden">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-12"
        >
          <p className="text-sm font-medium tracking-widest uppercase text-primary mb-4">
            Votre boutique, partout
          </p>
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl text-foreground">
            UN DESIGN QUI
            <br />
            <span className="text-gradient">S'ADAPTE.</span>
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ delay: 0.2, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <DeviceShowcase />
        </motion.div>
      </div>
    </section>
  );
}
