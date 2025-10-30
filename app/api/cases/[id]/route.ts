import { requireRole } from '@/lib/auth/authorize'
import { prisma } from '@/lib/prisma/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const caseItem = await prisma.case.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            fullName: true,
          },
        },
        updater: {
          select: {
            id: true,
            username: true,
            fullName: true,
          },
        },
        competencies: {
          include: {
            competency: true,
          },
        },
      },
    })

    if (!caseItem) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 })
    }

    return NextResponse.json({ case: caseItem })
  } catch (error) {
    console.error('Error fetching case:', error)
    return NextResponse.json({ error: 'Failed to fetch case' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(['editor', 'admin'])
    const { id } = await params
    const body = await request.json()

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
  } catch (error) {
    if (error instanceof Error && (error.message === 'Unauthorized' || error.message === 'Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    console.error('Error updating case:', error)
    return NextResponse.json({ error: 'Failed to update case' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(['admin'])
    const { id } = await params

    await prisma.case.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && (error.message === 'Unauthorized' || error.message === 'Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    console.error('Error deleting case:', error)
    return NextResponse.json({ error: 'Failed to delete case' }, { status: 500 })
  }
}

