"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount, useBalance } from "wagmi";
import { useI18n } from "@/lib/i18n";
import {
  formatAmount,
  formatPercent,
  parseTokenAmount,
} from "@/lib/format";
import { SUPPORTED_TOKENS, type TokenMeta } from "@/lib/tokens";
import { fetchQuote, type QuoteResponse } from "@/lib/quote";
import { TrustBar } from "./TrustBar";
import { TokenSelector } from "./TokenSelector";
import { TokenLogo } from "./TokenLogo";
import { AmountInput } from "./AmountInput";
import { QuoteBreakdown, type QuoteState } from "./QuoteBreakdown";
import { DirectionToggle } from "./DirectionToggle";
import { useCountUp } from "@/hooks/useCountUp";

const PLATFORM_FEE_PERCENT = 0.003;
const QUOTE_STALE_MS = 30_000;

/**
 * SwapCard — the entire swap form on the main screen.
 * Per Timothy polish (Cash App / Coinbase references):
 * - Numbers full opacity (Cash App: $0 biggest thing on screen, full black)
 * - Cards on subtle gradient bg, white surfaces with shadows
 * - Always-visible CTA at bottom (disabled state when empty)
 * - "MAX | CAMBIAR" two-button row when wallet connected
 * - No duplicate Conectar button
 */
