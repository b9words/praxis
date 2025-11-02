'use client'

import ExecemyRadarChart from '@/components/profile/ExecemyRadarChart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { motion } from 'framer-motion'
import { ArrowRight, TrendingUp } from 'lucide-react'

interface RadarComparisonProps {
  beforeData: any
  afterData: any
}

export default function RadarComparison({ beforeData, afterData }: RadarComparisonProps) {
  // Calculate improvements
  const improvements = Object.keys(afterData).map(key => {
    const before = beforeData?.[key] || 0
    const after = afterData[key] || 0
    const change = after - before
    return {
      competency: key,
      before,
      after,
      change,
      percentChange: before > 0 ? ((change / before) * 100).toFixed(1) : '100',
    }
  }).filter(item => item.change !== 0)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Before */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-gray-500">Before This Simulation</CardTitle>
          </CardHeader>
          <CardContent>
            {beforeData ? (
              <ExecemyRadarChart data={beforeData} />
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-400">
                <p>No previous data</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* After */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <Card className="border-2 border-blue-500 shadow-lg">
            <CardHeader>
              <CardTitle className="text-center text-blue-600">After This Simulation</CardTitle>
            </CardHeader>
            <CardContent>
              <ExecemyRadarChart data={afterData} />
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Improvements */}
      {improvements.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.5 }}
        >
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-800">
                <TrendingUp className="h-5 w-5" />
                Your Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {improvements.map((item) => (
                  <div
                    key={item.competency}
                    className="flex items-center justify-between p-3 bg-white rounded-lg border border-green-200"
                  >
                    <span className="text-sm font-medium text-gray-900 capitalize">
                      {item.competency.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">
                        {item.before.toFixed(1)}
                      </span>
                      <ArrowRight className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-semibold text-green-600">
                        {item.after.toFixed(1)}
                      </span>
                      <span className="text-xs text-green-600 ml-1">
                        (+{item.percentChange}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}

