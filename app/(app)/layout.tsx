import Navbar from '@/components/layout/Navbar'
import { getCurrentUser } from '@/lib/auth/get-user'
import { prisma } from '@/lib/prisma/server'
import { redirect } from 'next/navigation'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch user profile
  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={{ id: user.id, email: user.email } as any} profile={profile as any} />
      <main className="">{children}</main>
    </div>
  )
}
