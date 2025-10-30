import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { getCurrentUser } from '@/lib/auth/get-user'
import { getDomainById } from '@/lib/curriculum-data'
import { getAllUserProgress } from '@/lib/progress-tracking'
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

  // Get user progress if logged in
  const user = await getCurrentUser()
  let userProgress: Map<string, any> = new Map()

  if (user) {
    userProgress = await getAllUserProgress(user.id)
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
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Link href="/library/curriculum" className="hover:text-gray-700 flex items-center gap-1">
              <ArrowLeft className="h-4 w-4" />
              All Domains
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-gray-900">{domain.title}</span>
          </div>

          {/* Header */}
          <div className="space-y-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">{domain.title}</h1>
              <p className="text-lg text-gray-600 leading-relaxed max-w-4xl">{domain.philosophy}</p>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-8 text-sm">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-600" />
                <span className="font-medium">{domain.modules.length} Modules</span>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-green-600" />
                <span className="font-medium">{totalLessons} Lessons</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-600" />
                <span className="font-medium">{Math.round(estimatedTime / 60)} Hours</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button size="lg" className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                Start Learning Path
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href={`/admin/content/generate?domain=${domainId}`}>🤖 Generate Content</Link>
              </Button>
            </div>
          </div>

          <Separator />

          {/* Modules */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Curriculum Modules</h2>

            <div className="space-y-6">
              {modulesWithProgress.map((module, moduleIndex) => (
                <Card key={module.id} className="group hover:shadow-md transition-shadow">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge variant="secondary">Module {module.number}</Badge>
                          <div className="text-sm text-gray-500">
                            {module.lessons.length} lessons • {module.lessons.length * 12} min
                            {user && (module.completed > 0 || module.inProgress > 0) && (
                              <span className="text-blue-600 font-medium ml-2">
                                • {module.completed} of {module.total} completed
                              </span>
                            )}
                          </div>
                        </div>
                        <CardTitle className="text-xl mb-2 group-hover:text-blue-600 transition-colors">
                          {module.title}
                        </CardTitle>
                        <CardDescription className="leading-relaxed">{module.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <div className="space-y-4">
                      {/* Lessons Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {module.lessons.map((lesson, lessonIndex) => {
                          const progressKey = `${domainId}:${module.id}:${lesson.id}`
                          const progress = user ? userProgress.get(progressKey) : null
                          const isCompleted = progress?.status === 'completed'
                          const isInProgress = progress?.status === 'in_progress'

                          return (
                            <Link
                              key={lesson.id}
                              href={`/library/curriculum/${domainId}/${module.id}/${lesson.id}`}
                              className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-colors group/lesson"
                            >
                              <div className="flex-shrink-0">
                                {isCompleted ? (
                                  <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center">
                                    <CheckCircle className="h-4 w-4 text-white" />
                                  </div>
                                ) : isInProgress ? (
                                  <div className="w-8 h-8 rounded-full bg-blue-100 border-2 border-blue-600 flex items-center justify-center">
                                    <span className="text-xs font-medium text-blue-600">{lesson.number}</span>
                                  </div>
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-600 group-hover/lesson:bg-blue-100 group-hover/lesson:text-blue-600 transition-colors">
                                    {lesson.number}
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm text-gray-900 group-hover/lesson:text-blue-600 transition-colors">
                                  {lesson.title}
                                </div>
                                <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                                  {lesson.description.length > 100
                                    ? `${lesson.description.substring(0, 100)}...`
                                    : lesson.description}
                                </div>
                              </div>
                              <ChevronRight className="h-4 w-4 text-gray-400 group-hover/lesson:text-blue-600 transition-colors" />
                            </Link>
                          )
                        })}
                      </div>

                      {/* Module Actions */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div className="text-sm text-gray-500">
                          Module {moduleIndex + 1} of {domain.modules.length}
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/library/curriculum/${domainId}/${module.id}`}>View Module</Link>
                          </Button>
                          <Button size="sm">Start Module</Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Learning Path Suggestion */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mx-auto">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">
                    Ready to Master {domain.title}?
                  </h3>
                  <p className="text-blue-700 text-sm max-w-2xl mx-auto">
                    Follow our structured learning path to systematically build expertise in this domain.
                    Track your progress and earn completion certificates.
                  </p>
                </div>
                <div className="flex justify-center gap-3">
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Play className="mr-2 h-4 w-4" />
                    Start Learning Path
                  </Button>
                  <Button variant="outline">View Prerequisites</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Related Domains */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Related Domains</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* This would be populated with related domains based on tags or relationships */}
              <Card className="p-4 hover:shadow-md transition-shadow">
                <div className="text-sm font-medium text-gray-900 mb-1">
                  Competitive Moat Architecture
                </div>
                <div className="text-xs text-gray-500">Build sustainable competitive advantages</div>
              </Card>
              <Card className="p-4 hover:shadow-md transition-shadow">
                <div className="text-sm font-medium text-gray-900 mb-1">
                  Second-Order Decision Making
                </div>
                <div className="text-xs text-gray-500">Think beyond immediate consequences</div>
              </Card>
              <Card className="p-4 hover:shadow-md transition-shadow">
                <div className="text-sm font-medium text-gray-900 mb-1">Global Systems Thinking</div>
                <div className="text-xs text-gray-500">Navigate complex interconnected systems</div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
