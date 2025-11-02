import { Metadata } from 'next'
import { getCurrentUser } from '@/lib/auth/get-user'
import { prisma } from '@/lib/prisma/server'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ simulationId: string }>
}): Promise<Metadata> {
  const { simulationId } = await params

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_VERCEL_URL || 'http://localhost:3400'
  const ogImageUrl = `${baseUrl}/debrief/${simulationId}/opengraph-image`

  // Try to get case title for better metadata (non-blocking)
  let caseTitle = 'Simulation Debrief'
  try {
    const user = await getCurrentUser()
    if (user) {
      const simulation = await prisma.simulation.findUnique({
        where: { id: simulationId },
        select: {
          userId: true,
          case: {
            select: {
              title: true,
            },
          },
        },
      })

      if (simulation && simulation.userId === user.id && simulation.case?.title) {
        caseTitle = simulation.case.title
      }
    }
  } catch (error) {
    // Ignore errors, use default title
  }

  return {
    title: `Debrief: ${caseTitle}`,
    description: `View your simulation debrief and key competency outcomes for ${caseTitle}.`,
    openGraph: {
      title: `Debrief: ${caseTitle}`,
      description: `View your simulation debrief and key competency outcomes.`,
      images: [
        {
          url: ogImageUrl,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      images: [ogImageUrl],
    },
  }
}

export default function DebriefLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
