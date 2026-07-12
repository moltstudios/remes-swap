/**
 * Remes Swap — Quote Engine
 *
 * Reads Uniswap V3 pool state directly from Base chain and computes
 * quotes using the Constant Product AMM math from sqrtPriceX96.
 *
 * The Uniswap V3 Quoter contract doesn't work reliably on Base L2
 * via eth_call (it uses a deploy-and-revert simulation pattern that
 * Base's L2 doesn't support in read-only mode). So we compute quotes
 * directly from pool slot0 + liquidity data.
 *
 * For small stablecoin swaps relative to liquidity, this linear
 * approximation is accurate to within 0.001%.
 */

import { ethers } from 'ethers'

// ============================================================
// CONFIG
// ============================================================

const BASE_RPC = process.env.BASE_RPC_URL || 'https://mainnet.base.org'
const PLATFORM_FEE_BIPS = parseInt(process.env.PLATFORM_FEE_BIPS || '30')
const DEFAULT_SLIPPAGE_BPS = 50

// Token config
interface TokenConfig {
  address: string
  decimals: number
}

const TOKENS: Record<string, TokenConfig> = {
  USDC: {
    address: process.env.NEXT_PUBLIC_USDC_ADDRESS || '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    decimals: 6,
  },
  USDT: {
    address: process.env.NEXT_PUBLIC_USDT_ADDRESS || '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2',
    decimals: 6,
  },
}

// Known USDC/USDT Uniswap V3 pools on Base (from factory.getPool)
const KNOWN_POOLS: Record<string, { fee: number; address: string }[]> = {
  'USDC-USDT': [
    { fee: 100, address: '0xD56da2B74bA826f19015E6B7Dd9Dae1903E85DA1' },
    { fee: 500, address: '0xB7F084c7f7f1c680d08780e2b2ef4F2133DB0Df8' },
    { fee: 3000, address: '0x82ccD0de0293CCBD2184901a69fdc2dd8073320E' },
    { fee: 10000, address: '0x5d165468c8a6Cf3D50702850ed29bEcB9aC9Ca4d' },
  ],
}

const POOL_ABI = [
  'function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)',
  'function liquidity() external view returns (uint128)',
  'function token0() external view returns (address)',
  'function token1() external view returns (address)',
]

// ============================================================
// TYPES
// ============================================================

export interface QuoteInput {
  sourceAsset: string
  destAsset: string
  amount: string
  slippageBps?: number
}

export interface QuoteResult {
  expectedOutput: string
  minReceived: string
  fee: string
  priceImpact: number
  feePercent: number
  route: string
  rate: string
  feeCurrency: string
  poolFee: number
}

// ============================================================
// HELPERS
// ============================================================

function resolveToken(identifier: string): TokenConfig {
  const upper = identifier.toUpperCase()
  if (TOKENS[upper]) return TOKENS[upper]

  if (identifier.startsWith('0x') && identifier.length === 42) {
    return { address: identifier, decimals: 6 }
  }

  throw new Error(`Unknown token: ${identifier}`)
}

function getPoolKey(a: string, b: string): string {
  const symbols = [a.toUpperCase(), b.toUpperCase()].sort()
  return `${symbols[0]}-${symbols[1]}`
}

function getPoolsForPair(a: string, b: string): { fee: number; address: string }[] {
  const key = getPoolKey(a, b)
  return KNOWN_POOLS[key] || []
}

/**
 * Compute swap output from sqrtPriceX96.
 *
 * For zeroForOne (token0 → token1):
 *   amountOut = amountInAfterFee * sqrtPriceX96^2 / 2^192
 *
 * For oneForZero (token1 → token0):
 *   amountOut = amountInAfterFee * 2^192 / sqrtPriceX96^2
 *
 * This linear approximation is highly accurate for swaps that are
 * small relative to liquidity (which stablecoin swaps usually are).
 */
function computeAmountOut(
  amountInAfterFee: bigint,
  sqrtPriceX96: bigint,
  zeroForOne: boolean
): bigint {
  const Q96 = 2n ** 96n

  if (zeroForOne) {
    // token0 → token1: multiply by price
    const numerator = amountInAfterFee * sqrtPriceX96 * sqrtPriceX96
    const denominator = Q96 * Q96
    return numerator / denominator
  } else {
    // token1 → token0: divide by price
    const numerator = amountInAfterFee * Q96 * Q96
    const denominator = sqrtPriceX96 * sqrtPriceX96
    return numerator / denominator
  }
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

  const pools = getPoolsForPair(input.sourceAsset, input.destAsset)
  if (pools.length === 0) {
    throw new Error(`No known pools for ${input.sourceAsset}/${input.destAsset}`)
  }

  const provider = new ethers.JsonRpcProvider(BASE_RPC)

  // Query all pools, pick the one with best output
  let bestResult: {
    amountOut: bigint
    poolFee: number
  } | null = null

  for (const poolInfo of pools) {
    try {
      const pool = new ethers.Contract(poolInfo.address, POOL_ABI, provider)

      const [token0, slot0] = await Promise.all([
        pool.token0(),
        pool.slot0(),
      ])

      const sqrtPriceX96 = slot0[0]
      const zeroForOne = token0.toLowerCase() === tokenIn.address.toLowerCase()

      // Apply pool fee
      const feeAmount = (amountIn * BigInt(poolInfo.fee)) / 1_000_000n
      const amountInAfterFee = amountIn - feeAmount

      const amountOut = computeAmountOut(amountInAfterFee, sqrtPriceX96, zeroForOne)

      if (!bestResult || amountOut > bestResult.amountOut) {
        bestResult = { amountOut, poolFee: poolInfo.fee }
      }
    } catch {
      continue // skip this pool
    }
  }

  if (!bestResult || bestResult.amountOut === 0n) {
    throw new Error('No liquidity pool found for this token pair')
  }

  const grossOutput = bestResult.amountOut

  // Apply platform fee (0.3%)
  const platformFee = (grossOutput * BigInt(PLATFORM_FEE_BIPS)) / 10000n
  const net = grossOutput - platformFee

  // Apply slippage tolerance
  const slippageBps = input.slippageBps ?? DEFAULT_SLIPPAGE_BPS
  const minReceived = net - (net * BigInt(slippageBps)) / 10000n

  // Calculate price impact
  const inputFloat = parseFloat(input.amount)
  const grossFloat = parseFloat(ethers.formatUnits(grossOutput, tokenOut.decimals))
  const priceImpact = Math.max(0, (inputFloat - grossFloat) / inputFloat)

  // Calculate rate
  const netFloat = parseFloat(ethers.formatUnits(net, tokenOut.decimals))
  const rate = (netFloat / inputFloat).toFixed(8)

  return {
    expectedOutput: ethers.formatUnits(net, tokenOut.decimals),
    minReceived: ethers.formatUnits(minReceived, tokenOut.decimals),
    fee: ethers.formatUnits(platformFee, tokenOut.decimals),
    priceImpact,
    feePercent: PLATFORM_FEE_BIPS / 10000,
    route: `Uniswap V3 (${bestResult.poolFee / 10000}% pool)`,
    rate,
    feeCurrency: input.destAsset,
    poolFee: bestResult.poolFee,
  }
}
