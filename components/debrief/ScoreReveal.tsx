'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { motion } from 'framer-motion'
import { AlertCircle, CheckCircle2, TrendingUp, Trophy, XCircle } from 'lucide-react'

interface ScoreRevealProps {
  competencyName: string
  score: number
  maxScore: number
  justification: string
  delay: number
}

export default function ScoreReveal({ 
  competencyName, 
  score, 
  maxScore, 
  justification, 
  delay 
}: ScoreRevealProps) {
  const percentage = (score / maxScore) * 100
  
  const getScoreIcon = () => {
    if (percentage >= 80) return <Trophy className="h-8 w-8 text-yellow-500" />
    if (percentage >= 60) return <CheckCircle2 className="h-8 w-8 text-green-500" />
    if (percentage >= 40) return <TrendingUp className="h-8 w-8 text-blue-500" />
    if (percentage >= 20) return <AlertCircle className="h-8 w-8 text-orange-500" />
    return <XCircle className="h-8 w-8 text-red-500" />
  }

  const getScoreColor = () => {
    if (percentage >= 80) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    if (percentage >= 60) return 'text-green-600 bg-green-50 border-green-200'
    if (percentage >= 40) return 'text-blue-600 bg-blue-50 border-blue-200'
    if (percentage >= 20) return 'text-orange-600 bg-orange-50 border-orange-200'
    return 'text-red-600 bg-red-50 border-red-200'
  }

  const getPerformanceLabel = () => {
    if (percentage >= 80) return 'Excellent'
    if (percentage >= 60) return 'Good'
    if (percentage >= 40) return 'Developing'
    if (percentage >= 20) return 'Needs Work'
    return 'Critical Gap'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        delay, 
        duration: 0.6,
        type: "spring",
        stiffness: 100,
        damping: 15
      }}
    >
      <Card className={`border-2 ${getScoreColor()} shadow-lg hover:shadow-xl transition-shadow duration-300`}>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: delay + 0.3, duration: 0.5 }}
              >
                {getScoreIcon()}
              </motion.div>
              <div>
                <CardTitle className="text-xl font-bold">{competencyName}</CardTitle>
                <CardDescription className="text-sm font-medium">
                  {getPerformanceLabel()}
                </CardDescription>
              </div>
            </div>
            
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ 
                delay: delay + 0.5, 
                duration: 0.4,
                type: "spring",
                stiffness: 200 
              }}
              className="text-right"
            >
              <div className="text-4xl font-bold">
                {score}<span className="text-2xl text-gray-500">/{maxScore}</span>
              </div>
              <div className="text-sm font-medium text-gray-600">
                {Math.round(percentage)}%
              </div>
            </motion.div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Progress Bar */}
          <div className="mb-4">
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ delay: delay + 0.7, duration: 1, ease: "easeOut" }}
                className={`h-full rounded-full ${
                  percentage >= 80 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                  percentage >= 60 ? 'bg-gradient-to-r from-green-400 to-green-600' :
                  percentage >= 40 ? 'bg-gradient-to-r from-blue-400 to-blue-600' :
                  percentage >= 20 ? 'bg-gradient-to-r from-orange-400 to-orange-600' :
                  'bg-gradient-to-r from-red-400 to-red-600'
                }`}
              />
            </div>
          </div>
          
          {/* Justification */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: delay + 1.2, duration: 0.5 }}
          >
            <p className="text-gray-700 leading-relaxed">{justification}</p>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  )
}