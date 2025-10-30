import Navbar from '@/components/layout/Navbar'
import { getCurrentUser } from '@/lib/auth/get-user'
import { prisma } from '@/lib/prisma/server'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()

  // Auth protection is handled by middleware - do not redirect here
  // If middleware allows request, user should exist, but handle null defensively
  let profile = null
  try {
    if (user) {
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
    }
  } catch (error) {
    // Log error but don't crash - middleware will handle auth issues
    console.error('Error fetching profile in layout:', error)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {user && <Navbar user={{ id: user.id, email: user.email } as any} profile={profile as any} />}
      <main className="">{children}</main>
    </div>
  )
}
