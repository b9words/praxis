'use client'

import { ResponsiveRadar } from '@nivo/radar'

interface RadarChartData {
  financialAcumen: number
  strategicThinking: number
  marketAwareness: number
  riskManagement: number
  leadershipJudgment: number
}

interface ExecemyRadarChartProps {
  data: RadarChartData
}

export default function ExecemyRadarChart({ data }: ExecemyRadarChartProps) {
  // Transform data to Nivo format with fixed order
  const CHART_ORDER = [
    ['Financial Acumen', data.financialAcumen ?? 0],
    ['Strategic Thinking', data.strategicThinking ?? 0],
    ['Market Awareness', data.marketAwareness ?? 0],
    ['Risk Management', data.riskManagement ?? 0],
    ['Leadership Judgment', data.leadershipJudgment ?? 0],
  ] as const

  const nivoData = CHART_ORDER.map(([competency, value]) => ({
    competency,
    Score: Math.max(0, Math.min(5, value)),
  }))

  return (
    <div className="w-full h-64">
      <ResponsiveRadar
        data={nivoData}
        keys={['Score']}
        indexBy="competency"
        maxValue={5}
        valueFormat={(value) => `${value.toFixed(1)}`}
        gridLevels={5}
        curve="linearClosed"
        colors={['#1f3a8a']}
        fillOpacity={0.15}
        borderColor="#1f3a8a"
        borderWidth={2}
        dotSize={6}
        dotBorderWidth={1}
        dotBorderColor="#1f3a8a"
        enableDotLabel={true}
        dotLabel="value"
        dotLabelYOffset={-10}
        theme={{
          background: 'transparent',
          text: {
            fontSize: 11,
            fill: '#111827',
            fontFamily: 'inherit',
          },
          grid: {
            line: {
              stroke: '#E5E7EB',
              strokeWidth: 1,
            },
          },
          crosshair: {
            line: {
              stroke: '#9CA3AF',
              strokeWidth: 1,
            },
          },
          axis: {
            ticks: {
              text: {
                fontSize: 10,
                fill: '#6B7280',
                fontFamily: 'inherit',
              },
            },
          },
          tooltip: {
            container: {
              background: 'white',
              color: '#111827',
              fontSize: 12,
              borderRadius: 4,
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
              padding: '8px 12px',
            },
          },
        }}
        legends={[]}
        isInteractive={true}
        motionConfig="gentle"
        margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
      />
    </div>
  )
}

