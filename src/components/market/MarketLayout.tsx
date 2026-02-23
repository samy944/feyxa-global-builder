import { MarketNavbar } from "./MarketNavbar";
import { Footer } from "@/components/landing/Footer";

export function MarketLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen dark" style={{ background: "#111114" }}>
      <MarketNavbar />
      <main className="pt-14">{children}</main>
      <Footer />
    </div>
  );
}
