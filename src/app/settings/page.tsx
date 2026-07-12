"use client";

import { useState } from "react";
import { useI18n, type Locale } from "@/lib/i18n";
import { useTranslations } from "@/hooks/useTranslations";

export default function SettingsPage() {
  const t = useTranslations();
  const { locale, setLocale } = useI18n();
  const [slippageMode, setSlippageMode] = useState<"auto" | "custom">("auto");
  const [customSlippage, setCustomSlippage] = useState("0.5");

  return (
    <section className="px-4 pt-6 pb-12">
      <div className="max-w-content mx-auto space-y-6">
        <h1 className="text-heading text-ink-900">{t.settings.title}</h1>

        {/* General */}
        <Section title={t.settings.sectionGeneral}>
          <Row label={t.settings.language}>
            <div className="flex gap-2">
              <LangPill
                active={locale === "es"}
                onClick={() => setLocale("es" as Locale)}
              >
                ES
              </LangPill>
              <LangPill
                active={locale === "en"}
                onClick={() => setLocale("en" as Locale)}
              >
                EN
              </LangPill>
            </div>
          </Row>

          <Row label={t.settings.slippage}>
            <div className="text-right">
              <div className="flex justify-end gap-2 mb-2">
                <button
                  onClick={() => setSlippageMode("auto")}
                  className={`text-micro font-medium px-3 py-1.5 rounded-pill border ${
                    slippageMode === "auto"
                      ? "border-ink-900 bg-ink-900 text-white"
                      : "border-ink-200 bg-white text-ink-700"
                  }`}
                >
                  {t.settings.slippageAuto}
                </button>
                <button
                  onClick={() => setSlippageMode("custom")}
                  className={`text-micro font-medium px-3 py-1.5 rounded-pill border ${
                    slippageMode === "custom"
                      ? "border-ink-900 bg-ink-900 text-white"
                      : "border-ink-200 bg-white text-ink-700"
                  }`}
                >
                  {t.settings.slippageCustom}
                </button>
              </div>
              {slippageMode === "custom" && (
                <div className="flex items-center gap-2 justify-end">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={customSlippage}
                    onChange={(e) =>
                      setCustomSlippage(
                        e.target.value.replace(/[^0-9.]/g, "")
                      )
                    }
                    className="w-20 text-right text-small font-medium bg-white border border-ink-200 rounded-md px-2 py-1 focus:outline-none focus:border-ink-900"
                  />
                  <span className="text-small text-ink-500">%</span>
                </div>
              )}
              <p className="text-micro text-ink-400 mt-2 max-w-xs">
                {t.settings.slippageHelp}
              </p>
            </div>
          </Row>
        </Section>

        {/* About */}
        <Section title={t.settings.sectionAbout}>
          <Row label={t.settings.version}>
            <span className="text-small text-ink-500">0.1.0 · dev</span>
          </Row>
          <Row label={t.settings.privacy}>
            <span className="text-small text-ink-400">→</span>
          </Row>
          <Row label={t.settings.terms}>
            <span className="text-small text-ink-400">→</span>
          </Row>
          <Row label={t.settings.support}>
            <span className="text-small text-ink-400">→</span>
          </Row>
        </Section>
      </div>
    </section>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card divide-y divide-ink-100">
      <h2 className="text-micro uppercase tracking-wider text-ink-500 px-5 pt-4 pb-2">
        {title}
      </h2>
      <div className="px-5 py-2">{children}</div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between py-3 gap-4">
      <span className="text-body text-ink-900">{label}</span>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function LangPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`text-micro font-semibold px-3 py-1.5 rounded-pill border ${
        active
          ? "border-ink-900 bg-ink-900 text-white"
          : "border-ink-200 bg-white text-ink-700"
      }`}
    >
      {children}
    </button>
  );
}