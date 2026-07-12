"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { es, type Dictionary } from "./es";
import { en } from "./en";

export type Locale = "es" | "en";

const dictionaries: Record<Locale, Dictionary> = { es, en };

type I18nContextType = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: Dictionary;
};

const I18nContext = createContext<I18nContextType | null>(null);

const STORAGE_KEY = "ciento.locale";

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("es");

  // Hydrate from localStorage / browser preference
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY) as Locale | null;
      if (stored === "es" || stored === "en") {
        setLocaleState(stored);
        return;
      }
      const browser = navigator.language?.toLowerCase().startsWith("es")
        ? "es"
        : "en";
      setLocaleState(browser);
    } catch {
      // localStorage unavailable — keep default
    }
  }, []);

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    try {
      window.localStorage.setItem(STORAGE_KEY, l);
    } catch {
      // ignore
    }
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, t: dictionaries[locale] }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    // Fallback so server-rendered code never crashes
    return { locale: "es" as Locale, setLocale: () => {}, t: es };
  }
  return ctx;
}