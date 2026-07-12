import { NextRequest, NextResponse } from 'next/server'
import { ethers } from 'ethers'
import { z } from 'zod'
import { getQuote } from '@/lib/quote-engine'
import { SWAP_ROUTER_ABI, ERC20_ABI } from '@/lib/abis'

// ============================================================
// SWAP PREP — generates calldata for user-signed transaction
// Non-custodial: we NEVER sign. User signs in their wallet.
// ============================================================

const SwapPrepSchema = z.object({
  sourceAsset: z.string().min(3).max(42),
  destAsset: z.string().min(3).max(42),
  amount: z.string().regex(/^\d+(\.\d+)?$/, 'Amount must be a positive number'),
  recipient: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid recipient address'),
  slippageBps: z.number().int().min(0).max(1000).optional(),
}).transform((data) => ({
  ...data,
  // Normalize addresses to checksummed format for ethers v6
  recipient: ethers.getAddress(data.recipient),
}))

const ROUTER_ADDRESS = process.env.NEXT_PUBLIC_UNISWAP_V3_ROUTER || '0x2626664c2603336E57B271c5C0b26F421741e481'
const BASE_RPC = process.env.BASE_RPC_URL || 'https://mainnet.base.org'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = SwapPrepSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { sourceAsset, destAsset, recipient, slippageBps } = parsed.data

    // Get the quote first
    const quote = await getQuote({
      sourceAsset,
      destAsset,
      amount: parsed.data.amount,
      slippageBps,
    })

    const provider = new ethers.JsonRpcProvider(BASE_RPC)

    // Resolve token addresses
    const tokenIn = resolveAddress(sourceAsset)
    const tokenOut = resolveAddress(destAsset)

    // Check if Router is approved for tokenIn
    const tokenContract = new ethers.Contract(tokenIn, ERC20_ABI, provider)
    const amountIn = ethers.parseUnits(parsed.data.amount, 6)

    // Generate the swap calldata
    const router = new ethers.Contract(ROUTER_ADDRESS, SWAP_ROUTER_ABI, provider)

    // Deadline: 20 minutes from now
    const deadline = Math.floor(Date.now() / 1000) + 20 * 60

    // Min received from quote (already has slippage applied)
    const minAmountOut = ethers.parseUnits(quote.minReceived, 6)

    // Build the exactInputSingle params
    // The SwapRouter02 uses a slightly different struct than V3 router
    // params: tokenIn, tokenOut, fee, recipient, amountIn, amountOutMinimum, sqrtPriceLimitX96
    const swapParams = {
      tokenIn,
      tokenOut,
      fee: quote.poolFee,
      recipient,
      amountIn,
      amountOutMinimum: minAmountOut,
      sqrtPriceLimitX96: 0n,
    }

    // Encode the calldata
    const swapData = router.interface.encodeFunctionData('exactInputSingle', [swapParams])

    // Also prepare the approve calldata (if needed)
    const approveData = tokenContract.interface.encodeFunctionData('approve', [ROUTER_ADDRESS, amountIn])

    return NextResponse.json({
      quote,
      steps: [
        {
          step: 1,
          label: 'Approve',
          description: `Allow Router to spend ${parsed.data.amount} ${sourceAsset.toUpperCase()}`,
          to: tokenIn,
          data: approveData,
          value: '0',
          // Frontend checks if allowance is already sufficient before sending this
        },
        {
          step: 2,
          label: 'Swap',
          description: `Swap ${parsed.data.amount} ${sourceAsset.toUpperCase()} → ${quote.expectedOutput} ${destAsset.toUpperCase()}`,
          to: ROUTER_ADDRESS,
          data: swapData,
          value: '0',
        },
      ],
      routerAddress: ROUTER_ADDRESS,
      deadline,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    const safeMessage =
      message.includes('No liquidity') ||
      message.includes('must be different') ||
      message.includes('must be greater') ||
      message.includes('Unknown token') ||
      message.includes('No known pools')
        ? message
        : 'Failed to prepare swap'

    return NextResponse.json({ error: safeMessage }, { status: 500 })
  }
}

function resolveAddress(identifier: string): string {
  const TOKENS: Record<string, string> = {
    USDC: process.env.NEXT_PUBLIC_USDC_ADDRESS || '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    USDT: process.env.NEXT_PUBLIC_USDT_ADDRESS || '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2',
  }

  const upper = identifier.toUpperCase()
  if (TOKENS[upper]) return TOKENS[upper]

  if (identifier.startsWith('0x') && identifier.length === 42) {
    return identifier
  }

  throw new Error(`Unknown token: ${identifier}`)
}
