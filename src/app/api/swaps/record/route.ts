import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { z } from 'zod'

// ============================================================
// SWAP RECORDING — called after user-signed tx confirms
// ============================================================

const RecordSwapSchema = z.object({
  user_id: z.string().uuid(),
  source_asset: z.string(),
  dest_asset: z.string(),
  source_amount: z.string(),
  dest_amount: z.string(),
  rate: z.string(),
  fee_amount: z.string(),
  fee_currency: z.string(),
  evm_tx_hash: z.string(),
  route: z.string(),
  metadata: z.record(z.any()).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = RecordSwapSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    const { data, error } = await supabase
      .from('swaps')
      .insert({
        user_id: parsed.data.user_id,
        source_chain: 'base',
        dest_chain: 'base',
        source_asset: parsed.data.source_asset,
        dest_asset: parsed.data.dest_asset,
        source_amount: parsed.data.source_amount,
        dest_amount: parsed.data.dest_amount,
        rate: parsed.data.rate,
        fee_amount: parsed.data.fee_amount,
        fee_currency: parsed.data.fee_currency,
        evm_tx_hash: parsed.data.evm_tx_hash,
        status: 'completed',
        route: parsed.data.route,
        metadata: parsed.data.metadata || {},
        completed_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Supabase error recording swap:', error)
      return NextResponse.json({ error: 'Failed to record swap' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Record swap error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
