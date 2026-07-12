"use client";

import clsx from "clsx";
import { formatPercent } from "@/lib/format";

type Props = {
  symbol: string;
  size?: "sm" | "md" | "lg";
};

export function TokenLogo({ symbol, size = "md" }: Props) {
  const dim =
    size === "sm"
      ? "w-6 h-6 text-[10px]"
      : size === "lg"
      ? "w-12 h-12 text-base"
      : "w-8 h-8 text-xs";
  return (
    <div
      className={clsx(
        "rounded-full flex items-center justify-center font-bold shrink-0 text-white",
        tokenColor(symbol),
        dim
      )}
      aria-hidden="true"
    >
      {symbol.slice(0, 3)}
    </div>
  );
}

function tokenColor(symbol: string): string {
  switch (symbol.toUpperCase()) {
    case "USDC":
      return "bg-[#2775CA]";
    case "USDT":
      return "bg-[#26A17B]";
    case "RMUSD":
      return "bg-primary";
    default:
      return "bg-ink";
  }
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