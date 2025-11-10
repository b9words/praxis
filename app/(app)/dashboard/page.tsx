import FocusedDashboard from '@/components/dashboard/FocusedDashboard'
import { getCurrentUser } from '@/lib/auth/get-user'
import { assembleDashboardData } from '@/lib/dashboard-assembler'
import { getCachedUserData, CacheTags } from '@/lib/cache'

export default async function DashboardPage() {
  const user = await getCurrentUser()

  // All auth checks removed

  // Dashboard always renders - no server-side redirects to prevent loops
  // If user doesn't have residency, dashboard will show appropriate empty state
  // Client-side components can handle navigation if needed

  if (!user) {
    return null
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
    />
  )
}
