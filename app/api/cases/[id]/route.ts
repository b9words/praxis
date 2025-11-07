import { getCachedCase } from '@/lib/cache'
import { updateCaseWithCompetencies, deleteCase } from '@/lib/db/cases'
import { AppError } from '@/lib/db/utils'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Use cached case helper (1 hour revalidate)
    const caseItem = await getCachedCase(id)

    if (!caseItem) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 })
    }

    // Return case directly from DB (briefingDoc, datasets, rubric are now stored in DB)
    return NextResponse.json({ case: caseItem })
  } catch (error) {
    const { normalizeError } = await import('@/lib/api/route-helpers')
    const normalized = normalizeError(error)
    console.error('Error fetching case:', error)
    return NextResponse.json({ error: normalized }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { getCurrentUser } = await import('@/lib/auth/get-user')
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    const { competencyIds, ...updateData } = body

    const caseItem = await updateCaseWithCompetencies(id, {
      ...updateData,
      competencyIds: competencyIds !== undefined ? competencyIds : undefined,
      updatedBy: user.id,
    })

    return NextResponse.json({ case: caseItem })
  } catch (error: any) {
    if (error instanceof Error && (error.message === 'Unauthorized' || error.message === 'Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    const { normalizeError } = await import('@/lib/api/route-helpers')
    const normalized = normalizeError(error)
    console.error('Error updating case:', error)
    return NextResponse.json({ error: normalized }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { requireRole } = await import('@/lib/auth/authorize')
    await requireRole(['editor', 'admin'])
    
    const { id } = await params

    await deleteCase(id)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error instanceof Error && (error.message === 'Unauthorized' || error.message === 'Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: error.message === 'Unauthorized' ? 401 : 403 })
    }
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    const { normalizeError } = await import('@/lib/api/route-helpers')
    const normalized = normalizeError(error)
    console.error('Error deleting case:', error)
    return NextResponse.json({ error: normalized }, { status: 500 })
  }
}

