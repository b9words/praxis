'use client'

import { ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'

interface ScoreRevealProps {
  competencyName: string
  score: number
  maxScore: number
  justification: string
  delay: number
  rubricCriteria?: {
    description?: string
    scoring?: Record<string, string>
    weight?: number
  }
}

export default function ScoreReveal({ 
  competencyName, 
  score, 
  maxScore, 
  justification, 
  delay,
  rubricCriteria
}: ScoreRevealProps) {
  const [showRubric, setShowRubric] = useState(false)
  const percentage = (score / maxScore) * 100

  const getPerformanceLabel = () => {
    if (percentage >= 80) return 'Excellent'
    if (percentage >= 60) return 'Good'
    if (percentage >= 40) return 'Developing'
    if (percentage >= 20) return 'Needs Work'
    return 'Critical Gap'
  }

  // Get the rubric description for the score level
  const getScoreLevelCriteria = () => {
    if (!rubricCriteria?.scoring) return null
    
    const scoreKey = Math.round(score).toString()
    return rubricCriteria.scoring[scoreKey] || null
  }

  const scoreLevelCriteria = getScoreLevelCriteria()

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
        <p className="text-sm text-gray-600 leading-relaxed mb-4">{justification}</p>

        {/* Rubric Criteria Section */}
        {rubricCriteria && (
          <div className="border-t border-gray-200 pt-4">
            <button
              onClick={() => setShowRubric(!showRubric)}
              className="flex items-center justify-between w-full text-left text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
            >
              <span>View Rubric Criteria</span>
              {showRubric ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
            
            {showRubric && (
              <div className="mt-4 space-y-4">
                {rubricCriteria.description && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-2">
                      Competency Description
                    </h4>
                    <p className="text-sm text-gray-600">{rubricCriteria.description}</p>
                  </div>
                )}
                
                {rubricCriteria.scoring && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-3">
                      Scoring Criteria
                    </h4>
                    <div className="space-y-2">
                      {Object.entries(rubricCriteria.scoring)
                        .sort(([a], [b]) => parseInt(b) - parseInt(a)) // Sort 5 to 1
                        .map(([level, criteria]) => {
                          const isCurrentLevel = Math.round(score).toString() === level
                          return (
                            <div
                              key={level}
                              className={`p-3 border rounded ${
                                isCurrentLevel
                                  ? 'border-gray-900 bg-gray-50'
                                  : 'border-gray-200 bg-white'
                              }`}
                            >
                              <div className="flex items-start justify-between mb-1">
                                <span className="text-xs font-semibold text-gray-900">
                                  Score {level}/5
                                </span>
                                {isCurrentLevel && (
                                  <span className="text-xs font-medium text-gray-600 bg-gray-200 px-2 py-0.5 rounded">
                                    Your Score
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-600 leading-relaxed">{criteria}</p>
                            </div>
                          )
                        })}
                    </div>
                  </div>
                )}
                
                {rubricCriteria.weight !== undefined && (
                  <div className="text-xs text-gray-500">
                    <span className="font-medium">Weight:</span> {(rubricCriteria.weight * 100).toFixed(0)}%
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
