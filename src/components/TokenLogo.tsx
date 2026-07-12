"use client";

import clsx from "clsx";
import { formatPercent } from "@/lib/format";

type Props = {
  symbol: string;
  size?: "sm" | "md" | "lg";
};

const ICON_MAP: Record<string, string> = {
  USDC: "/icons/usdc.svg",
  USDT: "/icons/usdt.svg",
  RMUSD: "/icons/icon-192.svg",
};

/**
 * TokenLogo — uses official-style SVGs from /public/icons.
 * Falls back to a subtle monogram for unknown tokens.
 */
export function TokenLogo({ symbol, size = "md" }: Props) {
  const dim =
    size === "sm"
      ? "w-7 h-7"
      : size === "lg"
      ? "w-12 h-12"
      : "w-8 h-8";
  const src = ICON_MAP[symbol.toUpperCase()];
  if (src) {
    return (
      <img
        src={src}
        alt={symbol}
        width={size === "sm" ? 28 : size === "lg" ? 48 : 32}
        height={size === "sm" ? 28 : size === "lg" ? 48 : 32}
        className={clsx("shrink-0 rounded-full", dim)}
        aria-hidden="true"
      />
    );
  }
  return (
    <div
      className={clsx(
        "rounded-full flex items-center justify-center font-bold shrink-0 text-white bg-ink",
        size === "sm" ? "w-7 h-7 text-xs" : size === "lg" ? "w-12 h-12 text-base" : "w-8 h-8 text-xs"
      )}
      aria-hidden="true"
    >
      {symbol.slice(0, 3)}
    </div>
  );
}

/**
 * ImpactBadge — only renders when impact > threshold.
 */
export function ImpactBadge({ impact }: { impact: number }) {
  if (impact < 0.005) return null;
  const severity =
    impact > 0.05
      ? "bg-error/10 text-error border-error/30"
      : impact > 0.01
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : "bg-ink/5 text-ink/70 border-ink/10";
  return (
    <span
      className={clsx(
        "inline-flex items-center px-2 py-0.5 rounded-pill text-micro border",
        severity
      )}
    >
      Impacto {formatPercent(impact, 2)}
    </span>
  );
}