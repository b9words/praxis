import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/get-user'
import { prisma } from '@/lib/prisma/server'
import WaitlistClientPage from './WaitlistClientPage'

export default async function CommunityPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const [waitlistCount, existing] = await Promise.all([
    prisma.communityWaitlist.count(),
    prisma.communityWaitlist.findUnique({ where: { userId: user.id } }),
  ])

  return (
    <WaitlistClientPage initialWaitlistCount={waitlistCount} initialIsOnWaitlist={!!existing} />
  )
}


