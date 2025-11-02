import { getCurrentUser } from '@/lib/auth/get-user'
import { getDomainById } from '@/lib/curriculum-data'
import { prisma } from '@/lib/prisma/server'
import { redirect } from 'next/navigation'
import DomainCertificate from '@/components/certificates/DomainCertificate'
import { notFound } from 'next/navigation'

interface CertificatePageProps {
  params: Promise<{
    domainId: string
  }>
}

export default async function CertificatePage({ params }: CertificatePageProps) {
  const user = await getCurrentUser()
  if (!user) {
    redirect('/login')
  }

  const { domainId } = await params

  // Get domain info
  const domain = getDomainById(domainId)
  if (!domain) {
    notFound()
  }

  // Get domain completion
  const completion = await prisma.domainCompletion.findUnique({
    where: {
      userId_domainId: {
        userId: user.id,
        domainId,
      },
    },
  })

  if (!completion) {
    // User hasn't completed this domain yet
    redirect(`/library/curriculum/${domainId}`)
  }

  // Get user profile for name
  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: {
      fullName: true,
      username: true,
    },
  })

  const userName = profile?.fullName || profile?.username || 'Learner'

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <DomainCertificate
          domainTitle={domain.title}
          userName={userName}
          completedAt={completion.completedAt}
          domainId={domainId}
        />
      </div>
    </div>
  )
}

