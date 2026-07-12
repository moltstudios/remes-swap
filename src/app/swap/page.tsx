"use client";

import { SwapCard } from "@/components/SwapCard";
import { useTranslations } from "@/hooks/useTranslations";

export default function SwapPage() {
  const t = useTranslations();
  return (
    <section className="px-4 pt-6 pb-12">
      <div className="max-w-content mx-auto">
        <h1 className="text-heading text-ink-900 mb-4">{t.swap.title}</h1>
        <SwapCard />
      </div>
    </section>
  );
}