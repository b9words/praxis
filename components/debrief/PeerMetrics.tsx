'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchJson } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts'
import { Users, TrendingUp } from 'lucide-react'

interface PeerMetricsProps {
  caseId: string
}

interface PeerMetricsData {
  decisionsPie: Array<{ label: string; count: number }>
  percentiles: Array<{ competency: string; percentile: number }>
  totalPeers: number
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

export default function PeerMetrics({ caseId }: PeerMetricsProps) {
  const { data, isLoading, error } = useQuery<PeerMetricsData>({
    queryKey: ['peer-metrics', caseId],
    queryFn: () => fetchJson(`/api/case-studies/${caseId}/peer-metrics`),
    enabled: !!caseId,
  })

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Peer Benchmark
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <p className="text-sm text-gray-600">Loading peer metrics...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !data) {
    return null // Fail silently if no data
  }

  const { decisionsPie, percentiles, totalPeers } = data

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Peer Benchmark
          </CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            Compare your performance with {totalPeers} other members who completed this case
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Decision Distribution Pie Chart */}
          {decisionsPie.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-4">How Your Decision Compares</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={decisionsPie}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(props: any) => `${props.label}: ${(props.percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {decisionsPie.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Competency Percentiles */}
          {percentiles.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Your Competency Percentiles
              </h3>
              <div className="space-y-3">
                {percentiles.map((item) => (
                  <div key={item.competency} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-gray-900">{item.competency}</span>
                      <span className="text-gray-600">{item.percentile}th percentile</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${item.percentile}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {decisionsPie.length === 0 && percentiles.length === 0 && (
            <div className="text-center py-8 text-sm text-gray-500">
              <p>Not enough peer data available yet.</p>
              <p className="mt-1">Complete more case studies to see peer comparisons.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

