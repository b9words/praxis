
import { prisma } from '@/lib/prisma/server'
import { getCachedCase } from '@/lib/cache'
import { NextRequest, NextResponse } from 'next/server'

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

    // Check if case exists before updating
    const existing = await prisma.case.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 })
    }

    const { competencyIds, ...updateData } = body

    // Update case
    const caseItem = await prisma.$transaction(async (tx) => {
      // Update competencies if provided
      if (competencyIds) {
        // Delete existing relations
        await tx.caseCompetency.deleteMany({
          where: { caseId: id },
        })
        // Create new relations
        await tx.caseCompetency.createMany({
          data: competencyIds.map((compId: string) => ({
            caseId: id,
            competencyId: compId,
          })),
        })
      }

      // Update case
      return await tx.case.update({
        where: { id },
        data: {
          ...updateData,
          updatedBy: user.id,
        },
        include: {
          competencies: {
            include: {
              competency: true,
            },
          },
        },
      })
    })

    return NextResponse.json({ case: caseItem })
  } catch (error: any) {
    if (error instanceof Error && (error.message === 'Unauthorized' || error.message === 'Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    
    // Handle P2025 (record not found) gracefully
    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 })
    }
    
    const { normalizeError } = await import('@/lib/api/route-helpers')
    const { getPrismaErrorStatusCode } = await import('@/lib/prisma-error-handler')
    const normalized = normalizeError(error)
    const statusCode = getPrismaErrorStatusCode(error)
    console.error('Error updating case:', error)
    return NextResponse.json({ error: normalized }, { status: statusCode })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    
    const { id } = await params

    // Check if case exists before deleting
    const existing = await prisma.case.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 })
    }

    await prisma.case.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error instanceof Error && (error.message === 'Unauthorized' || error.message === 'Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    
    // Handle P2025 (record not found) gracefully
    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 })
    }
    
    const { normalizeError } = await import('@/lib/api/route-helpers')
    const { getPrismaErrorStatusCode } = await import('@/lib/prisma-error-handler')
    const normalized = normalizeError(error)
    const statusCode = getPrismaErrorStatusCode(error)
    console.error('Error deleting case:', error)
    return NextResponse.json({ error: normalized }, { status: statusCode })
  }
}

