import { useState, useEffect, createContext, useContext, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

const COUNTRY_KEY = "feyxa_country_id";
const CITY_KEY = "feyxa_city_id";

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
  needsSelection: boolean;
  setCountry: (c: Country) => void;
  setCity: (c: City) => void;
  loadCities: (countryId: string) => Promise<void>;
}

const LocationContext = createContext<LocationCtx | undefined>(undefined);

export function LocationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [country, setCountryState] = useState<Country | null>(null);
  const [city, setCityState] = useState<City | null>(null);
  const [countries, setCountries] = useState<Country[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsSelection, setNeedsSelection] = useState(false);

  // Load countries
  useEffect(() => {
    supabase
      .from("countries")
      .select("id, code, name, currency_code, flag_emoji")
      .eq("is_active", true)
      .order("sort_order")
      .then(({ data }) => {
        const list = (data || []) as Country[];
        setCountries(list);

        // Restore from localStorage
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
          } else {
            setNeedsSelection(true);
          }
        } else {
          setNeedsSelection(true);
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

  const setCountry = useCallback((c: Country) => {
    setCountryState(c);
    localStorage.setItem(COUNTRY_KEY, c.id);
    setCityState(null);
    localStorage.removeItem(CITY_KEY);
    setNeedsSelection(false);
    loadCitiesInternal(c.id);

    // Persist to profile if logged in
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
      value={{ country, city, countries, cities, loading, needsSelection, setCountry, setCity, loadCities }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error("useLocation must be used within LocationProvider");
  return ctx;
}
