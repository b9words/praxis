import { getCurrentUser } from '@/lib/auth/get-user'
import { getDomainProgress, getUserDomainCompletions } from '@/lib/progress-tracking'
import { getAllDomains } from '@/lib/curriculum-data'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/progress/domains
 * Get progress across all domains for the current user
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const allDomains = getAllDomains()
    
    // Get all domain completions
    const domainCompletions = await getUserDomainCompletions(user.id)
    const completionMap = new Map(
      domainCompletions.map(dc => [dc.domainId, dc])
    )

    // Get progress for each domain
    const domainProgressPromises = allDomains.map(async (domain) => {
      const totalLessons = domain.modules.reduce((sum, m) => sum + m.lessons.length, 0)
      const progress = await getDomainProgress(user.id, domain.id, totalLessons)
      const completion = completionMap.get(domain.id)

      return {
        domainId: domain.id,
        domainTitle: domain.title,
        totalLessons: progress.totalLessons,
        completedLessons: progress.completedLessons,
        inProgressLessons: progress.inProgressLessons,
        notStartedLessons: progress.notStartedLessons,
        completionPercentage: progress.completionPercentage,
        totalTimeSpentSeconds: progress.totalTimeSpentSeconds,
        completed: completion ? true : false,
        completedAt: completion?.completedAt?.toISOString() || null,
        certificateUrl: completion ? `/certificates/${domain.id}` : null,
      }
    })

    const domainProgress = await Promise.all(domainProgressPromises)

    return NextResponse.json({
      domains: domainProgress,
    })
  } catch (error) {
    console.error('Error fetching domain progress:', error)
    return NextResponse.json(
      { error: 'Failed to fetch domain progress' },
      { status: 500 }
    )
  }
}

