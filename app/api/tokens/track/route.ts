import { NextRequest, NextResponse } from 'next/server'
import { trackTokenUsage } from '@/lib/db/tokens'
import { AppError } from '@/lib/db/utils'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { date, model, prompt_tokens, completion_tokens, total_tokens } = body

    await trackTokenUsage({
      date: new Date(date),
      model,
      promptTokens: prompt_tokens,
      completionTokens: completion_tokens,
      totalTokens: total_tokens,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    console.error('Failed to track token usage:', error)
    return NextResponse.json({ error: 'Failed to track usage' }, { status: 500 })
  }
}

