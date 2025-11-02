import { ImageResponse } from 'next/server'
import { prisma } from '@/lib/prisma/server'
import { notFound } from 'next/navigation'

export const runtime = 'nodejs'
export const alt = 'Profile'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function Image({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params

  const profile = await prisma.profile.findUnique({
    where: { username },
    select: {
      fullName: true,
      username: true,
      bio: true,
      isPublic: true,
    },
  })

  if (!profile || !profile.isPublic) {
    notFound()
  }

  const displayName = profile.fullName || profile.username

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
          <span>Praxis Dossier</span>
          <span>@{username}</span>
        </div>

        {/* Main Content */}
        <div
          style={{
            display: 'flex',
            flexGrow: 1,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <h1
            style={{
              fontSize: '80px',
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: '-2px',
              color: '#111827',
              margin: 0,
              textAlign: 'center',
            }}
          >
            {displayName}
          </h1>
        </div>

        {/* Footer */}
        {profile.bio && (
          <div
            style={{
              borderTop: '2px solid #e5e7eb',
              paddingTop: '30px',
              fontSize: '24px',
              color: '#4b5563',
              fontWeight: 400,
              lineHeight: 1.4,
            }}
          >
            {profile.bio.length > 120 ? `${profile.bio.substring(0, 120)}...` : profile.bio}
          </div>
        )}
      </div>
    ),
    {
      ...size,
    }
  )
}
