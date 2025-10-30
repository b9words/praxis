'use client'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import MarkdownRenderer from '@/components/ui/markdown-renderer'
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
        <Card className="border-l-4 border-blue-500 bg-gradient-to-r from-blue-50 to-blue-25">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <CardTitle className="text-xl text-blue-900">The Scenario</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="bg-white">
            <div className="prose max-w-none">
              <MarkdownRenderer content={caseStructure.scenario} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Your Role */}
      {caseStructure.yourRole && (
        <Card className="border-l-4 border-green-500 bg-gradient-to-r from-green-50 to-green-25">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-600 rounded-lg">
                <Target className="h-5 w-5 text-white" />
              </div>
              <CardTitle className="text-xl text-green-900">Your Role</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="bg-white">
            <div className="prose max-w-none">
              <MarkdownRenderer content={caseStructure.yourRole} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Stakeholders */}
      {caseStructure.keyStakeholders && caseStructure.keyStakeholders.length > 0 && (
        <Card className="border-l-4 border-purple-500 bg-gradient-to-r from-purple-50 to-purple-25">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-600 rounded-lg">
                <Users className="h-5 w-5 text-white" />
              </div>
              <CardTitle className="text-xl text-purple-900">Key Stakeholders</CardTitle>
              <Badge variant="secondary" className="ml-auto">
                {caseStructure.keyStakeholders.length} people
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="bg-white">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {caseStructure.keyStakeholders.map((stakeholder, index) => {
                const initials = stakeholder.name
                  .split(' ')
                  .map(n => n[0])
                  .join('')
                  .toUpperCase()

                return (
                  <Card key={stakeholder.id} className="border border-gray-200 hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">{stakeholder.name}</CardTitle>
                          <CardDescription className="text-sm">{stakeholder.role}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-3">
                      {stakeholder.motivations && stakeholder.motivations.length > 0 && (
                        <div>
                          <h5 className="text-sm font-semibold text-gray-700 mb-1">Motivations</h5>
                          <ul className="text-sm text-gray-600 space-y-1">
                            {stakeholder.motivations.map((motivation, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="text-green-500 mt-1">•</span>
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
                                <span className="text-orange-500 mt-1">•</span>
                                <span>{bias}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Decision Points */}
      {caseStructure.decisionPoints && caseStructure.decisionPoints.length > 0 && (
        <Card className="border-l-4 border-red-500 bg-gradient-to-r from-red-50 to-red-25">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-600 rounded-lg">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <CardTitle className="text-xl text-red-900">The Decision Point(s)</CardTitle>
              <Badge variant="secondary" className="ml-auto">
                {caseStructure.decisionPoints.length} decisions
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="bg-white">
            <div className="space-y-4">
              {caseStructure.decisionPoints.map((dp, index) => (
                <div key={dp.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-red-600 text-white rounded-full text-sm font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-2">{dp.title}</h4>
                      <p className="text-gray-700 text-sm">{dp.description}</p>
                      {dp.type === 'role_play' && dp.requiresPersona && (
                        <Badge variant="outline" className="mt-2 text-xs">
                          Role-play required
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
