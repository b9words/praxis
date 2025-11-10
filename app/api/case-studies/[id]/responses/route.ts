import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/get-user'
import { createOrUpdateResponse, listPublicResponses } from '@/lib/db/responses'
import { getCaseById } from '@/lib/db/cases'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

/**
 * GET /api/case-studies/[id]/responses
 * List public responses for a case study, sorted by likes
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const cursor = searchParams.get('cursor') || undefined

    // Verify case exists
    const caseItem = await getCaseById(id)
    if (!caseItem || !caseItem.published) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 })
    }

    // List public responses (use database ID, not slug)
    const result = await listPublicResponses({
      caseId: caseItem.id,
      limit,
      cursor,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('[GET /api/case-studies/[id]/responses] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch responses' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/case-studies/[id]/responses
 * Create or update current user's response to a case study
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { content, isPublic, simulationId } = body

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      )
    }

    // Verify case exists
    const caseItem = await getCaseById(id)
    if (!caseItem || !caseItem.published) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 })
    }

    // Create or update response (use database ID, not slug)
    const response = await createOrUpdateResponse({
      caseId: caseItem.id,
      userId: user.id,
      simulationId: simulationId || null,
      content: content.trim(),
      isPublic: isPublic !== false, // Default to true
    })

    return NextResponse.json(response)
  } catch (error) {
    console.error('[POST /api/case-studies/[id]/responses] Error:', error)
    return NextResponse.json(
      { error: 'Failed to save response' },
      { status: 500 }
    )
  }
}





