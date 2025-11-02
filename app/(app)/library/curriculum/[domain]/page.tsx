import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { getCurrentUser } from '@/lib/auth/get-user'
import { getDomainById } from '@/lib/curriculum-data'
import { getAllUserProgress } from '@/lib/progress-tracking'
import { getCachedUserData, CacheTags } from '@/lib/cache'
import { ArrowLeft, BookOpen, CheckCircle, ChevronRight, Clock, Play, Target } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

interface DomainPageProps {
  params: Promise<{
    domain: string
  }>
}

export default async function DomainPage({ params }: DomainPageProps) {
  const { domain: domainId } = await params
  const domain = getDomainById(domainId)

  if (!domain) {
    notFound()
  }

  const totalLessons = domain.modules.reduce((sum, module) => sum + module.lessons.length, 0)
  const estimatedTime = totalLessons * 12 // 12 minutes per lesson

  // Get user progress if logged in (2 minutes revalidate, userId in key)
  const user = await getCurrentUser()
  let userProgress: Map<string, any> = new Map()

  if (user) {
    const getCachedUserProgress = getCachedUserData(
      user.id,
      () => getAllUserProgress(user.id),
      ['progress', 'all'],
      {
        tags: [CacheTags.USER_PROGRESS],
        revalidate: 120, // 2 minutes
      }
    )
    userProgress = await getCachedUserProgress()
  }

  // Calculate progress per module
  const modulesWithProgress = domain.modules.map((module) => {
    let completed = 0
    let inProgress = 0

    module.lessons.forEach((lesson) => {
      const progressKey = `${domainId}:${module.id}:${lesson.id}`
      const progress = userProgress.get(progressKey)
      if (progress) {
        if (progress.status === 'completed') completed++
        else if (progress.status === 'in_progress') inProgress++
      }
    })

    return {
      ...module,
      completed,
      inProgress,
      total: module.lessons.length,
    }
  })

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="flex-1 overflow-auto">
        <div className="px-4 py-4 md:px-6 md:py-6 space-y-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Link href="/library/curriculum" className="hover:text-gray-700 flex items-center gap-1 transition-colors">
              <ArrowLeft className="h-4 w-4" />
              All Domains
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-gray-900">{domain.title}</span>
          </div>

          {/* Header */}
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-medium text-gray-900 mb-4">{domain.title}</h1>
              <p className="text-sm text-gray-600 leading-relaxed max-w-4xl">{domain.philosophy}</p>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-8 text-xs text-gray-500">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-gray-400" />
                <span className="font-medium">{domain.modules.length} Modules</span>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-gray-400" />
                <span className="font-medium">{totalLessons} Lessons</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-400" />
                <span className="font-medium">{Math.round(estimatedTime / 60)} Hours</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button size="lg" className="bg-gray-900 hover:bg-gray-800 text-white rounded-none">
                <Play className="h-5 w-5 mr-2" />
                Start Learning Path
              </Button>
              <Button variant="outline" size="lg" asChild className="border-gray-300 hover:border-gray-400 rounded-none">
                <Link href={`/admin/content/generate?domain=${domainId}`}>Generate Content</Link>
              </Button>
            </div>
          </div>

          <Separator />

          {/* Modules */}
          <div className="space-y-6">
            <h2 className="text-lg font-medium text-gray-900">Curriculum Modules</h2>

            <div className="space-y-6">
              {modulesWithProgress.map((module, moduleIndex) => (
                <div key={module.id} className="bg-white border border-gray-200 hover:border-gray-300 transition-colors">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge variant="outline" className="text-xs font-medium text-gray-700 border-gray-300">
                            Module {module.number}
                          </Badge>
                          <div className="text-xs text-gray-500">
                            {module.lessons.length} lessons • {module.lessons.length * 12} min
                            {user && (module.completed > 0 || module.inProgress > 0) && (
                              <span className="text-gray-700 font-medium ml-2">
                                • {module.completed} of {module.total} completed
                              </span>
                            )}
                          </div>
                        </div>
                        <h3 className="text-base font-medium text-gray-900 mb-2">
                          {module.title}
                        </h3>
                        <p className="text-sm text-gray-600 leading-relaxed">{module.description}</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {/* Lessons Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {module.lessons.map((lesson) => {
                          const progressKey = `${domainId}:${module.id}:${lesson.id}`
                          const progress = user ? userProgress.get(progressKey) : null
                          const isCompleted = progress?.status === 'completed'
                          const isInProgress = progress?.status === 'in_progress'

                          return (
                            <Link
                              key={lesson.id}
                              href={`/library/curriculum/${domainId}/${module.id}/${lesson.id}`}
                              className="flex items-center gap-3 p-3 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
                            >
                              <div className="flex-shrink-0">
                                {isCompleted ? (
                                  <div className="w-8 h-8 bg-gray-900 flex items-center justify-center">
                                    <CheckCircle className="h-4 w-4 text-white" />
                                  </div>
                                ) : isInProgress ? (
                                  <div className="w-8 h-8 bg-gray-100 border-2 border-gray-600 flex items-center justify-center">
                                    <span className="text-xs font-medium text-gray-700">{lesson.number}</span>
                                  </div>
                                ) : (
                                  <div className="w-8 h-8 bg-gray-100 border border-gray-200 flex items-center justify-center text-sm font-medium text-gray-600 hover:bg-gray-200 transition-colors">
                                    {lesson.number}
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm text-gray-900">
                                  {lesson.title}
                                </div>
                                {lesson.description && (
                                  <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                                    {lesson.description.length > 100
                                      ? `${lesson.description.substring(0, 100)}...`
                                      : lesson.description}
                                  </div>
                                )}
                              </div>
                              <ChevronRight className="h-4 w-4 text-gray-400" />
                            </Link>
                          )
                        })}
                      </div>

                      {/* Module Actions */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                        <div className="text-xs text-gray-500">
                          Module {moduleIndex + 1} of {domain.modules.length}
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" asChild className="border-gray-300 hover:border-gray-400 rounded-none">
                            <Link href={`/library/curriculum/${domainId}/${module.id}`}>View Module</Link>
                          </Button>
                          <Button size="sm" className="bg-gray-900 hover:bg-gray-800 text-white rounded-none">Start Module</Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Learning Path Suggestion */}
          <div className="bg-gray-50 border border-gray-200 p-8">
            <div className="text-center space-y-4">
              <div className="w-12 h-12 bg-gray-900 flex items-center justify-center mx-auto">
                <Target className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-base font-medium text-gray-900 mb-2">
                  Ready to Master {domain.title}?
                </h3>
                <p className="text-sm text-gray-600 max-w-2xl mx-auto">
                  Follow our structured learning path to systematically build expertise in this domain. Track your progress and earn completion certificates.
                </p>
              </div>
              <div className="flex justify-center gap-3">
                <Button className="bg-gray-900 hover:bg-gray-800 text-white rounded-none">
                  <Play className="mr-2 h-4 w-4" />
                  Start Learning Path
                </Button>
                <Button variant="outline" className="border-gray-300 hover:border-gray-400 rounded-none">View Prerequisites</Button>
              </div>
            </div>
          </div>

          {/* Related Domains */}
          <div className="space-y-4">
            <h3 className="text-base font-medium text-gray-900">Related Domains</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-white border border-gray-200 p-4 hover:border-gray-300 transition-colors">
                <div className="text-sm font-medium text-gray-900 mb-1">
                  Competitive Moat Architecture
                </div>
                <div className="text-xs text-gray-500">Build sustainable competitive advantages</div>
              </div>
              <div className="bg-white border border-gray-200 p-4 hover:border-gray-300 transition-colors">
                <div className="text-sm font-medium text-gray-900 mb-1">
                  Second-Order Decision Making
                </div>
                <div className="text-xs text-gray-500">Think beyond immediate consequences</div>
              </div>
              <div className="bg-white border border-gray-200 p-4 hover:border-gray-300 transition-colors">
                <div className="text-sm font-medium text-gray-900 mb-1">Global Systems Thinking</div>
                <div className="text-xs text-gray-500">Navigate complex interconnected systems</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
