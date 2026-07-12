"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Logo } from "@/components/Logo";
import { WalletButton } from "@/components/WalletButton";
import { BigCTA } from "@/components/BigCTA";
import { SuccessCheck } from "@/components/SuccessCheck";
import { TrustBar } from "@/components/TrustBar";
import { useI18n } from "@/lib/i18n";
import { formatAmount, truncateAddress } from "@/lib/format";
import { useAccount } from "wagmi";

function DoneInner() {
  const router = useRouter();
  const search = useSearchParams();
  const { address } = useAccount();
  const { t } = useI18n();

  const from = (search.get("from") ?? "USDC") as "USDC" | "USDT";
  const to = (search.get("to") ?? "USDT") as "USDC" | "USDT";
  const sent = search.get("sent") ?? "0";
  const received = search.get("received") ?? "0";
  const hash = search.get("hash") ?? "0xabcd1234";

  return (
    <>
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

      <section className="max-w-content mx-auto px-md pt-lg pb-md space-y-lg">
        <div className="pt-md">
          <SuccessCheck />
        </div>

        <div className="text-center space-y-xs">
          <h1 className="text-display font-bold text-ink leading-tight">
            {t.done.title}
          </h1>
          <p className="text-small text-ink/60">{t.done.subtitle}</p>
        </div>

        <div className="text-center space-y-xs">
          <p className="big-number">
            {formatAmount(received, 2)}{" "}
            <span className="text-head font-bold">{to}</span>
          </p>
          <p className="text-small text-ink/60">
            {t.done.youSent}{" "}
            <span className="font-medium text-ink tabular-nums">
              {formatAmount(sent, 2)} {from}
            </span>
          </p>
          {address && (
            <p className="text-micro text-ink/40 tabular-nums pt-xs">
              {t.done.sentTo} · {truncateAddress(address, 6, 4)}
            </p>
          )}
        </div>

        <TrustBar />

        <a
          href={`https://basescan.org/tx/${hash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-xs py-sm text-small font-semibold text-primary hover:text-primary-hover rounded-md focus-visible:shadow-focus focus-visible:outline-none"
        >
          {t.done.viewTx}
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-4 h-4"
            aria-hidden="true"
          >
            <path d="M7 17L17 7M17 7H7M17 7v10" />
          </svg>
        </a>

        <p className="text-micro text-ink/40 text-center">
          {t.done.explorerNote}
        </p>

        <div className="pt-sm">
          <BigCTA onClick={() => router.push("/")}>{t.done.newSwap}</BigCTA>
        </div>
      </section>
    </>
  );
}

export default function DoneScreen() {
  return (
    <Suspense fallback={null}>
      <DoneInner />
    </Suspense>
  );
}