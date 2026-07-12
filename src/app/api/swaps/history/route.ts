import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

// ============================================================
// SWAP HISTORY — returns user's past swaps
// ============================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!userId) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 })
    }

    const supabase = createServiceClient()

    const { data, error, count } = await supabase
      .from('swaps')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Supabase error fetching swaps:', error)
      return NextResponse.json({ error: 'Failed to fetch swaps' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data,
      pagination: { limit, offset, total: count || 0 },
    })
  } catch (error) {
    console.error('Fetch swaps error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
