import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "@/hooks/useStore";
import { ChevronDown, Plus, Settings, Store, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface StoreSwitcherProps {
  collapsed?: boolean;
}

export function StoreSwitcher({ collapsed }: StoreSwitcherProps) {
  const { store, stores, switchStore } = useStore();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (!store) return null;

  const initials = store.name
    ?.split(" ")
    .map((w: string) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (collapsed) {
    return (
      <button
        onClick={() => setOpen(!open)}
        className="h-8 w-8 rounded-lg flex items-center justify-center text-[11px] font-semibold shrink-0 transition-colors duration-200"
        style={{ background: "hsla(0,0%,100%,0.08)", color: "#F8FAFC" }}
        title={store.name}
      >
        {initials}
      </button>
    );
  }

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors duration-200"
        style={{
          background: open ? "hsla(0,0%,100%,0.08)" : "transparent",
          color: "#F8FAFC",
        }}
        onMouseEnter={(e) => {
          if (!open) e.currentTarget.style.background = "hsla(0,0%,100%,0.04)";
        }}
        onMouseLeave={(e) => {
          if (!open) e.currentTarget.style.background = "transparent";
        }}
      >
        <div
          className="h-8 w-8 rounded-lg flex items-center justify-center text-[11px] font-semibold shrink-0"
          style={{ background: "hsla(0,0%,100%,0.08)", color: "#F8FAFC" }}
        >
          {initials}
        </div>
        <div className="flex-1 min-w-0 text-left">
          <p className="text-[13px] font-semibold truncate">{store.name}</p>
          <p className="text-[11px] truncate" style={{ color: "#6B7280" }}>
            {store.is_active ? "Active" : "Paused"} · {store.currency}
          </p>
        </div>
        <ChevronDown
          size={14}
          className="transition-transform duration-200 shrink-0"
          style={{
            color: "#6B7280",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 top-full mt-1 z-50 rounded-xl overflow-hidden"
            style={{
              background: "#1a1a21",
              border: "1px solid hsla(0,0%,100%,0.08)",
              boxShadow: "0 16px 48px rgba(0,0,0,0.4)",
            }}
          >
            {/* Store list */}
            <div className="py-1.5 max-h-[280px] overflow-y-auto">
              <p className="px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider" style={{ color: "#6B7280" }}>
                Mes boutiques
              </p>
              {stores.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    switchStore(s.id);
                    setOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 transition-colors duration-150"
                  style={{
                    background: s.id === store.id ? "hsla(0,0%,100%,0.06)" : "transparent",
                    color: "#F8FAFC",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "hsla(0,0%,100%,0.08)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background =
                      s.id === store.id ? "hsla(0,0%,100%,0.06)" : "transparent";
                  }}
                >
                  <div
                    className="h-7 w-7 rounded-md flex items-center justify-center text-[10px] font-semibold shrink-0"
                    style={{ background: "hsla(0,0%,100%,0.06)", color: "#F8FAFC" }}
                  >
                    {s.name?.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-[13px] font-medium truncate">{s.name}</p>
                    <p className="text-[10px]" style={{ color: "#6B7280" }}>
                      {s.is_active ? "Active" : "Paused"} · {s.currency}
                    </p>
                  </div>
                  {s.id === store.id && (
                    <Check size={14} style={{ color: "hsl(106 75% 47%)" }} />
                  )}
                </button>
              ))}
            </div>

            {/* Actions */}
            <div
              className="py-1.5"
              style={{ borderTop: "1px solid hsla(0,0%,100%,0.06)" }}
            >
              <button
                onClick={() => {
                  setOpen(false);
                  navigate("/dashboard/stores/new");
                }}
                className="w-full flex items-center gap-3 px-3 py-2 text-[13px] transition-colors duration-150"
                style={{ color: "#9CA3AF" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#F8FAFC";
                  e.currentTarget.style.background = "hsla(0,0%,100%,0.04)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "#9CA3AF";
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <Plus size={14} />
                <span>Créer une boutique</span>
              </button>
              <button
                onClick={() => {
                  setOpen(false);
                  navigate("/dashboard/stores");
                }}
                className="w-full flex items-center gap-3 px-3 py-2 text-[13px] transition-colors duration-150"
                style={{ color: "#9CA3AF" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#F8FAFC";
                  e.currentTarget.style.background = "hsla(0,0%,100%,0.04)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "#9CA3AF";
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <Settings size={14} />
                <span>Gérer mes boutiques</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
