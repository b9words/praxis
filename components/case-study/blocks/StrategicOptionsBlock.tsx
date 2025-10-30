'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useCaseStudyStore } from '@/lib/case-study-store'
import { CheckCircle, Circle } from 'lucide-react'
import { useEffect, useState } from 'react'

interface StrategyOption {
  id: string
  title: string
  description: string
  pros?: string[]
  cons?: string[]
  riskLevel?: 'low' | 'medium' | 'high'
}

interface StrategicOptionsBlockProps {
  blockId: string
  title?: string
  description?: string
  options: StrategyOption[]
  allowMultiple?: boolean
  required?: boolean
}

export default function StrategicOptionsBlock({
  blockId,
  title = 'Choose Your Strategic Path',
  description,
  options,
  allowMultiple = false,
  required = true
}: StrategicOptionsBlockProps) {
  const { currentStageId, getStageState, updateStageState, logEvent } = useCaseStudyStore()
  const [selectedOptions, setSelectedOptions] = useState<string[]>([])

  // Load existing selections on mount
  useEffect(() => {
    if (currentStageId) {
      const stageState = getStageState(currentStageId)
      const existing = stageState.userSubmissions[blockId]
      if (existing) {
        setSelectedOptions(Array.isArray(existing) ? existing : [existing])
      }
    }
  }, [currentStageId, blockId, getStageState])

  // Save selections to store
  useEffect(() => {
    if (currentStageId && selectedOptions.length > 0) {
      const stageState = getStageState(currentStageId)
      updateStageState(currentStageId, {
        userSubmissions: {
          ...stageState.userSubmissions,
          [blockId]: allowMultiple ? selectedOptions : selectedOptions[0]
        }
      })
    }
  }, [selectedOptions, currentStageId, blockId, allowMultiple, getStageState, updateStageState])

  const handleOptionSelect = (optionId: string) => {
    if (allowMultiple) {
      setSelectedOptions(prev => 
        prev.includes(optionId) 
          ? prev.filter(id => id !== optionId)
          : [...prev, optionId]
      )
    } else {
      setSelectedOptions([optionId])
    }

    logEvent('OPTION_SELECTED', currentStageId || undefined, {
      blockId, 
      optionId, 
      allowMultiple 
    })
  }

  const getRiskLevelColor = (riskLevel?: string) => {
    switch (riskLevel) {
      case 'low':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200'
      default:
        return 'text-neutral-600 bg-neutral-50 border-neutral-200'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-3">
        <h3 className="text-xl font-semibold text-neutral-900">{title}</h3>
        {description && (
          <p className="text-sm text-neutral-600 leading-relaxed">
            {description}
          </p>
        )}
        <div className="flex items-center justify-between">
          <div className="text-xs text-neutral-500">
            {allowMultiple ? 'Select one or more options' : 'Select one option'}
            {required && <span className="text-red-500 ml-1">*</span>}
          </div>
          <div className="text-xs text-neutral-400 font-mono">
            Review case materials on the left before deciding
          </div>
        </div>
      </div>

      {/* Options Grid */}
      <div className="grid grid-cols-1 gap-4">
        {options.map((option) => {
          const isSelected = selectedOptions.includes(option.id)
          
          return (
            <Card
              key={option.id}
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                isSelected 
                  ? 'border-blue-500 bg-blue-50 shadow-lg ring-2 ring-blue-200' 
                  : 'border-neutral-200 hover:border-blue-300 hover:shadow-md'
              }`}
              onClick={() => handleOptionSelect(option.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {isSelected ? (
                      <CheckCircle className="h-5 w-5 text-blue-600" />
                    ) : (
                      <Circle className="h-5 w-5 text-neutral-400" />
                    )}
                    <CardTitle className="text-base font-semibold text-neutral-900">
                      {option.title}
                    </CardTitle>
                  </div>
                  
                  {option.riskLevel && (
                    <div className={`px-2 py-1 rounded text-xs font-medium border ${getRiskLevelColor(option.riskLevel)}`}>
                      {option.riskLevel.toUpperCase()} RISK
                    </div>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <CardDescription className="text-sm leading-relaxed">
                  {option.description}
                </CardDescription>
                
                {(option.pros || option.cons) && (
                  <div className="space-y-2">
                    {option.pros && (
                      <div>
                        <h5 className="text-xs font-medium text-green-700 mb-1">Advantages:</h5>
                        <ul className="text-xs text-green-600 space-y-0.5">
                          {option.pros.map((pro, index) => (
                            <li key={index} className="flex items-start gap-1">
                              <span className="text-green-500 mt-0.5">+</span>
                              <span>{pro}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {option.cons && (
                      <div>
                        <h5 className="text-xs font-medium text-red-700 mb-1">Risks:</h5>
                        <ul className="text-xs text-red-600 space-y-0.5">
                          {option.cons.map((con, index) => (
                            <li key={index} className="flex items-start gap-1">
                              <span className="text-red-500 mt-0.5">-</span>
                              <span>{con}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Selection Summary */}
      {selectedOptions.length > 0 && (
        <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
          <h4 className="font-semibold text-blue-900 mb-3 text-lg">
            Selected Strategy: {selectedOptions.map(id => 
              options.find(opt => opt.id === id)?.title
            ).join(', ')}
          </h4>
          <p className="text-sm text-blue-700 mb-4">
            This strategic choice will influence the remaining challenges in this case study. 
            Your decision will be evaluated based on financial impact, strategic rationale, and execution feasibility.
          </p>
          <div className="text-xs text-blue-600 font-medium">
            💡 Remember: There's no single "right" answer - justify your choice with data from the case materials
          </div>
        </div>
      )}
    </div>
  )
}
