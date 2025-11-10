import { Button } from '@/components/ui/button'
import { cache, CacheTags } from '@/lib/cache'
import { listCases } from '@/lib/db/cases'
import { ArrowRight, BookOpen, Clock, Target, Users } from 'lucide-react'
import Link from 'next/link'

// Force dynamic rendering to avoid static generation issues with useSearchParams
export const dynamic = 'force-dynamic'

/**
 * Strip markdown formatting and truncate text for preview
 */
function stripMarkdownAndTruncate(text: string, maxLength: number = 150): string {
  if (!text) return ''
  
  // Remove markdown headers
  let cleaned = text.replace(/^#{1,6}\s+/gm, '')
  
  // Remove bold/italic
  cleaned = cleaned.replace(/\*\*([^*]+)\*\*/g, '$1')
  cleaned = cleaned.replace(/\*([^*]+)\*/g, '$1')
  cleaned = cleaned.replace(/__([^_]+)__/g, '$1')
  cleaned = cleaned.replace(/_([^_]+)_/g, '$1')
  
  // Remove links but keep text
  cleaned = cleaned.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
  
  // Remove code blocks
  cleaned = cleaned.replace(/```[\s\S]*?```/g, '')
  cleaned = cleaned.replace(/`([^`]+)`/g, '$1')
  
  // Remove images
  cleaned = cleaned.replace(/!\[([^\]]*)\]\([^\)]+\)/g, '')
  
  // Remove list markers
  cleaned = cleaned.replace(/^[\s]*[-*+]\s+/gm, '')
  cleaned = cleaned.replace(/^[\s]*\d+\.\s+/gm, '')
  
  // Remove blockquotes
  cleaned = cleaned.replace(/^>\s+/gm, '')
  
  // Clean up whitespace
  cleaned = cleaned.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim()
  
  // Truncate
  if (cleaned.length <= maxLength) {
    return cleaned
  }
  
  // Truncate at word boundary
  const truncated = cleaned.substring(0, maxLength)
  const lastSpace = truncated.lastIndexOf(' ')
  return lastSpace > 0 
    ? truncated.substring(0, lastSpace) + '...'
    : truncated + '...'
}

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
    // Load from database - only published cases
    const cases = await listCases({})
    
    return cases.map((c) => {
      const metadata = c.metadata as any || {}
      return {
        caseId: metadata.caseId || c.id,
        title: c.title,
        description: c.description || '',
        competencies: metadata.competencies || c.competencies?.map(cc => cc.competency.name) || [],
        estimatedDuration: c.estimatedMinutes ?? undefined,
        difficulty: (c.difficulty || 'intermediate') as 'beginner' | 'intermediate' | 'advanced'
      }
    })
  } catch (error) {
    console.error('Error loading case studies:', error)
    return []
  }
}

export default async function CaseStudiesPage() {
  // Cache cases list (15 minutes revalidate)
  const getCachedCaseStudies = cache(
    () => getAllCaseStudies(),
    ['library', 'case-studies', 'all'],
    {
      tags: [CacheTags.CASES],
      revalidate: 900, // 15 minutes
    }
  )
  const caseStudies = await getCachedCaseStudies()

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'text-gray-700 bg-gray-50 border-gray-200'
      case 'intermediate':
        return 'text-gray-700 bg-gray-50 border-gray-200'
      case 'advanced':
        return 'text-gray-700 bg-gray-50 border-gray-200'
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
              Immersive, high-fidelity case studies that test your strategic thinking, 
              decision-making, and leadership skills in realistic executive scenarios.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white border border-neutral-200 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 border border-gray-200">
                  <BookOpen className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <div className="text-xl font-semibold text-neutral-900">{caseStudies.length}</div>
                  <div className="text-xs text-neutral-500">Case Studies</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white border border-neutral-200 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 border border-gray-200">
                  <Target className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <div className="text-xl font-semibold text-neutral-900">15</div>
                  <div className="text-xs text-neutral-500">Challenge Types</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white border border-neutral-200 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 border border-gray-200">
                  <Users className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <div className="text-xl font-semibold text-neutral-900">8</div>
                  <div className="text-xs text-neutral-500">Competencies</div>
                </div>
              </div>
            </div>
          </div>

          {/* Case Studies Grid */}
          {caseStudies.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {caseStudies.map((caseStudy) => (
                <div key={caseStudy.caseId} className="bg-white border border-neutral-200 hover:border-neutral-300 transition-colors">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-base font-medium text-neutral-900 mb-2 leading-tight">
                          {caseStudy.title}
                        </h3>
                        <p className="text-sm text-neutral-600 leading-relaxed line-clamp-3">
                          {stripMarkdownAndTruncate(caseStudy.description, 200)}
                        </p>
                      </div>
                      
                      {caseStudy.difficulty && (
                        <div className={`px-2 py-1 text-xs font-medium border ${getDifficultyColor(caseStudy.difficulty)}`}>
                          {caseStudy.difficulty.toUpperCase()}
                        </div>
                      )}
                    </div>
                    
                    {/* Competencies */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {caseStudy.competencies.slice(0, 3).map((competency) => (
                        <span
                          key={competency}
                          className="px-2 py-1 bg-gray-100 text-gray-700 text-xs border border-gray-200 font-medium"
                        >
                          {competency}
                        </span>
                      ))}
                      {caseStudy.competencies.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs border border-gray-200">
                          +{caseStudy.competencies.length - 3} more
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <div className="flex items-center gap-4 text-xs text-neutral-500">
                        {caseStudy.estimatedDuration && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{caseStudy.estimatedDuration} min</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Target className="h-3 w-3" />
                          <span>{caseStudy.competencies.length} competencies</span>
                        </div>
                      </div>
                      
                      <Button asChild className="bg-gray-900 hover:bg-gray-800 text-white rounded-none">
                        <Link href={`/library/case-studies/${caseStudy.caseId}`}>
                          Start Case
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white border border-neutral-200 p-12 text-center">
              <BookOpen className="mx-auto h-10 w-10 text-gray-400 mb-4" />
              <h3 className="text-base font-medium text-neutral-900 mb-2">
                No Case Studies Available
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Case studies are being developed. Check back soon for immersive case studies.
              </p>
              <Button variant="outline" asChild className="border-gray-300 hover:border-gray-400 rounded-none">
                <Link href="/library">
                  Back to Library
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}