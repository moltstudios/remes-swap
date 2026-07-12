"use client";

import { createContext, useContext, type ReactNode } from "react";
import { es, type Dictionary } from "./es";

type I18nContextType = { t: Dictionary };
const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  return <I18nContext.Provider value={{ t: es }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) return { t: es };
  return ctx;
}