import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLocation } from "@/hooks/useLocation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
  Check,
  Package,
  Clock,
  Store,
  Star,
  Phone,
  User,
  Plus,
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
  full_name: string | null;
  phone: string | null;
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

export type DeliveryMethod = "home" | "relay" | "collect";

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
  deliveryMethod: DeliveryMethod;
  relayPointId?: string;
  relayPointName?: string;
}

interface Props {
  storeIds: string[];
  userId: string | null;
  onDeliveryChange: (data: DeliveryData) => void;
  totalWeight?: number;
}

const EXPRESS_MULTIPLIER = 1.5;

/* Fake relay points placeholder */
const RELAY_POINTS = [
  { id: "rp1", name: "Relais Express — Cotonou Centre", address: "123 Blvd St-Michel, Cotonou", hours: "Lun–Sam 8h–20h" },
  { id: "rp2", name: "Point Relais Ganhi", address: "45 Rue du Commerce, Ganhi", hours: "Lun–Ven 9h–18h" },
  { id: "rp3", name: "Relais Dantokpa Market", address: "Marché Dantokpa, Stand B12", hours: "Tous les jours 7h–19h" },
  { id: "rp4", name: "Relais Akpakpa", address: "Carrefour Akpakpa, Cotonou", hours: "Lun–Sam 8h–19h" },
];

