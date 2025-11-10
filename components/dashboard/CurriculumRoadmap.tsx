import { Button } from '@/components/ui/button'
import { CheckCircle2, Circle, Clock, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface CurriculumRoadmapProps {
  roadmap: {
    totalLessons: number
    completedCount: number
    nextLesson: {
      domainId: string
      moduleId: string
      lessonId: string
      title: string
      url: string
    } | null
    sections: Array<{
      domainId: string
      domainTitle: string
      modules: Array<{
        moduleId: string
        moduleTitle: string
        moduleNumber: number
        lessons: Array<{
          lessonId: string
          lessonTitle: string
          lessonNumber: number
          status: 'completed' | 'in_progress' | 'not_started'
          url: string
        }>
      }>
    }>
  }
}

export default function CurriculumRoadmap({ roadmap }: CurriculumRoadmapProps) {
  const progressPercentage = roadmap.totalLessons > 0
    ? Math.round((roadmap.completedCount / roadmap.totalLessons) * 100)
    : 0

  const hasStarted = roadmap.completedCount > 0

  return (
    <div className="space-y-12">
      {/* Header Section */}
      <div className="space-y-6">
        <div className="relative">
          <div className="absolute -left-8 top-0 w-px h-20 bg-neutral-900 opacity-20 hidden lg:block"></div>
          <h1 className="text-4xl font-light text-neutral-900 tracking-tight mb-2">
            Curriculum Roadmap
          </h1>
          <p className="text-lg text-neutral-600 font-light">
            Your progress through the executive curriculum
          </p>
        </div>

        {/* Overall Progress - Only show if user has started */}
        {hasStarted && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-neutral-700 uppercase tracking-wide">
                Overall Progress
              </span>
              <span className="text-2xl font-light text-neutral-900">
                {progressPercentage}%
              </span>
            </div>
            <div className="relative">
              <div className="h-[1px] bg-neutral-200"></div>
              <div 
                className="absolute top-0 left-0 h-[1px] bg-neutral-900 transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
            <div className="flex items-center justify-between text-xs text-neutral-500">
              <span>{roadmap.completedCount} lessons completed</span>
              <span>{roadmap.totalLessons} total lessons</span>
            </div>
          </div>
        )}
      </div>

      {/* Next Lesson CTA */}
      {roadmap.nextLesson && (
        <div className="border-t border-neutral-200 pt-8">
          <div className="flex items-start justify-between gap-8">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <ArrowRight className="h-4 w-4 text-neutral-600" />
                <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
                  Next Lesson
                </span>
              </div>
              <h2 className="text-2xl font-light text-neutral-900 tracking-tight">
                {roadmap.nextLesson.title}
              </h2>
            </div>
            <Button 
              asChild 
              className="bg-neutral-900 hover:bg-neutral-800 text-white rounded-none px-8 h-12 text-sm font-medium"
            >
              <Link href={roadmap.nextLesson.url}>
                Continue
              </Link>
            </Button>
          </div>
        </div>
      )}

      {/* Curriculum Structure - Single Column */}
      <div className="border-t border-neutral-200 pt-12 space-y-12">
        <div className="relative">
          <div className="absolute -left-8 top-0 w-px h-16 bg-neutral-900 opacity-20 hidden lg:block"></div>
          <h2 className="text-xl font-light text-neutral-900 tracking-tight">
            Curriculum Structure
          </h2>
        </div>

        <div className="space-y-12">
          {roadmap.sections.map((domain) => {
            const domainCompleted = domain.modules.every(module =>
              module.lessons.every(lesson => lesson.status === 'completed')
            )
            const domainInProgress = domain.modules.some(module =>
              module.lessons.some(lesson => lesson.status === 'in_progress' || lesson.status === 'completed')
            )
            const domainCompletedCount = domain.modules.reduce(
              (sum, module) => sum + module.lessons.filter(lesson => lesson.status === 'completed').length,
              0
            )
            const domainTotalCount = domain.modules.reduce(
              (sum, module) => sum + module.lessons.length,
              0
            )
            const domainProgress = domainTotalCount > 0 
              ? Math.round((domainCompletedCount / domainTotalCount) * 100)
              : 0

            // Only show detailed stats if user has started this domain
            const showDomainStats = domainInProgress || domainCompleted

            return (
              <div key={domain.domainId} className="space-y-6">
                {/* Domain Header */}
                <div className="flex items-start gap-4 pb-4 border-b border-neutral-200">
                  <div className="mt-1">
                    {domainCompleted ? (
                      <CheckCircle2 className="h-5 w-5 text-neutral-600" />
                    ) : domainInProgress ? (
                      <Clock className="h-5 w-5 text-neutral-600" />
                    ) : (
                      <Circle className="h-5 w-5 text-neutral-300" />
                    )}
                  </div>
                  <div className="flex-1">
                    <Link
                      href={`/library/curriculum/${domain.domainId}`}
                      className="group"
                    >
                      <h3 className="text-xl font-light text-neutral-900 tracking-tight mb-2 group-hover:text-neutral-600 transition-colors">
                        {domain.domainTitle}
                      </h3>
                    </Link>
                    {showDomainStats && (
                      <div className="text-sm text-neutral-500">
                        {domainCompletedCount} of {domainTotalCount} lessons completed
                        {domainProgress > 0 && (
                          <span className="ml-2">• {domainProgress}%</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Modules - Single Column */}
                <div className="space-y-4 pl-9">
                  {domain.modules.map((module) => {
                    const moduleCompleted = module.lessons.every(lesson => lesson.status === 'completed')
                    const moduleInProgress = module.lessons.some(lesson => lesson.status === 'in_progress' || lesson.status === 'completed')
                    const moduleCompletedCount = module.lessons.filter(lesson => lesson.status === 'completed').length
                    const moduleProgress = module.lessons.length > 0
                      ? Math.round((moduleCompletedCount / module.lessons.length) * 100)
                      : 0

                    // Only show stats if user has started this module
                    const showModuleStats = moduleInProgress || moduleCompleted

                    return (
                      <Link
                        key={module.moduleId}
                        href={`/library/curriculum/${domain.domainId}/${module.moduleId}`}
                        className="group block"
                      >
                        <div className="flex items-start gap-3 pb-4 border-b border-neutral-100 group-hover:border-neutral-200 transition-colors">
                          <div className="mt-0.5">
                            {moduleCompleted ? (
                              <CheckCircle2 className="h-4 w-4 text-neutral-600 flex-shrink-0" />
                            ) : moduleInProgress ? (
                              <Clock className="h-4 w-4 text-neutral-600 flex-shrink-0" />
                            ) : (
                              <Circle className="h-4 w-4 text-neutral-300 flex-shrink-0" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-base font-light text-neutral-900 group-hover:text-neutral-600 transition-colors mb-1">
                              {module.moduleNumber}. {module.moduleTitle}
                            </h4>
                            {showModuleStats && (
                              <div className="text-xs text-neutral-500">
                                {moduleCompletedCount} of {module.lessons.length} lessons completed
                                {moduleProgress > 0 && (
                                  <span className="ml-2">• {moduleProgress}%</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
