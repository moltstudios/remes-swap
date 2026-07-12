"use client";

import { WalletButton } from "@/components/WalletButton";
import { SwapCard } from "@/components/SwapCard";
import { useTranslations } from "@/hooks/useTranslations";

export default function HomePage() {
  const t = useTranslations();

  return (
    <>
      {/* Hero */}
      <section className="px-4 pt-10 pb-8 sm:pt-16 sm:pb-12">
        <div className="max-w-content mx-auto text-center">
          <p className="text-micro text-ink-500 uppercase tracking-widest mb-4">
            {t.brand.tagline}
          </p>
          <h1 className="text-display lg:text-display-lg text-ink-900 mb-4">
            {t.landing.headline}
          </h1>
          <p className="text-subheading text-ink-600 mb-3 max-w-md mx-auto">
            {t.landing.subhead}
          </p>
          <p className="text-small text-ink-500 mb-8">
            {t.landing.trustLine}
          </p>
          <p className="text-micro text-ink-400">
            {t.landing.noLogin}
          </p>
        </div>
      </section>

      {/* Swap card — front and center, no login required */}
      <section className="px-4 pb-12">
        <div className="max-w-content mx-auto">
          <SwapCard />
          <div className="mt-6 flex justify-center">
            <WalletButton />
          </div>
        </div>
      </section>

      {/* Trust grid — four pillars */}
      <section className="px-4 pb-section">
        <div className="max-w-content mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FeatureCard
              icon={<ShieldIcon />}
              title={t.landing.feature1Title}
              body={t.landing.feature1Body}
            />
            <FeatureCard
              icon={<CoinIcon />}
              title={t.landing.feature2Title}
              body={t.landing.feature2Body}
            />
            <FeatureCard
              icon={<GlobeIcon />}
              title={t.landing.feature3Title}
              body={t.landing.feature3Body}
            />
            <FeatureCard
              icon={<EyeIcon />}
              title={t.landing.feature4Title}
              body={t.landing.feature4Body}
            />
          </div>
        </div>
      </section>
    </>
  );
}

function FeatureCard({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="card p-5">
      <div className="w-10 h-10 rounded-full bg-ink-100 text-ink-900 flex items-center justify-center mb-3">
        {icon}
      </div>
      <h3 className="text-subheading text-ink-900 mb-1">{title}</h3>
      <p className="text-small text-ink-600">{body}</p>
    </div>
  );
}

function ShieldIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function CoinIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v12M9 9h4.5a2 2 0 0 1 0 4H9.5a2 2 0 0 0 0 4H15" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}