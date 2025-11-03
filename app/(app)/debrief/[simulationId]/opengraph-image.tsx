import { ImageResponse } from 'next/server'

export const runtime = 'nodejs'
export const alt = 'Debrief'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function Image({ params }: { params: Promise<{ simulationId: string }> }) {
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
        <div
          style={{
            display: 'flex',
            flexGrow: 1,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
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
            Simulation Debrief
          </h1>
        </div>
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
}

