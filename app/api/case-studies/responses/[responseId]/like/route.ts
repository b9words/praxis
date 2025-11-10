import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/get-user'
import { toggleLike, getResponseById } from '@/lib/db/responses'

export const dynamic = 'force-dynamic'

/**
 * POST /api/case-studies/responses/[responseId]/like
 * Like a response (idempotent - if already liked, does nothing)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ responseId: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { responseId } = await params

    // Verify response exists
    const response = await getResponseById(responseId)
    if (!response) {
      return NextResponse.json({ error: 'Response not found' }, { status: 404 })
    }

    // Toggle like
    const result = await toggleLike(responseId, user.id)

    // Return updated response with new like count
    const updatedResponse = await getResponseById(responseId)

    return NextResponse.json({
      liked: result.liked,
      likesCount: updatedResponse?.likesCount || 0,
    })
  } catch (error) {
    console.error('[POST /api/case-studies/responses/[responseId]/like] Error:', error)
    return NextResponse.json(
      { error: 'Failed to like response' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/case-studies/responses/[responseId]/like
 * Unlike a response (idempotent - if not liked, does nothing)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ responseId: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { responseId } = await params

    // Verify response exists
    const response = await getResponseById(responseId)
    if (!response) {
      return NextResponse.json({ error: 'Response not found' }, { status: 404 })
    }

    // Toggle like (will unlike if already liked)
    const result = await toggleLike(responseId, user.id)

    // Return updated response with new like count
    const updatedResponse = await getResponseById(responseId)

    return NextResponse.json({
      liked: result.liked,
      likesCount: updatedResponse?.likesCount || 0,
    })
  } catch (error) {
    console.error('[DELETE /api/case-studies/responses/[responseId]/like] Error:', error)
    return NextResponse.json(
      { error: 'Failed to unlike response' },
      { status: 500 }
    )
  }
}





