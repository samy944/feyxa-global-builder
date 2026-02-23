import { useState, useRef, useEffect } from "react";
import { useLocation } from "@/hooks/useLocation";
import { MapPin, ChevronDown, Check } from "lucide-react";

export function LocationSelector() {
  const { country, city, countries, cities, setCountry, setCity, loadCities } = useLocation();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"country" | "city">("country");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (!country) return null;

  const handleCountrySwitch = (c: any) => {
    setCountry(c);
    loadCities(c.id);
    setView("city");
  };

  const handleCitySwitch = (c: any) => {
    setCity(c);
    setOpen(false);
    setView("country");
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => { setOpen(!open); setView("country"); }}
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs transition-opacity duration-200 hover:opacity-70"
        style={{
          background: "rgba(255,255,255,0.05)",
          borderRadius: "0.5rem",
          border: "1px solid rgba(255,255,255,0.06)",
          color: "#9CA3AF",
          fontWeight: 500,
        }}
      >
        <span className="text-sm">{country.flag_emoji}</span>
        <span className="hidden sm:inline">{city ? city.name : country.name}</span>
        <ChevronDown size={12} />
      </button>

      {open && (
        <div
          className="absolute top-full mt-2 right-0 w-64 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-50"
          style={{
            background: "#1A1A1F",
            borderRadius: "0.75rem",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
          }}
        >
          {view === "country" ? (
            <>
              <div className="px-3 py-2 text-xs font-medium" style={{ color: "#6B7280", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                Pays
              </div>
              <div className="max-h-60 overflow-y-auto py-1">
                {countries.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleCountrySwitch(c)}
                    className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-left transition-colors duration-150"
                    style={{
                      color: c.id === country.id ? "#FFFFFF" : "#9CA3AF",
                      background: c.id === country.id ? "rgba(255,255,255,0.05)" : "transparent",
                    }}
                  >
                    <span>{c.flag_emoji}</span>
                    <span className="flex-1 font-medium">{c.name}</span>
                    <span className="text-xs" style={{ color: "#6B7280" }}>{c.currency_code}</span>
                    {c.id === country.id && <Check size={14} style={{ color: "hsl(var(--primary))" }} />}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="px-3 py-2 text-xs font-medium flex items-center gap-2" style={{ color: "#6B7280", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <button onClick={() => setView("country")} className="hover:opacity-70" style={{ color: "hsl(var(--primary))" }}>←</button>
                Villes — {country.flag_emoji} {country.name}
              </div>
              <div className="max-h-60 overflow-y-auto py-1">
                {cities.length === 0 ? (
                  <p className="px-3 py-4 text-xs text-center" style={{ color: "#6B7280" }}>Aucune ville</p>
                ) : (
                  cities.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => handleCitySwitch(c)}
                      className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-left transition-colors duration-150"
                      style={{
                        color: city?.id === c.id ? "#FFFFFF" : "#9CA3AF",
                        background: city?.id === c.id ? "rgba(255,255,255,0.05)" : "transparent",
                      }}
                    >
                      <MapPin size={13} />
                      <span className="flex-1 font-medium">{c.name}</span>
                      {city?.id === c.id && <Check size={14} style={{ color: "hsl(var(--primary))" }} />}
                    </button>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
