import { useState, useEffect } from "react";
import { useLocation } from "@/hooks/useLocation";
import { MapPin, ChevronRight, Check } from "lucide-react";

export function LocationPickerModal() {
  const { countries, cities, needsSelection, setCountry, setCity, loadCities } = useLocation();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedCountry, setSelectedCountry] = useState<any>(null);

  useEffect(() => {
    if (needsSelection) setOpen(true);
  }, [needsSelection]);

  if (!open) return null;

  const handleCountryPick = (c: any) => {
    setSelectedCountry(c);
    setCountry(c);
    loadCities(c.id);
    setStep(2);
  };

  const handleCityPick = (c: any) => {
    setCity(c);
    setOpen(false);
  };

  const handleSkipCity = () => {
    setOpen(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 transition-opacity duration-300"
        style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
      />

      {/* Card */}
      <div
        className="relative w-full max-w-md mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-300"
        style={{
          background: "#141419",
          borderRadius: "1rem",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 text-center">
          <div
            className="mx-auto mb-4 h-12 w-12 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.05)" }}
          >
            <MapPin size={22} style={{ color: "hsl(var(--primary))" }} />
          </div>
          <h2 className="text-lg font-semibold" style={{ color: "#FFFFFF" }}>
            {step === 1 ? "Choisissez votre pays" : "Choisissez votre ville"}
          </h2>
          <p className="text-sm mt-1" style={{ color: "#6B7280" }}>
            {step === 1
              ? "Pour voir les produits et prix disponibles chez vous"
              : `Villes disponibles au ${selectedCountry?.flag_emoji} ${selectedCountry?.name}`}
          </p>
        </div>

        {/* List */}
        <div className="px-4 pb-4 max-h-[50vh] overflow-y-auto">
          {step === 1 ? (
            <div className="grid grid-cols-2 gap-2">
              {countries.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleCountryPick(c)}
                  className="flex items-center gap-3 px-4 py-3 text-left transition-all duration-200 hover:scale-[1.02]"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    borderRadius: "0.75rem",
                    border: "1px solid rgba(255,255,255,0.05)",
                    color: "#FFFFFF",
                  }}
                >
                  <span className="text-xl">{c.flag_emoji}</span>
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{c.name}</div>
                    <div className="text-xs" style={{ color: "#6B7280" }}>
                      {c.currency_code}
                    </div>
                  </div>
                  <ChevronRight size={14} className="ml-auto shrink-0" style={{ color: "#6B7280" }} />
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {cities.length === 0 ? (
                <p className="text-sm text-center py-6" style={{ color: "#6B7280" }}>
                  Aucune ville disponible
                </p>
              ) : (
                cities.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleCityPick(c)}
                    className="flex items-center justify-between px-4 py-3 text-sm transition-all duration-200"
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      borderRadius: "0.75rem",
                      border: "1px solid rgba(255,255,255,0.05)",
                      color: "#FFFFFF",
                      fontWeight: 500,
                    }}
                  >
                    {c.name}
                    <ChevronRight size={14} style={{ color: "#6B7280" }} />
                  </button>
                ))
              )}
              <button
                onClick={handleSkipCity}
                className="mt-2 text-sm py-2 transition-opacity hover:opacity-70"
                style={{ color: "#6B7280" }}
              >
                Passer cette étape
              </button>
            </div>
          )}
        </div>

        {/* Back button on step 2 */}
        {step === 2 && (
          <div className="px-4 pb-4">
            <button
              onClick={() => setStep(1)}
              className="text-sm transition-opacity hover:opacity-70"
              style={{ color: "hsl(var(--primary))" }}
            >
              ← Changer de pays
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
