import PrescriptiveOnboarding from '@/components/onboarding/PrescriptiveOnboarding'
import { getUserResidency } from '@/lib/auth/get-residency'
import { getCurrentUser } from '@/lib/auth/get-user'
import { prisma } from '@/lib/prisma/server'
import { redirect } from 'next/navigation'

export default async function OnboardingPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  // Get user profile with error handling
  let profile = null
  try {
    profile = await prisma.profile.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        username: true,
        fullName: true,
        avatarUrl: true,
        bio: true,
        isPublic: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    })
  } catch (error) {
    console.error('Error fetching profile in onboarding:', error)
    // Don't redirect on error - let component handle gracefully
  }

  if (!profile) {
    redirect('/login')
    return
  }

  // Check if user has already completed onboarding (has a residency)
  // Use unified helper for consistent residency checking with error handling
  let currentResidency: number | null = null
  let residencyError = false
  try {
    const residencyResult = await getUserResidency(user.id)
    currentResidency = residencyResult.currentResidency
  } catch (error) {
    console.error('Error fetching residency in onboarding:', error)
    // If error, don't redirect - let user see onboarding even if check fails
    residencyError = true
    currentResidency = null
  }

  // CRITICAL: Only redirect to dashboard if we're CERTAIN residency exists AND no error occurred
  // If there's a Prisma error, we can't be sure - don't redirect to prevent loops
  if (!residencyError && currentResidency !== null && currentResidency > 0) {
    redirect('/dashboard')
    return
  }

  return <PrescriptiveOnboarding user={user} />
}
