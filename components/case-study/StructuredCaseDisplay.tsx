'use client'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import MarkdownRenderer from '@/components/ui/Markdown'
import { CaseStructure } from '@/types/simulation.types'
import { Building2, Target, Users, Zap } from 'lucide-react'

interface StructuredCaseDisplayProps {
  caseStructure: CaseStructure
}

export default function StructuredCaseDisplay({ caseStructure }: StructuredCaseDisplayProps) {
  if (!caseStructure) {
    return (
      <div className="prose max-w-none">
        <p className="text-gray-500">Case structure could not be parsed</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* The Scenario */}
      {caseStructure.scenario && (
        <div className="bg-white border border-gray-200">
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-900">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-xl font-medium text-gray-900">The Scenario</h2>
            </div>
          </div>
          <div className="p-6">
            <div className="prose max-w-none">
              <MarkdownRenderer content={caseStructure.scenario} />
            </div>
          </div>
        </div>
      )}

      {/* Your Role */}
      {caseStructure.yourRole && (
        <div className="bg-white border border-gray-200">
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-900">
                <Target className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-xl font-medium text-gray-900">Your Role</h2>
            </div>
          </div>
          <div className="p-6">
            <div className="prose max-w-none">
              <MarkdownRenderer content={caseStructure.yourRole} />
            </div>
          </div>
        </div>
      )}

      {/* Key Stakeholders */}
      {caseStructure.keyStakeholders && caseStructure.keyStakeholders.length > 0 && (
        <div className="bg-white border border-gray-200">
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-900">
                <Users className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-xl font-medium text-gray-900">Key Stakeholders</h2>
              <Badge variant="secondary" className="ml-auto bg-gray-100 text-gray-700 border-gray-300">
                {caseStructure.keyStakeholders.length} people
              </Badge>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {caseStructure.keyStakeholders.map((stakeholder, index) => {
                const initials = stakeholder.name
                  .split(' ')
                  .map(n => n[0])
                  .join('')
                  .toUpperCase()

                return (
                  <div key={stakeholder.id} className="bg-white border border-gray-200 hover:border-gray-300 transition-colors">
                    <div className="border-b border-gray-200 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12 border border-gray-200">
                          <AvatarFallback className="bg-gray-900 text-white font-semibold">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">{stakeholder.name}</h3>
                          <p className="text-sm text-gray-600">{stakeholder.role}</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 space-y-3">
                      {stakeholder.motivations && stakeholder.motivations.length > 0 && (
                        <div>
                          <h5 className="text-sm font-semibold text-gray-700 mb-1">Motivations</h5>
                          <ul className="text-sm text-gray-600 space-y-1">
                            {stakeholder.motivations.map((motivation, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="text-gray-700 mt-1">•</span>
                                <span>{motivation}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {stakeholder.biases && stakeholder.biases.length > 0 && (
                        <div>
                          <h5 className="text-sm font-semibold text-gray-700 mb-1">Potential Biases</h5>
                          <ul className="text-sm text-gray-600 space-y-1">
                            {stakeholder.biases.map((bias, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="text-gray-700 mt-1">•</span>
                                <span>{bias}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Decision Points */}
      {caseStructure.decisionPoints && caseStructure.decisionPoints.length > 0 && (
        <div className="bg-white border border-gray-200">
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-900">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-xl font-medium text-gray-900">The Decision Point(s)</h2>
              <Badge variant="secondary" className="ml-auto bg-gray-100 text-gray-700 border-gray-300">
                {caseStructure.decisionPoints.length} decisions
              </Badge>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {caseStructure.decisionPoints.map((dp, index) => (
                <div key={dp.id} className="border border-gray-200 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-gray-900 text-white text-sm font-semibold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-2">{dp.title}</h4>
                      <p className="text-gray-700 text-sm">{dp.description}</p>
                      {dp.type === 'role_play' && dp.requiresPersona && (
                        <Badge variant="outline" className="mt-2 text-xs bg-gray-100 text-gray-700 border-gray-300">
                          Role-play required
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
