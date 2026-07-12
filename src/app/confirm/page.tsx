"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Logo } from "@/components/Logo";
import { WalletButton } from "@/components/WalletButton";
import { BigCTA } from "@/components/BigCTA";
import { useI18n } from "@/lib/i18n";
import { formatAmount, formatPercent } from "@/lib/format";
import {
  useSwapExecution,
  useTransactionAwaiter,
  type GasEstimate,
  type PreparedSwap,
} from "@/hooks/useSwapExecution";
import { useEthPrice, formatGasUsd } from "@/hooks/useEthPrice";
import { BASE_TOKENS } from "@/lib/web3/contracts";
import type { TxStage } from "@/hooks/useSwapExecution";

const PLATFORM_FEE_PERCENT = 0.003;

function ConfirmInner() {
  const router = useRouter();
  const search = useSearchParams();
  const { t } = useI18n();

  const from = (search.get("from") ?? "USDC") as "USDC" | "USDT";
  const to = (search.get("to") ?? "USDT") as "USDC" | "USDT";
  const amount = (search.get("amount") ?? "0").replace(/,/g, "");
  const received = (search.get("received") ?? "0").replace(/,/g, "");

  const sendNum = parseFloat(amount) || 0;
  const receiveNum = parseFloat(received) || 0;
  const fee = sendNum * PLATFORM_FEE_PERCENT;
  const rate = sendNum > 0 ? receiveNum / sendNum : 0;

  const ethUsd = useEthPrice();
  const {
    stage,
    execute,
    sendSwapAfterApproval,
    markComplete,
    markError,
    reset,
  } = useSwapExecution();

  // The PreparedSwap returned from execute() — used to fire the swap tx
  // once wagmi confirms the approval receipt.
  const [pendingSwap, setPendingSwap] = useState<PreparedSwap | null>(null);

  // Currently-watched hash (approve OR swap)
  const watchingHash: `0x${string}` | undefined =
    stage.kind === "awaiting-approval"
      ? stage.txHash
      : stage.kind === "awaiting-swap"
      ? stage.txHash
      : undefined;

  // wagmi's receipt watcher — replaces the old manual eth_getTransactionReceipt poll
  const {
    isSuccess: txConfirmed,
    isError: txReverted,
    error: txError,
  } = useTransactionAwaiter(watchingHash);

  // Approval confirmed → fire the swap tx using the PreparedSwap we stashed
  useEffect(() => {
    if (stage.kind !== "awaiting-approval" || !txConfirmed) return;
    if (!pendingSwap) return;
    void (async () => {
      const fromAddress =
        from === "USDC" ? BASE_TOKENS.USDC.address : BASE_TOKENS.USDT.address;
      const toAddress =
        to === "USDC" ? BASE_TOKENS.USDC.address : BASE_TOKENS.USDT.address;
      const swapHash = await sendSwapAfterApproval({
        fromSymbol: from,
        toSymbol: to,
        fromAddress,
        toAddress,
        amount,
        swapStep: pendingSwap.swapStep,
        quote: pendingSwap.quote,
        gasEstimate: pendingSwap.gasEstimate,
        gasPriceWei: pendingSwap.gasPriceWei,
      });
      if (!swapHash) {
        markError("No se pudo enviar el cambio.");
      }
      setPendingSwap(null);
    })();
  }, [
    stage,
    txConfirmed,
    pendingSwap,
    sendSwapAfterApproval,
    markError,
    from,
    to,
    amount,
  ]);

  // Swap confirmed → mark complete
  useEffect(() => {
    if (stage.kind === "awaiting-swap" && txConfirmed) {
      markComplete(stage.txHash);
    }
  }, [stage, txConfirmed, markComplete]);

  // Reverted → error
  useEffect(() => {
    if (txReverted && txError) {
      markError("La transacción fue revertida en la red.");
    }
  }, [txReverted, txError, markError]);

  // Complete → redirect to done
  useEffect(() => {
    if (stage.kind === "complete") {
      router.push(
        `/done?from=${from}&to=${to}&sent=${amount}&received=${received}&hash=${stage.txHash}`
      );
    }
  }, [stage, router, from, to, amount, received]);

  useEffect(() => {
    return () => reset();
  }, [reset]);

  const fromAddress =
    from === "USDC" ? BASE_TOKENS.USDC.address : BASE_TOKENS.USDT.address;
  const toAddress =
    to === "USDC" ? BASE_TOKENS.USDC.address : BASE_TOKENS.USDT.address;

  // Gas estimate USD — sum approve + swap gas units, multiply by gas price
  const gasUsd = useMemo(() => {
    if (stage.kind !== "awaiting-approval" && stage.kind !== "awaiting-swap") {
      return null;
    }
    const ge = stage.gasEstimate;
    const gp = stage.gasPriceWei;
    if (!ge || !gp) return null;
    const totalGas = BigInt(ge.approve) + BigInt(ge.swap);
    return formatGasUsd(totalGas, gp, ethUsd);
  }, [stage, ethUsd]);

  const ctaState: "rest" | "loading" | "error" | "disabled" =
    stage.kind === "preparing" ||
    stage.kind === "needs-approval" ||
    stage.kind === "awaiting-approval" ||
    stage.kind === "awaiting-swap"
      ? "loading"
      : stage.kind === "error"
      ? "error"
      : "rest";

  const ctaLabel =
    stage.kind === "preparing"
      ? "Preparando..."
      : stage.kind === "needs-approval" || stage.kind === "awaiting-approval"
      ? "Esperando tu firma..."
      : stage.kind === "awaiting-swap"
      ? "Enviando cambio..."
      : stage.kind === "complete"
      ? "Listo"
      : t.confirm.confirm;

  async function handleConfirm() {
    const result = await execute({
      fromSymbol: from,
      toSymbol: to,
      fromAddress,
      toAddress,
      amount,
    });
    if (result && "approvalHash" in result) {
      setPendingSwap(result);
    }
    // Direct swap path (allowance OK): useSwapExecution already fired the
    // swap tx and set stage to awaiting-swap — wagmi picks it up from there.
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

        <SubtleProgress stage={stage} />

        <div>
          <h1 className="text-head text-ink">{t.confirm.title}</h1>
          <p className="text-small text-ink/60 mt-xs">{t.confirm.subtitle}</p>
        </div>

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
            <span className="text-head font-bold tabular-nums text-ink leading-none opacity-90">
              {formatAmount(received, 2)}
            </span>
            <span className="text-body font-semibold text-ink/70">{to}</span>
          </div>
        </div>

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
          {/* Gas estimate USD — surfaced from /api/swaps/prepare */}
          {gasUsd !== null && (
            <Row
              label="Gas estimado"
              value={`< $${gasUsd.toFixed(2)} USD`}
            />
          )}
        </div>

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

function SubtleProgress({ stage }: { stage: TxStage }) {
  let active = 0;
  if (
    stage.kind === "preparing" ||
    stage.kind === "needs-approval" ||
    stage.kind === "awaiting-approval" ||
    stage.kind === "awaiting-swap"
  ) {
    active = 1;
  } else if (stage.kind === "complete") {
    active = 2;
  }
  const labels = ["Revisar", "Firmar", "Listo"];

  return (
    <ol
      className="flex items-center justify-center gap-sm text-small"
      aria-label="Pasos de la operación"
    >
      {labels.map((label, i) => {
        const isActive = i === active;
        const isDone = i < active;
        return (
          <li key={label} className="flex items-center gap-sm">
            <span
              className={
                "tabular-nums " +
                (isActive
                  ? "text-primary font-bold"
                  : isDone
                  ? "text-ink/40 line-through"
                  : "text-ink/40")
              }
            >
              {i + 1} · {label}
            </span>
            {i < labels.length - 1 && (
              <span className="text-ink/30" aria-hidden="true">·</span>
            )}
          </li>
        );
      })}
    </ol>
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

export default function ConfirmScreen() {
  return (
    <Suspense fallback={null}>
      <ConfirmInner />
    </Suspense>
  );
}