export default function DeliverySection({ storeIds, userId, onDeliveryChange, totalWeight = 0 }: Props) {
  const { countries: locCountries, country: locCountry } = useLocation();

  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("home");
  const [selectedRelay, setSelectedRelay] = useState("");

  const [mode, setMode] = useState<"manual" | "gps">("manual");
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const [countries, setCountries] = useState<Country[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCountryId, setSelectedCountryId] = useState("");
  const [selectedCityId, setSelectedCityId] = useState("");
  const [quarter, setQuarter] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  const [shippingMode, setShippingMode] = useState<"standard" | "express">("standard");

  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [baseFee, setBaseFee] = useState(0);
  const [computedFee, setComputedFee] = useState(0);

  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [savingAddress, setSavingAddress] = useState(false);

  // Address book selection mode
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showManualForm, setShowManualForm] = useState(false);

  // Load countries
  useEffect(() => {
    if (locCountries.length > 0) {
      setCountries(locCountries);
      if (locCountry && !selectedCountryId) {
        setSelectedCountryId(locCountry.id);
      }
    }
  }, [locCountries, locCountry]);

  // Load cities
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

  // Load delivery zones
  useEffect(() => {
    if (storeIds.length === 0) return;
    supabase
      .from("delivery_zones")
      .select("*")
      .in("store_id", storeIds)
      .eq("is_active", true)
      .then(({ data }) => setZones((data || []) as DeliveryZone[]));
  }, [storeIds]);

  // Saved addresses
  useEffect(() => {
    if (!userId) return;
    supabase
      .from("saved_addresses")
      .select("*")
      .eq("user_id", userId)
      .order("is_default", { ascending: false })
      .then(({ data }) => {
        const addrs = (data || []) as SavedAddress[];
        setSavedAddresses(addrs);
        // Pre-select default address
        const defaultAddr = addrs.find((a) => a.is_default);
        if (defaultAddr && !selectedAddressId && !showManualForm) {
          setSelectedAddressId(defaultAddr.id);
          applyAddressData(defaultAddr);
        }
      });
  }, [userId]);

  const applyAddressData = (addr: SavedAddress) => {
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

  // Calculate fees
  useEffect(() => {
    if (deliveryMethod === "collect") {
      setBaseFee(0);
      setComputedFee(0);
      return;
    }
    if (deliveryMethod === "relay") {
      setBaseFee(1500);
      setComputedFee(shippingMode === "express" ? Math.round(1500 * EXPRESS_MULTIPLIER) : 1500);
      return;
    }

    const cityName = cities.find((c) => c.id === selectedCityId)?.name || "";
    if (!cityName || zones.length === 0) {
      setBaseFee(0);
      setComputedFee(0);
      return;
    }

    let totalFee = 0;
    const storeSet = new Set(storeIds);
    for (const sid of storeSet) {
      const storeZones = zones.filter((z) => z.store_id === sid);
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
        const cheapest = storeZones.reduce((a, b) => (a.fee < b.fee ? a : b));
        totalFee += cheapest.fee;
      }
    }

    const weightKg = totalWeight / 1000;
    if (weightKg > 5) {
      totalFee += Math.ceil(weightKg - 5) * 500;
    }

    setBaseFee(totalFee);
    const finalFee = shippingMode === "express" ? Math.round(totalFee * EXPRESS_MULTIPLIER) : totalFee;
    setComputedFee(finalFee);
  }, [selectedCityId, cities, zones, storeIds, quarter, shippingMode, totalWeight, deliveryMethod]);

  // Notify parent
  useEffect(() => {
    const countryObj = countries.find((c) => c.id === selectedCountryId);
    const cityObj = cities.find((c) => c.id === selectedCityId);
    const relay = RELAY_POINTS.find((r) => r.id === selectedRelay);
    onDeliveryChange({
      countryId: selectedCountryId,
      countryName: countryObj?.name || "",
      cityId: selectedCityId,
      cityName: deliveryMethod === "collect" ? "Click & Collect" : deliveryMethod === "relay" ? (relay?.name || "") : (cityObj?.name || ""),
      quarter,
      address: deliveryMethod === "relay" ? (relay?.address || "") : address,
      notes,
      latitude,
      longitude,
      shippingMode,
      shippingFee: computedFee,
      deliveryMethod,
      relayPointId: selectedRelay || undefined,
      relayPointName: relay?.name || undefined,
    });
  }, [selectedCountryId, selectedCityId, quarter, address, notes, latitude, longitude, shippingMode, computedFee, countries, cities, deliveryMethod, selectedRelay]);

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
        try {
          const resp = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json&accept-language=fr`,
            { signal: AbortSignal.timeout(5000) }
          );
          if (resp.ok) {
            const geo = await resp.json();
            const addr = geo.address || {};
            const countryCode = addr.country_code?.toUpperCase();
            if (countryCode) {
              const match = countries.find((c) => c.code === countryCode);
              if (match) setSelectedCountryId(match.id);
            }
            const cityName = addr.city || addr.town || addr.village || addr.county || "";
            if (cityName) {
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
          // silently fail
        }
        setGpsLoading(false);
        setMode("manual");
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

  const handleSelectAddress = (addrId: string) => {
    setSelectedAddressId(addrId);
    setShowManualForm(false);
    const addr = savedAddresses.find((a) => a.id === addrId);
    if (addr) applyAddressData(addr);
  };

  const handleNewAddressClick = () => {
    setSelectedAddressId(null);
    setShowManualForm(true);
    // Reset form fields
    setQuarter("");
    setAddress("");
    setNotes("");
    setLatitude(null);
    setLongitude(null);
  };

  const selectedCountry = countries.find((c) => c.id === selectedCountryId);
  const formatFee = (f: number) =>
    selectedCountry?.currency_code === "XOF" || !selectedCountry
      ? `${f.toLocaleString("fr-FR")} FCFA`
      : `€${f.toFixed(2)}`;

  // Whether to show the address book selector (logged in user with addresses, home delivery)
  const hasAddressBook = userId && savedAddresses.length > 0 && deliveryMethod === "home";

  /* ── Manual form (extracted for reuse) ── */
  const renderManualForm = () => (
    <div className="space-y-5">
      {/* Location mode toggle */}
      <div className="flex gap-2">
        <Button type="button" variant={mode === "gps" ? "default" : "outline"} size="sm" className="flex-1" onClick={handleGPS} disabled={gpsLoading}>
          {gpsLoading ? <Loader2 size={14} className="animate-spin" /> : <Navigation size={14} />}
          {gpsLoading ? "Détection…" : "📍 Ma position GPS"}
        </Button>
        <Button type="button" variant={mode === "manual" ? "default" : "outline"} size="sm" className="flex-1" onClick={() => setMode("manual")}>
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

      {/* Country */}
      <div className="space-y-1.5">
        <Label>Pays *</Label>
        <Select value={selectedCountryId} onValueChange={setSelectedCountryId}>
          <SelectTrigger><SelectValue placeholder="Sélectionner un pays" /></SelectTrigger>
          <SelectContent>
            {countries.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.flag_emoji} {c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* City */}
      <div className="space-y-1.5">
        <Label>Ville *</Label>
        <Select value={selectedCityId} onValueChange={setSelectedCityId} disabled={cities.length === 0}>
          <SelectTrigger><SelectValue placeholder={cities.length === 0 ? "Sélectionnez d'abord un pays" : "Sélectionner une ville"} /></SelectTrigger>
          <SelectContent>
            {cities.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
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

      {/* Delivery speed */}
      <div className="space-y-3 pt-2">
        <Label className="text-xs text-muted-foreground uppercase tracking-wider">Mode de livraison</Label>
        <RadioGroup value={shippingMode} onValueChange={(v) => setShippingMode(v as "standard" | "express")} className="grid grid-cols-2 gap-3">
          <label className={`flex flex-col items-center gap-2 p-4 rounded-xl border cursor-pointer transition-all ${shippingMode === "standard" ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}>
            <RadioGroupItem value="standard" className="sr-only" />
            <Truck size={20} className={shippingMode === "standard" ? "text-primary" : "text-muted-foreground"} />
            <span className="text-sm font-medium text-foreground">Standard</span>
            <span className="text-xs text-muted-foreground">2-5 jours</span>
            {baseFee > 0 && <span className="text-xs font-semibold text-foreground">{formatFee(baseFee)}</span>}
          </label>
          <label className={`flex flex-col items-center gap-2 p-4 rounded-xl border cursor-pointer transition-all ${shippingMode === "express" ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}>
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
    </div>
  );

  return (
    <div className="space-y-5">
      <h2 className="font-heading text-lg tracking-wide text-foreground">LIVRAISON</h2>

      {/* ── Delivery method tabs ── */}
      <Tabs value={deliveryMethod} onValueChange={(v) => setDeliveryMethod(v as DeliveryMethod)} className="w-full">
        <TabsList className="w-full grid grid-cols-3 h-auto p-1">
          <TabsTrigger value="home" className="flex items-center gap-1.5 py-2.5 text-xs sm:text-sm">
            <Truck size={14} />
            <span className="hidden sm:inline">Livraison</span> à domicile
          </TabsTrigger>
          <TabsTrigger value="relay" className="flex items-center gap-1.5 py-2.5 text-xs sm:text-sm">
            <Package size={14} />
            Point Relais
          </TabsTrigger>
          <TabsTrigger value="collect" className="flex items-center gap-1.5 py-2.5 text-xs sm:text-sm">
            <Store size={14} />
            Click & Collect
          </TabsTrigger>
        </TabsList>

        {/* ── HOME DELIVERY ── */}
        <TabsContent value="home" className="space-y-5 pt-4">
          {/* Address Book Selector */}
          {hasAddressBook && !showManualForm ? (
            <div className="space-y-3">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Choisir une adresse enregistrée</Label>
              <RadioGroup
                value={selectedAddressId || ""}
                onValueChange={handleSelectAddress}
                className="space-y-2"
              >
                {savedAddresses.map((sa) => (
                  <label
                    key={sa.id}
                    className={`relative flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedAddressId === sa.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/30"
                    }`}
                  >
                    <RadioGroupItem value={sa.id} className="mt-0.5" />
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-foreground">{sa.full_name || sa.label}</p>
                        {sa.is_default && (
                          <Badge variant="default" className="text-[10px]">
                            <Star size={8} className="mr-0.5" />
                            Par défaut
                          </Badge>
                        )}
                      </div>
                      {sa.phone && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Phone size={10} /> {sa.phone}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground flex items-start gap-1">
                        <MapPin size={10} className="mt-0.5 shrink-0" />
                        <span>{[sa.city_name, sa.quarter, sa.address].filter(Boolean).join(", ")}</span>
                      </p>
                    </div>
                    {selectedAddressId === sa.id && (
                      <div className="absolute top-3 right-3 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                        <Check size={12} className="text-primary-foreground" />
                      </div>
                    )}
                  </label>
                ))}
              </RadioGroup>

              {/* New address option */}
              <button
                type="button"
                onClick={handleNewAddressClick}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed border-border text-sm text-muted-foreground hover:border-primary/40 hover:text-foreground transition-all"
              >
                <Plus size={14} />
                Saisir une nouvelle adresse
              </button>

              {/* Delivery speed (still needed) */}
              {selectedAddressId && (
                <div className="space-y-3 pt-2">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">Mode de livraison</Label>
                  <RadioGroup value={shippingMode} onValueChange={(v) => setShippingMode(v as "standard" | "express")} className="grid grid-cols-2 gap-3">
                    <label className={`flex flex-col items-center gap-2 p-4 rounded-xl border cursor-pointer transition-all ${shippingMode === "standard" ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}>
                      <RadioGroupItem value="standard" className="sr-only" />
                      <Truck size={20} className={shippingMode === "standard" ? "text-primary" : "text-muted-foreground"} />
                      <span className="text-sm font-medium text-foreground">Standard</span>
                      <span className="text-xs text-muted-foreground">2-5 jours</span>
                      {baseFee > 0 && <span className="text-xs font-semibold text-foreground">{formatFee(baseFee)}</span>}
                    </label>
                    <label className={`flex flex-col items-center gap-2 p-4 rounded-xl border cursor-pointer transition-all ${shippingMode === "express" ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}>
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
              )}
            </div>
          ) : (
            <>
              {/* Back to address book link */}
              {hasAddressBook && showManualForm && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-xs mb-2"
                  onClick={() => {
                    setShowManualForm(false);
                    const def = savedAddresses.find((a) => a.is_default) || savedAddresses[0];
                    if (def) {
                      setSelectedAddressId(def.id);
                      applyAddressData(def);
                    }
                  }}
                >
                  <MapPin size={12} />
                  ← Choisir une adresse enregistrée
                </Button>
              )}
              {renderManualForm()}
            </>
          )}
        </TabsContent>

        {/* ── RELAY POINT ── */}
        <TabsContent value="relay" className="space-y-4 pt-4">
          <p className="text-sm text-muted-foreground">Choisissez un point relais près de chez vous pour récupérer votre commande.</p>

          <RadioGroup value={selectedRelay} onValueChange={setSelectedRelay} className="space-y-2">
            {RELAY_POINTS.map((rp) => (
              <label
                key={rp.id}
                className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${selectedRelay === rp.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}
              >
                <RadioGroupItem value={rp.id} className="mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{rp.name}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <MapPin size={10} /> {rp.address}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Clock size={10} /> {rp.hours}
                  </p>
                </div>
              </label>
            ))}
          </RadioGroup>

          {/* Delivery speed for relay */}
          <div className="space-y-3 pt-2">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Vitesse de livraison</Label>
            <RadioGroup value={shippingMode} onValueChange={(v) => setShippingMode(v as "standard" | "express")} className="grid grid-cols-2 gap-3">
              <label className={`flex flex-col items-center gap-2 p-4 rounded-xl border cursor-pointer transition-all ${shippingMode === "standard" ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}>
                <RadioGroupItem value="standard" className="sr-only" />
                <Truck size={20} className={shippingMode === "standard" ? "text-primary" : "text-muted-foreground"} />
                <span className="text-sm font-medium text-foreground">Standard</span>
                <span className="text-xs text-muted-foreground">3-5 jours</span>
                <span className="text-xs font-semibold text-foreground">{formatFee(1500)}</span>
              </label>
              <label className={`flex flex-col items-center gap-2 p-4 rounded-xl border cursor-pointer transition-all ${shippingMode === "express" ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}>
                <RadioGroupItem value="express" className="sr-only" />
                <Zap size={20} className={shippingMode === "express" ? "text-primary" : "text-muted-foreground"} />
                <span className="text-sm font-medium text-foreground">Express</span>
                <span className="text-xs text-muted-foreground">24-48h</span>
                <span className="text-xs font-semibold text-foreground">{formatFee(Math.round(1500 * EXPRESS_MULTIPLIER))}</span>
              </label>
            </RadioGroup>
          </div>
        </TabsContent>

        {/* ── CLICK & COLLECT ── */}
        <TabsContent value="collect" className="space-y-4 pt-4">
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Store size={18} className="text-primary" />
              <p className="text-sm font-medium text-foreground">Retrait en boutique</p>
            </div>
            <p className="text-sm text-muted-foreground">
              Récupérez votre commande directement auprès du vendeur. Vous serez contacté(e) par téléphone dès que votre commande sera prête.
            </p>
            <div className="flex items-center gap-2 text-xs text-primary font-medium">
              <Check size={14} />
              Retrait gratuit — 0 frais de livraison
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Instructions (optionnel)</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Horaires de passage préférés…" rows={2} />
          </div>
        </TabsContent>
      </Tabs>

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
      {deliveryMethod === "collect" && (
        <div className="flex items-center justify-between bg-secondary rounded-xl p-4">
          <div className="flex items-center gap-2 text-sm text-foreground">
            <Store size={16} className="text-primary" />
            Retrait en boutique
          </div>
          <span className="font-semibold text-primary">Gratuit</span>
        </div>
      )}
    </div>
  );
}
