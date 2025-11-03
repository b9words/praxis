import { ImageResponse } from 'next/server'
import { prisma } from '@/lib/prisma/server'
import { notFound } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/get-user'

export const runtime = 'nodejs'
export const alt = 'Debrief'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function Image({ params }: { params: Promise<{ simulationId: string }> }) {
  try {
    const { simulationId } = await params

    // Verify user owns this simulation
    const user = await getCurrentUser()
    if (!user) {
      notFound()
    }

    let simulation
    try {
      simulation = await prisma.simulation.findUnique({
        where: { id: simulationId },
        select: {
          userId: true,
          case: {
            select: {
              title: true,
            },
          },
          debrief: {
            select: {
              scores: true,
            },
          },
        },
      })
    } catch (error: any) {
      // Handle missing table gracefully
      if (error?.code === 'P2021') {
        notFound()
      }
      throw error
    }

    if (!simulation || simulation.userId !== user.id) {
      notFound()
    }

    const caseTitle = simulation.case?.title || 'Simulation Debrief'
    
    // Calculate average score if available
    let averageScore: number | null = null
    if (simulation.debrief?.scores) {
      const scores = simulation.debrief.scores as any[]
      if (Array.isArray(scores) && scores.length > 0) {
        const sum = scores.reduce((acc: number, s: any) => {
          const score = typeof s === 'number' ? s : (s.score || 0)
          return acc + score
        }, 0)
        averageScore = sum / scores.length
      }
    }

    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            width: '100%',
            padding: '60px',
            backgroundColor: '#ffffff',
            color: '#1f2937',
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '28px',
            color: '#6b7280',
            fontWeight: 500,
            marginBottom: '40px',
          }}
        >
          <span>Praxis Simulation</span>
          <span>After-Action Report</span>
        </div>

        {/* Main Content */}
        <div
          style={{
            display: 'flex',
            flexGrow: 1,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: '30px',
          }}
        >
          <h1
            style={{
              fontSize: '72px',
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: '-2px',
              color: '#111827',
              margin: 0,
              textAlign: 'center',
            }}
          >
            {caseTitle}
          </h1>
          
          {averageScore !== null && (
            <div
              style={{
                fontSize: '48px',
                fontWeight: 600,
                color: '#4b5563',
                marginTop: '20px',
              }}
            >
              Score: {averageScore.toFixed(1)}/5.0
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            borderTop: '2px solid #e5e7eb',
            paddingTop: '30px',
            fontSize: '24px',
            color: '#6b7280',
            fontWeight: 400,
          }}
        >
          View detailed competency analysis and recommendations
        </div>
      </div>
      ),
      {
        ...size,
      }
    )
  } catch (error) {
    console.error('Error generating opengraph image for debrief:', error)
    notFound()
  }
}
