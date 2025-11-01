'use client'


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

  const getPerformanceLabel = () => {
    if (percentage >= 80) return 'Excellent'
    if (percentage >= 60) return 'Good'
    if (percentage >= 40) return 'Developing'
    if (percentage >= 20) return 'Needs Work'
    return 'Critical Gap'
  }

  return (
    <div className="bg-white border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-medium text-gray-900">{competencyName}</h3>
            <p className="text-xs text-gray-500 mt-1">{getPerformanceLabel()}</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-semibold text-gray-900">
              {score}<span className="text-lg text-gray-500">/{maxScore}</span>
            </div>
            <div className="text-xs text-gray-500">
              {Math.round(percentage)}%
            </div>
          </div>
        </div>
      </div>
      
      <div className="p-6">
        {/* Progress Bar */}
        <div className="mb-4">
          <div className="w-full bg-gray-200 h-1.5">
            <div
              className="h-full bg-gray-900 transition-all"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
        
        {/* Justification */}
        <p className="text-sm text-gray-600 leading-relaxed">{justification}</p>
      </div>
    </div>
  )
}
