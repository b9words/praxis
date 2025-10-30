import ResidencySelector from '@/components/dashboard/ResidencySelector'
import { getCurrentUser } from '@/lib/auth/get-user'
import { prisma } from '@/lib/prisma/server'

export default async function ResidencyPage() {
  const user = await getCurrentUser()

  // Auth protection is handled by middleware
  if (!user) {
    return null
  }

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

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <ResidencySelector currentResidency={userResidency?.currentResidency} userId={user.id} />
    </div>
  )
}
