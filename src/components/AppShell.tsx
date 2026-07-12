"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useI18n } from "@/lib/i18n";
import { WalletButton } from "./WalletButton";
import clsx from "clsx";

export function AppShell({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const pathname = usePathname();
  const isLanding = pathname === "/";

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header — minimal, mobile-first */}
      <header className="safe-top sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-ink-100">
        <div className="max-w-content mx-auto px-4 h-14 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-ink-900 font-semibold"
          >
            <Logo className="w-7 h-7" />
            <span className="text-body font-bold tracking-tight">
              {t.brand.name}
            </span>
          </Link>
          {!isLanding && <WalletButton variant="compact" />}
        </div>
      </header>

      {/* Main content — centered, mobile-first max-width */}
      <main className="flex-1 pb-24">{children}</main>

      {/* Bottom nav — only on app routes, not landing */}
      {!isLanding && <BottomNav />}

      {/* Footer */}
      <footer className="border-t border-ink-100 py-8 mt-8">
        <div className="max-w-content mx-auto px-4 text-center">
          <p className="text-small text-ink-500">{t.footer.tagline}</p>
          <p className="text-micro text-ink-400 mt-2">
            {t.footer.poweredBy} · Base
          </p>
        </div>
      </footer>
    </div>
  );
}

function BottomNav() {
  const { t } = useI18n();
  const pathname = usePathname();

  const items = [
    { href: "/swap", label: t.nav.swap, icon: SwapIcon },
    { href: "/history", label: t.nav.history, icon: HistoryIcon },
    { href: "/settings", label: t.nav.settings, icon: SettingsIcon },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-ink-100 safe-bottom">
      <div className="max-w-content mx-auto px-2 h-16 flex items-stretch justify-around">
        {items.map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex-1 flex flex-col items-center justify-center gap-1 rounded-lg",
                "transition-colors duration-150",
                active
                  ? "text-ink-900"
                  : "text-ink-400 hover:text-ink-600"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-micro font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function Logo({ className }: { className?: string }) {
  // Remes mark — "R" monogram on a banking-grade dark square.
  // The descender of the R nods to the trail of a money transfer.
  // Remes mark — a clean "100" inspired by the codename (cien = 100)
  return (
    <svg
      className={className}
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="28" height="28" rx="8" fill="#0E1119" />
      <text
        x="14"
        y="19"
        textAnchor="middle"
        fontFamily="Inter, sans-serif"
        fontSize="16"
        fontWeight="700"
        fill="white"
        letterSpacing="-0.5"
      >
        Re
      </text>
    </svg>
  );
}

function SwapIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 16V4M7 4l-3 3M7 4l3 3M17 8v12M17 20l-3-3M17 20l3-3" />
    </svg>
  );
}

function HistoryIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v5h5M3.05 13A9 9 0 1 0 6 5.3L3 8M12 7v5l4 2" />
    </svg>
  );
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.01a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.01a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}