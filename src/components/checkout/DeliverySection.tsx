import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLocation } from "@/hooks/useLocation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MapPin,
  Navigation,
  Loader2,
  Truck,
  Zap,
  BookmarkPlus,
  ChevronDown,
  Check,
} from "lucide-react";

/* ── Types ── */
interface Country {
  id: string;
  code: string;
  name: string;
  currency_code: string;
  flag_emoji: string;
}
interface City {
  id: string;
  country_id: string;
  name: string;
}
interface SavedAddress {
  id: string;
  label: string;
  country_id: string | null;
  city_id: string | null;
  city_name: string | null;
  quarter: string | null;
  address: string | null;
  notes: string | null;
  latitude: number | null;
  longitude: number | null;
  is_default: boolean;
}
interface DeliveryZone {
  id: string;
  store_id: string;
  name: string;
  cities: string[] | null;
  quarters: string[] | null;
  fee: number;
  is_active: boolean;
}

export interface DeliveryData {
  countryId: string;
  countryName: string;
  cityId: string;
  cityName: string;
  quarter: string;
  address: string;
  notes: string;
  latitude: number | null;
  longitude: number | null;
  shippingMode: "standard" | "express";
  shippingFee: number;
}

interface Props {
  storeIds: string[];
  userId: string | null;
  onDeliveryChange: (data: DeliveryData) => void;
  totalWeight?: number;
}

const EXPRESS_MULTIPLIER = 1.5;

