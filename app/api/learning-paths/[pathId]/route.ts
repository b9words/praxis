import { getCurrentUser } from '@/lib/auth/get-user'
import { getLearningPathById } from '@/lib/learning-paths'
import { prisma } from '@/lib/prisma/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pathId: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { pathId } = await params
    const path = await getLearningPathById(pathId)

    if (!path) {
      return NextResponse.json({ error: 'Learning path not found' }, { status: 404 })
    }

    // Get user's progress for this path
    const lessonProgress = await prisma.userLessonProgress.findMany({
      where: {
        userId: user.id,
      },
    })

    // Calculate progress for each item
    const itemsWithProgress = await Promise.all(
      path.items.map(async (item) => {
        if (item.type === 'lesson') {
          const progress = lessonProgress.find(
            p => p.domainId === item.domain &&
                 p.moduleId === item.module &&
                 p.lessonId === item.lesson
          )
          return {
            ...item,
            completed: progress?.status === 'completed' || false,
            progress: progress?.progressPercentage || 0,
          }
        } else if (item.type === 'case') {
          const simulation = await prisma.simulation.findFirst({
            where: {
              userId: user.id,
              caseId: item.caseId,
              status: 'completed',
            },
          }).catch(() => null)
          
          return {
            ...item,
            completed: !!simulation,
            progress: simulation ? 100 : 0,
          }
        }
        return item
      })
    )

    const completedCount = itemsWithProgress.filter((item: any) => item.completed || false).length
    const totalItems = itemsWithProgress.length
    const progressPercentage = totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0

    return NextResponse.json({
      path: {
        ...path,
        items: itemsWithProgress,
        progress: {
          completed: completedCount,
          total: totalItems,
          percentage: progressPercentage,
        },
      },
    })
  } catch (error: any) {
    console.error('Error fetching learning path:', error)
    const { normalizeError } = await import('@/lib/api/route-helpers')
    const normalized = normalizeError(error)
    return NextResponse.json({ error: normalized }, { status: 500 })
  }
}

