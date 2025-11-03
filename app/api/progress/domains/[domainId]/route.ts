import { getCurrentUser } from '@/lib/auth/get-user'
import { getDomainProgress, checkDomainCompletion } from '@/lib/progress-tracking'
import { getDomainById } from '@/lib/curriculum-data'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/progress/domains/[domainId]
 * Get progress for a specific domain
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ domainId: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { domainId } = await params
    const domain = getDomainById(domainId)

    if (!domain) {
      return NextResponse.json(
        { error: 'Domain not found' },
        { status: 404 }
      )
    }

    const totalLessons = domain.modules.reduce((sum, m) => sum + m.lessons.length, 0)
    const progress = await getDomainProgress(user.id, domainId, totalLessons)
    const completion = await checkDomainCompletion(user.id, domainId)

    return NextResponse.json({
      domainId: domainId,
      domainTitle: domain.title,
      ...progress,
      completed: completion ? true : false,
      completedAt: completion?.completedAt?.toISOString() || null,
      certificateUrl: completion ? `/certificates/${domainId}` : null,
    })
  } catch (error) {
    console.error('Error fetching domain progress:', error)
    return NextResponse.json(
      { error: 'Failed to fetch domain progress' },
      { status: 500 }
    )
  }
}

