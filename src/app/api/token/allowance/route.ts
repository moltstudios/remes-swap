import { NextRequest, NextResponse } from 'next/server'
import { ethers } from 'ethers'
import { z } from 'zod'
import { ERC20_ABI } from '@/lib/abis'

// ============================================================
// ALLOWANCE CHECK — does the Router have enough allowance?
// If yes, skip the approve tx entirely (saves gas + time)
// ============================================================

const AllowanceSchema = z.object({
  token: z.string().min(3).max(42),
  owner: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid owner address'),
  spender: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid spender address'),
})

const BASE_RPC = process.env.BASE_RPC_URL || 'https://mainnet.base.org'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = AllowanceSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { token, owner, spender } = parsed.data

    // Normalize addresses to checksummed format
    const tokenAddr = ethers.getAddress(token)
    const ownerAddr = ethers.getAddress(owner)
    const spenderAddr = ethers.getAddress(spender)

    const provider = new ethers.JsonRpcProvider(BASE_RPC)
    const tokenContract = new ethers.Contract(tokenAddr, ERC20_ABI, provider)

    const allowance = await tokenContract.allowance(ownerAddr, spenderAddr)

    return NextResponse.json({
      allowance: allowance.toString(),
      token: tokenAddr,
      owner: ownerAddr,
      spender: spenderAddr,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: 'Failed to check allowance' }, { status: 500 })
  }
}
