import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import fs from 'fs'
import { ArrowRight, BookOpen, Clock, Target, Users } from 'lucide-react'
import Link from 'next/link'
import path from 'path'

interface CaseStudyMeta {
  caseId: string
  title: string
  description: string
  competencies: string[]
  estimatedDuration?: number
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
}

async function getAllCaseStudies(): Promise<CaseStudyMeta[]> {
  try {
    const caseStudiesDir = path.join(process.cwd(), 'data', 'case-studies')
    
    if (!fs.existsSync(caseStudiesDir)) {
      return []
    }

    const files = fs.readdirSync(caseStudiesDir).filter(file => file.endsWith('.json'))
    
    const caseStudies: CaseStudyMeta[] = []

    for (const file of files) {
      try {
        const filePath = path.join(caseStudiesDir, file)
        const fileContents = fs.readFileSync(filePath, 'utf8')
        const data = JSON.parse(fileContents)
        
        caseStudies.push({
          caseId: data.caseId,
          title: data.title,
          description: data.description,
          competencies: data.competencies || [],
          estimatedDuration: data.estimatedDuration,
          difficulty: data.difficulty
        })
      } catch (error) {
        console.error(`Error loading case study ${file}:`, error)
      }
    }

    return caseStudies
  } catch (error) {
    console.error('Error loading case studies:', error)
    return []
  }
}

export default async function CaseStudiesPage() {
  const caseStudies = await getAllCaseStudies()

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'intermediate':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'advanced':
        return 'text-red-600 bg-red-50 border-red-200'
      default:
        return 'text-neutral-600 bg-neutral-50 border-neutral-200'
    }
  }

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="flex-1 overflow-auto">
        <div className="px-6 py-6 space-y-6">
          {/* Header */}
          <div className="space-y-3">
            <h1 className="text-xl font-semibold leading-tight text-neutral-900">
              Executive Case Studies
            </h1>
            <p className="text-sm text-neutral-500 leading-snug max-w-3xl">
              Immersive, high-fidelity business simulations that test your strategic thinking, 
              decision-making, and leadership skills in realistic executive scenarios.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="border border-neutral-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-xl font-bold text-neutral-900">{caseStudies.length}</div>
                    <div className="text-xs text-neutral-500">Case Studies</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border border-neutral-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Target className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <div className="text-xl font-bold text-neutral-900">15</div>
                    <div className="text-xs text-neutral-500">Challenge Types</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border border-neutral-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Users className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-xl font-bold text-neutral-900">8</div>
                    <div className="text-xs text-neutral-500">Competencies</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Case Studies Grid */}
          {caseStudies.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {caseStudies.map((caseStudy) => (
                <Card key={caseStudy.caseId} className="border border-neutral-200 hover:shadow-lg transition-shadow duration-200">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <CardTitle className="text-lg font-semibold text-neutral-900 mb-2 leading-tight">
                          {caseStudy.title}
                        </CardTitle>
                        <CardDescription className="text-sm text-neutral-600 leading-relaxed">
                          {caseStudy.description}
                        </CardDescription>
                      </div>
                      
                      {caseStudy.difficulty && (
                        <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getDifficultyColor(caseStudy.difficulty)}`}>
                          {caseStudy.difficulty.toUpperCase()}
                        </div>
                      )}
                    </div>
                    
                    {/* Competencies */}
                    <div className="flex flex-wrap gap-2">
                      {caseStudy.competencies.slice(0, 3).map((competency) => (
                        <span
                          key={competency}
                          className="px-2 py-1 bg-neutral-100 text-neutral-700 text-xs rounded font-medium"
                        >
                          {competency}
                        </span>
                      ))}
                      {caseStudy.competencies.length > 3 && (
                        <span className="px-2 py-1 bg-neutral-100 text-neutral-500 text-xs rounded">
                          +{caseStudy.competencies.length - 3} more
                        </span>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-neutral-500">
                        {caseStudy.estimatedDuration && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{caseStudy.estimatedDuration} min</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Target className="h-4 w-4" />
                          <span>{caseStudy.competencies.length} competencies</span>
                        </div>
                      </div>
                      
                      <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
                        <Link href={`/library/case-studies/${caseStudy.caseId}`}>
                          Start Case
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border border-neutral-200">
              <CardContent className="p-12 text-center">
                <BookOpen className="mx-auto h-12 w-12 text-neutral-400 mb-4" />
                <h3 className="text-lg font-medium text-neutral-900 mb-2">
                  No Case Studies Available
                </h3>
                <p className="text-neutral-500 mb-6">
                  Case studies are being developed. Check back soon for immersive business simulations.
                </p>
                <Button variant="outline" asChild>
                  <Link href="/library">
                    Back to Library
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}