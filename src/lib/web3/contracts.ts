// Base chain token + contract addresses
// Source: Base docs + Basescan
// IMPORTANT: verify on every deploy — addresses are immutable but mistakes are costly

import { base, baseSepolia } from "wagmi/chains";

export const BASE_TOKENS = {
  USDC: {
    address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as `0x${string}`,
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
    logoURI: "/icons/usdc.svg",
    // Native USDC on Base
  },
  USDT: {
    address: "0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2" as `0x${string}`,
    symbol: "USDT",
    name: "Tether USD",
    decimals: 6,
    logoURI: "/icons/usdt.svg",
  },
} as const;

export const UNISWAP_V3 = {
  // Base mainnet addresses (verified)
  SwapRouter02: "0x2626664c2603336E57B271c5C0b26F421741e481" as `0x${string}`,
  QuoterV2: "0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6" as `0x${string}`,
  // Fee tiers (concentrated liquidity)
  FeeTiers: {
    LOWEST: 100, // 0.01%
    LOW: 500, // 0.05%
    MEDIUM: 3000, // 0.3%
    HIGH: 10000, // 1%
  },
} as const;

// Stablecoin pairs — USDC/USDT typically uses the 0.01% or 0.05% pool
export const DEFAULT_FEE_TIER = UNISWAP_V3.FeeTiers.LOWEST;

export const CHAIN_INFO = {
  [base.id]: {
    name: "Base",
    explorer: "https://basescan.org",
    nativeCurrency: "ETH",
  },
  [baseSepolia.id]: {
    name: "Base Sepolia",
    explorer: "https://sepolia.basescan.org",
    nativeCurrency: "ETH",
  },
} as const;