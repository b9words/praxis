import Navbar from '@/components/layout/Navbar'
import SentryUserProvider from '@/components/providers/SentryUserProvider'
import { getCurrentUser } from '@/lib/auth/get-user'
import { prisma } from '@/lib/prisma/server'
import { getCachedUserData, CacheTags } from '@/lib/cache'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()

  // Auth protection is handled by middleware - do not redirect here
  // If middleware allows request, user should exist, but handle null defensively
  // Cache profile (5 minutes revalidate, userId in key) - this runs on every page!
  let profile = null
  if (user) {
    const getCachedProfile = getCachedUserData(
      user.id,
      async () => {
        try {
          const profileData = await prisma.profile.findUnique({
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
          return profileData
        } catch (error) {
          // Log error but don't crash - middleware will handle auth issues
          console.error('Error fetching profile in layout:', error)
          return null
        }
      },
      ['profile'],
      {
        tags: [CacheTags.USERS],
        revalidate: 300, // 5 minutes
      }
    )
    profile = await getCachedProfile()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Set Sentry user context for error tracking */}
      {user && (
        <SentryUserProvider
          userId={user.id}
          email={user.email || undefined}
          username={profile?.username || undefined}
        />
      )}
      {user && <Navbar user={{ id: user.id, email: user.email } as any} profile={profile as any} />}
      <main className="lg:pb-0 pb-16">{children}</main>
    </div>
  )
}
