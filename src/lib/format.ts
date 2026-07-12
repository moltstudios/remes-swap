// Number / currency formatters — locale-aware.
// USD is the default display currency since we're swapping stablecoins.

export function formatAmount(
  value: string | number,
  decimals: number = 2
): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (!isFinite(num)) return "0";
  return num.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * formatAmountInput — adds thousands separators while editing.
 * "1000" → "1,000" · "1000.5" → "1,000.5" · "" → "".
 * Preserves decimal point and trailing zeros after the dot.
 */
export function formatAmountInput(raw: string): string {
  if (!raw) return "";
  const hasDot = raw.includes(".");
  const [whole, fraction = ""] = raw.split(".");
  const wholeWithCommas = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return fraction
    ? `${wholeWithCommas}.${fraction}`
    : hasDot
    ? `${wholeWithCommas}.`
    : wholeWithCommas;
}

// For token amounts (USDC has 6 decimals on chain, we show 2-4)
export function formatTokenAmount(
  raw: bigint | string,
  tokenDecimals: number,
  displayDecimals: number
): string {
  const big =
    typeof raw === "string" ? BigInt(raw) : (raw as unknown as bigint);
  const divisor = 10n ** BigInt(tokenDecimals);
  const whole = big / divisor;
  const fraction = big % divisor;
  if (fraction === 0n) {
    return formatAmount(whole.toString(), 0);
  }
  const fractionStr = fraction
    .toString()
    .padStart(tokenDecimals, "0")
    .slice(0, displayDecimals);
  // trim trailing zeros
  const trimmed = fractionStr.replace(/0+$/, "");
  if (trimmed === "") return formatAmount(whole.toString(), 0);
  return `${formatAmount(whole.toString(), 0)}.${trimmed}`;
}

export function truncateAddress(
  addr: string,
  head: number = 6,
  tail: number = 4
): string {
  if (!addr) return "";
  if (addr.length <= head + tail + 2) return addr;
  return `${addr.slice(0, head)}…${addr.slice(-tail)}`;
}

export function parseTokenAmount(
  humanAmount: string,
  tokenDecimals: number
): bigint {
  if (!humanAmount || humanAmount === ".") return 0n;
  const [whole, fraction = ""] = humanAmount.split(".");
  const padded = (fraction + "0".repeat(tokenDecimals)).slice(
    0,
    tokenDecimals
  );
  const wholeClean = whole.replace(/[^0-9]/g, "") || "0";
  return (BigInt(wholeClean) * 10n ** BigInt(tokenDecimals)) +
    BigInt(padded || "0");
}

// For percent values like 0.003 (fee) → "0.3%"
export function formatPercent(value: number, decimals: number = 2): string {
  if (!isFinite(value)) return "0%";
  return `${(value * 100).toFixed(decimals)}%`;
}