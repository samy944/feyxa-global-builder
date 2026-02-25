import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { fr, type TranslationKeys } from "./fr";
import { en } from "./en";
import { supabase } from "@/integrations/supabase/client";

export type Language = "fr" | "en";

const translations: Record<Language, TranslationKeys> = { fr, en };

interface I18nCtx {
  lang: Language;
  setLang: (lang: Language) => void;
  t: TranslationKeys;
}

const I18nContext = createContext<I18nCtx>({ lang: "fr", setLang: () => {}, t: fr });

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => {
    const saved = localStorage.getItem("feyxa_lang");
    if (saved === "en" || saved === "fr") return saved;
    return "fr";
  });

  // Load user preference from DB on auth
  useEffect(() => {
    const loadUserLang = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("preferred_language")
        .eq("id", user.id)
        .maybeSingle();
      if (data?.preferred_language && (data.preferred_language === "fr" || data.preferred_language === "en")) {
        setLangState(data.preferred_language as Language);
        localStorage.setItem("feyxa_lang", data.preferred_language);
      }
    };
    loadUserLang();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) loadUserLang();
    });
    return () => subscription.unsubscribe();
  }, []);

  const setLang = useCallback(async (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem("feyxa_lang", newLang);
    // Persist to DB if logged in
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("profiles").update({ preferred_language: newLang }).eq("id", user.id);
    }
  }, []);

  return (
    <I18nContext.Provider value={{ lang, setLang, t: translations[lang] }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  return useContext(I18nContext);
}

export { fr, en };
export type { TranslationKeys };
