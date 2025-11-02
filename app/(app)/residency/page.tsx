import ResidencySelector from '@/components/dashboard/ResidencySelector'
import { getCurrentUser } from '@/lib/auth/get-user'
import { prisma } from '@/lib/prisma/server'
import { getCachedUserData, CacheTags } from '@/lib/cache'

export default async function ResidencyPage() {
  const user = await getCurrentUser()

  // Auth protection is handled by middleware
  if (!user) {
    return null
  }

  // Cache user's current residency (5 minutes revalidate, userId in key)
  const getCachedUserResidency = getCachedUserData(
    user.id,
    async () => {
      // Get user's current residency with error handling
      let userResidency = null
      try {
        userResidency = await prisma.userResidency.findUnique({
          where: { userId: user.id },
          select: { currentResidency: true },
        })
      } catch (error) {
        console.error('Error fetching user residency:', error)
      }
      return userResidency
    },
    ['residency'],
    {
      tags: [CacheTags.USER_PROGRESS],
      revalidate: 300, // 5 minutes
    }
  )

  const userResidency = await getCachedUserResidency()

  return (
    <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-medium text-gray-900 mb-2">Select Residency Path</h1>
        <p className="text-sm text-gray-600">Choose your learning trajectory</p>
      </div>
      <ResidencySelector currentResidency={userResidency?.currentResidency} userId={user.id} />
    </div>
  )
}
