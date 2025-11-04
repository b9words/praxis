import { NextRequest, NextResponse } from 'next/server'
import { getAggregatedUsageByDate } from '@/lib/db/tokens'
import { AppError } from '@/lib/db/utils'
import { OPENAI_TOKEN_LIMITS } from '@/lib/content-generator'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const date = searchParams.get('date')
    const model = searchParams.get('model')

    if (!date) {
      return NextResponse.json({ error: 'Date parameter required' }, { status: 400 })
    }

    const dateObj = new Date(date)

    const modelUsage = await getAggregatedUsageByDate(dateObj)

    // Filter by model if specified
    const filteredUsage = model
      ? modelUsage.filter(u => u.model === model)
      : modelUsage

    // Convert to summary format
    const summaries = filteredUsage.map((usage) => {
      const limit =
        OPENAI_TOKEN_LIMITS[usage.model as keyof typeof OPENAI_TOKEN_LIMITS] || 0
      const remaining = Math.max(0, limit - usage.total_tokens)
      const percentage_used = limit > 0 ? (usage.total_tokens / limit) * 100 : 0

      return {
        date,
        model: usage.model,
        total_tokens: usage.total_tokens,
        limit,
        remaining,
        percentage_used,
      }
    })

    return NextResponse.json(summaries)
  } catch (error: any) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    console.error('Failed to get daily usage:', error)
    return NextResponse.json({ error: 'Failed to get usage' }, { status: 500 })
  }
}

