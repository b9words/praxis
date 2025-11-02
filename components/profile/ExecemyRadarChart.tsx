'use client'

import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer } from 'recharts'

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
  const chartData = [
    { competency: 'Financial Acumen', score: data.financialAcumen || 0 },
    { competency: 'Strategic Thinking', score: data.strategicThinking || 0 },
    { competency: 'Market Awareness', score: data.marketAwareness || 0 },
    { competency: 'Risk Management', score: data.riskManagement || 0 },
    { competency: 'Leadership Judgment', score: data.leadershipJudgment || 0 },
  ]

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={chartData}>
          <PolarGrid />
          <PolarAngleAxis dataKey="competency" />
          <PolarRadiusAxis angle={90} domain={[0, 5]} />
          <Radar name="Score" dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.5} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}

