import PrescriptiveOnboarding from '@/components/onboarding/PrescriptiveOnboarding'
import { getCurrentUser } from '@/lib/auth/get-user'
import { prisma } from '@/lib/prisma/server'
import { redirect } from 'next/navigation'

export default async function OnboardingPage() {
  // All auth checks removed - component will handle user state
  const user = await getCurrentUser()
  
  return <PrescriptiveOnboarding user={user || undefined} />
}
