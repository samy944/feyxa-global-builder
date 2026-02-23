import { useState, useEffect, createContext, useContext, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

const COUNTRY_KEY = "feyxa_country_id";
const CITY_KEY = "feyxa_city_id";
const NOTIF_DISMISSED_KEY = "feyxa_location_notif_dismissed";

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

interface LocationCtx {
  country: Country | null;
  city: City | null;
  countries: Country[];
  cities: City[];
  loading: boolean;
  autoDetected: boolean;
  showLocationNotif: boolean;
  dismissLocationNotif: () => void;
  setCountry: (c: Country) => void;
  setCity: (c: City) => void;
  loadCities: (countryId: string) => Promise<void>;
}

const LocationContext = createContext<LocationCtx | undefined>(undefined);

// Default fallback country code
const DEFAULT_COUNTRY_CODE = "BJ";

export function LocationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [country, setCountryState] = useState<Country | null>(null);
  const [city, setCityState] = useState<City | null>(null);
  const [countries, setCountries] = useState<Country[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoDetected, setAutoDetected] = useState(false);
  const [showLocationNotif, setShowLocationNotif] = useState(false);

  // Load countries + auto-detect
  useEffect(() => {
    supabase
      .from("countries")
      .select("id, code, name, currency_code, flag_emoji")
      .eq("is_active", true)
      .order("sort_order")
      .then(async ({ data }) => {
        const list = (data || []) as Country[];
        setCountries(list);

        // 1. Check localStorage first
        const savedCountryId = localStorage.getItem(COUNTRY_KEY);
        const savedCityId = localStorage.getItem(CITY_KEY);

        if (savedCountryId) {
          const found = list.find((c) => c.id === savedCountryId);
          if (found) {
            setCountryState(found);
            loadCitiesInternal(found.id).then((cityList) => {
              if (savedCityId) {
                const foundCity = cityList.find((c) => c.id === savedCityId);
                if (foundCity) setCityState(foundCity);
              }
            });
            setLoading(false);
            return;
          }
        }

        // 2. Auto-detect via IP geolocation (free API)
        let detectedCode: string | null = null;
        try {
          const resp = await fetch("https://ipapi.co/json/", { signal: AbortSignal.timeout(3000) });
          if (resp.ok) {
            const geo = await resp.json();
            detectedCode = geo.country_code;
          }
        } catch {
          // Silently fail, use fallback
        }

        // 3. Match detected country or fallback
        const matchCode = detectedCode || DEFAULT_COUNTRY_CODE;
        const matched = list.find(c => c.code.toUpperCase() === matchCode.toUpperCase())
          || list.find(c => c.code.toUpperCase() === DEFAULT_COUNTRY_CODE)
          || list[0];

        if (matched) {
          setCountryState(matched);
          localStorage.setItem(COUNTRY_KEY, matched.id);
          loadCitiesInternal(matched.id);
          setAutoDetected(true);

          // Show non-blocking notification if not previously dismissed
          const dismissed = localStorage.getItem(NOTIF_DISMISSED_KEY);
          if (!dismissed) {
            setShowLocationNotif(true);
          }
        }

        setLoading(false);
      });
  }, []);

  const loadCitiesInternal = async (countryId: string): Promise<City[]> => {
    const { data } = await supabase
      .from("cities")
      .select("id, country_id, name")
      .eq("country_id", countryId)
      .eq("is_active", true)
      .order("sort_order");
    const list = (data || []) as City[];
    setCities(list);
    return list;
  };

  const loadCities = useCallback(async (countryId: string) => {
    await loadCitiesInternal(countryId);
  }, []);

  const dismissLocationNotif = useCallback(() => {
    setShowLocationNotif(false);
    localStorage.setItem(NOTIF_DISMISSED_KEY, "1");
  }, []);

  const setCountry = useCallback((c: Country) => {
    setCountryState(c);
    localStorage.setItem(COUNTRY_KEY, c.id);
    setCityState(null);
    localStorage.removeItem(CITY_KEY);
    setAutoDetected(false);
    setShowLocationNotif(false);
    localStorage.setItem(NOTIF_DISMISSED_KEY, "1");
    loadCitiesInternal(c.id);

    if (user) {
      supabase
        .from("profiles")
        .update({ selected_country_id: c.id, selected_city_id: null })
        .eq("id", user.id)
        .then(() => {});
    }
  }, [user]);

  const setCity = useCallback((c: City) => {
    setCityState(c);
    localStorage.setItem(CITY_KEY, c.id);

    if (user) {
      supabase
        .from("profiles")
        .update({ selected_city_id: c.id })
        .eq("id", user.id)
        .then(() => {});
    }
  }, [user]);

  return (
    <LocationContext.Provider
      value={{ country, city, countries, cities, loading, autoDetected, showLocationNotif, dismissLocationNotif, setCountry, setCity, loadCities }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation(): LocationCtx {
  const ctx = useContext(LocationContext);
  if (!ctx) {
    // Graceful fallback when rendered outside LocationProvider (e.g. HMR edge-case)
    return {
      country: null,
      city: null,
      countries: [],
      cities: [],
      loading: true,
      autoDetected: false,
      showLocationNotif: false,
      dismissLocationNotif: () => {},
      setCountry: () => {},
      setCity: () => {},
      loadCities: async () => {},
    };
  }
  return ctx;
}
