/**
 * Case Study Thumbnail Component for Satori
 * Renders a professional, McKinsey-style thumbnail for case study content
 * Features AI-generated abstract SVG visualization as background
 * Designed for server-side rendering with satori
 */


interface CaseStudyThumbnailProps {
  title: string
  domainName: string
  dataVizSvg: string
  duration?: string
  difficulty?: string
}

export const CaseStudyThumbnail = ({
  title,
  domainName,
  dataVizSvg,
  duration = '90 min sim',
  difficulty = 'Advanced',
}: CaseStudyThumbnailProps) => {
  // Dot grid pattern for background
  const dotGridPattern = `
    <pattern id="dot-grid" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="1" fill="oklch(0.6 0.01 240)" opacity="0.1"/>
    </pattern>
  `

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        padding: '20px',
        backgroundColor: '#fafafa',
        color: '#1a1a1a',
        fontFamily: 'Inter, system-ui, sans-serif',
        position: 'relative',
      }}
    >
      {/* Background dot grid pattern */}
      <svg
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          opacity: 0.3,
          pointerEvents: 'none',
        }}
      >
        <defs>
          <pattern id="dot-grid" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1" fill="#666666" opacity="0.1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dot-grid)" />
      </svg>

      {/* Header */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          marginBottom: '16px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div
          style={{
            fontSize: '10px',
            color: '#666666',
            fontWeight: 500,
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
          }}
        >
          Execemy Program
        </div>
        <div
          style={{
            fontSize: '12px',
            color: '#4a90e2',
            fontWeight: 600,
          }}
        >
          {domainName}
        </div>
      </div>

      {/* Main Content with AI-generated SVG background */}
      <div
        style={{
          display: 'flex',
          flexGrow: 1,
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          flexDirection: 'column',
          padding: '0 10px',
        }}
      >
        {/* AI-generated SVG visualization as background - embed as img with data URI */}
        <img
          src={`data:image/svg+xml,${encodeURIComponent(dataVizSvg)}`}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            opacity: 0.15,
            zIndex: 0,
          }}
          alt=""
        />

        {/* Case Study Title Overlay */}
        <h1
          style={{
            fontSize: '24px',
            fontWeight: 700,
            lineHeight: 1.2,
            letterSpacing: '-0.5px',
            textAlign: 'center',
            width: '100%',
            color: '#1a1a1a',
            margin: 0,
            position: 'relative',
            zIndex: 1,
          }}
        >
          {title}
        </h1>
      </div>

      {/* Footer */}
      <div
        style={{
          borderTop: '1.5px solid #4a90e2',
          paddingTop: '12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '10px',
          color: '#666666',
          fontWeight: 500,
          position: 'relative',
          zIndex: 1,
        }}
      >
        <span>Case Study</span>
        <span>{duration}</span>
        <span>{difficulty}</span>
      </div>
    </div>
  )
}

