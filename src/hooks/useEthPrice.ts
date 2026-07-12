"use client";

import { useEffect, useState } from "react";

const FALLBACK_ETH_USD = 3500; // used if CoinGecko is unreachable
const CACHE_MS = 60_000;

type CacheEntry = { price: number; at: number };
let cache: CacheEntry | null = null;

/**
 * useEthPrice — USD price of ETH, used to render gas estimate as USD.
 * Free CoinGecko endpoint, no API key required. Cached client-side for 60s.
 * Falls back to $3,500 if the network call fails.
 */
export function useEthPrice(): number {
  const [price, setPrice] = useState<number>(
    () => cache?.price ?? FALLBACK_ETH_USD
  );

  useEffect(() => {
    if (cache && Date.now() - cache.at < CACHE_MS) {
      setPrice(cache.price);
      return;
    }
    let cancelled = false;
    fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd",
      { headers: { accept: "application/json" } }
    )
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((j) => {
        const p = j?.ethereum?.usd;
        if (typeof p === "number" && isFinite(p) && p > 0) {
          cache = { price: p, at: Date.now() };
          if (!cancelled) setPrice(p);
        }
      })
      .catch(() => {
        // keep current value (fallback or stale cache)
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return price;
}

/**
 * formatGasUsd — convert (gas units * gas price wei) to USD at the current ETH price.
 * Returns null if either value is missing/invalid.
 */
export function formatGasUsd(
  gasUnits: bigint | null | undefined,
  gasPriceWei: string | null | undefined,
  ethUsd: number
): number | null {
  if (!gasUnits || !gasPriceWei) return null;
  try {
    const priceWei = BigInt(gasPriceWei);
    if (priceWei === 0n || gasUnits === 0n) return null;
    // wei * ETH/USD / 1e18 = USD (with 1e18 scale for wei → ETH)
    // To avoid losing precision: do everything in bigint then divide.
    // Multiply by 1e8 to keep precision, then divide at the end.
    const SCALE = 1_000_000n;
    const numerator = gasUnits * priceWei * BigInt(Math.round(ethUsd * Number(SCALE)));
    const denominator = 10n ** 18n * SCALE;
    const usdScaled = numerator / denominator;
    return Number(usdScaled) / Number(SCALE);
  } catch {
    return null;
  }
}