export default function DeliverySection({ storeIds, userId, onDeliveryChange, totalWeight = 0 }: Props) {
  const { countries: locCountries, country: locCountry } = useLocation();

  const [mode, setMode] = useState<"manual" | "gps">("manual");
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Address fields
  const [countries, setCountries] = useState<Country[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCountryId, setSelectedCountryId] = useState("");
  const [selectedCityId, setSelectedCityId] = useState("");
  const [quarter, setQuarter] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  // Delivery mode
  const [shippingMode, setShippingMode] = useState<"standard" | "express">("standard");

  // Fees
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [baseFee, setBaseFee] = useState(0);
  const [computedFee, setComputedFee] = useState(0);

  // Saved addresses
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [savingAddress, setSavingAddress] = useState(false);

  // Load countries from location context
  useEffect(() => {
    if (locCountries.length > 0) {
      setCountries(locCountries);
      if (locCountry && !selectedCountryId) {
        setSelectedCountryId(locCountry.id);
      }
    }
  }, [locCountries, locCountry]);

  // Load cities when country changes
  useEffect(() => {
    if (!selectedCountryId) return;
    supabase
      .from("cities")
      .select("id, country_id, name")
      .eq("country_id", selectedCountryId)
      .eq("is_active", true)
      .order("sort_order")
      .then(({ data }) => {
        setCities((data || []) as City[]);
        setSelectedCityId("");
      });
  }, [selectedCountryId]);

  // Load delivery zones for all stores in cart
  useEffect(() => {
    if (storeIds.length === 0) return;
    supabase
      .from("delivery_zones")
      .select("*")
      .in("store_id", storeIds)
      .eq("is_active", true)
      .then(({ data }) => setZones((data || []) as DeliveryZone[]));
  }, [storeIds]);

  // Load saved addresses for logged-in user
  useEffect(() => {
    if (!userId) return;
    supabase
      .from("saved_addresses")
      .select("*")
      .eq("user_id", userId)
      .order("is_default", { ascending: false })
      .then(({ data }) => setSavedAddresses((data || []) as SavedAddress[]));
  }, [userId]);

  // Calculate fees when city/mode changes
  useEffect(() => {
    const cityName = cities.find((c) => c.id === selectedCityId)?.name || "";
    if (!cityName || zones.length === 0) {
      setBaseFee(0);
      setComputedFee(0);
      return;
    }

    // Find matching zone per store, sum fees
    let totalFee = 0;
    const storeSet = new Set(storeIds);
    for (const sid of storeSet) {
      const storeZones = zones.filter((z) => z.store_id === sid);
      // Match by city name (case-insensitive)
      const match =
        storeZones.find((z) =>
          z.cities?.some((c) => c.toLowerCase() === cityName.toLowerCase())
        ) ||
        storeZones.find((z) =>
          z.quarters?.some((q) => q.toLowerCase() === (quarter || "").toLowerCase())
        );
      if (match) {
        totalFee += match.fee;
      } else if (storeZones.length > 0) {
        // Fallback to cheapest zone
        const cheapest = storeZones.reduce((a, b) => (a.fee < b.fee ? a : b));
        totalFee += cheapest.fee;
      }
    }

    // Weight surcharge: +500 per kg above 5kg
    const weightKg = totalWeight / 1000;
    if (weightKg > 5) {
      totalFee += Math.ceil(weightKg - 5) * 500;
    }

    setBaseFee(totalFee);
    const finalFee = shippingMode === "express" ? Math.round(totalFee * EXPRESS_MULTIPLIER) : totalFee;
    setComputedFee(finalFee);
  }, [selectedCityId, cities, zones, storeIds, quarter, shippingMode, totalWeight]);

  // Notify parent
  useEffect(() => {
    const countryObj = countries.find((c) => c.id === selectedCountryId);
    const cityObj = cities.find((c) => c.id === selectedCityId);
    onDeliveryChange({
      countryId: selectedCountryId,
      countryName: countryObj?.name || "",
      cityId: selectedCityId,
      cityName: cityObj?.name || "",
      quarter,
      address,
      notes,
      latitude,
      longitude,
      shippingMode,
      shippingFee: computedFee,
    });
  }, [selectedCountryId, selectedCityId, quarter, address, notes, latitude, longitude, shippingMode, computedFee, countries, cities]);

  // GPS
  const handleGPS = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsError("La géolocalisation n'est pas supportée par votre navigateur.");
      return;
    }
    setGpsLoading(true);
    setGpsError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
        // Reverse geocode
        try {
          const resp = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json&accept-language=fr`,
            { signal: AbortSignal.timeout(5000) }
          );
          if (resp.ok) {
            const geo = await resp.json();
            const addr = geo.address || {};
            // Try to match country
            const countryCode = addr.country_code?.toUpperCase();
            if (countryCode) {
              const match = countries.find((c) => c.code === countryCode);
              if (match) setSelectedCountryId(match.id);
            }
            // Set city name and try to match
            const cityName = addr.city || addr.town || addr.village || addr.county || "";
            if (cityName) {
              // Wait a tick for cities to load
              setTimeout(() => {
                setCities((prev) => {
                  const cityMatch = prev.find((c) => c.name.toLowerCase() === cityName.toLowerCase());
                  if (cityMatch) setSelectedCityId(cityMatch.id);
                  return prev;
                });
              }, 500);
            }
            setQuarter(addr.suburb || addr.neighbourhood || "");
            setAddress(geo.display_name?.split(",").slice(0, 3).join(",") || "");
          }
        } catch {
          // silently fail reverse geocode
        }
        setGpsLoading(false);
        setMode("manual"); // Switch to manual to show filled fields
      },
      (err) => {
        setGpsLoading(false);
        setGpsError(
          err.code === 1
            ? "Accès à la position refusé. Veuillez autoriser la géolocalisation."
            : "Impossible d'obtenir votre position."
        );
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [countries]);

  // Apply saved address
  const applySavedAddress = (addr: SavedAddress) => {
    if (addr.country_id) setSelectedCountryId(addr.country_id);
    if (addr.city_id) {
      setTimeout(() => setSelectedCityId(addr.city_id!), 300);
    }
    setQuarter(addr.quarter || "");
    setAddress(addr.address || "");
    setNotes(addr.notes || "");
    setLatitude(addr.latitude);
    setLongitude(addr.longitude);
  };

  // Save current address
  const handleSaveAddress = async () => {
    if (!userId) return;
    setSavingAddress(true);
    try {
      const cityObj = cities.find((c) => c.id === selectedCityId);
      await supabase.from("saved_addresses").insert({
        user_id: userId,
        label: `${cityObj?.name || "Adresse"} - ${quarter || "principale"}`,
        country_id: selectedCountryId || null,
        city_id: selectedCityId || null,
        city_name: cityObj?.name || null,
        quarter: quarter || null,
        address: address || null,
        notes: notes || null,
        latitude,
        longitude,
        is_default: savedAddresses.length === 0,
      });
      // Refresh
      const { data } = await supabase
        .from("saved_addresses")
        .select("*")
        .eq("user_id", userId)
        .order("is_default", { ascending: false });
      setSavedAddresses((data || []) as SavedAddress[]);
    } catch {
      // silent
    }
    setSavingAddress(false);
  };

  const selectedCountry = countries.find((c) => c.id === selectedCountryId);
  const selectedCity = cities.find((c) => c.id === selectedCityId);
  const formatFee = (f: number) =>
    selectedCountry?.currency_code === "XOF" || !selectedCountry
      ? `${f.toLocaleString("fr-FR")} FCFA`
      : `€${f.toFixed(2)}`;

  return (
    <div className="space-y-5">
      <h2 className="font-heading text-lg tracking-wide text-foreground">ADRESSE DE LIVRAISON</h2>

      {/* Location mode toggle */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant={mode === "gps" ? "default" : "outline"}
          size="sm"
          className="flex-1"
          onClick={handleGPS}
          disabled={gpsLoading}
        >
          {gpsLoading ? <Loader2 size={14} className="animate-spin" /> : <Navigation size={14} />}
          {gpsLoading ? "Détection…" : "📍 Ma position GPS"}
        </Button>
        <Button
          type="button"
          variant={mode === "manual" ? "default" : "outline"}
          size="sm"
          className="flex-1"
          onClick={() => setMode("manual")}
        >
          <MapPin size={14} />
          Saisie manuelle
        </Button>
      </div>
      {gpsError && <p className="text-xs text-destructive">{gpsError}</p>}
      {latitude && longitude && (
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Check size={12} className="text-primary" />
          Position GPS enregistrée ({latitude.toFixed(4)}, {longitude.toFixed(4)})
        </p>
      )}

      {/* Saved addresses */}
      {savedAddresses.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground uppercase tracking-wider">Adresses sauvegardées</Label>
          <div className="flex gap-2 flex-wrap">
            {savedAddresses.map((sa) => (
              <Button
                key={sa.id}
                type="button"
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => applySavedAddress(sa)}
              >
                <MapPin size={12} />
                {sa.label}
                {sa.is_default && <span className="text-primary ml-1">★</span>}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Country */}
      <div className="space-y-1.5">
        <Label>Pays *</Label>
        <Select value={selectedCountryId} onValueChange={setSelectedCountryId}>
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner un pays" />
          </SelectTrigger>
          <SelectContent>
            {countries.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.flag_emoji} {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* City */}
      <div className="space-y-1.5">
        <Label>Ville *</Label>
        <Select value={selectedCityId} onValueChange={setSelectedCityId} disabled={cities.length === 0}>
          <SelectTrigger>
            <SelectValue placeholder={cities.length === 0 ? "Sélectionnez d'abord un pays" : "Sélectionner une ville"} />
          </SelectTrigger>
          <SelectContent>
            {cities.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Quarter + Address */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Quartier</Label>
          <Input value={quarter} onChange={(e) => setQuarter(e.target.value)} placeholder="Ganhi, Zogbo…" />
        </div>
        <div className="space-y-1.5">
          <Label>Adresse / Repère</Label>
          <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Près du marché…" />
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-1.5">
        <Label>Instructions de livraison</Label>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Étage, code porte, horaires préférés…" rows={2} />
      </div>

      {/* Save address */}
      {userId && selectedCityId && (
        <Button type="button" variant="ghost" size="sm" className="text-xs" onClick={handleSaveAddress} disabled={savingAddress}>
          {savingAddress ? <Loader2 size={12} className="animate-spin" /> : <BookmarkPlus size={12} />}
          Sauvegarder cette adresse
        </Button>
      )}

      {/* Delivery mode */}
      <div className="space-y-3 pt-2">
        <Label className="text-xs text-muted-foreground uppercase tracking-wider">Mode de livraison</Label>
        <RadioGroup value={shippingMode} onValueChange={(v) => setShippingMode(v as "standard" | "express")} className="grid grid-cols-2 gap-3">
          <label
            className={`flex flex-col items-center gap-2 p-4 rounded-xl border cursor-pointer transition-all ${
              shippingMode === "standard" ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
            }`}
          >
            <RadioGroupItem value="standard" className="sr-only" />
            <Truck size={20} className={shippingMode === "standard" ? "text-primary" : "text-muted-foreground"} />
            <span className="text-sm font-medium text-foreground">Standard</span>
            <span className="text-xs text-muted-foreground">2-5 jours</span>
            {baseFee > 0 && <span className="text-xs font-semibold text-foreground">{formatFee(baseFee)}</span>}
          </label>
          <label
            className={`flex flex-col items-center gap-2 p-4 rounded-xl border cursor-pointer transition-all ${
              shippingMode === "express" ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
            }`}
          >
            <RadioGroupItem value="express" className="sr-only" />
            <Zap size={20} className={shippingMode === "express" ? "text-primary" : "text-muted-foreground"} />
            <span className="text-sm font-medium text-foreground">Express</span>
            <span className="text-xs text-muted-foreground">24-48h</span>
            {baseFee > 0 && (
              <span className="text-xs font-semibold text-foreground">{formatFee(Math.round(baseFee * EXPRESS_MULTIPLIER))}</span>
            )}
          </label>
        </RadioGroup>
      </div>

      {/* Fee preview */}
      {computedFee > 0 && (
        <div className="flex items-center justify-between bg-secondary rounded-xl p-4">
          <div className="flex items-center gap-2 text-sm text-foreground">
            <Truck size={16} className="text-primary" />
            Frais de livraison
          </div>
          <span className="font-semibold text-foreground">{formatFee(computedFee)}</span>
        </div>
      )}
    </div>
  );
}
