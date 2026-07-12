"use client";

import { formatAmount, formatPercent } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

export type QuoteState = "loading" | "stale" | "fresh" | "error" | "empty";

type Props = {
  state: QuoteState;
  rate?: number;
  fee?: number;
  feeCurrency?: string;
  feePercent?: number;
  received?: number;
  receivedCurrency?: string;
  minReceived?: number;
  impact?: number;
};

/**
 * QuoteDisplay — 5 states per brief.
 * loading · stale · fresh · error · empty (implicit via null)
 */
export function QuoteBreakdown({
  state,
  rate,
  fee,
  feeCurrency = "USDC",
  feePercent,
  received,
  receivedCurrency = "USDT",
  minReceived,
  impact,
}: Props) {
  const { t } = useI18n();

  if (state === "empty") return null;

  if (state === "loading") {
    return (
      <div className="space-y-xs" aria-busy="true">
        <SkeletonRow />
        <SkeletonRow />
        <SkeletonRow />
      </div>
    );
  }

  if (state === "error") {
    return (
      <p className="text-small text-error text-center py-sm" role="alert">
        {t.swap.quoteFailed}
      </p>
    );
  }

  return (
    <div className="space-y-xs" aria-live="polite">
      {typeof rate === "number" && (
        <Row
          label={
            <span className="flex items-center gap-xs">
              {t.swap.rate}
              {state === "fresh" && (
                <span
                  className="w-1.5 h-1.5 rounded-full bg-success animate-pulse"
                  aria-label="Actualizado"
                />
              )}
              {state === "stale" && (
                <span className="text-micro text-ink/40">
                  · actualizando
                </span>
              )}
            </span>
          }
          value={`1 USDC = ${formatAmount(rate, 6)} ${receivedCurrency}`}
        />
      )}
      {typeof fee === "number" && (
        <Row
          label={t.swap.fee}
          value={`$${formatAmount(fee, 2)}${
            typeof feePercent === "number"
              ? ` (${formatPercent(feePercent)})`
              : ""
          }`}
        />
      )}
      {typeof impact === "number" && impact > 0.01 && (
        <Row
          label={t.swap.impact}
          value={
            <span className="text-ink font-medium tabular-nums">
              {formatPercent(impact)}
            </span>
          }
        />
      )}
      {typeof received === "number" && (
        <Row
          label={t.swap.youGet}
          value={
            <span className="text-ink font-semibold tabular-nums">
              {formatAmount(received, 2)} {receivedCurrency}
            </span>
          }
        />
      )}
      {typeof minReceived === "number" && (
        <Row
          label={t.swap.minReceived}
          value={
            <span className="text-ink/70 font-medium tabular-nums">
              {formatAmount(minReceived, 2)} {receivedCurrency}
            </span>
          }
        />
      )}
    </div>
  );
}

function Row({
  label,
  value,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-xs text-small text-ink/70">
      <span>{label}</span>
      <span className="text-ink font-medium tabular-nums">{value}</span>
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="flex items-center justify-between py-xs">
      <span className="h-3 w-20 bg-ink/10 rounded-sm animate-pulse" />
      <span className="h-3 w-24 bg-ink/10 rounded-sm animate-pulse" />
    </div>
  );
}