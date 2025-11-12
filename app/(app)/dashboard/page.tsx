import FocusedDashboard from '@/components/dashboard/FocusedDashboard'
import { getCurrentUser } from '@/lib/auth/get-user'
import { getUserResidency } from '@/lib/auth/get-residency'
import { assembleDashboardData } from '@/lib/dashboard-assembler'
import { getCachedUserData, CacheTags } from '@/lib/cache'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const user = await getCurrentUser()

  if (!user) {
    return null
  }

  // Check if user has completed onboarding (has residency set)
  const residency = await getUserResidency(user.id)
  if (!residency.currentResidency) {
    redirect('/onboarding')
  }

  // Cache dashboard data with userId in key, 5 minute revalidation
  const getCachedDashboardData = getCachedUserData(
    user.id,
    () => assembleDashboardData(user.id),
    ['dashboard', 'data'],
    {
      tags: [CacheTags.DASHBOARD, CacheTags.USER_PROGRESS],
      revalidate: 300, // 5 minutes
    }
  )
  
  const dashboardData = await getCachedDashboardData()

  // Deduplicate content across shelves
  const seenContentIds = new Set<string>()
  const dedupeContent = <T extends { id: string }>(items: T[] | undefined): T[] => {
    if (!items || !Array.isArray(items)) {
      return []
    }
    return items.filter(item => {
      if (seenContentIds.has(item.id)) {
        return false
      }
      seenContentIds.add(item.id)
      return true
    })
  }

  return (
    <FocusedDashboard
      roadmap={dashboardData.roadmap}
      recommendation={dashboardData.recommendation}
      jumpBackInItems={dashboardData.jumpBackInItems}
      currentStreak={dashboardData.currentStreak}
      weeklyGoal={dashboardData.weeklyGoal}
    />
  )
}
