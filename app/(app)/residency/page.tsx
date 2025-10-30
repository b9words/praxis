import ResidencySelector from '@/components/dashboard/ResidencySelector'
import { getCurrentUser } from '@/lib/auth/get-user'
import { prisma } from '@/lib/prisma/server'
import { redirect } from 'next/navigation'

export default async function ResidencyPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  // Get user's current residency
  const userResidency = await prisma.userResidency.findUnique({
    where: { userId: user.id },
    select: { currentResidency: true },
  })

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <ResidencySelector currentResidency={userResidency?.currentResidency} userId={user.id} />
    </div>
  )
}
