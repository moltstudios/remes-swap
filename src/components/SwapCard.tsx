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
import { UNISWAP_V3 } from "@/lib/web3/contracts";
import { TrustBar } from "./TrustBar";
import { TokenSelector } from "./TokenSelector";
import { TokenLogo } from "./TokenLogo";
import { AmountInput } from "./AmountInput";
import { QuoteBreakdown, type QuoteState } from "./QuoteBreakdown";
import { BigCTA, type CTAState } from "./BigCTA";
import { DirectionToggle } from "./DirectionToggle";

const PLATFORM_FEE_PERCENT = 0.003;
const QUOTE_STALE_MS = 30_000;

/**
 * SwapCard — the entire swap form on the main screen.
 * Routes to /confirm on CTA tap; execution happens there.
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

  // Quote fetching — debounced
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

  // Mark quote stale after 30s
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

  const receivedNum = quote ? parseFloat(quote.expectedOutput) : 0;
  const minReceivedNum = quote ? parseFloat(quote.minReceived) : 0;
  const feeNum = quote ? parseFloat(quote.fee) : 0;

  // CTA state derivation
  let ctaState: CTAState = "rest";
  let ctaLabel = `${t.swap.swap} ${formatAmount(amount || "0", 0)} ${fromToken.symbol}`;

  if (!isConnected) {
    ctaLabel = t.wallet.connect;
    ctaState = "disabled";
  } else if (!amount || parseFloat(amount) === 0) {
    ctaLabel = t.swap.enterAmount;
    ctaState = "disabled";
  } else if (quoteState === "loading") {
    ctaLabel = t.swap.fetchingQuote;
    ctaState = "loading";
  } else if (quoteState === "error") {
    ctaLabel = t.swap.quoteFailed;
    ctaState = "error";
  } else if (insufficient) {
    ctaLabel = t.swap.insufficient;
    ctaState = "error";
  } else if (quoteState === "fresh" || quoteState === "stale") {
    ctaState = "rest";
    ctaLabel = `${t.swap.swap} ${formatAmount(amount, 2)} ${fromToken.symbol}`;
  }

  function handleCta() {
    if (!isConnected || !amount || !quote) return;
    router.push(
      `/confirm?from=${fromToken.symbol}&to=${toToken.symbol}&amount=${amount}&received=${quote.expectedOutput}`
    );
  }

  return (
    <div className="space-y-lg">
      {/* Trust signals — above the input per brief */}
      <TrustBar />

      {/* Headline */}
      <div>
        <h1 className="text-head text-ink leading-tight">{t.swap.headline}</h1>
        <p className="text-small text-ink/60 mt-xs">{t.swap.subhead}</p>
      </div>

      {/* Send card */}
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
        onMax={
          fromBalance && fromBalance.value > 0n
            ? () =>
                setAmount(
                  formatBalance(fromBalance.value, fromBalance.decimals)
                )
            : undefined
        }
      />

      {/* Direction toggle */}
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

      {/* Receive card */}
      <AmountInput
        label={t.swap.youReceive}
        value={quote ? formatAmount(quote.expectedOutput, 2) : ""}
        onChange={() => {}}
        readOnly
        muted
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

      {/* Quote breakdown */}
      {(amount && parseFloat(amount) > 0) && (
        <QuoteBreakdown
          state={quoteState}
          rate={rate}
          fee={feeNum}
          feeCurrency={fromToken.symbol}
          feePercent={PLATFORM_FEE_PERCENT}
          received={receivedNum}
          receivedCurrency={toToken.symbol}
          minReceived={minReceivedNum}
          impact={quote?.priceImpact}
        />
      )}

      {/* Sticky CTA */}
      <div className="sticky bottom-0 -mx-md px-md pt-md pb-md bg-gradient-to-t from-bg via-bg to-transparent">
        <BigCTA state={ctaState} onClick={handleCta} ariaLabel={ctaLabel}>
          {ctaLabel}
        </BigCTA>
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