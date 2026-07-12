"use client";

import clsx from "clsx";
import { formatPercent } from "@/lib/format";

type Props = {
  symbol: string;
  size?: "sm" | "md" | "lg";
};

export function TokenLogo({ symbol, size = "md" }: Props) {
  const dim =
    size === "sm" ? "w-6 h-6 text-[10px]" : size === "lg" ? "w-12 h-12 text-base" : "w-8 h-8 text-xs";
  return (
    <div
      className={clsx(
        "rounded-full flex items-center justify-center font-bold shrink-0",
        tokenColor(symbol),
        dim
      )}
    >
      {symbol.slice(0, 3)}
    </div>
  );
}

function tokenColor(symbol: string): string {
  switch (symbol.toUpperCase()) {
    case "USDC":
      return "bg-[#2775CA] text-white";
    case "USDT":
      return "bg-[#26A17B] text-white";
    case "CUSD":
      return "bg-ink-900 text-white";
    case "DAI":
      return "bg-[#F5AC37] text-white";
    default:
      return "bg-ink-200 text-ink-700";
  }
}

// Tiny inline label for amounts + impact indicators
export function ImpactBadge({ impact }: { impact: number }) {
  if (impact < 0.005) return null;
  const severity =
    impact > 0.05
      ? "bg-red-50 text-red-700 border-red-200"
      : impact > 0.01
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : "bg-ink-100 text-ink-700 border-ink-200";
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