import PrescriptiveOnboarding from '@/components/onboarding/PrescriptiveOnboarding'
import { getCurrentUser } from '@/lib/auth/get-user'
import { prisma } from '@/lib/prisma/server'
import { redirect } from 'next/navigation'

export default async function OnboardingPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  // Get user profile
  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
  })

  if (!profile) {
    redirect('/login')
  }

  // Check if user has already completed onboarding (has a residency)
  const userResidency = await prisma.userResidency.findUnique({
    where: { userId: user.id },
    select: { currentResidency: true },
  })

  // If user already has a residency, redirect to dashboard
  if (userResidency?.currentResidency) {
    redirect('/dashboard')
  }

  return <PrescriptiveOnboarding user={user} />
}
