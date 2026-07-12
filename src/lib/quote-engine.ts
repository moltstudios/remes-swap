/**
 * Backend quote engine — queries Uniswap V3 Quoter on Base chain.
 * Response shape matches Jin's frontend QuoteResponse type.
 */

import { ethers } from 'ethers'
import { QUOTER_ABI } from '@/lib/abis'

// ============================================================
// CONFIG
// ============================================================

const BASE_RPC = process.env.BASE_RPC_URL || process.env.BASE_SEPOLIA_RPC_URL!
const QUOTER_ADDRESS = process.env.NEXT_PUBLIC_UNISWAP_V3_QUOTER || '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6'
const PLATFORM_FEE_BIPS = parseInt(process.env.PLATFORM_FEE_BIPS || '30') // 0.3%

// Token addresses on Base
const TOKENS: Record<string, { address: string; decimals: number }> = {
  USDC: {
    address: process.env.NEXT_PUBLIC_USDC_ADDRESS || '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    decimals: 6,
  },
  USDT: {
    address: process.env.NEXT_PUBLIC_USDT_ADDRESS || '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2',
    decimals: 6,
  },
}

// Uniswap V3 pool fee tiers to try (priority order)
const POOL_FEES = [500, 3000, 100, 10000] // 0.05%, 0.3%, 0.01%, 1%

// ============================================================
// TYPES — matches Jin's frontend QuoteResponse
// ============================================================

export interface QuoteInput {
  sourceAsset: string // "USDC" or 0x address
  destAsset: string // "USDT" or 0x address
  amount: string // human-readable (e.g. "100.5")
  slippageBps?: number // optional, default 50 (0.5%)
}

export interface QuoteResult {
  expectedOutput: string // human-readable
  minReceived: string // human-readable after slippage
  fee: string // human-readable
  priceImpact: number // 0-1 float (e.g. 0.001 = 0.1%)
  feePercent: number // platform fee as 0-1 float
  route: string
  // Extra backend-only fields
  rate: string
  feeCurrency: string
  poolFee: number
}

// ============================================================
// HELPERS
// ============================================================

function resolveToken(identifier: string): { address: string; decimals: number } {
  const upper = identifier.toUpperCase()
  if (TOKENS[upper]) return TOKENS[upper]

  if (identifier.startsWith('0x') && identifier.length === 42) {
    return { address: identifier, decimals: 6 }
  }

  throw new Error(`Unknown token: ${identifier}`)
}

function applyFee(amountOut: bigint, feeBips: number): { net: bigint; fee: bigint } {
  const fee = (amountOut * BigInt(feeBips)) / 10000n
  const net = amountOut - fee
  return { net, fee }
}

// ============================================================
// QUOTE ENGINE
// ============================================================

export async function getQuote(input: QuoteInput): Promise<QuoteResult> {
  const tokenIn = resolveToken(input.sourceAsset)
  const tokenOut = resolveToken(input.destAsset)

  if (tokenIn.address.toLowerCase() === tokenOut.address.toLowerCase()) {
    throw new Error('Source and destination assets must be different')
  }

  const amountIn = ethers.parseUnits(input.amount, tokenIn.decimals)
  if (amountIn <= 0n) {
    throw new Error('Amount must be greater than 0')
  }

  const provider = new ethers.JsonRpcProvider(BASE_RPC)
  const quoter = new ethers.Contract(QUOTER_ADDRESS, QUOTER_ABI, provider)

  // Try each pool fee tier, pick best output
  let bestResult: { amountOut: bigint; poolFee: number } | null = null

  for (const fee of POOL_FEES) {
    try {
      const amountOut = await quoter.quoteExactInputSingle.staticCall(
        tokenIn.address,
        tokenOut.address,
        fee,
        amountIn,
        0 // sqrtPriceLimitX96 = 0 (no limit)
      )

      if (!bestResult || amountOut > bestResult.amountOut) {
        bestResult = { amountOut, poolFee: fee }
      }
    } catch {
      continue // Pool doesn't exist for this fee tier
    }
  }

  if (!bestResult) {
    throw new Error('No liquidity pool found for this token pair')
  }

  const grossOutput = bestResult.amountOut

  // Apply platform fee
  const { net, fee } = applyFee(grossOutput, PLATFORM_FEE_BIPS)

  // Calculate price impact (0-1 float for frontend)
  const inputFloat = parseFloat(input.amount)
  const grossOutputFloat = parseFloat(ethers.formatUnits(grossOutput, tokenOut.decimals))
  const priceImpact = Math.max(0, (inputFloat - grossOutputFloat) / inputFloat)

  // Slippage tolerance
  const slippageBps = input.slippageBps ?? 50
  const minReceived = net - (net * BigInt(slippageBps)) / 10000n

  // Rate
  const netFloat = parseFloat(ethers.formatUnits(net, tokenOut.decimals))
  const rate = (netFloat / inputFloat).toFixed(8)

  return {
    expectedOutput: ethers.formatUnits(net, tokenOut.decimals),
    minReceived: ethers.formatUnits(minReceived, tokenOut.decimals),
    fee: ethers.formatUnits(fee, tokenOut.decimals),
    priceImpact,
    feePercent: PLATFORM_FEE_BIPS / 10000,
    route: `Uniswap V3 (${bestResult.poolFee / 10000}%)`,
    rate,
    feeCurrency: input.destAsset,
    poolFee: bestResult.poolFee,
  }
}
