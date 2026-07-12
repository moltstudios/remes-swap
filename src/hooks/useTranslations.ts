"use client";

import { useI18n } from "@/lib/i18n";

/**
 * Convenience hook for component-level translations.
 * Avoids prop-drilling the dictionary through server components.
 */
export function useTranslations() {
  return useI18n().t;
}