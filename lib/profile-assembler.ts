/**
 * Profile data assembler
 * Aggregates public profile data including contributions and stats
 */

import { getProfileByUsername } from './db/profiles'
import { getUserReadingStats } from './db/progress'
import { dbCall } from './db/utils'

export interface PublicProfileData {
  profile: {
    id: string
    username: string
    fullName: string | null
    avatarUrl: string | null
    bio: string | null
    createdAt: Date
  }
  stats: {
    lessonsCompleted: number
    totalTimeSpent: number
    caseResponses: number
    totalLikes: number
  }
  recentResponses: Array<{
    id: string
    caseId: string
    caseTitle: string
    content: string
    likesCount: number
    createdAt: Date
  }>
}

/**
 * Assemble public profile data for a user
 */
export async function assemblePublicProfile(username: string): Promise<PublicProfileData | null> {
  // Get profile
  const profile = await getProfileByUsername(username)
  if (!profile || !profile.isPublic) {
    return null
  }

  // Get reading stats
  const readingStats = await getUserReadingStats(profile.id).catch(() => null)

  // Get case responses for this user
  const responses = await dbCall(async (prisma) => {
    return prisma.caseResponse.findMany({
      where: {
        userId: profile.id,
        isPublic: true,
      },
      include: {
        case: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    })
  }).catch(() => [])

  // Calculate total likes across all responses
  const totalLikes = responses.reduce((sum, r) => sum + r.likesCount, 0)

  return {
    profile: {
      id: profile.id,
      username: profile.username,
      fullName: profile.fullName,
      avatarUrl: profile.avatarUrl,
      bio: profile.bio,
      createdAt: profile.createdAt,
    },
    stats: {
      lessonsCompleted: readingStats?.totalLessonsCompleted || 0,
      totalTimeSpent: readingStats?.totalTimeSpentSeconds || 0,
      caseResponses: responses.length,
      totalLikes,
    },
    recentResponses: responses.map((r) => ({
      id: r.id,
      caseId: r.case.id,
      caseTitle: r.case.title,
      content: r.content.substring(0, 200) + (r.content.length > 200 ? '...' : ''),
      likesCount: r.likesCount,
      createdAt: r.createdAt,
    })),
  }
}

