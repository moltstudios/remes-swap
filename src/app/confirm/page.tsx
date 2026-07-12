"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Logo } from "@/components/Logo";
import { WalletButton } from "@/components/WalletButton";
import { BigCTA } from "@/components/BigCTA";
import { TrustBar } from "@/components/TrustBar";
import { useI18n } from "@/lib/i18n";
import { formatAmount, formatPercent } from "@/lib/format";
import { useSwapExecution } from "@/hooks/useSwapExecution";
import { BASE_TOKENS } from "@/lib/web3/contracts";

const PLATFORM_FEE_PERCENT = 0.003;

function ConfirmInner() {
  const router = useRouter();
  const search = useSearchParams();
  const { t } = useI18n();

  const from = (search.get("from") ?? "USDC") as "USDC" | "USDT";
  const to = (search.get("to") ?? "USDT") as "USDC" | "USDT";
  const amount = search.get("amount") ?? "0";
  const received = search.get("received") ?? "0";

  const sendNum = parseFloat(amount) || 0;
  const receiveNum = parseFloat(received) || 0;
  const fee = sendNum * PLATFORM_FEE_PERCENT;
  const rate = sendNum > 0 ? receiveNum / sendNum : 0;

  const { stage, execute, reset } = useSwapExecution();

  // Redirect to done on completion
  useEffect(() => {
    if (stage.kind === "complete") {
      router.push(
        `/done?from=${from}&to=${to}&sent=${amount}&received=${received}&hash=${stage.txHash}`
      );
    }
  }, [stage, router, from, to, amount, received]);

  // Reset stage when leaving the page
  useEffect(() => {
    return () => reset();
  }, [reset]);

  const fromAddress = from === "USDC" ? BASE_TOKENS.USDC.address : BASE_TOKENS.USDT.address;
  const toAddress = to === "USDC" ? BASE_TOKENS.USDC.address : BASE_TOKENS.USDT.address;

  const ctaState =
    stage.kind === "preparing" ||
    stage.kind === "awaiting-approval" ||
    stage.kind === "broadcasting-swap" ||
    stage.kind === "approval-confirmed"
      ? "loading"
      : stage.kind === "error"
      ? "error"
      : "rest";

  const ctaLabel =
    stage.kind === "preparing"
      ? "Preparando..."
      : stage.kind === "awaiting-approval"
      ? "Esperando tu firma..."
      : stage.kind === "broadcasting-swap"
      ? "Enviando cambio..."
      : t.confirm.confirm;

  function handleConfirm() {
    execute({
      fromSymbol: from,
      toSymbol: to,
      fromAddress,
      toAddress,
      amount,
    });
  }

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

      <section className="max-w-content mx-auto px-md pt-md pb-md space-y-md">
        {/* Back row */}
        <div className="flex items-center gap-sm -ml-sm">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 flex items-center justify-center rounded-pill hover:bg-surface focus-visible:shadow-focus focus-visible:outline-none"
            aria-label={t.common.back}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-5 h-5"
              aria-hidden="true"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-small text-ink/60">{t.confirm.backCta}</span>
        </div>

        <TrustBar />

        <div>
          <h1 className="text-head text-ink">{t.confirm.title}</h1>
          <p className="text-small text-ink/60 mt-xs">{t.confirm.subtitle}</p>
        </div>

        {/* Headline amount */}
        <div className="bg-surface rounded-lg p-md">
          <p className="text-micro text-ink/50 uppercase tracking-wider">
            {t.confirm.youSend}
          </p>
          <div className="flex items-baseline gap-sm mt-xs">
            <span className="text-display font-bold tabular-nums text-ink leading-none">
              {formatAmount(amount, 2)}
            </span>
            <span className="text-subhead font-semibold text-ink/70">{from}</span>
          </div>
          <div className="border-t border-ink/10 my-md" />
          <p className="text-micro text-ink/50 uppercase tracking-wider">
            {t.confirm.youReceive}
          </p>
          <div className="flex items-baseline gap-sm mt-xs">
            <span className="text-head font-bold tabular-nums text-ink leading-none">
              {formatAmount(received, 2)}
            </span>
            <span className="text-body font-semibold text-ink/70">{to}</span>
          </div>
        </div>

        {/* Detail rows */}
        <div className="space-y-xs">
          <Row
            label={t.confirm.rate}
            value={`1 ${from} = ${formatAmount(rate, 6)} ${to}`}
          />
          <Row
            label={t.confirm.fee}
            value={`$${formatAmount(fee, 2)} (${formatPercent(
              PLATFORM_FEE_PERCENT
            )})`}
          />
          <Row label={t.confirm.route} value={`Uniswap V3 · Base`} />
          <Row
            label={t.confirm.estimatedTime}
            value={`~30 ${t.common.seconds}`}
          />
        </div>

        {/* Non-custodial trust signal */}
        <div className="flex items-start gap-sm bg-accent/10 rounded-md p-md">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-5 h-5 text-primary shrink-0 mt-1"
            aria-hidden="true"
          >
            <path d="M12 9v4M12 17h.01" />
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          </svg>
          <p className="text-small text-ink/80 leading-snug">
            {t.confirm.nonCustodial}
          </p>
        </div>

        {/* Stage indicator */}
        <StageIndicator stage={stage} />

        {/* CTA */}
        <BigCTA state={ctaState} onClick={handleConfirm}>
          {ctaLabel}
        </BigCTA>

        {stage.kind === "error" && (
          <p className="text-small text-error text-center" role="alert">
            {stage.message}
          </p>
        )}
      </section>
    </>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-xs text-small">
      <span className="text-ink/60">{label}</span>
      <span className="text-ink font-medium tabular-nums">{value}</span>
    </div>
  );
}

function StageIndicator({ stage }: { stage: ReturnType<typeof useSwapExecution>["stage"] }) {
  const stages = [
    { key: "preparing", label: "Preparar" },
    { key: "awaiting-approval", label: "Aprobar" },
    { key: "broadcasting-swap", label: "Enviar" },
    { key: "complete", label: "Listo" },
  ];
  const currentIdx = stages.findIndex((s) => s.key === stage.kind);
  return (
    <div className="flex items-center justify-between gap-xs" aria-live="polite">
      {stages.map((s, i) => {
        const active = i === currentIdx;
        const done = i < currentIdx || stage.kind === "complete";
        return (
          <div
            key={s.key}
            className="flex-1 flex flex-col items-center gap-1"
          >
            <div
              className={
                "w-6 h-6 rounded-full flex items-center justify-center text-micro font-bold " +
                (done
                  ? "bg-success text-white"
                  : active
                  ? "bg-primary text-white animate-pulse"
                  : "bg-ink/10 text-ink/40")
              }
            >
              {done ? "✓" : i + 1}
            </div>
            <span
              className={
                "text-micro " +
                (active || done ? "text-ink font-semibold" : "text-ink/40")
              }
            >
              {s.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function ConfirmScreen() {
  return (
    <Suspense fallback={null}>
      <ConfirmInner />
    </Suspense>
  );
}