export function SwapCard() {
  const router = useRouter();
  const { t } = useI18n();
  const { address, isConnected, chain } = useAccount();

  const [fromToken, setFromToken] = useState<TokenMeta>(SUPPORTED_TOKENS[0]);
  const [toToken, setToToken] = useState<TokenMeta>(SUPPORTED_TOKENS[1]);
  const [amount, setAmount] = useState("");
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [quoteState, setQuoteState] = useState<QuoteState>("empty");
  const [quoteFetchedAt, setQuoteFetchedAt] = useState(0);
  const [reversed, setReversed] = useState(false);

  const { data: fromBalance } = useBalance({
    address,
    token: fromToken.address,
    chainId: chain?.id,
    query: { enabled: isConnected },
  });

  useEffect(() => {
    if (!amount || parseFloat(amount) <= 0) {
      setQuote(null);
      setQuoteState("empty");
      return;
    }
    setQuoteState((s) => (s === "empty" ? "loading" : s));
    const handle = setTimeout(async () => {
      setQuoteState("loading");
      try {
        const q = await fetchQuote({
          sourceAsset: fromToken.address,
          destAsset: toToken.address,
          amount,
          sourceDecimals: fromToken.decimals,
          slippageBps: 50,
        });
        setQuote(q);
        setQuoteFetchedAt(Date.now());
        setQuoteState("fresh");
      } catch {
        setQuote(null);
        setQuoteState("error");
      }
    }, 350);
    return () => clearTimeout(handle);
  }, [amount, fromToken, toToken]);

  useEffect(() => {
    if (!quote || quoteState !== "fresh") return;
    const interval = setInterval(() => {
      if (Date.now() - quoteFetchedAt > QUOTE_STALE_MS) {
        setQuoteState("stale");
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [quote, quoteState, quoteFetchedAt]);

  const insufficient = useMemo(() => {
    if (!fromBalance || !amount) return false;
    const have = parseTokenAmount(amount, fromToken.decimals);
    return have > fromBalance.value;
  }, [amount, fromBalance, fromToken.decimals]);

  const rate = useMemo(() => {
    if (!quote || !amount || parseFloat(amount) === 0) return undefined;
    return parseFloat(quote.expectedOutput) / parseFloat(amount);
  }, [quote, amount]);

  const receivedTarget = quote ? parseFloat(quote.expectedOutput) : 0;
  const receivedAnimated = useCountUp(receivedTarget, 600);
  const minReceivedNum = quote ? parseFloat(quote.minReceived) : 0;
  const feeNum = quote ? parseFloat(quote.fee) : 0;

  // Always-visible CTA state derivation
  const ctaLabel =
    !isConnected
      ? t.wallet.connect
      : !amount || parseFloat(amount) === 0
      ? "INGRESA UN MONTO"
      : quoteState === "loading"
      ? "PIDIENDO PRECIO..."
      : quoteState === "error"
      ? "INTENTA DE NUEVO"
      : insufficient
      ? "NO TE ALCANZA"
      : `CAMBIAR ${formatAmount(amount, 2)} ${fromToken.symbol}`;

  const ctaState: "rest" | "loading" | "error" | "disabled" =
    quoteState === "loading"
      ? "loading"
      : quoteState === "error"
      ? "error"
      : insufficient
      ? "error"
      : !isConnected || !amount || parseFloat(amount) === 0
      ? "disabled"
      : "rest";

  const ctaDisabled = ctaState === "disabled" || ctaState === "loading";

  function handleMax() {
    if (fromBalance && fromBalance.value > 0n) {
      setAmount(formatBalance(fromBalance.value, fromBalance.decimals));
    }
  }

  function handleCta() {
    if (ctaDisabled || !quote) return;
    router.push(
      `/confirm?from=${fromToken.symbol}&to=${toToken.symbol}&amount=${amount}&received=${quote.expectedOutput}`
    );
  }

  return (
    <div className="space-y-md">
      <TrustBar />

      <div className="pt-xs">
        <h1 className="text-head text-ink leading-tight">
          {t.swap.headline}
        </h1>
      </div>

      <AmountInput
        label={t.swap.youSend}
        value={amount}
        onChange={setAmount}
        state={
          quoteState === "error"
            ? "error"
            : !amount
            ? "empty"
            : quoteState === "loading"
            ? "typing"
            : insufficient
            ? "error"
            : "quoted"
        }
        token={fromToken.symbol}
        tokenLogo={<TokenLogo symbol={fromToken.symbol} size="sm" />}
        onMax={isConnected ? handleMax : undefined}
      />

      <DirectionToggle
        reversed={reversed}
        onToggle={() => {
          const prev = fromToken;
          setFromToken(toToken);
          setToToken(prev);
          setReversed((r) => !r);
          setAmount("");
          setQuote(null);
          setQuoteState("empty");
        }}
        ariaLabel={t.swap.reverseDirection}
      />

      <AmountInput
        label={t.swap.youReceive}
        value={quote ? formatAmount(receivedAnimated, 2) : ""}
        onChange={() => {}}
        readOnly
        state={
          quoteState === "loading"
            ? "loading"
            : quoteState === "error"
            ? "empty"
            : quote
            ? "quoted"
            : "empty"
        }
        token={toToken.symbol}
        tokenLogo={<TokenLogo symbol={toToken.symbol} size="sm" />}
        placeholder="0.00"
        decimals={2}
      />

      {amount && parseFloat(amount) > 0 && (
        <QuoteBreakdown
          state={quoteState}
          rate={rate}
          fee={feeNum}
          feeCurrency={fromToken.symbol}
          feePercent={PLATFORM_FEE_PERCENT}
          received={receivedTarget}
          receivedCurrency={toToken.symbol}
          minReceived={minReceivedNum}
          impact={quote?.priceImpact}
        />
      )}

      {/* ALWAYS-VISIBLE CTA — disabled "Ingresa un monto" when empty */}
      <div className="sticky bottom-0 -mx-md px-md pt-md pb-md bg-gradient-to-t from-white via-white/90 to-transparent">
        <button
          type="button"
          onClick={handleCta}
          disabled={ctaDisabled}
          data-state={ctaState}
          aria-busy={ctaState === "loading"}
          aria-label={ctaLabel}
          className="cta-primary flex items-center justify-center gap-sm"
        >
          {ctaState === "loading" && <Spinner />}
          {ctaLabel}
        </button>
      </div>
    </div>
  );
}

function formatBalance(value: bigint, decimals: number): string {
  const whole = value / 10n ** BigInt(decimals);
  const fraction = value % 10n ** BigInt(decimals);
  const fStr = fraction
    .toString()
    .padStart(decimals, "0")
    .slice(0, 6)
    .replace(/0+$/, "");
  if (!fStr) return whole.toString();
  return `${whole}.${fStr}`;
}

function Spinner() {
  return (
    <svg
      className="w-4 h-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        strokeOpacity="0.25"
      />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}