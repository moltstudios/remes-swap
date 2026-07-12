"use client";

import { SwapCard } from "@/components/SwapCard";
import { WalletButton } from "@/components/WalletButton";
import { Logo } from "@/components/Logo";

/**
 * Screen 1 — Swap (also the landing page).
 * No hero, no trust pillar grid, no marketing. Just the form + wallet pill in the header.
 */
export default function HomePage() {
  return (
    <>
      {/* Minimal header */}
      <header className="safe-top sticky top-0 z-30 bg-bg/95 backdrop-blur-sm border-b border-ink/5">
        <div className="max-w-content mx-auto px-md h-14 flex items-center justify-between">
          <div className="flex items-center gap-sm">
            <Logo className="w-8 h-8" />
            <span className="text-body font-bold tracking-tight text-ink">
              Remes
            </span>
          </div>
          <WalletButton variant="compact" />
        </div>
      </header>

      <section className="max-w-content mx-auto px-md pt-lg pb-md">
        <SwapCard />
      </section>
    </>
  );
}