import { NextResponse } from 'next/server'

/**
 * GET /api/content-generation/config
 * Returns API configuration (keys availability) for content generation
 * Never exposes actual API keys - only indicates if they're configured
 */
export async function GET() {
  try {
    // Check if API keys are configured (but don't expose them)
    const openaiConfigured = !!process.env.OPENAI_API_KEY
    const geminiConfigured = !!process.env.GEMINI_API_KEY

    return NextResponse.json({
      providers: {
        openai: {
          available: openaiConfigured,
          configured: openaiConfigured,
        },
        gemini: {
          available: geminiConfigured,
          configured: geminiConfigured,
        },
      },
    })
  } catch (error) {
    console.error('Error fetching content generation config:', error)
    return NextResponse.json(
      { error: 'Failed to fetch configuration' },
      { status: 500 }
    )
  }
}

