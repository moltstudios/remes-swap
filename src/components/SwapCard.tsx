"use client";

import { useEffect, useMemo, useState } from "react";
import { useAccount, useBalance } from "wagmi";
import { TokenSelector } from "./TokenSelector";
import { TokenLogo, ImpactBadge } from "./TokenLogo";
import { useI18n } from "@/lib/i18n";
import {
  formatAmount,
  formatTokenAmount,
  formatPercent,
  parseTokenAmount,
} from "@/lib/format";
import { SUPPORTED_TOKENS, type TokenMeta } from "@/lib/tokens";
import { fetchQuote, type QuoteResponse } from "@/lib/quote";

const DEFAULT_SLIPPAGE_BPS = 50;

export function SwapCard() {
  const { t } = useI18n();
  const { address, isConnected, chain } = useAccount();

  const [fromToken, setFromToken] = useState<TokenMeta>(SUPPORTED_TOKENS[0]);
  const [toToken, setToToken] = useState<TokenMeta>(SUPPORTED_TOKENS[1]);
  const [amount, setAmount] = useState("");
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: fromBalance } = useBalance({
    address,
    token: fromToken.address,
    chainId: chain?.id,
    query: { enabled: isConnected },
  });

  // Debounced quote fetching — pulls live rate as user types
  useEffect(() => {
    if (!amount || parseFloat(amount) <= 0) {
      setQuote(null);
      return;
    }
    const handle = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const q = await fetchQuote({
          sourceAsset: fromToken.address,
          destAsset: toToken.address,
          amount,
          sourceDecimals: fromToken.decimals,
          slippageBps: DEFAULT_SLIPPAGE_BPS,
        });
        setQuote(q);
      } catch (e) {
        setError(t.swap.quoteFailed);
        setQuote(null);
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => clearTimeout(handle);
  }, [amount, fromToken, toToken, t.swap.quoteFailed]);

  const insufficient = useMemo(() => {
    if (!fromBalance || !amount) return false;
    const have = parseTokenAmount(amount, fromToken.decimals);
    return have > fromBalance.value;
  }, [amount, fromBalance, fromToken.decimals]);

  const receivedDisplay = quote ? quote.expectedOutput : "0";
  const minReceivedDisplay = quote ? quote.minReceived : "0";
  const feeDisplay = quote ? quote.fee : "0";
  const rateDisplay = useMemo(() => {
    if (!quote || !amount || parseFloat(amount) === 0) return null;
    const out = parseFloat(receivedDisplay) / parseFloat(amount);
    return out.toFixed(6);
  }, [quote, amount, receivedDisplay]);

  const handleSwap = () => {
    // TODO Week 2: wire to writeContract using UNISWAP_V3.SwapRouter02
    // For now this is a scaffolded stub so the UX flow can be tested.
    alert(
      `Stub: swap ${amount} ${fromToken.symbol} → ${receivedDisplay} ${toToken.symbol}\n` +
        `Wire to Neo's swap endpoint in Week 2.`
    );
  };

  return (
    <div className="card p-5 sm:p-6 space-y-4">
      {/* From */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-micro text-ink-500 uppercase tracking-wider">
            {t.swap.from}
          </span>
          {isConnected && fromBalance && (
            <span className="text-micro text-ink-500 tabular-nums">
              {t.swap.balance}{" "}
              <span className="text-ink-700">
                {formatTokenAmount(fromBalance.value, fromBalance.decimals, 2)}
              </span>{" "}
              {fromToken.symbol}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 bg-surface-alt rounded-card p-4">
          <input
            type="text"
            inputMode="decimal"
            placeholder="0"
            value={amount}
            onChange={(e) => {
              const v = e.target.value.replace(/[^0-9.]/g, "");
              setAmount(v);
            }}
            className="input-amount bg-transparent flex-1"
          />
          <div className="flex items-center gap-2 shrink-0">
            {isConnected && fromBalance && fromBalance.value > 0n && (
              <button
                onClick={() =>
                  setAmount(
                    formatTokenAmount(
                      fromBalance.value,
                      fromBalance.decimals,
                      6
                    )
                  )
                }
                className="text-micro font-semibold text-ink-700 hover:text-ink-900 px-2 py-1 rounded-md bg-white border border-ink-200"
              >
                {t.swap.max}
              </button>
            )}
            <TokenSelector
              label={t.swap.from}
              selected={fromToken}
              onChange={setFromToken}
              options={SUPPORTED_TOKENS}
              exclude={toToken}
            />
          </div>
        </div>
      </div>

      {/* Direction toggle */}
      <div className="flex justify-center -my-1">
        <button
          onClick={() => {
            const prev = fromToken;
            setFromToken(toToken);
            setToToken(prev);
            setAmount("");
            setQuote(null);
          }}
          aria-label="Invertir dirección"
          className="w-10 h-10 rounded-full bg-white border border-ink-200 shadow-card flex items-center justify-center hover:bg-surface-alt transition-colors"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-ink-700"
          >
            <path d="M7 16V4M7 4l-3 3M7 4l3 3M17 8v12M17 20l-3-3M17 20l3-3" />
          </svg>
        </button>
      </div>

      {/* To */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-micro text-ink-500 uppercase tracking-wider">
            {t.swap.to}
          </span>
        </div>
        <div className="flex items-center gap-3 bg-surface-alt rounded-card p-4">
          <div className="input-amount flex-1 text-ink-700">
            {loading ? "…" : formatAmount(receivedDisplay, 6)}
          </div>
          <TokenSelector
            label={t.swap.to}
            selected={toToken}
            onChange={setToToken}
            options={SUPPORTED_TOKENS}
            exclude={fromToken}
          />
        </div>
      </div>

      {/* Quote details */}
      {quote && amount && (
        <div className="border-t border-ink-100 pt-4 space-y-2 text-small">
          <Row
            label={t.swap.rate}
            value={
              rateDisplay ? `1 ${fromToken.symbol} = ${rateDisplay} ${toToken.symbol}` : "—"
            }
          />
          <Row
            label={t.swap.fee}
            value={`${feeDisplay} ${fromToken.symbol} (${formatPercent(quote.feePercent)})`}
          />
          <Row
            label={t.swap.priceImpact}
            value={
              <ImpactBadge impact={quote.priceImpact} />
            }
          />
          <Row
            label={t.swap.minReceived}
            value={`${formatAmount(minReceivedDisplay, 6)} ${toToken.symbol}`}
          />
        </div>
      )}

      {error && (
        <p className="text-small text-red-600 text-center">{error}</p>
      )}

      {/* CTA */}
      <button
        onClick={handleSwap}
        disabled={
          !isConnected ||
          !amount ||
          !quote ||
          loading ||
          insufficient
        }
        className="btn-primary w-full"
      >
        {!isConnected
          ? t.wallet.connect
          : insufficient
          ? t.swap.insufficientBalance
          : loading
          ? t.swap.quoteLoading
          : !amount
          ? t.swap.enterAmount
          : t.swap.swap}
      </button>
    </div>
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
    <div className="flex items-center justify-between">
      <span className="text-ink-500">{label}</span>
      <span className="text-ink-900 font-medium tabular-nums">{value}</span>
    </div>
  );
}