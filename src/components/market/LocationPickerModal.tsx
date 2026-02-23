import { useLocation } from "@/hooks/useLocation";
import { X } from "lucide-react";
import { useEffect, useState } from "react";

/**
 * Non-blocking notification banner that appears when country is auto-detected.
 * Replaces the old full-screen modal. Dismissible and auto-hides after 8s.
 */
export function LocationPickerModal() {
  const { country, showLocationNotif, dismissLocationNotif } = useLocation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (showLocationNotif && country) {
      // Small delay for smoother entrance
      const t = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(t);
    }
  }, [showLocationNotif, country]);

  // Auto-dismiss after 8 seconds
  useEffect(() => {
    if (visible) {
      const t = setTimeout(() => {
        setVisible(false);
        setTimeout(dismissLocationNotif, 300);
      }, 8000);
      return () => clearTimeout(t);
    }
  }, [visible, dismissLocationNotif]);

  if (!showLocationNotif || !country) return null;

  const handleDismiss = () => {
    setVisible(false);
    setTimeout(dismissLocationNotif, 300);
  };

  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[90] transition-all duration-300 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
      }`}
    >
      <div
        className="flex items-center gap-3 pl-4 pr-2 py-2.5 text-sm"
        style={{
          background: "rgba(20,20,25,0.95)",
          backdropFilter: "blur(16px)",
          borderRadius: "0.75rem",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 12px 40px rgba(0,0,0,0.4)",
          color: "#e5e7eb",
        }}
      >
        <span className="text-base">{country.flag_emoji}</span>
        <span>
          Vous naviguez depuis <strong style={{ color: "#FFFFFF" }}>{country.name}</strong>
        </span>
        <button
          onClick={handleDismiss}
          className="ml-1 px-2.5 py-1 text-xs font-medium transition-all duration-200 hover:opacity-80"
          style={{
            color: "hsl(var(--primary))",
          }}
        >
          Modifier
        </button>
        <button
          onClick={handleDismiss}
          className="p-1.5 transition-opacity duration-200 hover:opacity-60"
          style={{ color: "#6B7280" }}
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
