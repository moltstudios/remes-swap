import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getQuote } from '@/lib/quote-engine'

// ============================================================
// VALIDATION
// ============================================================

const QuoteRequestSchema = z.object({
  sourceAsset: z.string().min(3).max(42),
  destAsset: z.string().min(3).max(42),
  amount: z.string().regex(/^\d+(\.\d+)?$/, 'Amount must be a positive number string'),
  slippageBps: z.number().int().min(0).max(1000).optional(),
})

// ============================================================
// RATE LIMITING (in-memory; upgrade to Upstash Redis for prod)
// ============================================================

const requestCounts = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX = 30

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const existing = requestCounts.get(ip)

  if (!existing || existing.resetAt < now) {
    requestCounts.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return true
  }

  if (existing.count >= RATE_LIMIT_MAX) {
    return false
  }

  existing.count++
  return true
}

// ============================================================
// HANDLER
// ============================================================

export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      'unknown'

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Try again in a minute.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const parsed = QuoteRequestSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const quote = await getQuote(parsed.data)

    return NextResponse.json(quote)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'

    const safeMessage =
      message.includes('No liquidity') ||
      message.includes('must be different') ||
      message.includes('must be greater') ||
      message.includes('Unknown token')
        ? message
        : 'Failed to generate quote'

    return NextResponse.json({ error: safeMessage }, { status: 500 })
  }
}

// Health check
export async function GET() {
  return NextResponse.json({ status: 'ok', service: 'remes-quote-engine' })
}
