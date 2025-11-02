/**
 * Lesson Thumbnail Component for Satori
 * Renders a professional, McKinsey-style thumbnail for lesson content
 * Designed for server-side rendering with satori
 */


interface LessonThumbnailProps {
  title: string
  domainName: string
  iconSvgPath: string
  duration?: string
  difficulty?: string
}

export const LessonThumbnail = ({
  title,
  domainName,
  iconSvgPath,
  duration = '12 min read',
  difficulty = 'Advanced',
}: LessonThumbnailProps) => {
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
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          marginBottom: '20px',
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

      {/* Icon - Top Center */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: '16px',
          opacity: 0.2,
        }}
      >
        <svg
          width="60"
          height="60"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#4a90e2"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Render icon path directly - parse SVG string */}
          {(() => {
            // iconSvgPath is like: `<path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />`
            // Extract path elements
            const pathMatch = iconSvgPath.match(/<path\s+([^>]+)\/?>/i)
            if (pathMatch) {
              const attrs = pathMatch[1]
              const d = attrs.match(/d="([^"]+)"/)?.[1]
              if (d) return <path d={d} />
            }
            const circleMatch = iconSvgPath.match(/<circle\s+([^>]+)\/?>/i)
            if (circleMatch) {
              const attrs = circleMatch[1]
              const cx = attrs.match(/cx="([^"]+)"/)?.[1] || '12'
              const cy = attrs.match(/cy="([^"]+)"/)?.[1] || '12'
              const r = attrs.match(/r="([^"]+)"/)?.[1] || '10'
              return <circle cx={cx} cy={cy} r={r} />
            }
            const polylineMatch = iconSvgPath.match(/<polyline\s+([^>]+)\/?>/i)
            if (polylineMatch) {
              const attrs = polylineMatch[1]
              const points = attrs.match(/points="([^"]+)"/)?.[1] || ''
              return <polyline points={points} />
            }
            // If multiple paths, try to parse all
            const allPaths = iconSvgPath.match(/<path\s+[^>]+>/gi) || []
            return allPaths.map((p, i) => {
              const d = p.match(/d="([^"]+)"/)?.[1]
              return d ? <path key={i} d={d} /> : null
            })
          })()}
        </svg>
      </div>

      {/* Main Content: Lesson Title */}
      <div
        style={{
          flexGrow: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 20px',
        }}
      >
        <h1
          style={{
            fontSize: '28px',
            fontWeight: 700,
            lineHeight: 1.2,
            letterSpacing: '-0.5px',
            color: '#1a1a1a',
            margin: 0,
            textAlign: 'center',
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
        }}
      >
        <span>Lesson</span>
        <span>{duration}</span>
        <span>{difficulty}</span>
      </div>
    </div>
  )
}

